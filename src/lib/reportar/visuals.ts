import type { ReporteCategoria } from "@/lib/reportar/types";

export function colorTipoReporte(
  categoria: ReporteCategoria | null,
  subcategoriaId: string | null,
  subcategoriaPadreId: string | null,
  colorBase?: string,
) {
  if (categoria === "emergencia") return "#D83644";
  if (categoria === "via") return "#E58129";
  if (categoria === "otro") {
    return subcategoriaPadreId === "alerta_seguridad" ? "#D83644" : "#E7A836";
  }

  const serviceId = subcategoriaPadreId ?? subcategoriaId;
  if (serviceId === "agua") return "#2A91C9";
  if (serviceId === "energia") return "#D49A1C";
  if (serviceId === "gas") return "#E4772C";
  if (serviceId === "recoleccion_basura") return "#6D8E42";
  if (serviceId === "senal") return "#3D83C4";
  return colorBase ?? "#208666";
}
