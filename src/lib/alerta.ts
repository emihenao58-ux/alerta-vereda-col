// El valor intermedio es "atencion" para coincidir con el constraint
// `*_nivel_check` de la base de datos (ARRAY['urgente','atencion','normal']).
// La etiqueta visual que ve el habitante sigue siendo "Precaución".
export type Severidad = "urgente" | "atencion" | "normal";

export type TipoServicio = "agua" | "luz" | "senal";

export type TipoReporte = "emergencia" | "via" | "servicio" | "aviso";

export type ResultadoCierre = "solucionado" | "no_solucionado" | "retirado";

export const LABEL_RESULTADO_CIERRE: Record<ResultadoCierre, string> = {
  solucionado: "Solucionado",
  no_solucionado: "No solucionado",
  retirado: "Retirado",
};

/** Colores oficiales de severidad (documento de identidad, sección 4.4). */
export const COLOR_SEVERIDAD: Record<Severidad, string> = {
  urgente: "#C23B2E",
  atencion: "#DB7B33",
  normal: "#3C8A5B",
};

export const LABEL_SEVERIDAD: Record<Severidad, string> = {
  urgente: "Urgente",
  atencion: "Precaución",
  normal: "Normal",
};

const NIVELES_VALIDOS: readonly Severidad[] = ["urgente", "atencion", "normal"];

/**
 * Convierte la columna `nivel` (la fija el admin al publicar) al tipo `Severidad`.
 * Cualquier valor no reconocido cae en "atencion" para no ocultar una novedad
 * por un dato inesperado.
 */
export function severidadDeNivel(nivel: string | null | undefined): Severidad {
  return (NIVELES_VALIDOS as readonly string[]).includes(nivel ?? "")
    ? (nivel as Severidad)
    : "atencion";
}

/**
 * Texto neutro de estado publicado para la etiqueta al lado del chip de severidad.
 * Normaliza minúsculas/añade "Activa" por defecto; si ya está bien escrito se usa tal cual. */
export function ETIQUETA_ESTADO(
  tipo: "emergencia" | "via" | "servicio" | "aviso",
  estado: string | null | undefined,
): string {
  switch (tipo) {
    case "emergencia":
      return estado ?? "Activa";
    case "via":
      return estado ?? "";
    case "servicio":
      return estado ?? "";
    case "aviso":
      return "Aviso";
    default:
      return "";
  }
}

export const LABEL_TIPO_SERVICIO: Record<TipoServicio, string> = {
  agua: "Agua",
  luz: "Luz",
  senal: "Señal / internet",
};

export const LABEL_TIPO_REPORTE: Record<TipoReporte, string> = {
  emergencia: "Emergencia",
  via: "Estado de una vía",
  servicio: "Corte de servicio",
  aviso: "Aviso comunitario",
};

export function fecha(valor: string | null | undefined) {
  if (!valor) return "";
  return new Date(valor).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Convierte un path relativo de Storage (ej.: "vereda_id/archivo.png", guardado en
 * `foto_url`) en la URL pública completa de Supabase Storage.
 * Si el valor ya es una URL absoluta, se devuelve tal cual. */
export function URL_FOTO(foto_url: string | null | undefined): string | null {
  if (!foto_url) return null;
  if (foto_url.startsWith("http")) return foto_url;
  return `https://bajsmsuxuwkxlctukyvv.supabase.co/storage/v1/object/public/reportes-fotos/${foto_url}`;
}
