import type { ReporteDraft, ReporteEvidencia } from "./types";
import { MAX_VIDEO_BYTES, MAX_VIDEO_DURATION_SECONDS } from "./media";

export type EstadoReporteLocal =
  "En revisión" | "Verificado y activo" | "En atención" | "Verificado y solucionado";

export type OrigenReporteLocal = "comunitario" | "jac";

export type IdentidadAdministrativaLocal = {
  perfilId: string;
  nombre: string;
};

type EvidenciaLocal = Pick<
  ReporteEvidencia,
  | "id"
  | "tipo"
  | "fuente"
  | "procesamiento"
  | "dimensiones"
  | "capturadaEn"
  | "incorporadaEn"
  | "duracionSegundos"
  | "recortada"
>;

export type FotografiaReporteLocal = {
  evidenciaId: string;
  archivo: Blob;
  tipoMime: string;
  tamanoBytes: number;
  procesamiento: Extract<ReporteEvidencia["procesamiento"], "procesada" | "pesada">;
};

export type VideoReporteLocal = {
  evidenciaId: string;
  archivo: Blob;
  tipoMime: string;
  tamanoBytes: number;
  duracionSegundos: number;
  dimensiones: { width: number; height: number };
};

export type ReporteLocal = {
  version: 3;
  id: string;
  registradoEn: string;
  estado: EstadoReporteLocal;
  origen: OrigenReporteLocal;
  // Instantánea local de la cuenta creadora; no conserva sesión ni credenciales.
  // Ausente en registros anteriores, que se siguen leyendo sin reescribirlos.
  identidadAdministrativa?: IdentidadAdministrativaLocal;
  // No implica recepción, publicación ni revisión administrativa real.
  modo: "local-preview";
  publicId: null;
  datos: Omit<ReporteDraft, "evidencias"> & { evidencias: EvidenciaLocal[] };
  fotografias: FotografiaReporteLocal[];
  videos: VideoReporteLocal[];
};

export const HISTORIAL_LOCAL_EVENTO = "alertavereda:historial-local-actualizado";
const DB_NAME = "alertavereda-historial-local";
const STORE_NAME = "reportes";
const ESTADOS: readonly EstadoReporteLocal[] = [
  "En revisión",
  "Verificado y activo",
  "En atención",
  "Verificado y solucionado",
];
const ORIGENES: readonly OrigenReporteLocal[] = ["comunitario", "jac"];

function abrirHistorial(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("Este navegador no permite guardar el historial local."));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
    request.onerror = () =>
      reject(request.error ?? new Error("No se pudo abrir el historial local."));
    request.onblocked = () =>
      reject(
        new Error("El historial está ocupado en otra pestaña. Ciérrala e inténtalo nuevamente."),
      );
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}

function datosSinArchivos(draft: ReporteDraft): ReporteLocal["datos"] {
  // Lista permitida: no serializa el borrador completo, archivos originales,
  // previewUrl, fotos personales ni avatares. Multimedia procesada se almacena
  // por separado como Blob dentro del registro del reporte.
  return {
    categoria: draft.categoria,
    subcategoria: draft.subcategoria,
    subcategoriaPadre: draft.subcategoriaPadre,
    veredaId: draft.veredaId,
    tipoLugar: draft.tipoLugar,
    territorioId: draft.territorioId,
    territorioPadreId: draft.territorioPadreId,
    descripcion: draft.descripcion,
    lugar: draft.lugar,
    nombre: draft.nombre,
    ubicacionEstado: draft.ubicacionEstado,
    ubicacion:
      draft.ubicacionEstado === "confirmada" && draft.ubicacion
        ? {
            latitud: draft.ubicacion.latitud,
            longitud: draft.ubicacion.longitud,
            precision: draft.ubicacion.precision,
          }
        : null,
    sinEvidencia: draft.sinEvidencia
      ? { motivo: draft.sinEvidencia.motivo, detalle: draft.sinEvidencia.detalle }
      : null,
    evidencias: draft.evidencias.map((evidencia) => ({
      id: evidencia.id,
      tipo: evidencia.tipo,
      fuente: evidencia.fuente,
      procesamiento: evidencia.procesamiento,
      dimensiones: evidencia.dimensiones ? { ...evidencia.dimensiones } : null,
      capturadaEn: evidencia.capturadaEn,
      incorporadaEn: evidencia.incorporadaEn,
      ...(evidencia.duracionSegundos === undefined
        ? {}
        : { duracionSegundos: evidencia.duracionSegundos }),
      ...(evidencia.recortada === undefined ? {} : { recortada: evidencia.recortada }),
    })),
  };
}

function fotografiasProcesadasDesdeBorrador(
  evidencias: readonly ReporteEvidencia[],
): FotografiaReporteLocal[] {
  return evidencias
    .filter((evidencia) => evidencia.tipo === "foto")
    .map((evidencia) => {
      if (!(evidencia.archivo instanceof Blob) || !evidencia.archivo.type.startsWith("image/")) {
        throw new Error(
          "No se pudo preparar una fotografía para el historial local. No se guardó el reporte.",
        );
      }
      if (evidencia.procesamiento !== "procesada" && evidencia.procesamiento !== "pesada") {
        throw new Error(
          "No se pudo guardar el reporte porque una fotografía no tiene una versión procesada disponible. Inténtalo nuevamente con otra imagen.",
        );
      }
      return {
        evidenciaId: evidencia.id,
        // `archivo` es la versión procesada/recortada que ya muestra el flujo.
        // No se conserva archivoOriginal ni una segunda copia del original.
        archivo: evidencia.archivo.slice(0, evidencia.archivo.size, evidencia.archivo.type),
        tipoMime: evidencia.archivo.type,
        tamanoBytes: evidencia.archivo.size,
        procesamiento: evidencia.procesamiento,
      };
    });
}

function videosProcesadosDesdeBorrador(
  evidencias: readonly ReporteEvidencia[],
): VideoReporteLocal[] {
  return evidencias
    .filter((evidencia) => evidencia.tipo === "video")
    .map((evidencia) => {
      if (!(evidencia.archivo instanceof Blob) || !evidencia.archivo.type.startsWith("video/")) {
        throw new Error("No se pudo preparar un video optimizado para el historial local.");
      }
      if (evidencia.procesamiento !== "procesada") {
        throw new Error(
          "El video no tiene una versión optimizada disponible. No se guardó el reporte.",
        );
      }
      if (
        evidencia.archivo.size <= 0 ||
        evidencia.archivo.size > MAX_VIDEO_BYTES ||
        !Number.isFinite(evidencia.duracionSegundos) ||
        !evidencia.duracionSegundos ||
        evidencia.duracionSegundos > MAX_VIDEO_DURATION_SECONDS ||
        !evidencia.dimensiones ||
        !Number.isFinite(evidencia.dimensiones.width) ||
        !Number.isFinite(evidencia.dimensiones.height) ||
        evidencia.dimensiones.width <= 0 ||
        evidencia.dimensiones.height <= 0
      ) {
        throw new Error(
          "El video optimizado no cumple los requisitos actuales. No se guardó el reporte.",
        );
      }
      return {
        evidenciaId: evidencia.id,
        archivo: evidencia.archivo.slice(0, evidencia.archivo.size, evidencia.archivo.type),
        tipoMime: evidencia.archivo.type,
        tamanoBytes: evidencia.archivo.size,
        duracionSegundos: evidencia.duracionSegundos,
        dimensiones: { ...evidencia.dimensiones },
      };
    });
}

function avisarActualizacion() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(HISTORIAL_LOCAL_EVENTO));
  let channel: BroadcastChannel | null = null;
  try {
    if (typeof BroadcastChannel === "undefined") return;
    channel = new BroadcastChannel(HISTORIAL_LOCAL_EVENTO);
    channel.postMessage("actualizado");
  } catch {
    // La transacción ya se completó. El canal opcional no cambia su resultado;
    // otras pestañas también releen el historial al recuperar el foco.
  } finally {
    channel?.close();
  }
}

function errorGuardado(cause: unknown, contieneMultimedia: boolean) {
  const nombre =
    cause && typeof cause === "object" && "name" in cause && typeof cause.name === "string"
      ? cause.name
      : "";
  if (nombre === "QuotaExceededError") {
    return new Error(
      contieneMultimedia
        ? "El almacenamiento local del navegador no tiene espacio suficiente para guardar el reporte y sus evidencias. No se registró como guardado. Libera espacio e inténtalo nuevamente."
        : "El almacenamiento local del navegador no tiene espacio suficiente para guardar el reporte. No se registró como guardado.",
    );
  }
  if (cause instanceof Error && cause.message.startsWith("No se pudo")) return cause;
  return new Error(
    contieneMultimedia
      ? "No se pudo guardar el reporte y sus evidencias en este dispositivo. No se registró como guardado; inténtalo nuevamente."
      : "No se pudo guardar el reporte en este dispositivo. No se registró como guardado; inténtalo nuevamente.",
  );
}

export async function guardarReporteLocal(
  draft: ReporteDraft,
  id: string,
  registradoEn: string,
  origen: OrigenReporteLocal = "comunitario",
  identidadAdministrativa?: IdentidadAdministrativaLocal,
): Promise<ReporteLocal> {
  if (!draft.categoria || !draft.territorioId || !id) {
    throw new Error("El reporte no tiene los datos necesarios para guardarlo.");
  }
  if (
    origen === "jac" &&
    (!identidadAdministrativa?.perfilId.trim() || !identidadAdministrativa.nombre.trim())
  ) {
    throw new Error("No se pudo identificar la cuenta JAC. No se guardó el reporte.");
  }
  if (
    draft.evidencias.filter((evidencia) => evidencia.tipo === "foto").length > 3 ||
    draft.evidencias.filter((evidencia) => evidencia.tipo === "video").length > 1
  ) {
    throw new Error("Solo puedes guardar hasta 3 fotografías y 1 video por reporte.");
  }
  const fotografias = fotografiasProcesadasDesdeBorrador(draft.evidencias);
  const videos = videosProcesadosDesdeBorrador(draft.evidencias);
  const reporte: ReporteLocal = {
    version: 3,
    id,
    registradoEn,
    estado: "En revisión",
    origen,
    ...(origen === "jac" && identidadAdministrativa
      ? {
          identidadAdministrativa: {
            perfilId: identidadAdministrativa.perfilId,
            nombre: identidadAdministrativa.nombre.trim(),
          },
        }
      : {}),
    modo: "local-preview",
    publicId: null,
    datos: datosSinArchivos(draft),
    fotografias,
    videos,
  };
  let db: IDBDatabase | null = null;
  try {
    db = await abrirHistorial();
    await new Promise<void>((resolve, reject) => {
      const tx = db!.transaction(STORE_NAME, "readwrite");
      // Metadatos y todos los Blobs procesados comparten una transacción: si el
      // navegador rechaza cualquier evidencia, no queda un reporte parcial.
      tx.objectStore(STORE_NAME).put(reporte);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error ?? new Error("No se pudo completar el guardado local."));
      tx.onerror = () =>
        reject(tx.error ?? new Error("No se pudo guardar el reporte en este dispositivo."));
    });
  } catch (cause) {
    throw errorGuardado(cause, fotografias.length > 0 || videos.length > 0);
  } finally {
    db?.close();
  }
  avisarActualizacion();
  return reporte;
}

function esRegistro(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function datosValidos(value: unknown): value is ReporteLocal["datos"] {
  if (!esRegistro(value)) return false;
  return (
    typeof value["nombre"] === "string" &&
    typeof value["descripcion"] === "string" &&
    typeof value["lugar"] === "string" &&
    typeof value["territorioId"] === "string" &&
    ["emergencia", "via", "servicio", "otro"].includes(String(value["categoria"] ?? "")) &&
    Array.isArray(value["evidencias"])
  );
}

function reporteComunValido(value: Record<string, unknown>): value is Record<string, unknown> & {
  id: string;
  registradoEn: string;
  estado: EstadoReporteLocal;
  datos: ReporteLocal["datos"];
} {
  return (
    typeof value["id"] === "string" &&
    value["id"].length > 0 &&
    typeof value["registradoEn"] === "string" &&
    Number.isFinite(Date.parse(value["registradoEn"])) &&
    value["modo"] === "local-preview" &&
    value["publicId"] === null &&
    ESTADOS.includes(value["estado"] as EstadoReporteLocal) &&
    datosValidos(value["datos"])
  );
}

function fotografiaLocalValida(
  value: unknown,
  datos: ReporteLocal["datos"],
): value is FotografiaReporteLocal {
  if (!esRegistro(value) || typeof Blob === "undefined") return false;
  const evidenciaId = value["evidenciaId"];
  const archivo = value["archivo"];
  const tipoMime = value["tipoMime"];
  const tamanoBytes = value["tamanoBytes"];
  const procesamiento = value["procesamiento"];
  if (
    typeof evidenciaId !== "string" ||
    !(archivo instanceof Blob) ||
    typeof tipoMime !== "string" ||
    typeof tamanoBytes !== "number"
  ) {
    return false;
  }
  const evidencia = datos.evidencias.find(
    (item) => item.id === evidenciaId && item.tipo === "foto",
  );
  return (
    Boolean(evidencia) &&
    archivo.type.startsWith("image/") &&
    tipoMime === archivo.type &&
    Number.isFinite(tamanoBytes) &&
    tamanoBytes === archivo.size &&
    ["procesada", "pesada"].includes(String(procesamiento))
  );
}

function videoLocalValido(
  value: unknown,
  datos: ReporteLocal["datos"],
): value is VideoReporteLocal {
  if (!esRegistro(value) || typeof Blob === "undefined") return false;
  const evidenciaId = value["evidenciaId"];
  const archivo = value["archivo"];
  const tipoMime = value["tipoMime"];
  const tamanoBytes = value["tamanoBytes"];
  const duracionSegundos = value["duracionSegundos"];
  const dimensiones = value["dimensiones"];
  if (
    typeof evidenciaId !== "string" ||
    !(archivo instanceof Blob) ||
    typeof tipoMime !== "string" ||
    typeof tamanoBytes !== "number" ||
    typeof duracionSegundos !== "number" ||
    !esRegistro(dimensiones) ||
    typeof dimensiones["width"] !== "number" ||
    typeof dimensiones["height"] !== "number"
  ) {
    return false;
  }
  const evidencia = datos.evidencias.find(
    (item) => item.id === evidenciaId && item.tipo === "video",
  );
  return (
    evidencia?.procesamiento === "procesada" &&
    archivo.type.startsWith("video/") &&
    tipoMime === archivo.type &&
    Number.isFinite(tamanoBytes) &&
    tamanoBytes === archivo.size &&
    tamanoBytes > 0 &&
    tamanoBytes <= MAX_VIDEO_BYTES &&
    Number.isFinite(duracionSegundos) &&
    duracionSegundos > 0 &&
    duracionSegundos <= MAX_VIDEO_DURATION_SECONDS &&
    Number.isFinite(dimensiones["width"]) &&
    Number.isFinite(dimensiones["height"]) &&
    dimensiones["width"] > 0 &&
    dimensiones["height"] > 0
  );
}

function normalizarReporteLocal(value: unknown): ReporteLocal | null {
  if (!esRegistro(value) || !reporteComunValido(value)) return null;
  const datos = value["datos"];
  if (value["version"] === 1) {
    // Compatibilidad de lectura no destructiva: registros previos conservan sus
    // metadatos y se etiquetan como comunitarios, sin inventar fotos guardadas.
    return {
      version: 3,
      id: value.id,
      registradoEn: value.registradoEn,
      estado: value.estado,
      origen: "comunitario",
      modo: "local-preview",
      publicId: null,
      datos,
      fotografias: [],
      videos: [],
    };
  }
  const fotografias = value["fotografias"];
  if (
    (value["version"] !== 2 && value["version"] !== 3) ||
    !ORIGENES.includes(value["origen"] as OrigenReporteLocal) ||
    !Array.isArray(fotografias) ||
    !fotografias.every((foto) => fotografiaLocalValida(foto, datos))
  ) {
    return null;
  }
  const idsFotos = fotografias.map((foto) => (foto as FotografiaReporteLocal).evidenciaId);
  if (new Set(idsFotos).size !== idsFotos.length) return null;
  if (value["version"] === 2) {
    return {
      version: 3,
      id: value.id,
      registradoEn: value.registradoEn,
      estado: value.estado,
      origen: value["origen"] as OrigenReporteLocal,
      modo: "local-preview",
      publicId: null,
      datos,
      fotografias: fotografias as FotografiaReporteLocal[],
      videos: [],
    };
  }
  const videos = value["videos"];
  if (!Array.isArray(videos) || !videos.every((video) => videoLocalValido(video, datos))) {
    return null;
  }
  const idsVideos = videos.map((video) => (video as VideoReporteLocal).evidenciaId);
  if (
    new Set(idsVideos).size !== idsVideos.length ||
    idsFotos.some((id) => idsVideos.includes(id))
  ) {
    return null;
  }
  const identidad = value["identidadAdministrativa"];
  if (
    identidad !== undefined &&
    (value["origen"] !== "jac" ||
      !esRegistro(identidad) ||
      typeof identidad["perfilId"] !== "string" ||
      !identidad["perfilId"].trim() ||
      typeof identidad["nombre"] !== "string" ||
      !identidad["nombre"].trim())
  ) {
    return null;
  }
  return value as unknown as ReporteLocal;
}

export async function leerReportesLocales(): Promise<ReporteLocal[]> {
  const db = await abrirHistorial();
  try {
    const resultados = await new Promise<unknown[]>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const request = tx.objectStore(STORE_NAME).getAll();
      let registros: unknown[] = [];
      request.onsuccess = () => {
        registros = request.result as unknown[];
      };
      tx.oncomplete = () => resolve(registros);
      tx.onabort = () => reject(tx.error ?? new Error("No se pudo leer el historial local."));
      tx.onerror = () => reject(tx.error ?? new Error("No se pudo leer el historial local."));
    });
    const reportes = resultados.map(normalizarReporteLocal);
    if (reportes.some((reporte) => reporte === null)) {
      throw new Error(
        "No se pudo interpretar todo el historial local. Los datos existentes no se han borrado.",
      );
    }
    return (reportes as ReporteLocal[]).sort(
      (a, b) => b.registradoEn.localeCompare(a.registradoEn) || a.id.localeCompare(b.id),
    );
  } finally {
    db.close();
  }
}
