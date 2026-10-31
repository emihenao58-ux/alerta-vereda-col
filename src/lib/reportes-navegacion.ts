export const ORIGENES_LISTA_REPORTE = {
  todos: { ruta: "/reportes/todos", etiqueta: "Volver a reportes" },
  emergencias: { ruta: "/emergencias", etiqueta: "Volver a Emergencias" },
  vias: { ruta: "/vias", etiqueta: "Volver a Vías" },
  servicios: { ruta: "/servicios", etiqueta: "Volver a Servicios" },
  avisos: { ruta: "/avisos", etiqueta: "Volver a Avisos" },
} as const;

export type OrigenListaReporte = keyof typeof ORIGENES_LISTA_REPORTE;

export function normalizarOrigenListaReporte(value: unknown): OrigenListaReporte {
  if (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(ORIGENES_LISTA_REPORTE, value)
  ) {
    return value as OrigenListaReporte;
  }

  return "todos";
}
