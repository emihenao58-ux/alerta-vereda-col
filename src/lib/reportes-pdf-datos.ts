import type { CoordenadasPublicas } from "./reportes-publicos";
import type { ReporteLocal } from "./reportar/local-history";

const MAX_FOTOGRAFIAS_PDF = 3;
const MAX_VIDEOS_PDF = 1;

export type EvidenciaReportePdf = {
  id: string;
  tipo: "foto" | "video";
  etiqueta: string;
  archivo?: Blob;
  url?: string;
  tipoMime?: string;
  duracionSegundos?: number;
};

export type DatosReportePdf = {
  origenRegistro: "publico" | "local";
  titulo: string;
  categoria: string;
  tipo: string | null;
  estado: string;
  fecha: string;
  autor: string | null;
  vereda: string | null;
  referencia: string | null;
  coordenadas: string | null;
  precision: string | null;
  descripcion: string | null;
  motivoSinEvidencia: string | null;
  notaOrigen: string;
  evidencias: EvidenciaReportePdf[];
  evidenciasOmitidas: { fotografias: number; videos: number };
};

export type EntradaPublicaPdf = {
  titulo: string;
  categoria: string;
  tipo: string | null;
  estado: string;
  fecha: string;
  vereda: string | null;
  referencia: string | null;
  descripcion: string | null;
  emergenciaSinVerificar: boolean;
  fotoUrl: string | null;
  coordenadasPublicas: CoordenadasPublicas | null;
};

export type EntradaLocalPdf = {
  reporte: ReporteLocal;
  titulo: string;
  categoria: string;
  tipo: string | null;
  fecha: string;
  vereda: string | null;
  referencia: string | null;
  motivoSinEvidencia: string | null;
};

export type EvidenciaReportePdfPreparada = {
  id: string;
  tipo: "foto" | "video";
  etiqueta: string;
  /** Vista ligera para la portada; no sustituye la imagen de detalle. */
  miniaturaDataUri: string | null;
  /** Mejor archivo de imagen disponible, reservado para la página fotográfica. */
  imagenCompletaDataUri: string | null;
  detalle: string | null;
  incidencia: string | null;
};

export type DatosReportePdfPreparados = Omit<DatosReportePdf, "evidencias"> & {
  generadoEn: string;
  plantillaPrincipalDataUri: string;
  plantillaAmpliacionDataUri: string | null;
  evidencias: EvidenciaReportePdfPreparada[];
};

function coordenadasValidas(latitud: number, longitud: number) {
  return (
    Number.isFinite(latitud) &&
    Number.isFinite(longitud) &&
    latitud >= -90 &&
    latitud <= 90 &&
    longitud >= -180 &&
    longitud <= 180
  );
}

export function coordenadasReportePdf(
  coordenadas: CoordenadasPublicas | null | undefined,
): string | null {
  if (!coordenadas || !coordenadasValidas(coordenadas.latitud, coordenadas.longitud)) return null;
  return `${coordenadas.latitud.toFixed(5)}, ${coordenadas.longitud.toFixed(5)}`;
}

export function tieneUbicacionReportePdf(
  datos: Pick<DatosReportePdf, "vereda" | "referencia" | "coordenadas">,
) {
  return Boolean(datos.vereda?.trim() || datos.referencia?.trim() || datos.coordenadas?.trim());
}

function limitarEvidenciasPdf(evidencias: EvidenciaReportePdf[]) {
  let fotografias = 0;
  let videos = 0;
  const permitidas = evidencias.filter((evidencia) => {
    if (evidencia.tipo === "foto") return fotografias++ < MAX_FOTOGRAFIAS_PDF;
    return videos++ < MAX_VIDEOS_PDF;
  });

  return {
    evidencias: permitidas,
    omitidas: {
      fotografias: Math.max(0, fotografias - MAX_FOTOGRAFIAS_PDF),
      videos: Math.max(0, videos - MAX_VIDEOS_PDF),
    },
  };
}

export function crearDatosReportePdfPublico(entrada: EntradaPublicaPdf): DatosReportePdf {
  const coordenadas = coordenadasReportePdf(entrada.coordenadasPublicas);
  const evidencias =
    !entrada.emergenciaSinVerificar && entrada.fotoUrl
      ? [
          {
            id: "fotografia-publica",
            tipo: "foto" as const,
            etiqueta: "Evidencia fotográfica",
            url: entrada.fotoUrl,
          },
        ]
      : [];
  const resultadoEvidencias = limitarEvidenciasPdf(evidencias);

  return {
    origenRegistro: "publico",
    titulo: entrada.titulo,
    categoria: entrada.categoria,
    tipo: entrada.tipo?.trim() || null,
    estado: entrada.estado,
    fecha: entrada.fecha,
    autor: null,
    vereda: entrada.vereda?.trim() || null,
    referencia: entrada.referencia?.trim() || null,
    coordenadas,
    precision: null,
    descripcion: entrada.descripcion?.trim() || null,
    motivoSinEvidencia: null,
    notaOrigen: entrada.emergenciaSinVerificar
      ? "Emergencia no verificada. El estado no confirma recepción ni revisión oficial de la administración. La información aún no está confirmada; actúa con precaución."
      : "Publicación de consulta pública. Se muestra la información disponible en la publicación, sin añadir datos de autoría.",
    evidencias: resultadoEvidencias.evidencias,
    evidenciasOmitidas: resultadoEvidencias.omitidas,
  };
}

function coordenadasLocalesPdf(reporte: ReporteLocal) {
  if (reporte.datos.ubicacionEstado !== "confirmada" || !reporte.datos.ubicacion) return null;
  const { latitud, longitud } = reporte.datos.ubicacion;
  if (!coordenadasValidas(latitud, longitud)) return null;
  return `${latitud.toFixed(5)}, ${longitud.toFixed(5)}`;
}

function precisionLocalPdf(reporte: ReporteLocal) {
  if (reporte.datos.ubicacionEstado !== "confirmada" || !reporte.datos.ubicacion) return null;
  const precision = reporte.datos.ubicacion.precision;
  return Number.isFinite(precision) && precision >= 0 ? `${Math.round(precision)} m` : null;
}

export function crearDatosReportePdfLocal(entrada: EntradaLocalPdf): DatosReportePdf {
  const { reporte } = entrada;
  const evidencias: EvidenciaReportePdf[] = [
    ...reporte.fotografias.map((foto, index) => ({
      id: foto.evidenciaId,
      tipo: "foto" as const,
      etiqueta: `Evidencia fotográfica ${index + 1}`,
      archivo: foto.archivo,
      tipoMime: foto.tipoMime,
    })),
    ...reporte.videos.map((video, index) => ({
      id: video.evidenciaId,
      tipo: "video" as const,
      etiqueta: `Video ${index + 1}`,
      archivo: video.archivo,
      tipoMime: video.tipoMime,
      duracionSegundos: video.duracionSegundos,
    })),
  ];

  const idsFotografiasDisponibles = new Set(reporte.fotografias.map((foto) => foto.evidenciaId));
  const fotografiasSinArchivo = reporte.datos.evidencias.filter(
    (evidencia) => evidencia.tipo === "foto" && !idsFotografiasDisponibles.has(evidencia.id),
  );
  for (const [index, foto] of fotografiasSinArchivo.entries()) {
    evidencias.push({
      id: foto.id,
      tipo: "foto",
      etiqueta: `Evidencia fotográfica ${reporte.fotografias.length + index + 1}`,
    });
  }

  const videosSinArchivo = reporte.datos.evidencias.filter(
    (evidencia) =>
      evidencia.tipo === "video" &&
      !reporte.videos.some((video) => video.evidenciaId === evidencia.id),
  );
  for (const [index, video] of videosSinArchivo.entries()) {
    evidencias.push({
      id: video.id,
      tipo: "video",
      etiqueta: `Video ${reporte.videos.length + index + 1}`,
    });
  }

  const resultadoEvidencias = limitarEvidenciasPdf(evidencias);

  return {
    origenRegistro: "local",
    titulo: entrada.titulo,
    categoria: entrada.categoria,
    tipo: entrada.tipo?.trim() || null,
    estado: reporte.estado,
    fecha: entrada.fecha,
    autor: reporte.datos.nombre.trim() || (reporte.origen === "comunitario" ? "Habitante" : null),
    vereda: entrada.vereda?.trim() || null,
    referencia: entrada.referencia?.trim() || null,
    coordenadas: coordenadasLocalesPdf(reporte),
    precision: precisionLocalPdf(reporte),
    descripcion: reporte.datos.descripcion.trim() || null,
    motivoSinEvidencia: entrada.motivoSinEvidencia?.trim() || null,
    notaOrigen:
      "Este reporte está almacenado en este dispositivo. Su estado no confirma la recepción ni la revisión oficial por parte de la administración.",
    evidencias: resultadoEvidencias.evidencias,
    evidenciasOmitidas: resultadoEvidencias.omitidas,
  };
}

export function nombreArchivoReportePdf(titulo: string, fecha = new Date()) {
  const fragmento = titulo
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const fechaTexto = [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("");
  return `alertavereda-reporte-${fragmento || "comunitario"}-${fechaTexto}.pdf`;
}
