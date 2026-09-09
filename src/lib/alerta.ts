// `*_nivel_check` de la base de datos usa urgent/atencion/normal.
// La etiqueta visual conserva "Precaución" para el nivel atencion.
export type Severidad = "urgente" | "atencion" | "normal";

export type TipoServicio = "agua" | "energia" | "senal" | "internet" | "luz" | "otro";

export type TipoReporte = "emergencia" | "via" | "servicio" | "otro" | "aviso";

export type ResultadoCierre = "solucionado" | "no_solucionado" | "retirado";

export const LABEL_RESULTADO_CIERRE: Record<ResultadoCierre, string> = {
  solucionado: "Solucionado",
  no_solucionado: "No solucionado",
  retirado: "Retirado",
};

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

export function severidadDeNivel(nivel: string | null | undefined): Severidad {
  return (NIVELES_VALIDOS as readonly string[]).includes(nivel ?? "")
    ? (nivel as Severidad)
    : "atencion";
}

/** Texto visual del estado operacional de una publicación. */
export function ETIQUETA_ESTADO(
  tipo: "emergencia" | "via" | "servicio" | "avisos" | "aviso" | "otro",
  estado: string | null | undefined,
  resultado?: string | null,
  razonCierre?: string | null,
): string {
  if ((tipo === "avisos" || tipo === "aviso" || tipo === "otro") && resultado === "retirado") {
    return razonCierre === "finalizacion_natural" ? "Finalizado" : "Retirado";
  }

  switch (tipo) {
    case "emergencia":
      return estado ?? "Activa";
    case "via":
      return estado ?? "";
    case "servicio":
      return estado ?? "";
    case "avisos":
    case "aviso":
    case "otro":
      return "Aviso";
    default:
      return "";
  }
}

export const LABEL_TIPO_SERVICIO: Record<TipoServicio, string> = {
  agua: "Agua",
  energia: "Energía",
  senal: "Señal",
  internet: "Internet",
  luz: "Alumbrado",
  otro: "Otro servicio",
};

export const LABEL_TIPO_REPORTE: Record<TipoReporte, string> = {
  emergencia: "Emergencia",
  via: "Estado de una vía",
  servicio: "Corte de servicio",
  otro: "Aviso comunitario",
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

export function URL_FOTO(foto_url: string | null | undefined): string | null {
  if (!foto_url) return null;
  if (foto_url.startsWith("http")) return foto_url;
  const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/reportes-fotos/${foto_url}`;
}
