import type { Database } from "@/integrations/supabase/types";

export type Severidad = "urgente" | "precaucion" | "normal";

export type EstadoVia = "habilitada" | "precaucion" | "afectada" | "cerrada";

export type TipoServicio = "agua" | "luz" | "senal";

export type EstadoServicio = "normal" | "intermitente" | "suspendido" | "restablecido";

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

/**
 * Mapea el texto de estado publicado de una vía al tipo `EstadoVia`.
 * Las publicaciones se crean con `vias.estado` = "Habilitada" / "Precaución" / "Cerrada";
 * cualquier valor no reconocido cae en "afectada" (el chip muestra solo el color de severidad). */
export function estadoDeVia(estado: string | null | undefined): EstadoVia {
  const e = (estado ?? "").trim().toLowerCase();
  if (e === "habilitada") return "habilitada";
  if (e === "precaución" || e === "precaucion") return "precaucion";
  if (e === "cerrada") return "cerrada";
  return "afectada";
}

/**
 * Mapea el texto de estado publicado de un servicio al tipo `EstadoServicio`.
 * Las publicaciones se crean con `servicios.estado` = "Normal" / "Intermitente" / "Interrumpido";
 * "Restablecido" se reconoce por si un admin lo escribe a mano. Cualquier otro valor cae en "intermitente". */
export function estadoDeServicio(estado: string | null | undefined): EstadoServicio {
  const e = (estado ?? "").trim().toLowerCase();
  if (e === "normal") return "normal";
  if (e === "intermitente") return "intermitente";
  if (e === "suspendido" || e === "interrumpido") return "suspendido";
  if (e === "restablecido") return "restablecido";
  return "intermitente";
}

/**
 * Mapea el texto de estado publicado de una emergencia al tipo `Severidad`.
 * Las publicaciones se crean con `emergencias.estado` = "Activa" / "En observación";
 * una emergencia ya no vigente se puede marcar con "Resuelta" y en ese caso cae en "normal". */
export function severidadDeEmergencia(estado: string | null | undefined): Severidad {
  const e = (estado ?? "").trim().toLowerCase();
  if (e === "resuelta" || e === "solucionada" || e === "cerrada") return "normal";
  return "urgente";
}

export function fecha(valor: string | null | undefined) {
  if (!valor) return "";
  return new Date(valor).toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}
