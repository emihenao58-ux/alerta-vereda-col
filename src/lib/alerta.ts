import type { Database } from "@/integrations/supabase/types";

export type Severidad = Database["public"]["Enums"]["severidad"];
export type EstadoVia = Database["public"]["Enums"]["estado_via"];
export type TipoServicio = Database["public"]["Enums"]["tipo_servicio"];
export type EstadoServicio = Database["public"]["Enums"]["estado_servicio"];
export type TipoReporte = Database["public"]["Enums"]["tipo_reporte"];

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

export const SEVERIDAD_DE_VIA: Record<EstadoVia, Severidad> = {
  habilitada: "normal",
  precaucion: "precaucion",
  afectada: "precaucion",
  cerrada: "urgente",
};

export const LABEL_VIA: Record<EstadoVia, string> = {
  habilitada: "Habilitada",
  precaucion: "Precaución",
  afectada: "Afectada",
  cerrada: "Cerrada",
};

export const SEVERIDAD_DE_SERVICIO: Record<EstadoServicio, Severidad> = {
  normal: "normal",
  restablecido: "normal",
  intermitente: "precaucion",
  suspendido: "urgente",
};

export const LABEL_SERVICIO: Record<EstadoServicio, string> = {
  normal: "Normal",
  intermitente: "Intermitente",
  suspendido: "Suspendido",
  restablecido: "Restablecido",
};

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
