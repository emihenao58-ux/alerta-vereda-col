import { MAX_VIDEO_BYTES, MAX_VIDEO_DURATION_SECONDS } from "./media";

export type DimensionesVideoProcesado = {
  width: number;
  height: number;
};

export type ResultadoProcesamientoVideo = {
  archivo: File;
  tipoMime: string;
  duracionSegundos: number;
  dimensiones: DimensionesVideoProcesado;
  bytesOriginales: number;
  bytesProcesados: number;
  tasaBitsVideo: number;
};

export class ErrorProcesamientoVideo extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ErrorProcesamientoVideo";
  }
}

const VIDEO_MAX_LADO_LARGO = 1280;
const VIDEO_FPS_OBJETIVO = 24;
const VIDEO_BITRATE_TOTAL_MAX = 2_500_000;
const AUDIO_BITRATE_MAX = 96_000;
const FACTORES_BITRATE = [1, 0.78, 0.6] as const;
const TIEMPO_VALIDACION_MS = 10_000;
// Tolerancia de empaquetado/frames; no permite aceptar un clip truncado.
const TOLERANCIA_DURACION_SEGUNDOS = 0.25;

const FORMATOS_PREFERIDOS = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1.42E01E",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
] as const;

type VideoConCaptura = HTMLVideoElement & {
  captureStream?: () => MediaStream;
  mozCaptureStream?: () => MediaStream;
  audioTracks?: { length: number };
};

function errorSeguro() {
  return new ErrorProcesamientoVideo(
    "No se pudo optimizar el video en un formato reproducible en este dispositivo. El borrador se conserva; puedes retirar o reemplazar el video e intentarlo nuevamente.",
  );
}

function mimeTypesDisponibles() {
  if (typeof MediaRecorder === "undefined" || typeof MediaRecorder.isTypeSupported !== "function") {
    throw errorSeguro();
  }

  return FORMATOS_PREFERIDOS.filter((mimeType) => {
    try {
      return MediaRecorder.isTypeSupported(mimeType);
    } catch {
      return false;
    }
  });
}

function dimensionesOptimizadas(width: number, height: number): DimensionesVideoProcesado {
  if (width <= 0 || height <= 0) throw errorSeguro();
  const ladoLargo = Math.max(width, height);
  if (ladoLargo <= VIDEO_MAX_LADO_LARGO) return { width, height };
  const escala = VIDEO_MAX_LADO_LARGO / ladoLargo;
  return {
    width: Math.max(2, Math.round((width * escala) / 2) * 2),
    height: Math.max(2, Math.round((height * escala) / 2) * 2),
  };
}

function tasasBitrate(bytes: number, durationSeconds: number) {
  const promedioFuente = (bytes * 8) / durationSeconds;
  const totalBase = Math.min(VIDEO_BITRATE_TOTAL_MAX, promedioFuente * 0.82);

  return FACTORES_BITRATE.map((factor) => {
    const total = Math.max(160_000, Math.floor(totalBase * factor));
    const audio = Math.min(AUDIO_BITRATE_MAX, Math.floor(total * 0.14));
    return {
      video: Math.max(64_000, total - audio),
      audio,
    };
  });
}

function esperarEvento(
  video: HTMLVideoElement,
  readyEvent: "loadedmetadata" | "canplay",
  url: string,
): Promise<void> {
  const readyState =
    readyEvent === "loadedmetadata"
      ? HTMLMediaElement.HAVE_METADATA
      : HTMLMediaElement.HAVE_FUTURE_DATA;
  if (video.readyState >= readyState) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(errorSeguro());
    }, TIEMPO_VALIDACION_MS);

    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener(readyEvent, onReady);
      video.removeEventListener("error", onError);
    };
    const onReady = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      URL.revokeObjectURL(url);
      reject(errorSeguro());
    };

    video.addEventListener(readyEvent, onReady, { once: true });
    video.addEventListener("error", onError, { once: true });
  });
}

async function abrirVideo(archivo: Blob) {
  if (typeof URL.createObjectURL !== "function") throw errorSeguro();
  const url = URL.createObjectURL(archivo);
  const video = document.createElement("video") as VideoConCaptura;
  video.preload = "auto";
  video.playsInline = true;
  video.volume = 0;
  const metadataReady = esperarEvento(video, "loadedmetadata", url);
  video.src = url;
  video.load();

  try {
    await metadataReady;
    if (
      !Number.isFinite(video.duration) ||
      video.duration <= 0 ||
      !Number.isFinite(video.videoWidth) ||
      !Number.isFinite(video.videoHeight) ||
      video.videoWidth <= 0 ||
      video.videoHeight <= 0
    ) {
      throw errorSeguro();
    }
    return { video, url, duration: video.duration };
  } catch (error) {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function esperarPrimerFotograma(video: HTMLVideoElement) {
  try {
    await video.play();
    await new Promise<void>((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup();
        reject(errorSeguro());
      }, TIEMPO_VALIDACION_MS);
      const cleanup = () => {
        window.clearTimeout(timeout);
        video.removeEventListener("playing", onPlaying);
        video.removeEventListener("error", onError);
      };
      const onPlaying = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(errorSeguro());
      };
      video.addEventListener("playing", onPlaying, { once: true });
      video.addEventListener("error", onError, { once: true });
      if (!video.paused && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        cleanup();
        resolve();
      }
    });
  } catch {
    throw errorSeguro();
  }
}

async function volverAlInicio(video: HTMLVideoElement) {
  video.pause();
  if (video.currentTime === 0) return;
  await new Promise<void>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(errorSeguro());
    }, TIEMPO_VALIDACION_MS);
    const cleanup = () => {
      window.clearTimeout(timeout);
      video.removeEventListener("seeked", onSeeked);
      video.removeEventListener("error", onError);
    };
    const onSeeked = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(errorSeguro());
    };
    video.addEventListener("seeked", onSeeked, { once: true });
    video.addEventListener("error", onError, { once: true });
    video.currentTime = 0;
  });
}

async function codificarUnaVez(
  archivo: File,
  mimeType: string,
  dimensiones: DimensionesVideoProcesado,
  videoBitsPerSecond: number,
  audioBitsPerSecond: number,
): Promise<{ blob: Blob; tieneAudio: boolean }> {
  const { video, url, duration } = await abrirVideo(archivo);
  const source = video.captureStream?.bind(video) ?? video.mozCaptureStream?.bind(video);
  if (!source) {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
    throw errorSeguro();
  }

  let sourceStream: MediaStream | null = null;
  let canvasStream: MediaStream | null = null;
  let outputStream: MediaStream | null = null;
  let frameId: number | null = null;
  let recorder: MediaRecorder | null = null;
  let timeout: number | null = null;
  let alOcultar: (() => void) | null = null;
  const canvas = document.createElement("canvas");
  canvas.width = dimensiones.width;
  canvas.height = dimensiones.height;
  const context = canvas.getContext("2d", { alpha: false });

  if (!context || typeof canvas.captureStream !== "function") {
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
    canvas.width = 0;
    canvas.height = 0;
    throw errorSeguro();
  }

  try {
    sourceStream = source();
    await esperarPrimerFotograma(video);
    const audioTracks = sourceStream.getAudioTracks();
    const declaredAudioTracks = video.audioTracks?.length;
    if (
      typeof declaredAudioTracks === "number" &&
      declaredAudioTracks > 0 &&
      audioTracks.length === 0
    ) {
      throw errorSeguro();
    }
    await volverAlInicio(video);

    canvasStream = canvas.captureStream(VIDEO_FPS_OBJETIVO);
    outputStream = new MediaStream([...canvasStream.getVideoTracks(), ...audioTracks]);
    if (outputStream.getVideoTracks().length === 0) throw errorSeguro();
    recorder = new MediaRecorder(outputStream, {
      mimeType,
      videoBitsPerSecond,
      audioBitsPerSecond,
    });

    return await new Promise<{ blob: Blob; tieneAudio: boolean }>((resolve, reject) => {
      let settled = false;
      const settleError = (error: Error) => {
        if (settled) return;
        settled = true;
        reject(error);
      };
      const chunks: BlobPart[] = [];
      const detener = () => {
        if (recorder?.state === "recording") recorder.stop();
      };
      const dibujar = () => {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          try {
            context.drawImage(video, 0, 0, dimensiones.width, dimensiones.height);
          } catch {
            detener();
            settleError(errorSeguro());
            return;
          }
        }
        if (recorder?.state === "recording" && !video.ended) {
          frameId = window.requestAnimationFrame(dibujar);
        }
      };

      recorder!.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data);
      };
      recorder!.onerror = () => {
        detener();
        settleError(errorSeguro());
      };
      recorder!.onstop = () => {
        if (settled) return;
        if (!video.ended || document.visibilityState === "hidden") {
          settleError(errorSeguro());
          return;
        }
        settled = true;
        const actualMime = recorder?.mimeType || mimeType;
        resolve({
          blob: new Blob(chunks, { type: actualMime }),
          tieneAudio: audioTracks.length > 0,
        });
      };
      video.onended = detener;
      video.onerror = () => {
        settleError(errorSeguro());
        detener();
      };
      alOcultar = () => {
        if (document.visibilityState === "hidden") {
          settleError(errorSeguro());
          detener();
        }
      };
      document.addEventListener("visibilitychange", alOcultar);
      timeout = window.setTimeout(
        () => {
          settleError(errorSeguro());
          detener();
        },
        duration * 1000 + TIEMPO_VALIDACION_MS,
      );

      try {
        context.drawImage(video, 0, 0, dimensiones.width, dimensiones.height);
        recorder!.start();
        void video
          .play()
          .then(() => {
            dibujar();
          })
          .catch(() => {
            detener();
            settleError(errorSeguro());
          });
      } catch {
        detener();
        settleError(errorSeguro());
      }
    });
  } finally {
    if (timeout !== null) window.clearTimeout(timeout);
    if (alOcultar) document.removeEventListener("visibilitychange", alOcultar);
    if (frameId !== null) window.cancelAnimationFrame(frameId);
    if (recorder?.state === "recording") {
      try {
        recorder.stop();
      } catch {
        // El grabador puede haberse detenido debido a un error previo.
      }
    }
    outputStream?.getTracks().forEach((track) => track.stop());
    canvasStream?.getTracks().forEach((track) => track.stop());
    sourceStream?.getTracks().forEach((track) => track.stop());
    video.pause();
    video.onended = null;
    video.onerror = null;
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
    canvas.width = 0;
    canvas.height = 0;
  }
}

async function comprobarReproduccion(
  archivo: Blob,
  duracionOriginal: number,
  dimensiones: DimensionesVideoProcesado,
  tieneAudio: boolean,
) {
  const { video, url, duration } = await abrirVideo(archivo);
  let stream: MediaStream | null = null;
  try {
    if (!video.canPlayType(archivo.type)) throw errorSeguro();
    await esperarEvento(video, "canplay", url);
    if (
      Math.abs(duration - duracionOriginal) > TOLERANCIA_DURACION_SEGUNDOS ||
      duration > MAX_VIDEO_DURATION_SECONDS ||
      video.videoWidth !== dimensiones.width ||
      video.videoHeight !== dimensiones.height
    ) {
      throw errorSeguro();
    }
    const capturar = video.captureStream?.bind(video) ?? video.mozCaptureStream?.bind(video);
    if (!capturar) throw errorSeguro();
    stream = capturar();
    await esperarPrimerFotograma(video);
    if (tieneAudio && stream.getAudioTracks().length === 0) throw errorSeguro();
    // Recorrer la salida completa, sin guardarla, detecta errores de decodificación.
    await new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        window.clearTimeout(timeout);
        video.removeEventListener("ended", onEnded);
        video.removeEventListener("error", onError);
      };
      const onEnded = () => {
        cleanup();
        resolve();
      };
      const onError = () => {
        cleanup();
        reject(errorSeguro());
      };
      const timeout = window.setTimeout(onError, duration * 1000 + TIEMPO_VALIDACION_MS);
      video.addEventListener("ended", onEnded, { once: true });
      video.addEventListener("error", onError, { once: true });
      if (video.ended) onEnded();
    });
    return duration;
  } finally {
    stream?.getTracks().forEach((track) => track.stop());
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

function extensionVideo(mimeType: string) {
  return mimeType.includes("mp4") ? "mp4" : "webm";
}

function paginaOculta() {
  return document.visibilityState === "hidden";
}

/**
 * Optimiza un video en memoria. No accede a IndexedDB ni conserva el archivo
 * original. El almacenamiento recibe el resultado solo después de validar el
 * formato, la reproducción y la reducción del tamaño.
 */
export async function procesarVideoEvidencia(
  archivoOriginal: File,
): Promise<ResultadoProcesamientoVideo> {
  if (paginaOculta()) throw errorSeguro();
  if (!archivoOriginal.type.startsWith("video/")) throw errorSeguro();
  if (archivoOriginal.size > MAX_VIDEO_BYTES) {
    throw new ErrorProcesamientoVideo("El video supera el límite actual de 15 MB.");
  }

  const metadata = await abrirVideo(archivoOriginal);
  const duration = metadata.duration;
  const dimensions = dimensionesOptimizadas(metadata.video.videoWidth, metadata.video.videoHeight);
  metadata.video.removeAttribute("src");
  metadata.video.load();
  URL.revokeObjectURL(metadata.url);

  if (duration > MAX_VIDEO_DURATION_SECONDS) {
    throw new ErrorProcesamientoVideo("El video supera el límite actual de 15 segundos.");
  }

  const mimeTypes = mimeTypesDisponibles();
  if (mimeTypes.length === 0) throw errorSeguro();
  const attempts = tasasBitrate(archivoOriginal.size, duration);

  for (const mimeType of mimeTypes) {
    for (const bitrate of attempts) {
      try {
        const { blob, tieneAudio } = await codificarUnaVez(
          archivoOriginal,
          mimeType,
          dimensions,
          bitrate.video,
          bitrate.audio,
        );
        if (
          blob.size <= 0 ||
          blob.size >= archivoOriginal.size ||
          blob.size > MAX_VIDEO_BYTES ||
          !blob.type.startsWith("video/")
        ) {
          continue;
        }
        const duracionProcesada = await comprobarReproduccion(
          blob,
          duration,
          dimensions,
          tieneAudio,
        );
        const now = Date.now();
        const file = new File([blob], `video-optimizado-${now}.${extensionVideo(blob.type)}`, {
          type: blob.type,
          lastModified: now,
        });
        return {
          archivo: file,
          tipoMime: file.type,
          duracionSegundos: duracionProcesada,
          dimensiones: dimensions,
          bytesOriginales: archivoOriginal.size,
          bytesProcesados: file.size,
          tasaBitsVideo: bitrate.video,
        };
      } catch {
        if (paginaOculta()) throw errorSeguro();
        // Prueba el siguiente bitrate/formato soportado; nunca cae al archivo original.
      }
    }
  }

  throw errorSeguro();
}
