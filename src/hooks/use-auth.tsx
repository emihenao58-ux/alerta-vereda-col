import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type Perfil = {
  id: string;
  nombre: string | null;
  vereda_id: string | null;
  rol: string;
};

export type Rol = "pendiente" | "habitante" | "administrador" | "admin_vereda" | "superadmin";

function esRolAdmin(rol: string | null | undefined) {
  return rol === "administrador" || rol === "admin_vereda" || rol === "superadmin";
}

/**
 * Puente de compatibilidad previo a la migración administrativa.
 *
 * Este hook consulta exclusivamente el contrato legacy de perfiles. Reconoce
 * tanto administrador como admin_vereda, pero no consulta admin_asignaciones,
 * estado_cuenta, estado_solicitud ni veredas.activa porque esas estructuras
 * todavía no existen en producción durante esta etapa.
 *
 * La autorización real sigue viviendo en RLS y en las funciones del backend.
 * Este puente debe retirarse después de aplicar y verificar la migración final.
 */
export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSession(nuevaSesion);

      if (!nuevaSesion) {
        setPerfil(null);
        setRoles([]);
      }
    });

    void supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCargando(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const userId = session?.user.id;

    if (!userId) {
      setPerfil(null);
      setRoles([]);
      return;
    }

    let activo = true;

    void (async () => {
      // Deliberadamente solo se consultan columnas presentes en producción
      // antes de la migración administrativa.
      const { data: p, error } = await supabase
        .from("perfiles")
        .select("id, nombre, vereda_id, rol")
        .eq("id", userId)
        .maybeSingle();

      if (!activo) return;

      if (error) {
        console.error("Error cargando perfil:", error);
        setPerfil(null);
        setRoles([]);
        return;
      }

      const perfilActual = (p as Perfil | null) ?? null;
      setPerfil(perfilActual);

      if (esRolAdmin(perfilActual?.rol)) {
        setRoles(["admin_vereda"]);
      } else {
        setRoles(["habitante"]);
      }
    })();

    return () => {
      activo = false;
    };
  }, [session?.user.id]);

  const esSuperadmin = perfil?.rol === "superadmin";
  const esAdminVereda =
    (perfil?.rol === "administrador" || perfil?.rol === "admin_vereda") &&
    perfil.vereda_id !== null;
  const solicitudPendiente = perfil?.rol === "pendiente";

  return {
    session,
    usuario: session?.user ?? null,
    perfil,
    roles,
    esAdmin: Boolean(esSuperadmin || esAdminVereda),
    esSuperadmin,
    esAdminVereda,
    solicitudPendiente,
    cargando,
    salir: () => supabase.auth.signOut(),
  };
}
