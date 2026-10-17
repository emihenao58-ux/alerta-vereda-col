import type { ReporteEvidencia } from "./types";

export const PHOTO_RESOLUTION_ATTEMPTS = [2400, 2048, 1600, 1200, 960] as const;
export const MAX_PHOTO_LONG_EDGE: number = PHOTO_RESOLUTION_ATTEMPTS[0];
export const FALLBACK_PHOTO_LONG_EDGE = 1200;
export const MIN_PHOTO_LONG_EDGE: number = PHOTO_RESOLUTION_ATTEMPTS[4];
export const MAX_PHOTO_TARGET_BYTES = 600 * 1024; // Objetivo aproximado, no garantía absoluta
export const PHOTO_QUALITY_ATTEMPTS = [0.8, 0.75, 0.7, 0.65, 0.6] as const;
export const INITIAL_PHOTO_QUALITY: number = PHOTO_QUALITY_ATTEMPTS[0];
export const MIN_PHOTO_QUALITY: number = PHOTO_QUALITY_ATTEMPTS[4];
export const QUALITY_STEP = 0.05;

export type DimensionesImagen = {
  width: number;
  height: number;
};

export type EstadoProcesamientoFotografia = "procesada" | "pesada" | "original";
export type EstadoIntentoProcesamiento = "aceptado" | "pesado" | "error";

export type IntentoProcesamientoFotografia = {
  maxLadoLargo: number;
  calidad: number | null;
  bytes?: number;
  estado: EstadoIntentoProcesamiento;
  duracionMs: number;
  error?: string;
};

export type ResultadoProcesamientoFotografia = {
  archivo: File;
  estado: EstadoProcesamientoFotografia;
  dimensiones: DimensionesImagen | null;
  intentos: readonly IntentoProcesamientoFotografia[];
  puedeVisualizarse: boolean;
  mensajeError?: string;
};

const MENSAJE_IMAGEN_NO_COMPATIBLE =
  "No se pudo mostrar esta fotografía en este navegador. Elige otra imagen o conviértela a JPG o PNG.";

export function actualizarMetadatosEvidencia(
  evidencia: ReporteEvidencia,
  resultado: Pick<ResultadoProcesamientoFotografia, "archivo" | "estado" | "dimensiones">,
  recortada = evidencia.recortada ?? false,
): Pick<
  ReporteEvidencia,
  "archivo" | "procesamiento" | "dimensiones" | "archivoOriginal" | "recortada"
> {
  return {
    archivo: resultado.archivo,
    procesamiento: resultado.estado,
    dimensiones: resultado.dimensiones,
    archivoOriginal: evidencia.archivoOriginal ?? evidencia.archivo,
    recortada,
  };
}

/**
 * Calcula las dimensiones ajustadas sin aumentar imágenes pequeñas
 * y respetando la relación de aspecto.
 */
export function calcularDimensionesOptimizadas(
  anchoOriginal: number,
  altoOriginal: number,
  maxLadoLargo: number = MAX_PHOTO_LONG_EDGE,
): DimensionesImagen {
  if (anchoOriginal <= 0 || altoOriginal <= 0) {
    return { width: Math.max(1, anchoOriginal), height: Math.max(1, altoOriginal) };
  }

  const ladoMayor = Math.max(anchoOriginal, altoOriginal);
  if (ladoMayor <= maxLadoLargo) {
    return { width: anchoOriginal, height: altoOriginal };
  }

  const factor = maxLadoLargo / ladoMayor;
  return {
    width: Math.max(1, Math.round(anchoOriginal * factor)),
    height: Math.max(1, Math.round(altoOriginal * factor)),
  };
}

/**
 * Devuelve una secuencia finita basada en el tamaño real de la imagen.
 * No clasifica el dispositivo ni intenta medir su RAM: solo usa dimensiones,
 * resultados de conversión y fallos observables del procesamiento.
 */
export function crearSecuenciaResoluciones(
  anchoOriginal: number,
  altoOriginal: number,
  maxLadoLargo: number = MAX_PHOTO_LONG_EDGE,
): readonly number[] {
  const ladoMayor = Math.max(anchoOriginal, altoOriginal);
  const primerIntento = Math.min(ladoMayor, maxLadoLargo);
  const siguientes = PHOTO_RESOLUTION_ATTEMPTS.filter(
    (resolucion) => resolucion < primerIntento && resolucion <= ladoMayor,
  );

  return [...new Set([primerIntento, ...siguientes])];
}

function ahoraMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

/**
 * Decodifica una imagen usando createImageBitmap con orientación EXIF cuando
 * está disponible, o un elemento Image HTML como respaldo seguro.
 */
async function decodificarImagen(file: File): Promise<{
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof window !== "undefined" && typeof window.createImageBitmap === "function") {
    try {
      const bitmap = await window.createImageBitmap(file, { imageOrientation: "from-image" });
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      try {
        const bitmap = await window.createImageBitmap(file);
        return {
          source: bitmap,
          width: bitmap.width,
          height: bitmap.height,
          cleanup: () => bitmap.close(),
        };
      } catch {
        // Fallback al cargador estándar para formatos no soportados por ImageBitmap
      }
    }
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      resolve({
        source: img,
        width: img.naturalWidth,
        height: img.naturalHeight,
        cleanup: () => URL.revokeObjectURL(url),
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen seleccionada."));
    };

    img.src = url;
  });
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("No se pudo comprimir la fotografía."));
          return;
        }
        if (blob.type !== "image/jpeg") {
          reject(new Error("El navegador no confirmó la conversión JPEG."));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

async function convertirEnResolucion(
  source: ImageBitmap | HTMLImageElement,
  anchoOriginal: number,
  altoOriginal: number,
  maxLadoLargo: number,
): Promise<{
  archivo: File;
  dimensiones: DimensionesImagen;
  calidad: number;
  bytes: number;
}> {
  const dimensiones = calcularDimensionesOptimizadas(anchoOriginal, altoOriginal, maxLadoLargo);
  const canvas = document.createElement("canvas");
  canvas.width = dimensiones.width;
  canvas.height = dimensiones.height;

  try {
    const contexto = canvas.getContext("2d", { alpha: false });
    if (!contexto) {
      throw new Error("El navegador no permitió inicializar el procesador de imágenes.");
    }

    // El JPEG no conserva transparencia; el fondo blanco evita un resultado negro inesperado.
    contexto.fillStyle = "#ffffff";
    contexto.fillRect(0, 0, dimensiones.width, dimensiones.height);
    contexto.drawImage(source, 0, 0, dimensiones.width, dimensiones.height);

    let blob: Blob | null = null;
    let calidad = MIN_PHOTO_QUALITY;
    for (const calidadIntento of PHOTO_QUALITY_ATTEMPTS) {
      calidad = calidadIntento;
      blob = await canvasToJpegBlob(canvas, calidadIntento);
      if (blob.size <= MAX_PHOTO_TARGET_BYTES) break;
    }

    if (!blob) {
      throw new Error("No se generó un archivo de fotografía.");
    }

    const timestamp = Date.now();
    return {
      archivo: new File([blob], `evidencia-${timestamp}.jpg`, {
        type: "image/jpeg",
        lastModified: timestamp,
      }),
      dimensiones,
      calidad,
      bytes: blob.size,
    };
  } finally {
    // Libera el backing store del canvas antes de probar la siguiente resolución.
    canvas.width = 0;
    canvas.height = 0;
  }
}

/**
 * Procesa una fotografía con intentos progresivos y finitos.
 *
 * - Comienza hasta 2400 px cuando la imagen original lo permite.
 * - Baja a 2048, 1600, 1200 y 960 px si el resultado continúa pesado o falla.
 * - En cada resolución prueba calidades entre 0.8 y 0.6.
 * - No aumenta imágenes pequeñas.
 * - Si todos los intentos fallan, devuelve el archivo original sin afirmar que fue optimizado.
 */
export async function procesarFotografiaEvidenciaDetallada(
  archivoOriginal: File,
  maxLadoLargo = MAX_PHOTO_LONG_EDGE,
): Promise<ResultadoProcesamientoFotografia> {
  if (!archivoOriginal.type.startsWith("image/")) {
    return {
      archivo: archivoOriginal,
      estado: "original",
      dimensiones: null,
      intentos: [],
      puedeVisualizarse: false,
      mensajeError: "El archivo seleccionado no es una imagen compatible.",
    };
  }

  let imagen: Awaited<ReturnType<typeof decodificarImagen>>;
  try {
    imagen = await decodificarImagen(archivoOriginal);
  } catch {
    return {
      archivo: archivoOriginal,
      estado: "original",
      dimensiones: null,
      intentos: [],
      puedeVisualizarse: false,
      mensajeError: MENSAJE_IMAGEN_NO_COMPATIBLE,
    };
  }

  const intentos: IntentoProcesamientoFotografia[] = [];
  let ultimoProcesado: {
    archivo: File;
    dimensiones: DimensionesImagen;
  } | null = null;
  const resoluciones = crearSecuenciaResoluciones(imagen.width, imagen.height, maxLadoLargo);

  try {
    for (const resolucion of resoluciones) {
      const inicio = ahoraMs();
      try {
        const resultado = await convertirEnResolucion(
          imagen.source,
          imagen.width,
          imagen.height,
          resolucion,
        );
        ultimoProcesado = {
          archivo: resultado.archivo,
          dimensiones: resultado.dimensiones,
        };
        const estado = resultado.bytes <= MAX_PHOTO_TARGET_BYTES ? "aceptado" : "pesado";
        intentos.push({
          maxLadoLargo: resolucion,
          calidad: resultado.calidad,
          bytes: resultado.bytes,
          estado,
          duracionMs: ahoraMs() - inicio,
        });

        if (estado === "aceptado") {
          return {
            archivo: resultado.archivo,
            estado: "procesada",
            dimensiones: resultado.dimensiones,
            intentos,
            puedeVisualizarse: true,
          };
        }
      } catch (error) {
        intentos.push({
          maxLadoLargo: resolucion,
          calidad: null,
          estado: "error",
          duracionMs: ahoraMs() - inicio,
          error: error instanceof Error ? error.message : "Error de procesamiento",
        });
      }
    }

    if (ultimoProcesado) {
      return {
        archivo: ultimoProcesado.archivo,
        estado: "pesada",
        dimensiones: ultimoProcesado.dimensiones,
        intentos,
        puedeVisualizarse: true,
      };
    }

    return {
      archivo: archivoOriginal,
      estado: "original",
      dimensiones: null,
      intentos,
      puedeVisualizarse: true,
    };
  } finally {
    imagen.cleanup();
  }
}

/**
 * Compatibilidad con el consumidor anterior: devuelve solo el archivo.
 * El flujo nuevo usa procesarFotografiaEvidenciaDetallada() para conocer el estado.
 */
export async function procesarFotografiaEvidencia(
  archivoOriginal: File,
  maxLadoLargo = MAX_PHOTO_LONG_EDGE,
): Promise<File> {
  const resultado = await procesarFotografiaEvidenciaDetallada(archivoOriginal, maxLadoLargo);
  return resultado.archivo;
}
