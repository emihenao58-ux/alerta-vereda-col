import { useState } from "react";
import { Download, FileText, LoaderCircle } from "lucide-react";
import {
  nombreArchivoReportePdf,
  type DatosReportePdf,
  type DatosReportePdfPreparados,
  type EvidenciaReportePdf,
  type EvidenciaReportePdfPreparada,
} from "@/lib/reportes-pdf-datos";

const RUTA_PLANTILLA_PRINCIPAL = "/images/reportes/plantilla-reporte-principal.png";
const RUTA_PLANTILLA_AMPLIACION = "/images/reportes/plantilla-ampliacion-fotografica.png";
const MAX_IMAGEN_BYTES = 15 * 1024 * 1024;
const MAX_MINIATURA_BYTES = 512 * 1024;
const MAX_PLANTILLA_BYTES = 4 * 1024 * 1024;
const LADOS_MINIATURA_PORTADA = [640, 480, 320] as const;
const MAX_FOTOGRAMA_LADO = 640;
const MAX_FOTOGRAMA_ESPERA_MS = 2500;

export function DescargaReportePdf({ reporte }: { reporte: DatosReportePdf }) {
  const [generando, setGenerando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function generarYDescargar() {
    if (generando) return;
    setGenerando(true);
    setMensaje("");
    setError("");

    try {
      const datosPreparados = await prepararDatosPdf(reporte);
      const [{ pdf }, { ReportePdfDocumento }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/reportes/reporte-pdf-documento"),
      ]);
      const blob = await pdf(<ReportePdfDocumento datos={datosPreparados} />).toBlob();
      if (blob.size === 0) throw new Error("El archivo PDF quedó vacío.");

      const archivo = new File([blob], nombreArchivoReportePdf(reporte.titulo), {
        type: "application/pdf",
      });
      iniciarDescarga(archivo);
      const evidenciasNoIncluidas = datosPreparados.evidencias
        .filter((evidencia) => evidencia.incidencia)
        .map(
          (evidencia) =>
            `${evidencia.etiqueta}: ${evidencia.incidencia?.replace(/[.]+$/, "") ?? ""}`,
        );
      const avisos = [];
      if (evidenciasNoIncluidas.length > 0) {
        avisos.push(
          `No se pudieron incluir estas evidencias: ${evidenciasNoIncluidas.join("; ")}. Las demás sí se procesaron.`,
        );
      }
      if (datosPreparados.evidenciasOmitidas.fotografias > 0) {
        const cantidad = datosPreparados.evidenciasOmitidas.fotografias;
        avisos.push(
          cantidad === 1
            ? "Se omitió 1 fotografía adicional por el límite de tres."
            : `Se omitieron ${cantidad} fotografías adicionales por el límite de tres.`,
        );
      }
      if (datosPreparados.evidenciasOmitidas.videos > 0) {
        const cantidad = datosPreparados.evidenciasOmitidas.videos;
        avisos.push(
          cantidad === 1
            ? "Se omitió 1 video adicional por el límite de uno."
            : `Se omitieron ${cantidad} videos adicionales por el límite de uno.`,
        );
      }
      setMensaje(["Se inició la descarga del PDF individual.", ...avisos].join(" "));
    } catch {
      setError("No se pudo generar el PDF. Inténtalo nuevamente desde este detalle.");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <section className="reporte-pdf-actions" aria-labelledby="reporte-pdf-actions-title">
      <div className="reporte-pdf-actions-copy">
        <span className="reporte-pdf-actions-icon" aria-hidden="true">
          <FileText size={19} />
        </span>
        <div>
          <h2 id="reporte-pdf-actions-title">Descargar reporte en PDF</h2>
          <p>
            Genera una copia individual de la información disponible. La portada muestra hasta tres
            fotografías en miniatura y cada foto disponible tiene su página ampliada. Si hay video,
            se incluye una vista previa fija cuando puede extraerse.
          </p>
        </div>
      </div>
      <div className="reporte-pdf-actions-buttons">
        <button
          type="button"
          className="reporte-pdf-download-button"
          onClick={() => void generarYDescargar()}
          disabled={generando}
          aria-busy={generando}
        >
          {generando ? (
            <LoaderCircle size={17} className="reporte-pdf-spinner" aria-hidden="true" />
          ) : (
            <Download size={17} aria-hidden="true" />
          )}
          {generando ? "Generando PDF…" : "Descargar reporte en PDF"}
        </button>
      </div>
      <p className="reporte-pdf-feedback" aria-live="polite" role={error ? "alert" : "status"}>
        {error || mensaje}
      </p>
    </section>
  );
}

async function prepararDatosPdf(reporte: DatosReportePdf): Promise<DatosReportePdfPreparados> {
  const tieneFotografias = reporte.evidencias.some((evidencia) => evidencia.tipo === "foto");
  const [plantillaPrincipalDataUri, plantillaAmpliacionDataUri, evidencias] = await Promise.all([
    cargarPlantilla(RUTA_PLANTILLA_PRINCIPAL),
    tieneFotografias ? cargarPlantilla(RUTA_PLANTILLA_AMPLIACION) : Promise.resolve(null),
    prepararEvidencias(reporte.evidencias),
  ]);
  return {
    ...reporte,
    generadoEn: new Date().toLocaleString("es-CO", {
      dateStyle: "long",
      timeStyle: "short",
    }),
    plantillaPrincipalDataUri,
    plantillaAmpliacionDataUri,
    evidencias,
  };
}

async function prepararEvidencias(
  evidencias: EvidenciaReportePdf[],
): Promise<EvidenciaReportePdfPreparada[]> {
  const preparadas: EvidenciaReportePdfPreparada[] = [];
  for (const evidencia of evidencias) {
    let miniaturaDataUri: string | null = null;
    let imagenCompletaDataUri: string | null = null;
    let detalle: string | null = null;
    let incidencia: string | null = null;

    if (evidencia.tipo === "foto") {
      try {
        const blob =
          evidencia.archivo ?? (evidencia.url ? await descargarImagen(evidencia.url) : null);
        if (!blob) throw new Error("No hay un archivo fotográfico disponible.");
        const preparacion = await prepararFoto(blob);
        miniaturaDataUri = preparacion.miniaturaDataUri;
        imagenCompletaDataUri = preparacion.imagenCompletaDataUri;
        if (!miniaturaDataUri) {
          detalle = "Miniatura no disponible; la fotografía completa se incluye en su página.";
        }
      } catch (cause) {
        incidencia = motivoFotografiaNoIncluida(cause);
        detalle = `Fotografía no incluida: ${incidencia}`;
      }
    } else if (evidencia.archivo) {
      miniaturaDataUri = await crearFotograma(evidencia.archivo).catch(() => null);
      if (!miniaturaDataUri) {
        detalle = "Vista previa no disponible";
      } else if (evidencia.duracionSegundos && Number.isFinite(evidencia.duracionSegundos)) {
        detalle = `Vista previa · duración: ${formatearDuracion(evidencia.duracionSegundos)}`;
      } else {
        detalle = "Vista previa del video";
      }
    } else {
      detalle = "Vista previa no disponible";
    }

    preparadas.push({
      id: evidencia.id,
      tipo: evidencia.tipo,
      etiqueta: evidencia.etiqueta,
      miniaturaDataUri,
      imagenCompletaDataUri,
      detalle,
      incidencia,
    });
  }
  return preparadas;
}

function motivoFotografiaNoIncluida(cause: unknown) {
  if (cause instanceof DOMException && cause.name === "AbortError") {
    return "la descarga superó el tiempo máximo de espera";
  }
  if (
    cause instanceof DOMException &&
    ["InvalidStateError", "EncodingError", "NotReadableError"].includes(cause.name)
  ) {
    return "el archivo está dañado o su formato no se pudo decodificar";
  }
  if (cause instanceof Error && /could not be decoded|failed to decode/i.test(cause.message)) {
    return "el archivo está dañado o su formato no se pudo decodificar";
  }
  if (cause instanceof Error) return cause.message;
  return "no se pudo leer o decodificar el archivo";
}

function formatearDuracion(segundos: number) {
  return `${segundos.toLocaleString("es-CO", { maximumFractionDigits: 1 })} s`;
}

async function cargarPlantilla(ruta: string): Promise<string> {
  const response = await fetch(ruta, { credentials: "same-origin" });
  if (!response.ok) throw new Error("No se pudo cargar la plantilla gráfica del reporte.");
  const blob = await response.blob();
  if (blob.type !== "image/png" || blob.size === 0 || blob.size > MAX_PLANTILLA_BYTES) {
    throw new Error("La plantilla gráfica no tiene un formato o tamaño válido.");
  }
  return blobComoDataUri(blob);
}

async function descargarImagen(url: string): Promise<Blob> {
  const destino = new URL(url, window.location.href);
  if (destino.protocol !== "https:" && destino.origin !== window.location.origin) {
    throw new Error("se rechazó una dirección de imagen externa no segura");
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 12_000);
  try {
    const response = await fetch(destino.href, {
      credentials: "omit",
      mode: "cors",
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`el servidor respondió HTTP ${response.status}`);
    const contentLength = Number(response.headers.get("content-length"));
    if (Number.isFinite(contentLength) && contentLength > MAX_IMAGEN_BYTES) {
      throw new Error("el archivo supera el límite de 15 MiB");
    }
    const blob = await response.blob();
    if (!blob.type.startsWith("image/")) {
      throw new Error("el recurso no tiene un formato de imagen compatible");
    }
    if (blob.size === 0) throw new Error("el archivo recibido está vacío");
    if (blob.size > MAX_IMAGEN_BYTES) throw new Error("el archivo supera el límite de 15 MiB");
    return blob;
  } finally {
    window.clearTimeout(timeout);
  }
}

async function prepararFoto(
  blob: Blob,
): Promise<{ imagenCompletaDataUri: string; miniaturaDataUri: string | null }> {
  if (!blob.type.startsWith("image/")) {
    throw new Error("el archivo no tiene un formato de imagen compatible");
  }
  if (blob.size === 0) throw new Error("el archivo está vacío");
  if (blob.size > MAX_IMAGEN_BYTES) throw new Error("el archivo supera el límite de 15 MiB");

  const imagen = await decodificarImagen(blob);
  try {
    if (imagen.width <= 0 || imagen.height <= 0) {
      throw new Error("el archivo no tiene dimensiones de imagen válidas");
    }

    const formato = blob.type.toLowerCase().split(";")[0]?.trim();
    let imagenCompletaDataUri: string;
    if (formato === "image/jpeg" || formato === "image/png") {
      // El registro local conserva la versión procesada de mayor resolución disponible.
      // Se inserta intacta en la página fotográfica, sin una segunda reducción.
      imagenCompletaDataUri = await blobComoDataUri(blob);
    } else {
      // Los formatos no admitidos por React-PDF se rasterizan a su tamaño intrínseco.
      const canvas = document.createElement("canvas");
      canvas.width = imagen.width;
      canvas.height = imagen.height;
      try {
        const context = canvas.getContext("2d");
        if (!context) throw new Error("el navegador no permitió preparar la imagen");
        context.drawImage(imagen.source, 0, 0, canvas.width, canvas.height);

        const png = await canvasComoBlob(canvas, "image/png");
        if (png.size <= MAX_IMAGEN_BYTES) {
          imagenCompletaDataUri = await blobComoDataUri(png);
        } else {
          // Solo cambiar formato/calidad si el PNG a tamaño original excede el límite.
          const jpeg = await canvasComoBlob(canvas, "image/jpeg", 0.96);
          if (jpeg.size > MAX_IMAGEN_BYTES) {
            throw new Error("la conversión a formato compatible superaría el límite de 15 MiB");
          }
          imagenCompletaDataUri = await blobComoDataUri(jpeg);
        }
      } finally {
        canvas.width = 0;
        canvas.height = 0;
      }
    }

    // La miniatura usa una copia pequeña y proporcional; nunca sustituye la imagen completa.
    const miniaturaDataUri = await crearMiniaturaFoto(imagen).catch(() => null);
    return { imagenCompletaDataUri, miniaturaDataUri };
  } catch (cause) {
    if (cause instanceof Error) throw cause;
    throw new Error("no se pudo decodificar la imagen");
  } finally {
    imagen.cleanup();
  }
}

async function crearMiniaturaFoto(imagen: {
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
}): Promise<string> {
  const ladoMayor = Math.max(imagen.width, imagen.height);
  for (const ladoMaximo of LADOS_MINIATURA_PORTADA) {
    const escala = Math.min(1, ladoMaximo / ladoMayor);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(imagen.width * escala));
    canvas.height = Math.max(1, Math.round(imagen.height * escala));
    try {
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("el navegador no permitió preparar la miniatura");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(imagen.source, 0, 0, canvas.width, canvas.height);
      const miniatura = await canvasComoBlob(canvas, "image/jpeg", 0.82);
      if (miniatura.size <= MAX_MINIATURA_BYTES) return await blobComoDataUri(miniatura);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
  throw new Error("no se pudo preparar una miniatura ligera para la portada");
}

async function decodificarImagen(blob: Blob): Promise<{
  source: ImageBitmap | HTMLImageElement;
  width: number;
  height: number;
  cleanup: () => void;
}> {
  if (typeof globalThis.createImageBitmap === "function") {
    const bitmap = await globalThis.createImageBitmap(blob);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    };
  }

  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const imagen = new window.Image();
    imagen.onload = () => {
      resolve({
        source: imagen,
        width: imagen.naturalWidth,
        height: imagen.naturalHeight,
        cleanup: () => URL.revokeObjectURL(url),
      });
    };
    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("no se pudo decodificar la imagen en este navegador"));
    };
    imagen.src = url;
  });
}

function canvasComoBlob(canvas: HTMLCanvasElement, tipo: string, calidad?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("el navegador no pudo convertir la imagen a un formato compatible"));
          return;
        }
        resolve(blob);
      },
      tipo,
      calidad,
    );
  });
}

async function crearFotograma(blob: Blob): Promise<string | null> {
  if (!blob.type.startsWith("video/") || typeof URL.createObjectURL !== "function") return null;
  const url = URL.createObjectURL(blob);
  const video = document.createElement("video");
  video.muted = true;
  video.playsInline = true;
  video.preload = "metadata";

  try {
    const metadata = esperarEventoVideo(video, "loadedmetadata");
    video.src = url;
    await metadata;
    if (!Number.isFinite(video.duration) || video.duration <= 0) return null;
    const punto = Math.min(0.5, Math.max(0, video.duration / 4));
    if (punto > 0) {
      const seeked = esperarEventoVideo(video, "seeked");
      video.currentTime = punto;
      await seeked;
    }
    if (video.videoWidth <= 0 || video.videoHeight <= 0) return null;

    const scale = Math.min(
      1,
      MAX_FOTOGRAMA_LADO / video.videoWidth,
      MAX_FOTOGRAMA_LADO / video.videoHeight,
    );
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    try {
      const context = canvas.getContext("2d");
      if (!context) return null;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const fotograma = await canvasComoBlob(canvas, "image/jpeg", 0.78);
      return await blobComoDataUri(fotograma);
    } finally {
      canvas.width = 0;
      canvas.height = 0;
    }
  } catch {
    return null;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

function esperarEventoVideo(video: HTMLVideoElement, evento: "loadedmetadata" | "seeked") {
  return new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error("Se agotó el tiempo de preparación del fotograma."));
    }, MAX_FOTOGRAMA_ESPERA_MS);
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener(evento, listo);
      video.removeEventListener("error", error);
    };
    const listo = () => {
      cleanup();
      resolve();
    };
    const error = () => {
      cleanup();
      reject(new Error("El video no se pudo decodificar en este navegador."));
    };
    video.addEventListener(evento, listo, { once: true });
    video.addEventListener("error", error, { once: true });
  });
}

function blobComoDataUri(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () =>
      typeof lector.result === "string"
        ? resolve(lector.result)
        : reject(new Error("no se pudo leer el archivo de evidencia"));
    lector.onerror = () => reject(new Error("no se pudo leer el archivo de evidencia"));
    lector.readAsDataURL(blob);
  });
}

function iniciarDescarga(archivo: File) {
  const url = URL.createObjectURL(archivo);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = archivo.name;
  enlace.style.display = "none";
  document.body.append(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
