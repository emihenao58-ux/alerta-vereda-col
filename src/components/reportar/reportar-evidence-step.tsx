import { useState } from "react";
import { Camera, Film, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MOTIVOS_SIN_EVIDENCIA } from "@/lib/reportar/catalogo";
import type { ReporteEvidencia, SinEvidencia, SinEvidenciaMotivo } from "@/lib/reportar/types";
import { ReportarStepActions, ReportarStepShell } from "@/components/reportar/reportar-step-shell";
import { ReportarEvidenceList } from "@/components/reportar/reportar-evidence-list";

export function ReportarEvidenceStep({
  evidencias,
  fotoCount,
  videoCount,
  fotoObligatoria,
  sinEvidencia,
  error,
  onOpenCapture,
  onFiles,
  onRemove,
  onEdit,
  onSinEvidencia,
  onBack,
  onNext,
}: {
  evidencias: readonly ReporteEvidencia[];
  fotoCount: number;
  videoCount: number;
  fotoObligatoria: boolean;
  sinEvidencia: SinEvidencia | null;
  error: string | null;
  onOpenCapture: (mode: "foto" | "video") => void;
  onFiles: (files: readonly File[]) => void;
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
  onSinEvidencia: (value: SinEvidencia | null) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [mostrarExcepcion, setMostrarExcepcion] = useState(Boolean(sinEvidencia));
  const [motivo, setMotivo] = useState<SinEvidenciaMotivo>(
    sinEvidencia?.motivo ?? "camara_no_disponible",
  );
  const [detalle, setDetalle] = useState(sinEvidencia?.detalle ?? "");

  const guardarExcepcion = () => {
    onSinEvidencia({ motivo, detalle: detalle.trim() });
  };

  const elegirArchivos = (event: React.ChangeEvent<HTMLInputElement>) => {
    onFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  };

  return (
    <ReportarStepShell
      eyebrow="Paso 4 · Evidencias"
      title="¿Puedes mostrar lo que ocurre?"
      description="Puedes agregar hasta 3 fotos y 1 video. Las evidencias quedan en este dispositivo durante la revisión."
    >
      <div className="reportar-evidence-limit" role="status">
        <strong>{evidencias.length}/4 evidencias</strong>
        <span>
          {fotoCount}/3 fotos · {videoCount}/1 video
        </span>
      </div>

      <div className="reportar-evidence-add-grid">
        <Button type="button" onClick={() => onOpenCapture("foto")} disabled={fotoCount >= 3}>
          <Camera size={17} /> Tomar foto
        </Button>
        <label className={`reportar-file-button ${fotoCount >= 3 ? "is-disabled" : ""}`}>
          <FolderOpen size={17} /> Elegir de galería
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={elegirArchivos}
            disabled={fotoCount >= 3}
          />
        </label>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenCapture("video")}
          disabled={videoCount >= 1}
        >
          <Film size={17} /> Grabar video
        </Button>
      </div>

      <ReportarEvidenceList evidencias={evidencias} onRemove={onRemove} onEdit={onEdit} />

      {fotoObligatoria && fotoCount === 0 && !sinEvidencia && (
        <div className="reportar-evidence-required">
          <strong>Para esta categoría la foto es obligatoria.</strong>
          <p>
            Si existe un problema técnico real que te impide tomarla, puedes registrarlo para
            continuar.
          </p>
          <button
            type="button"
            className="reportar-text-button"
            onClick={() => setMostrarExcepcion(true)}
          >
            ¿No puedes tomar una foto?
          </button>
        </div>
      )}

      {mostrarExcepcion && fotoObligatoria && fotoCount === 0 && (
        <div className="reportar-no-evidence-card">
          <h3>Reportar sin foto</h3>
          <p>Selecciona la razón técnica. Esta decisión quedará visible en la revisión local.</p>
          <label className="reportar-field">
            <span>Justificación</span>
            <select
              className="reportar-input"
              value={motivo}
              onChange={(event) => setMotivo(event.target.value as SinEvidenciaMotivo)}
            >
              {MOTIVOS_SIN_EVIDENCIA.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="reportar-field">
            <span>
              Detalle adicional <em>(opcional)</em>
            </span>
            <textarea
              className="reportar-input reportar-textarea reportar-textarea-small"
              rows={3}
              value={detalle}
              onChange={(event) => setDetalle(event.target.value)}
              placeholder="Cuéntanos brevemente qué ocurrió…"
            />
          </label>
          <div className="reportar-inline-actions">
            <Button type="button" onClick={guardarExcepcion}>
              Continuar sin foto
            </Button>
            {sinEvidencia && (
              <button
                type="button"
                className="reportar-text-button"
                onClick={() => {
                  onSinEvidencia(null);
                  setMostrarExcepcion(false);
                }}
              >
                Quitar excepción
              </button>
            )}
          </div>
        </div>
      )}

      {sinEvidencia && (
        <div className="reportar-no-evidence-confirmed" role="status">
          <strong>Reporte sin evidencia fotográfica registrado</strong>
          <span>
            {MOTIVOS_SIN_EVIDENCIA.find((item) => item.value === sinEvidencia.motivo)?.label}
          </span>
        </div>
      )}

      {error && (
        <p className="reportar-error" role="alert">
          {error}
        </p>
      )}

      <ReportarStepActions>
        <Button type="button" variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button type="button" onClick={onNext}>
          Revisar reporte
        </Button>
      </ReportarStepActions>
    </ReportarStepShell>
  );
}
