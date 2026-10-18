import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Circle, Square, SwitchCamera, Video, Zap } from "lucide-react";
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
  detectarCapacidadesCamara,
  detenerStream,
  esperarVideoListo,
  extensionDeMime,
  mensajeDeErrorMedia,
  MAX_VIDEO_BYTES,
  MAX_VIDEO_DURATION_SECONDS,
  recorderMimeType,
  solicitarStream,
  type CameraFacingMode,
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
  onPhoto: (file: File, capturedAt: string) => void | Promise<void>;
  onVideo: (file: File, durationSeconds: number, capturedAt: string) => void;
  onPermissionState: (state: "concedido" | "denegado" | "no-disponible") => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number | null>(null);
  const discardRecordingRef = useRef(false);
  const timerRef = useRef<number | null>(null);
  const sessionRef = useRef(0);
  const recordingStartAbortRef = useRef<AbortController | null>(null);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [facingMode, setFacingMode] = useState<CameraFacingMode>("environment");
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [ready, setReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordingStarting, setRecordingStarting] = useState(false);
  const [capturingPhoto, setCapturingPhoto] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cameraRetry, setCameraRetry] = useState(0);
  const [canRetryCamera, setCanRetryCamera] = useState(false);

  const setVideoNode = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setVideoElement(node);
  }, []);

  const stopTimer = () => {
    if (timerRef.current !== null) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  const releaseStream = () => {
    detenerStream(streamRef.current);
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const closeMedia = (discardRecording = false) => {
    sessionRef.current += 1;
    recordingStartAbortRef.current?.abort();
    recordingStartAbortRef.current = null;
    discardRecordingRef.current = discardRecording;
    if (recorderRef.current?.state === "recording") recorderRef.current.stop();
    recorderRef.current = null;
    stopTimer();
    releaseStream();
    setReady(false);
    setRecording(false);
    setRecordingStarting(false);
    setCapturingPhoto(false);
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
    setRecordingStarting(false);
    setCapturingPhoto(false);
    setSeconds(0);
    setCanRetryCamera(false);
    setAudioAvailable(false);
    setTorchSupported(false);
    setTorchEnabled(false);
    setCanSwitchCamera(false);
    discardRecordingRef.current = false;

    if (mode === "video" && !videoDisponible()) {
      onPermissionState("no-disponible");
      setError(
        "Este navegador no permite grabar video. Puedes elegir una foto desde tus archivos.",
      );
      return () => undefined;
    }

    let streamAcquired = false;
    void solicitarStream(mode, facingMode, false)
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

        let capabilities = { canSwitchCamera: false, torch: false };
        try {
          capabilities = await detectarCapacidadesCamara(stream);
        } catch {
          // La cámara sigue siendo usable si el navegador no expone sus capacidades.
        }
        if (cancelled) return;
        setCanSwitchCamera(capabilities.canSwitchCamera);
        setTorchSupported(capabilities.torch);
        setReady(true);
      })
      .catch((cause: unknown) => {
        if (cancelled) return;
        if (!streamAcquired) onPermissionState("denegado");
        abortController.abort();
        releaseStream();
        setReady(false);
        setCanRetryCamera(true);
        setError(mensajeDeErrorMedia(cause));
      });

    return () => {
      cancelled = true;
      abortController.abort();
      recordingStartAbortRef.current?.abort();
      discardRecordingRef.current = true;
      if (recorderRef.current?.state === "recording") recorderRef.current.stop();
      recorderRef.current = null;
      stopTimer();
      releaseStream();
    };
  }, [cameraRetry, facingMode, mode, onPermissionState, open, videoElement]);

  useEffect(() => {
    if (open) return;
    setFacingMode("environment");
    setCanSwitchCamera(false);
    setTorchSupported(false);
    setTorchEnabled(false);
    setAudioAvailable(false);
    setCameraRetry(0);
    setCanRetryCamera(false);
  }, [open]);

  const takePhoto = async () => {
    if (!videoRef.current || !ready || capturingPhoto) return;
    setCapturingPhoto(true);
    try {
      const capturedAt = new Date().toISOString();
      const file = await capturarFotoDesdeVideo(videoRef.current);
      await onPhoto(file, capturedAt);
      closeMedia();
    } catch (cause) {
      releaseStream();
      setReady(false);
      setCanRetryCamera(true);
      setError(mensajeDeErrorMedia(cause));
    } finally {
      setCapturingPhoto(false);
    }
  };

  const retryCamera = () => {
    if (recording || recordingStarting) return;
    discardRecordingRef.current = true;
    recordingStartAbortRef.current?.abort();
    recordingStartAbortRef.current = null;
    recorderRef.current = null;
    chunksRef.current = [];
    stopTimer();
    releaseStream();
    setReady(false);
    setError(null);
    setCanRetryCamera(false);
    setCameraRetry((attempt) => attempt + 1);
  };

  const flipCamera = () => {
    if (!canSwitchCamera || recording || recordingStarting) return;
    setFacingMode((actual) => (actual === "environment" ? "user" : "environment"));
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !torchSupported) return;
    const nextValue = !torchEnabled;
    try {
      const constraints = { advanced: [{ torch: nextValue }] } as unknown as MediaTrackConstraints;
      await track.applyConstraints(constraints);
      setTorchEnabled(nextValue);
    } catch {
      setError("La iluminación no está disponible en este momento.");
    }
  };

  const stopRecording = () => {
    if (!recorderRef.current || recorderRef.current.state !== "recording") return;
    recorderRef.current.stop();
  };

  const startRecording = async () => {
    if (!streamRef.current || !ready || recording || recordingStarting) return;
    const mimeType = recorderMimeType();
    if (!mimeType) {
      setError("No encontramos un formato de video compatible en este navegador.");
      return;
    }

    const session = ++sessionRef.current;
    const abortController = new AbortController();
    recordingStartAbortRef.current = abortController;
    const videoElement = videoRef.current;
    releaseStream();
    setReady(false);
    setRecordingStarting(true);
    setError(null);

    try {
      // El stream de previsualización no tiene audio. El micrófono se solicita
      // únicamente después de que la persona pulsa «Iniciar video».
      const stream = await solicitarStream("video", facingMode, true);
      if (session !== sessionRef.current || !open || abortController.signal.aborted) {
        detenerStream(stream);
        return;
      }
      if (!videoElement) throw new Error("No se encontró el visor de video.");

      streamRef.current = stream;
      setAudioAvailable(stream.getAudioTracks().length > 0);
      videoElement.srcObject = stream;
      const readyPromise = esperarVideoListo(videoElement, abortController.signal);
      await Promise.all([videoElement.play(), readyPromise]);
      if (
        session !== sessionRef.current ||
        !videoListoParaCaptura(videoElement) ||
        abortController.signal.aborted
      ) {
        detenerStream(stream);
        return;
      }

      let capabilities = { canSwitchCamera: false, torch: false };
      try {
        capabilities = await detectarCapacidadesCamara(stream);
      } catch {
        // La grabación sigue siendo utilizable si el navegador no expone capacidades.
      }
      if (session !== sessionRef.current || abortController.signal.aborted) {
        detenerStream(stream);
        return;
      }
      setCanSwitchCamera(capabilities.canSwitchCamera);
      setTorchSupported(capabilities.torch);
      if (torchEnabled && capabilities.torch) {
        const track = stream.getVideoTracks()[0];
        try {
          await track?.applyConstraints({
            advanced: [{ torch: true }],
          } as unknown as MediaTrackConstraints);
        } catch {
          setTorchEnabled(false);
        }
      } else if (!capabilities.torch) {
        setTorchEnabled(false);
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorderRef.current = recorder;
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      setSeconds(0);
      setRecording(true);
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        discardRecordingRef.current = true;
        chunksRef.current = [];
        recorderRef.current = null;
        releaseStream();
        setReady(false);
        setError("No se pudo grabar el video. Inténtalo de nuevo.");
        setCanRetryCamera(true);
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
          releaseStream();
          setReady(false);
          setCanRetryCamera(true);
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
        const capturedAt = new Date(startedAtRef.current ?? Date.now()).toISOString();
        onVideo(file, duration, capturedAt);
        closeMedia();
      };
      recorder.start();
      timerRef.current = window.setInterval(() => {
        const elapsed = Math.floor((Date.now() - (startedAtRef.current ?? Date.now())) / 1000);
        setSeconds(Math.min(MAX_VIDEO_DURATION_SECONDS, elapsed));
        if (elapsed >= MAX_VIDEO_DURATION_SECONDS) stopRecording();
      }, 250);
    } catch (cause) {
      if (session === sessionRef.current && !abortController.signal.aborted) {
        releaseStream();
        setReady(false);
        setCanRetryCamera(true);
        setError(mensajeDeErrorMedia(cause));
      }
    } finally {
      if (recordingStartAbortRef.current === abortController) {
        recordingStartAbortRef.current = null;
      }
      setRecordingStarting(false);
    }
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
          {recording && !audioAvailable && (
            <span className="reportar-audio-status">Grabando video sin audio</span>
          )}
          <div className="reportar-media-tools" aria-label="Controles de cámara">
            {canSwitchCamera && (
              <button
                type="button"
                className="reportar-media-tool"
                onClick={flipCamera}
                disabled={recording || recordingStarting}
                aria-label="Voltear cámara"
                title="Voltear cámara"
              >
                <SwitchCamera size={22} aria-hidden="true" />
              </button>
            )}
            {torchSupported && (
              <button
                type="button"
                className={`reportar-media-tool${torchEnabled ? " is-active" : ""}`}
                onClick={() => void toggleTorch()}
                aria-pressed={torchEnabled}
                aria-label={torchEnabled ? "Apagar iluminación" : "Encender iluminación"}
                title={torchEnabled ? "Apagar iluminación" : "Encender iluminación"}
              >
                <Zap size={22} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {error && (
          <p className="reportar-error reportar-media-error" role="alert">
            {error}
          </p>
        )}

        <div className="reportar-media-actions">
          {canRetryCamera && !recording && !recordingStarting && (
            <Button type="button" variant="secondary" onClick={retryCamera}>
              <Camera size={20} /> Reintentar cámara
            </Button>
          )}
          {mode === "foto" ? (
            <Button
              type="button"
              className="reportar-media-primary"
              onClick={() => void takePhoto()}
              disabled={!ready || capturingPhoto}
            >
              <Camera size={20} /> {capturingPhoto ? "Procesando foto…" : "Capturar foto"}
            </Button>
          ) : recording ? (
            <Button
              type="button"
              className="reportar-media-primary"
              variant="destructive"
              onClick={stopRecording}
            >
              <Square size={20} fill="currentColor" /> Detener video
            </Button>
          ) : (
            <Button
              type="button"
              className="reportar-media-primary"
              onClick={() => void startRecording()}
              disabled={!ready || recordingStarting}
            >
              <Video size={20} /> {recordingStarting ? "Preparando grabación…" : "Iniciar video"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
