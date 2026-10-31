import { CircleHelp, Droplet, Flame, Radio, Trash2, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { MiVeredaPublicacion } from "@/lib/mi-vereda-cartelera";
import { estadoPublicoDe, type EstadoPublico } from "@/lib/reportes-publicos";

export type TipoServicioOpcion = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

/** IDs cotejados con el catálogo local de Reportar; los valores se comparan exactamente. */
export const TIPOS_SERVICIO = [
  { id: "agua", label: "Agua", Icon: Droplet },
  { id: "energia", label: "Electricidad", Icon: Zap },
  { id: "senal", label: "Señal o comunicación", Icon: Radio },
  { id: "gas", label: "Gas", Icon: Flame },
  { id: "recoleccion_basura", label: "Recolección de basura", Icon: Trash2 },
  { id: "otro_servicio", label: "Otro servicio", Icon: CircleHelp },
] satisfies readonly TipoServicioOpcion[];

export type TipoServicioCodigo = (typeof TIPOS_SERVICIO)[number]["id"];

function normalizarCondicion(valor: string | null | undefined) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

export function tipoServicioCatalogoDe(valor: string | null | undefined) {
  if (valor == null) return null;
  return TIPOS_SERVICIO.find((opcion) => opcion.id === valor) ?? null;
}

export function tipoServicioSinEquivalenciaDe(valor: string | null | undefined) {
  if (valor == null || tipoServicioCatalogoDe(valor)) return null;
  const valorVisible = valor.trim();
  return valorVisible || null;
}

export function etiquetaTipoServicioDe(valor: string | null | undefined) {
  const opcion = tipoServicioCatalogoDe(valor);
  if (opcion) return opcion.label;

  const valorSinEquivalencia = tipoServicioSinEquivalenciaDe(valor);
  return valorSinEquivalencia
    ? `Sin equivalencia confirmada · ${valorSinEquivalencia}`
    : "Tipo de servicio no disponible";
}

/** La condición operativa es independiente del estado general del reporte. */
export function condicionOperativaServicioDe(publicacion: MiVeredaPublicacion) {
  if (publicacion.categoria !== "servicio") return null;

  const condicion = normalizarCondicion(publicacion.estado_operativo);
  if (condicion === "normal") return "Normal";
  if (condicion === "intermitente") return "Intermitente";
  if (condicion === "interrumpido") return "Interrumpido";
  return null;
}

export function estadoGeneralServicioDe(publicacion: MiVeredaPublicacion): EstadoPublico | null {
  if (publicacion.categoria !== "servicio") return null;
  return estadoPublicoDe(publicacion);
}

export function esPublicacionServicioPublica(publicacion: MiVeredaPublicacion) {
  return publicacion.categoria === "servicio" && estadoPublicoDe(publicacion) !== null;
}
