import { Button } from "@/components/ui/button";
import {
  categoriaConfig,
  etiquetaMotivoSinEvidencia,
  subcategoriasDe,
} from "@/lib/reportar/catalogo";
import { etiquetaTipoLugar, territorioPorId } from "@/lib/reportar/mock-data";
import type { ReporteDraft } from "@/lib/reportar/types";
import { ReportarStepActions, ReportarStepShell } from "@/components/reportar/reportar-step-shell";

export function ReportarReviewStep({
  draft,
  onEdit,
  onConfirm,
}: {
  draft: ReporteDraft;
  onEdit: (step: "categoria" | "detalle" | "ubicacion" | "evidencias") => void;
  onConfirm: () => void;
}) {
  const categoria = categoriaConfig(draft.categoria);
  const subcategoria = subcategoriasDe(draft.categoria).find(
    (item) => item.id === draft.subcategoria,
  )?.label;
  const territorio = territorioPorId(draft.territorioId);
  const territorioPadre = territorioPorId(draft.territorioPadreId);
  const territorioResumen = territorio
    ? `${etiquetaTipoLugar(draft.tipoLugar)} · ${territorio.nombre}`
    : "Sin territorio";

  return (
    <ReportarStepShell
      eyebrow="Paso 5 · Revisión"
      title="Revisa antes de continuar"
      description="Confirma que la información sea clara. Puedes volver a cualquier bloque para corregirla."
    >
      <div className="reportar-review-list">
        <article>
          <div>
            <span className="reportar-review-label">Tipo</span>
            <strong>{categoria?.label ?? "Sin seleccionar"}</strong>
            <span>{subcategoria ?? "Sin subcategoría"}</span>
          </div>
          <button
            type="button"
            className="reportar-text-button"
            onClick={() => onEdit("categoria")}
          >
            Editar
          </button>
        </article>
        <article>
          <div>
            <span className="reportar-review-label">Lugar del reporte</span>
            <strong>{territorioResumen}</strong>
            {territorioPadre && <span>Dentro de {territorioPadre.nombre}</span>}
            <span>{draft.lugar}</span>
            <p>{draft.descripcion}</p>
            {draft.nombre && <span>Reporta: {draft.nombre}</span>}
          </div>
          <button type="button" className="reportar-text-button" onClick={() => onEdit("detalle")}>
            Editar
          </button>
        </article>
        <article>
          <div>
            <span className="reportar-review-label">Ubicación GPS</span>
            <strong>
              {draft.ubicacion
                ? `Compartida · ±${Math.round(draft.ubicacion.precision)} m`
                : "No compartida"}
            </strong>
          </div>
          <button
            type="button"
            className="reportar-text-button"
            onClick={() => onEdit("ubicacion")}
          >
            Editar
          </button>
        </article>
        <article>
          <div>
            <span className="reportar-review-label">Evidencias</span>
            <strong>
              {draft.evidencias.length ? `${draft.evidencias.length} agregada(s)` : "Sin evidencia"}
            </strong>
            {draft.sinEvidencia && (
              <span>{etiquetaMotivoSinEvidencia(draft.sinEvidencia.motivo)}</span>
            )}
          </div>
          <button
            type="button"
            className="reportar-text-button"
            onClick={() => onEdit("evidencias")}
          >
            Editar
          </button>
        </article>
      </div>

      <div className="reportar-review-notice">
        <strong>Estado de esta versión</strong>
        <p>
          El reporte está preparado localmente. Todavía no se ha creado un registro ni se han subido
          archivos.
        </p>
      </div>

      <ReportarStepActions>
        <Button type="button" variant="outline" onClick={() => onEdit("evidencias")}>
          Atrás
        </Button>
        <Button type="button" onClick={onConfirm}>
          Preparar reporte
        </Button>
      </ReportarStepActions>
    </ReportarStepShell>
  );
}
