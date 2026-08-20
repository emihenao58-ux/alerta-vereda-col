export type Severidad = "urgente" | "precaucion" | "normal";

export type TipoServicio = "agua" | "luz" | "senal";

export type TipoReporte = "emergencia" | "via" | "servicio" | "aviso";

export type ResultadoCierre = "solucionado" | "no_solucionado";

export const LABEL_RESULTADO_CIERRE: Record<ResultadoCierre, string> = {
  solucionado: "Solucionado",
  no_solucionado: "No solucionado",
};

/** Colores oficiales de severidad (documento de identidad, sección 4.4). */
export const COLOR_SEVERIDAD: Record<Severidad, string> = {
  urgente: "#C23B2E",
  precaucion: "#DB7B33",
  normal: "#3C8A5B",
};

export const LABEL_SEVERIDAD: Record<Severidad, string> = {
  urgente: "Urgente",
  precaucion: "Precaución",
  normal: "Normal",
};

const NIVELES_VALIDOS: readonly Severidad[] = ["urgente", "precaucion", "normal"];

/**
 * Convierte la columna `nivel` (la fija el admin al publicar) al tipo `Severidad`.
 * Cualquier valor no reconocido cae en "precaucion" para no ocultar una novedad
 * por un dato inesperado.
 */
export function severidadDeNivel(nivel: string | null | undefined): Severidad {
  return (NIVELES_VALIDOS as readonly string[]).includes(nivel ?? "")
    ? (nivel as Severidad)
    : "precaucion";
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
