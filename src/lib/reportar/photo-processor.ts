export const MAX_PHOTO_LONG_EDGE = 1600;
export const MAX_PHOTO_TARGET_BYTES = 600 * 1024; // ~600 KB
export const INITIAL_PHOTO_QUALITY = 0.8;
export const MIN_PHOTO_QUALITY = 0.6;
export const QUALITY_STEP = 0.05;

// Dimensiones de respaldo para dispositivos con memoria muy limitada o fallos en canvas grande
export const FALLBACK_PHOTO_LONG_EDGE = 1200;

export type DimensionesImagen = {
  width: number;
  height: number;
};

/**
 * Calcula las dimensiones ajustadas sin aumentar imágenes pequeñas
 * y respetando la relación de aspecto.
 */
export function calcularDimensionesOptimizadas(
  anchoOriginal: number,
  altoOriginal: number,
  maxLadoLargo = MAX_PHOTO_LONG_EDGE,
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
 * Decodifica una imagen usando createImageBitmap si está disponible,
 * o un elemento Image HTML como respaldo seguro.
 */
async function decodificarImagen(file: File): Promise<{
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof window !== "undefined" && typeof window.createImageBitmap === "function") {
    try {
      const bitmap = await window.createImageBitmap(file);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        cleanup: () => bitmap.close(),
      };
    } catch {
      // Fallback al cargador estándar si createImageBitmap falla con formatos particulares
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

/**
 * Convierte un canvas a un Blob JPEG con la calidad dada.
 */
function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("No se pudo comprimir la fotografía."));
      },
      "image/jpeg",
      quality,
    );
  });
}

/**
 * Procesa una imagen de fotografía:
 * 1. Reduce su resolución máxima al límite de 1600px en el lado más largo (sin agrandar).
 * 2. Comprime en JPEG con calidad inicial de 0.8.
 * 3. Si supera los ~600 KB, reduce iterativamente la calidad hasta un mínimo de 0.6.
 * 4. Si el canvas falla, reintenta con el perfil de respaldo más ligero (1200px).
 * 5. Elimina metadatos EXIF al redibujar en canvas nuevo (sin geolocalización incrustada).
 * 6. Devuelve un nuevo File limpio y manejable para el reporte local y posterior subida.
 */
export async function procesarFotografiaEvidencia(
  archivoOriginal: File,
  maxLadoLargo = MAX_PHOTO_LONG_EDGE,
): Promise<File> {
  // Si no es un archivo de imagen válido, devolvemos el archivo original sin romper el flujo
  if (!archivoOriginal.type.startsWith("image/")) {
    return archivoOriginal;
  }

  try {
    return await ejecutarProcesamiento(archivoOriginal, maxLadoLargo);
  } catch (err) {
    // Si falló por tamaño o asignación de memoria, intentamos con el perfil de respaldo ligero
    if (maxLadoLargo > FALLBACK_PHOTO_LONG_EDGE) {
      try {
        return await ejecutarProcesamiento(archivoOriginal, FALLBACK_PHOTO_LONG_EDGE);
      } catch {
        // En caso extremo de soporte de canvas no disponible, devolvemos el original
        return archivoOriginal;
      }
    }
    return archivoOriginal;
  }
}

async function ejecutarProcesamiento(file: File, maxLadoLargo: number): Promise<File> {
  const { source, width, height, cleanup } = await decodificarImagen(file);

  try {
    const { width: targetW, height: targetH } = calcularDimensionesOptimizadas(
      width,
      height,
      maxLadoLargo,
    );

    const canvas = document.createElement("canvas");
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext("2d", { alpha: false });

    if (!ctx) {
      throw new Error("El navegador no permitió inicializar el procesador de imágenes.");
    }

    // Fondo blanco para evitar fondos negros si la imagen de origen tenía canal alfa (PNG)
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, targetW, targetH);
    ctx.drawImage(source, 0, 0, targetW, targetH);

    // Iteración de compresión adaptativa
    let calidadActual = INITIAL_PHOTO_QUALITY;
    let blob = await canvasToJpegBlob(canvas, calidadActual);

    while (blob.size > MAX_PHOTO_TARGET_BYTES && calidadActual > MIN_PHOTO_QUALITY) {
      calidadActual = Math.max(
        MIN_PHOTO_QUALITY,
        Number((calidadActual - QUALITY_STEP).toFixed(2)),
      );
      const nuevoBlob = await canvasToJpegBlob(canvas, calidadActual);
      blob = nuevoBlob;
      if (calidadActual <= MIN_PHOTO_QUALITY) break;
    }

    const timestamp = Date.now();
    const nombreLimpio = `evidencia-${timestamp}.jpg`;

    return new File([blob], nombreLimpio, {
      type: "image/jpeg",
      lastModified: timestamp,
    });
  } finally {
    cleanup();
  }
}
