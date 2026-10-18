import { useCallback, useEffect, useRef, useState } from "react";
import {
  FastForward,
  Maximize2,
  Minimize2,
  Minus,
  Pause,
  Play,
  Plus,
  Rewind,
  RotateCcw,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ReporteEvidencia } from "@/lib/reportar/types";

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;

function limitarZoom(value: number) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(value.toFixed(2))));
}

function limitarTiempo(value: number, duration: number) {
  return Math.max(0, Math.min(duration || 0, value));
}

function formatearTiempo(value: number) {
  const total = Math.max(0, Math.floor(value));
  const minutes = Math.floor(total / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function ReportarEvidencePreview({
  evidencia,
  onClose,
}: {
  evidencia: ReporteEvidencia | null;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [fullscreen, setFullscreen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoVolume, setVideoVolumeLevel] = useState(1);
  const stageRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const esFoto = evidencia?.tipo === "foto";

  useEffect(() => {
    setZoom(MIN_ZOOM);
    setFullscreen(false);
    setVideoPlaying(false);
    setVideoTime(0);
    setVideoDuration(0);
    setVideoVolumeLevel(1);
  }, [evidencia?.id]);

  useEffect(() => {
    const stageAtSetup = stageRef.current;
    const onFullscreenChange = () => {
      setFullscreen(document.fullscreenElement === stageRef.current);
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      if (stageAtSetup && document.fullscreenElement === stageAtSetup) {
        void document.exitFullscreen();
      }
    };
  }, [evidencia?.id]);

  const closePreview = useCallback(async () => {
    if (document.fullscreenElement === stageRef.current) {
      await document.exitFullscreen().catch(() => undefined);
    }
    setFullscreen(false);
    onClose();
  }, [onClose]);

  const toggleFullscreen = useCallback(async () => {
    const stage = stageRef.current;
    if (!stage) return;

    if (fullscreen) {
      if (document.fullscreenElement === stage) {
        await document.exitFullscreen().catch(() => undefined);
      }
      setFullscreen(false);
      return;
    }

    try {
      if (typeof stage.requestFullscreen === "function") {
        await stage.requestFullscreen();
      }
    } catch {
      // Si el navegador no permite la API, conservamos una vista ampliada dentro del diálogo.
    }
    setFullscreen(true);
  }, [fullscreen]);

  const toggleVideoPlayback = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video.paused || video.ended) {
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      setVideoPlaying(false);
    }
  }, []);

  const seekVideo = useCallback((offset: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = limitarTiempo(video.currentTime + offset, video.duration);
    setVideoTime(video.currentTime);
  }, []);

  const setVideoPosition = useCallback((position: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = limitarTiempo(position, video.duration);
    setVideoTime(video.currentTime);
  }, []);

  const setVideoVolume = useCallback((volume: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = volume === 0;
    setVideoVolumeLevel(volume);
  }, []);

  return (
    <Dialog
      open={Boolean(evidencia)}
      onOpenChange={(open) => {
        if (!open) void closePreview();
      }}
    >
      <DialogContent
        className={`reportar-evidence-preview-dialog${fullscreen ? " is-fullscreen" : ""}`}
      >
        <DialogHeader className="reportar-evidence-preview-header">
          <DialogTitle>{esFoto ? "Vista ampliada" : "Reproducir video"}</DialogTitle>
          <DialogDescription>
            {esFoto
              ? "Examina la evidencia sin modificarla. Usa los controles para acercar o alejar."
              : "Reproduce o pausa el video sin modificar la evidencia adjunta."}
          </DialogDescription>
        </DialogHeader>

        {evidencia && (
          <div ref={stageRef} className="reportar-evidence-preview-stage">
            {esFoto ? (
              <div className="reportar-evidence-preview-image-scroll">
                <img
                  src={evidencia.previewUrl}
                  alt="Evidencia fotográfica ampliada"
                  className="reportar-evidence-preview-image"
                  style={{ transform: `scale(${zoom})` }}
                />
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={evidencia.previewUrl}
                  className="reportar-evidence-preview-video"
                  playsInline
                  preload="metadata"
                  onClick={() => void toggleVideoPlayback()}
                  onLoadedMetadata={(event) => {
                    const duration = event.currentTarget.duration;
                    setVideoDuration(Number.isFinite(duration) ? duration : 0);
                  }}
                  onDurationChange={(event) => {
                    const duration = event.currentTarget.duration;
                    setVideoDuration(Number.isFinite(duration) ? duration : 0);
                  }}
                  onTimeUpdate={(event) => setVideoTime(event.currentTarget.currentTime)}
                  onPlay={() => setVideoPlaying(true)}
                  onPause={() => setVideoPlaying(false)}
                  onEnded={() => setVideoPlaying(false)}
                  aria-label="Evidencia de video ampliada"
                />
                <div
                  className="reportar-evidence-preview-video-controls"
                  aria-label="Controles del video"
                >
                  <div className="reportar-evidence-preview-video-control-row">
                    <button
                      type="button"
                      onClick={() => void toggleVideoPlayback()}
                      aria-label={videoPlaying ? "Pausar video" : "Reproducir video"}
                    >
                      {videoPlaying ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => seekVideo(-10)}
                      aria-label="Retroceder 10 segundos"
                    >
                      <Rewind size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => seekVideo(10)}
                      aria-label="Adelantar 10 segundos"
                    >
                      <FastForward size={18} />
                    </button>
                    <span className="reportar-evidence-preview-video-time" aria-live="polite">
                      {formatearTiempo(videoTime)} / {formatearTiempo(videoDuration)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void toggleFullscreen()}
                      aria-label={
                        fullscreen ? "Salir de pantalla completa" : "Ver video en pantalla completa"
                      }
                    >
                      {fullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                    </button>
                  </div>
                  <input
                    className="reportar-evidence-preview-video-seek"
                    type="range"
                    min="0"
                    max={videoDuration || 1}
                    step="0.1"
                    value={Math.min(videoTime, videoDuration || 1)}
                    onChange={(event) => setVideoPosition(Number(event.currentTarget.value))}
                    aria-label="Posición del video"
                  />
                  <div className="reportar-evidence-preview-video-volume">
                    {videoVolume === 0 ? <VolumeX size={17} /> : <Volume2 size={17} />}
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={videoVolume}
                      onChange={(event) => setVideoVolume(Number(event.currentTarget.value))}
                      aria-label="Volumen del video"
                    />
                  </div>
                </div>
              </>
            )}
            {!esFoto && fullscreen && (
              <button
                type="button"
                className="reportar-evidence-preview-fullscreen-close"
                onClick={() => void toggleFullscreen()}
                aria-label="Salir de pantalla completa"
                title="Salir de pantalla completa"
              >
                <X size={22} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {esFoto && (
          <div className="reportar-evidence-preview-zoom" aria-label="Controles de zoom">
            <button
              type="button"
              onClick={() => setZoom((actual) => limitarZoom(actual - ZOOM_STEP))}
              disabled={zoom <= MIN_ZOOM}
              aria-label="Alejar fotografía"
            >
              <Minus size={17} />
            </button>
            <span aria-live="polite">{Math.round(zoom * 100)}%</span>
            <button
              type="button"
              onClick={() => setZoom((actual) => limitarZoom(actual + ZOOM_STEP))}
              disabled={zoom >= MAX_ZOOM}
              aria-label="Acercar fotografía"
            >
              <Plus size={17} />
            </button>
            <button
              type="button"
              onClick={() => setZoom(MIN_ZOOM)}
              disabled={zoom === MIN_ZOOM}
              aria-label="Restablecer zoom"
            >
              <RotateCcw size={16} /> Restablecer
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
