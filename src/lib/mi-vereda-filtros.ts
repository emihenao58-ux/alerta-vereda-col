export type PeriodoMiVereda = "todo" | "15" | "30" | "60" | "90";
export type OrdenMiVereda = "recientes" | "antiguos";
export type CriterioFechaMiVereda = "creacion" | "cierre";

export type RegistroConFechasMiVereda = {
  id: string;
  fechaCreacion: string;
  cerradoEn?: string | null;
};

const MILISEGUNDOS_POR_DIA = 24 * 60 * 60 * 1000;

export function esResultadoHistorialPublico(
  resultado: string | null | undefined,
): resultado is "solucionado" | "no_solucionado" {
  return resultado === "solucionado" || resultado === "no_solucionado";
}

export function esResultadoNovedadPublico(resultado: string | null | undefined): resultado is null {
  return resultado === null;
}

export function obtenerTimestampFechaMiVereda(valor: string | null | undefined): number | null {
  if (typeof valor !== "string") return null;
  const texto = valor.trim();
  const partes = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/i.exec(texto);
  if (!partes) return null;

  const anio = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  const fechaCalendario = new Date(0);
  fechaCalendario.setUTCHours(0, 0, 0, 0);
  fechaCalendario.setUTCFullYear(anio, mes - 1, dia);
  if (
    fechaCalendario.getUTCFullYear() !== anio ||
    fechaCalendario.getUTCMonth() !== mes - 1 ||
    fechaCalendario.getUTCDate() !== dia
  ) {
    return null;
  }

  const timestamp = Date.parse(texto);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function registroDentroDelPeriodo(
  registro: Pick<RegistroConFechasMiVereda, "fechaCreacion" | "cerradoEn">,
  periodo: PeriodoMiVereda,
  ahora: number,
  considerarCierre: boolean,
): boolean {
  const valores = considerarCierre
    ? [registro.fechaCreacion, registro.cerradoEn]
    : [registro.fechaCreacion];
  const fechas = valores.map(obtenerTimestampFechaMiVereda);

  // Las fechas futuras no califican, pero no descartan otra fecha válida del mismo registro.
  const fechasNoFuturas = fechas.filter(
    (fecha): fecha is number => fecha !== null && fecha <= ahora,
  );
  if (fechasNoFuturas.length === 0) return false;
  if (periodo === "todo") return true;

  const limiteInferior = ahora - Number(periodo) * MILISEGUNDOS_POR_DIA;
  return fechasNoFuturas.some((fecha) => fecha >= limiteInferior);
}

export function ordenarRegistrosPorFecha<T extends RegistroConFechasMiVereda>(
  registros: readonly T[],
  orden: OrdenMiVereda,
  criterio: CriterioFechaMiVereda = "creacion",
): T[] {
  const obtenerFecha = (registro: T) => {
    if (criterio === "cierre") {
      return (
        obtenerTimestampFechaMiVereda(registro.cerradoEn) ??
        obtenerTimestampFechaMiVereda(registro.fechaCreacion)
      );
    }
    return obtenerTimestampFechaMiVereda(registro.fechaCreacion);
  };

  return [...registros].sort((a, b) => {
    const fechaA = obtenerFecha(a);
    const fechaB = obtenerFecha(b);

    if (fechaA === null && fechaB !== null) return 1;
    if (fechaA !== null && fechaB === null) return -1;
    if (fechaA === null && fechaB === null) return a.id.localeCompare(b.id, "es");

    const diferencia = orden === "recientes" ? fechaB! - fechaA! : fechaA! - fechaB!;
    return diferencia || a.id.localeCompare(b.id, "es");
  });
}
