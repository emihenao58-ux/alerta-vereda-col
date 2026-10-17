import { Image as ImageIcon, Maximize2, Play, Scissors, Trash2, Video } from "lucide-react";
import type { ReporteEvidencia } from "@/lib/reportar/types";
import { etiquetaFechaEvidencia } from "@/lib/reportar/media";

export function ReportarEvidenceList({
  evidencias,
  onRemove,
  onEdit,
  onPreview,
}: {
  evidencias: readonly ReporteEvidencia[];
  onRemove: (id: string) => void;
  onEdit: (id: string) => void;
  onPreview: (id: string) => void;
}) {
  if (evidencias.length === 0) {
    return <p className="reportar-empty-evidence">Todavía no has agregado evidencias.</p>;
  }

  return (
    <ul className="reportar-evidence-grid" aria-label="Evidencias agregadas">
      {evidencias.map((evidencia, index) => (
        <li key={evidencia.id} className="reportar-evidence-card">
          <button
            type="button"
            className="reportar-evidence-media-button"
            onClick={() => onPreview(evidencia.id)}
            aria-label={
              evidencia.tipo === "foto"
                ? `Ver fotografía ${index + 1} ampliada`
                : `Ver video ${index + 1} ampliado`
            }
          >
            {evidencia.tipo === "foto" ? (
              <img src={evidencia.previewUrl} alt="" />
            ) : (
              <video
                src={evidencia.previewUrl}
                muted
                playsInline
                preload="metadata"
                aria-hidden="true"
              />
            )}
            <span className="reportar-evidence-media-overlay" aria-hidden="true">
              {evidencia.tipo === "foto" ? <Maximize2 size={20} /> : <Play size={22} />}
            </span>
          </button>
          <div className="reportar-evidence-card-body">
            <span className="reportar-evidence-type">
              {evidencia.tipo === "foto" ? <ImageIcon size={14} /> : <Video size={14} />}
              {evidencia.tipo === "foto" ? "Foto" : "Video"}
              {evidencia.recortada ? " · recortada" : ""}
              {evidencia.procesamiento === "procesada" ? " · procesada" : ""}
              {evidencia.procesamiento === "pesada" ? " · supera 600 KB" : ""}
              {evidencia.procesamiento === "original" ? " · original" : ""}
            </span>
            <span className="reportar-evidence-timestamp">
              {etiquetaFechaEvidencia(evidencia.fuente, evidencia.capturadaEn)}
            </span>
            <div className="reportar-evidence-actions">
              {evidencia.tipo === "foto" && (
                <button
                  type="button"
                  onClick={() => onEdit(evidencia.id)}
                  aria-label={`Editar evidencia fotográfica ${index + 1}`}
                >
                  <Scissors size={15} /> Editar
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
