import { Image as ImageIcon, Scissors, Trash2, Video } from "lucide-react";
import type { ReporteEvidencia } from "@/lib/reportar/types";

export function ReportarEvidenceList({
  evidencias,
  onRemove,
  onEdit,
}: {
  evidencias: readonly ReporteEvidencia[];
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  if (evidencias.length === 0) {
    return <p className="reportar-empty-evidence">Todavía no has agregado evidencias.</p>;
  }

  return (
    <ul className="reportar-evidence-grid" aria-label="Evidencias agregadas">
      {evidencias.map((evidencia, index) => (
        <li key={evidencia.id} className="reportar-evidence-card">
          {evidencia.tipo === "foto" ? (
            <img src={evidencia.previewUrl} alt={`Evidencia fotográfica ${index + 1}`} />
          ) : (
            <video
              src={evidencia.previewUrl}
              controls
              playsInline
              aria-label={`Evidencia de video ${index + 1}`}
            />
          )}
          <div className="reportar-evidence-card-body">
            <span className="reportar-evidence-type">
              {evidencia.tipo === "foto" ? <ImageIcon size={14} /> : <Video size={14} />}
              {evidencia.tipo === "foto" ? "Foto" : "Video"}
              {evidencia.recortada ? " · recortada" : ""}
            </span>
            <div className="reportar-evidence-actions">
              {evidencia.tipo === "foto" && (
                <button
                  type="button"
                  onClick={() => onEdit(evidencia.id)}
                  aria-label={`Recortar evidencia ${index + 1}`}
                >
                  <Scissors size={15} /> Recortar
                </button>
              )}
              <button
                type="button"
                onClick={() => onRemove(evidencia.id)}
                aria-label={`Eliminar evidencia ${index + 1}`}
              >
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
