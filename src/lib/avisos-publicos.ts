import type { MiVeredaPublicacion } from "@/lib/mi-vereda-cartelera";
import { estadoPublicoDe, type EstadoPublico } from "@/lib/reportes-publicos";

export const FILTROS_TIPO_AVISO = [
  { id: "reunion", etiqueta: "Reuniones" },
  { id: "aviso_comunitario", etiqueta: "Avisos comunitarios" },
  { id: "persona_desaparecida", etiqueta: "Desaparecidos" },
  { id: "robo", etiqueta: "Robo" },
  { id: "intento_robo", etiqueta: "Intento de robo" },
  { id: "mascota_perdida", etiqueta: "Mascotas perdidas" },
  { id: "disturbios_orden", etiqueta: "Disturbios" },
  { id: "embriaguez_via", etiqueta: "Embriaguez en vía pública" },
  { id: "otro_seguridad", etiqueta: "Otro" },
] as const;

export type TipoFiltroAviso = (typeof FILTROS_TIPO_AVISO)[number]["id"];

const NOMBRES_COMPLETOS_TIPO_AVISO: Record<TipoFiltroAviso, string> = {
  reunion: "Reunión o convocatoria",
  aviso_comunitario: "Aviso comunitario",
  persona_desaparecida: "Persona desaparecida",
  robo: "Robo",
  intento_robo: "Intento de robo",
  mascota_perdida: "Mascota perdida",
  disturbios_orden: "Disturbios o alteración del orden",
  embriaguez_via: "Persona en estado de embriaguez en la vía pública",
  otro_seguridad: "Otro",
};

export function tipoAvisoFiltroDe(tipo: string | null | undefined): TipoFiltroAviso | null {
  const identificador = (tipo ?? "").trim().toLowerCase();
  return FILTROS_TIPO_AVISO.find((opcion) => opcion.id === identificador)?.id ?? null;
}

export function etiquetaTipoAvisoDe(tipo: string | null | undefined): string | null {
  const identificador = (tipo ?? "").trim().toLowerCase();
  const tipoFiltrable = tipoAvisoFiltroDe(identificador);
  if (tipoFiltrable) return NOMBRES_COMPLETOS_TIPO_AVISO[tipoFiltrable];

  // `otro_aviso` no tiene equivalencia aprobada en los nueve filtros; se conserva en Todos.
  return identificador === "otro_aviso" ? "Otro aviso" : null;
}

export function esAvisoPublico(publicacion: MiVeredaPublicacion) {
  return publicacion.categoria === "aviso" && estadoPublicoDe(publicacion) !== null;
}

export function estadoGeneralAvisoDe(publicacion: MiVeredaPublicacion): EstadoPublico | null {
  if (publicacion.categoria !== "aviso") return null;
  return estadoPublicoDe(publicacion);
}
