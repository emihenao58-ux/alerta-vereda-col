import { useSyncExternalStore } from "react";

export type PerfilLocal = Readonly<{
  nombre: string;
  apellido: string;
}>;

type PerfilLocalSnapshot = Readonly<{
  perfil: PerfilLocal | null;
  listo: boolean;
}>;

const PROFILE_STORAGE_KEY = "alertavereda-perfil-local";
const PROFILE_CHANGE_EVENT = "alertavereda:perfil-local-cambiado";
const CACHE_UNREAD = Symbol("perfil-local-unread");
const CACHE_ERROR = Symbol("perfil-local-error");
type RawCache = string | null | typeof CACHE_UNREAD | typeof CACHE_ERROR;

const SERVER_SNAPSHOT: PerfilLocalSnapshot = Object.freeze({ perfil: null, listo: false });
let cachedRaw: RawCache = CACHE_UNREAD;
let cachedSnapshot: PerfilLocalSnapshot = SERVER_SNAPSHOT;

function normalizarPerfil(value: unknown): PerfilLocal | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const nombre = typeof record["nombre"] === "string" ? record["nombre"].trim() : "";
  if (!nombre) return null;

  const apellido = typeof record["apellido"] === "string" ? record["apellido"].trim() : "";
  return Object.freeze({ nombre, apellido });
}

function parsearPerfil(raw: string | null): PerfilLocal | null {
  if (!raw) return null;
  try {
    return normalizarPerfil(JSON.parse(raw));
  } catch {
    return null;
  }
}

function leerSnapshot(): PerfilLocalSnapshot {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw === cachedRaw && cachedSnapshot.listo) return cachedSnapshot;

    cachedRaw = raw;
    cachedSnapshot = Object.freeze({ perfil: parsearPerfil(raw), listo: true });
    return cachedSnapshot;
  } catch {
    if (cachedRaw !== CACHE_ERROR) {
      cachedRaw = CACHE_ERROR;
      cachedSnapshot = Object.freeze({ perfil: null, listo: true });
    }
    return cachedSnapshot;
  }
}

function suscribir(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const actualizar = (event: Event) => {
    if (event.type === "storage") {
      const key = (event as StorageEvent).key;
      if (key !== PROFILE_STORAGE_KEY && key !== null) return;
    }

    cachedRaw = CACHE_UNREAD;
    onStoreChange();
  };

  window.addEventListener("storage", actualizar);
  window.addEventListener(PROFILE_CHANGE_EVENT, actualizar);
  return () => {
    window.removeEventListener("storage", actualizar);
    window.removeEventListener(PROFILE_CHANGE_EVENT, actualizar);
  };
}

export function usePerfilLocal() {
  return useSyncExternalStore(suscribir, leerSnapshot, () => SERVER_SNAPSHOT);
}

export function guardarPerfilLocal(value: Pick<PerfilLocal, "nombre" | "apellido">): boolean {
  if (typeof window === "undefined") return false;

  const perfil = normalizarPerfil(value);
  if (!perfil) return false;

  const raw = JSON.stringify(perfil);
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, raw);
  } catch {
    return false;
  }

  cachedRaw = raw;
  cachedSnapshot = Object.freeze({ perfil, listo: true });
  try {
    window.dispatchEvent(new Event(PROFILE_CHANGE_EVENT));
  } catch {
    // El evento solo sincroniza vistas abiertas; el guardado ya se completó.
  }
  return true;
}
