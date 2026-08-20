export type Severidad = "urgente" | "precaucion" | "normal";

export type TipoServicio = "agua" | "luz" | "senal";

export type TipoReporte = "emergencia" | "via" | "servicio" | "aviso";

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