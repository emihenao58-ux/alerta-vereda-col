import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Circle, Square, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  capturarFotoDesdeVideo,
  detenerStream,
  extensionDeMime,
  esperarVideoListo,
  mensajeDeErrorMedia,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
  recorderMimeType,
  solicitarStream,
  videoListoParaCaptura,
  videoDisponible,
} from "@/lib/reportar/media";

export function ReportarMediaCapture({
  open,
  mode,
  onOpenChange,
  onPhoto,
  onVideo,
  onPermissionState,
}: {
  open: boolean;
  mode: "foto" | "video";
  onOpenChange: (open: boolean) => void;
  onPhoto: (file: File) => void;
  onVideo: (file: File, durationSeconds: number) => void;
  onPermissionState: (state: "concedido" | "denegado" | "no-disponible") => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const discardRecordingRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const setVideoNode = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setVideoElement(node);
  }, []);

  const stopTimer = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const closeMedia = (discardRecording = false) => {
    discardRecordingRef.current = discardRecording;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recorderRef.current = null;
    stopTimer();
    detenerStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setReady(false);
    setRecording(false);
    setSeconds(0);
    onOpenChange(false);
  };

  useEffect(() => {
    if (!open || !videoElement) return;
    let cancelled = false;
    const abortController = new AbortController();
    setError(null);
    setReady(false);
    setRecording(false);
    setSeconds(0);
    discardRecordingRef.current = false;

    if (mode === "video" && !videoDisponible()) {
      onPermissionState("no-disponible");
      setError(
        "Este navegador no permite grabar video. Puedes elegir una foto desde tus archivos.",
      );
      return () => undefined;
    }

    let streamAcquired = false;
    void solicitarStream(mode)
      .then(async (stream) => {
        if (cancelled) {
          detenerStream(stream);
          return;
        }
        streamRef.current = stream;
        streamAcquired = true;
        onPermissionState("concedido");
        videoElement.srcObject = stream;
        const readyPromise = esperarVideoListo(videoElement, abortController.signal);
        await Promise.all([videoElement.play(), readyPromise]);
        if (cancelled || !videoListoParaCaptura(videoElement)) return;
        setReady(true);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (!streamAcquired) onPermissionState("denegado");
        abortController.abort();
        detenerStream(streamRef.current);
        streamRef.current = null;
        videoElement.srcObject = null;
        setReady(false);
        setError(mensajeDeErrorMedia(cause));
      });

    return () => {
      cancelled = true;
      abortController.abort();
      discardRecordingRef.current = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      recorderRef.current = null;
      stopTimer();
      detenerStream(streamRef.current);
      streamRef.current = null;
      if (videoElement) videoElement.srcObject = null;
    };
  }, [mode, onPermissionState, open, videoElement]);

  const takePhoto = async () => {
    if (!videoRef.current || !ready) return;
    try {
      onPhoto(await capturarFotoDesdeVideo(videoRef.current));
      closeMedia();
    } catch (cause) {
      setError(mensajeDeErrorMedia(cause));
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current || recorderRef.current.state !== "recording") return;
    recorderRef.current.stop();
  };

  const startRecording = () => {
    if (!streamRef.current || !ready || recording) return;
    const mimeType = recorderMimeType();
    if (!mimeType) {
      setError("No encontramos un formato de video compatible en este navegador.");
      return;
    }

    chunksRef.current = [];
    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    recorderRef.current = recorder;
    startedAtRef.current = Date.now();
    setSeconds(0);
    setRecording(true);
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) chunksRef.current.push(event.data);
    };
    recorder.onerror = () => {
      setError("No se pudo grabar el video. Inténtalo de nuevo.");
      setRecording(false);
      stopTimer();
    };
    recorder.onstop = () => {
      if (discardRecordingRef.current) {
        discardRecordingRef.current = false;
        chunksRef.current = [];
        return;
      }
      const duration = Math.min(
        MAX_VIDEO_DURATION_SECONDS,
        Math.max(1, Math.round((Date.now() - (startedAtRef.current ?? Date.now())) / 1000)),
      );
      const blob = new Blob(chunksRef.current, { type: mimeType });
      if (blob.size > MAX_VIDEO_BYTES) {
        recorderRef.current = null;
        chunksRef.current = [];
        stopTimer();
        setRecording(false);
        setError("El video supera el límite de 15 MB. Inténtalo de nuevo.");
        return;
      }
      const file = new File(
        [blob],
        `evidencia-alertavereda-${Date.now()}.${extensionDeMime(mimeType)}`,
        {
          type: mimeType,
          lastModified: Date.now(),
        },
      );
      onVideo(file, duration);
      closeMedia();
    };
    recorder.start();
    timerRef.current = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - (startedAtRef.current ?? Date.now())) / 1000);
      setSeconds(Math.min(MAX_VIDEO_DURATION_SECONDS, elapsed));
      if (elapsed >= MAX_VIDEO_DURATION_SECONDS) stopRecording();
    }, 250);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => (nextOpen ? onOpenChange(true) : closeMedia(true))}
    >
      <DialogContent className="reportar-media-dialog">
        <DialogHeader>
          <DialogTitle>{mode === "foto" ? "Tomar foto" : "Grabar video"}</DialogTitle>
          <DialogDescription>
            La captura permanece en este dispositivo durante la revisión. Todavía no se sube a
            ningún servicio.
          </DialogDescription>
        </DialogHeader>

        <div className="reportar-media-viewfinder">
          <video
            ref={setVideoNode}
            autoPlay
            playsInline
            muted
            aria-label="Vista previa de la cámara"
          />
          {!ready && !error && <span className="reportar-media-status">Preparando la cámara…</span>}
          {recording && (
            <span className="reportar-recording-badge">
              <Circle size={12} fill="currentColor" /> {seconds}s / {MAX_VIDEO_DURATION_SECONDS}s
            </span>
          )}
        </div>

        {error && (
          <p className="reportar-error" role="alert">
            {error}
          </p>
        )}

        <div className="reportar-media-actions">
          {mode === "foto" ? (
            <Button type="button" onClick={() => void takePhoto()} disabled={!ready}>
              <Camera size={17} /> Capturar foto
            </Button>
          ) : recording ? (
            <Button type="button" variant="destructive" onClick={stopRecording}>
              <Square size={16} fill="currentColor" /> Detener video
            </Button>
          ) : (
            <Button type="button" onClick={startRecording} disabled={!ready}>
              <Video size={17} /> Iniciar video
            </Button>
          )}
          <Button type="button" variant="outline" onClick={() => closeMedia(true)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
