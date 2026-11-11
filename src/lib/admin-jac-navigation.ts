export const VISTAS_PANEL_JAC = [
  "resumen",
  "reportes-pendientes",
  "publicaciones-activas",
  "reportes-revisados",
] as const;

export type VistaPanelJac = (typeof VISTAS_PANEL_JAC)[number];

export function esVistaPanelJac(value: unknown): value is VistaPanelJac {
  return typeof value === "string" && VISTAS_PANEL_JAC.some((vista) => vista === value);
}

export function validarBusquedaPanelJac(search: Record<string, unknown>): {
  vista?: VistaPanelJac;
} {
  return esVistaPanelJac(search["vista"]) ? { vista: search["vista"] } : {};
}
