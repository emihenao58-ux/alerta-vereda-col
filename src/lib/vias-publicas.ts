import { estadoPublicoDe, type EstadoPublico } from "@/lib/reportes-publicos";
import type { MiVeredaPublicacion } from "@/lib/mi-vereda-cartelera";

export type CondicionViaPublica = "habilitada" | "precaucion" | "afectada" | "cerrada";

const CONDICIONES_VIA: Record<string, CondicionViaPublica> = {
  habilitada: "habilitada",
  precaucion: "precaucion",
  "con precaucion": "precaucion",
  afectada: "afectada",
  cerrada: "cerrada",
};
const ETIQUETAS_CONDICION_VIA: Record<CondicionViaPublica, string> = {
  habilitada: "Vía habilitada",
  precaucion: "Vía con precaución",
  afectada: "Vía afectada",
  cerrada: "Vía cerrada",
};

function normalizarCondicion(valor: string | null | undefined) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("_", " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Vías usa las mismas reglas públicas y solo agrega la comprobación de categoría. */
export function esPublicacionViasPublica(publicacion: MiVeredaPublicacion) {
  return publicacion.categoria === "via" && estadoPublicoDe(publicacion) !== null;
}

/** Una condición vial nunca se convierte por sí sola en estado general. */
export function estadoGeneralViaDe(publicacion: MiVeredaPublicacion): EstadoPublico | null {
  if (publicacion.categoria !== "via") return null;
  return estadoPublicoDe(publicacion);
}

/** Devuelve una condición vial solo si el valor coincide con el catálogo conocido. */
export function condicionViaDe(publicacion: MiVeredaPublicacion): CondicionViaPublica | null {
  if (publicacion.categoria !== "via") return null;
  return CONDICIONES_VIA[normalizarCondicion(publicacion.estado_operativo)] ?? null;
}

export function etiquetaCondicionViaDe(publicacion: MiVeredaPublicacion) {
  const condicion = condicionViaDe(publicacion);
  return condicion ? ETIQUETAS_CONDICION_VIA[condicion] : null;
}
