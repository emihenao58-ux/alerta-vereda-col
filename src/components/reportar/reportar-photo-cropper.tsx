import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recortarFoto } from "@/lib/reportar/photo-editor";
import type { ReporteEvidencia } from "@/lib/reportar/types";

export function ReportarPhotoCropper({
  evidencia,
  onClose,
  onSave,
}: {
  evidencia: ReporteEvidencia | null;
  onClose: () => void;
  onSave: (archivo: File) => void;
}) {
  const [porcentaje, setPorcentaje] = useState(0.8);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    if (!evidencia) return;
    setGuardando(true);
    setError(null);
    try {
      onSave(await recortarFoto(evidencia.archivo, porcentaje));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo recortar la fotografía.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={Boolean(evidencia)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="reportar-crop-dialog">
        <DialogHeader>
          <DialogTitle>Recortar fotografía</DialogTitle>
          <DialogDescription>
            El recorte es cuadrado y se realiza localmente. La imagen original no se modifica.
          </DialogDescription>
        </DialogHeader>
        {evidencia && (
          <img
            className="reportar-crop-preview"
            src={evidencia.previewUrl}
            alt="Fotografía para recortar"
          />
        )}
        <label className="reportar-field">
          <span>Área visible: {Math.round(porcentaje * 100)}%</span>
          <input
            type="range"
            min="45"
            max="100"
            value={Math.round(porcentaje * 100)}
            onChange={(event) => setPorcentaje(Number(event.target.value) / 100)}
          />
        </label>
        {error && (
          <p className="reportar-error" role="alert">
            {error}
          </p>
        )}
        <div className="reportar-step-actions">
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void guardar()} disabled={guardando}>
            {guardando ? "Guardando…" : "Guardar recorte"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
