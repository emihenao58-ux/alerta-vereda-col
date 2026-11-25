export type ContextoAdminReportes = "reportes" | "publicaciones" | "historial";
export type TipoRegistroAdminHistorial = "publicacion" | "reporte";

export function normalizarContextoAdminReportes(value: unknown): ContextoAdminReportes | undefined {
  return value === "reportes" || value === "publicaciones" || value === "historial"
    ? value
    : undefined;
}

export function normalizarTipoRegistroAdminHistorial(
  value: unknown,
): TipoRegistroAdminHistorial | undefined {
  return value === "publicacion" || value === "reporte" ? value : undefined;
}

export function validarBusquedaReportesAdmin(search: Record<string, unknown>): {
  contexto?: ContextoAdminReportes | undefined;
} {
  const contexto = normalizarContextoAdminReportes(search["contexto"]);
  return contexto === undefined ? {} : { contexto };
}
