export const MAX_VIDEO_DURATION_SECONDS = 15;
export const MAX_VIDEO_BYTES = 15 * 1024 * 1024;

export type CameraFacingMode = "environment" | "user";

type CameraCapabilities = {
  canSwitchCamera: boolean;
  torch: boolean;
};

export function detenerStream(stream: MediaStream | null) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function camaraDisponible() {
  return typeof navigator !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);
}

export function videoDisponible() {
  return (
    typeof window !== "undefined" &&
    "MediaRecorder" in window &&
    typeof MediaRecorder.isTypeSupported === "function"
  );
}

function constraintsDeVideo(facingMode: CameraFacingMode): MediaTrackConstraints {
  return { facingMode: { ideal: facingMode } };
}

export async function solicitarStream(
  modo: "foto" | "video",
  facingMode: CameraFacingMode = "environment",
  solicitarAudio = false,
) {
  if (!camaraDisponible()) {
    throw new Error("Este dispositivo no permite acceder a la cámara.");
  }

  const video = constraintsDeVideo(facingMode);
  if (modo !== "video" || !solicitarAudio) {
    return navigator.mediaDevices.getUserMedia({ video, audio: false });
  }

  try {
    return await navigator.mediaDevices.getUserMedia({ video, audio: true });
  } catch (cause) {
    // Algunos navegadores rechazan toda la solicitud cuando el micrófono está bloqueado.
    // Reintentamos solo con video para conservar la captura sin dejar el flujo inutilizable.
    if (cause instanceof DOMException) {
      return navigator.mediaDevices.getUserMedia({ video, audio: false });
    }
    throw cause;
  }
}

export async function detectarCapacidadesCamara(stream: MediaStream): Promise<CameraCapabilities> {
  const track = stream.getVideoTracks()[0];
  const capabilities = track?.getCapabilities?.() as
    (MediaTrackCapabilities & { facingMode?: string[]; torch?: boolean }) | undefined;
  const facingModes = capabilities?.facingMode ?? [];
  let canSwitchCamera = facingModes.includes("environment") && facingModes.includes("user");

  if (!canSwitchCamera && navigator.mediaDevices?.enumerateDevices) {
    const devices = await navigator.mediaDevices.enumerateDevices();
    canSwitchCamera = devices.filter((device) => device.kind === "videoinput").length > 1;
  }

  return {
    canSwitchCamera,
    torch: capabilities?.torch === true,
  };
}

export function videoListoParaCaptura(video: HTMLVideoElement) {
  return video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;
}

export function esperarVideoListo(video: HTMLVideoElement, signal?: AbortSignal) {
  if (videoListoParaCaptura(video)) return Promise.resolve();

  return new Promise<void>((resolve, reject) => {
    const cleanup = () => {
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("canplay", onReady);
      video.removeEventListener("error", onError);
      signal?.removeEventListener("abort", onAbort);
    };
    const onReady = () => {
      if (videoListoParaCaptura(video)) {
        cleanup();
        resolve();
      }
    };
    const onError = () => {
      cleanup();
      reject(new Error("No se pudo iniciar la vista previa de la cámara."));
    };
    const onAbort = () => {
      cleanup();
      reject(new DOMException("La vista previa fue cancelada.", "AbortError"));
    };

    if (signal?.aborted) {
      onAbort();
      return;
    }
    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("canplay", onReady);
    video.addEventListener("error", onError);
    signal?.addEventListener("abort", onAbort, { once: true });
    onReady();
  });
}

export async function capturarFotoDesdeVideo(video: HTMLVideoElement) {
  if (!video.srcObject || !videoListoParaCaptura(video)) {
    throw new Error("La cámara aún se está preparando. Inténtalo de nuevo.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const contexto = canvas.getContext("2d");

  if (!contexto) {
    throw new Error("No se pudo preparar la fotografía.");
  }

  contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (imagen) => {
        if (imagen) {
          resolve(imagen);
        } else {
          reject(new Error("No se pudo crear la fotografía."));
        }
      },
      "image/jpeg",
      0.9,
    );
  });

  return new File([blob], `evidencia-alertavereda-${Date.now()}.jpg`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}

export function recorderMimeType() {
  const opciones = ["video/webm;codecs=vp8,opus", "video/webm", "video/mp4"];
  return opciones.find((opcion) => MediaRecorder.isTypeSupported(opcion)) ?? "";
}

export function extensionDeMime(mime: string) {
  return mime.includes("mp4") ? "mp4" : "webm";
}

export function mensajeDeErrorMedia(error: unknown) {
  if (error instanceof DOMException) {
    if (error.name === "NotAllowedError" || error.name === "SecurityError") {
      return "El acceso a la cámara o al micrófono está bloqueado. Revisa los permisos del navegador.";
    }
    if (error.name === "NotFoundError" || error.name === "OverconstrainedError") {
      return "No encontramos una cámara compatible en este dispositivo.";
    }
    if (error.name === "NotReadableError") {
      return "La cámara está siendo usada por otra aplicación o no responde.";
    }
  }

  return error instanceof Error
    ? error.message
    : "No se pudo acceder al dispositivo. Puedes elegir una foto desde tus archivos.";
}
