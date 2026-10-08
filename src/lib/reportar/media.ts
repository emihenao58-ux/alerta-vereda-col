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

export async function solicitarStream(modo: "foto" | "video") {
  if (!camaraDisponible()) {
    throw new Error("Este dispositivo no permite acceder a la cámara.");
  }

  return navigator.mediaDevices.getUserMedia({
    video: { facingMode: "environment" },
    audio: false,
  });
}

export async function capturarFotoDesdeVideo(video: HTMLVideoElement) {
  if (!video.videoWidth || !video.videoHeight) {
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
