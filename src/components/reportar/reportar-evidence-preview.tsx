import { useEffect, useState } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";
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

export function ReportarEvidencePreview({
  evidencia,
  onClose,
}: {
  evidencia: ReporteEvidencia | null;
  onClose: () => void;
}) {
  const [zoom, setZoom] = useState(MIN_ZOOM);

  useEffect(() => {
    setZoom(MIN_ZOOM);
  }, [evidencia?.id]);

  const esFoto = evidencia?.tipo === "foto";

  return (
    <Dialog open={Boolean(evidencia)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="reportar-evidence-preview-dialog">
        <DialogHeader>
          <DialogTitle>{esFoto ? "Vista ampliada" : "Reproducir video"}</DialogTitle>
          <DialogDescription>
            {esFoto
              ? "Examina la evidencia sin modificarla. Usa los controles para acercar o alejar."
              : "Reproduce o pausa el video sin modificar la evidencia adjunta."}
          </DialogDescription>
        </DialogHeader>

        {evidencia && (
          <div className="reportar-evidence-preview-stage">
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
              <video
                src={evidencia.previewUrl}
                className="reportar-evidence-preview-video"
                controls
                playsInline
                preload="metadata"
                aria-label="Evidencia de video ampliada"
              />
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
