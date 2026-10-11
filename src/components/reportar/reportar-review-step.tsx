import {
  ArrowLeft,
  Images,
  Info,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  Pencil,
  Send,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  categoriaConfig,
  etiquetaMotivoSinEvidencia,
  subcategoriaPorId,
} from "@/lib/reportar/catalogo";
import { contextoVereda, territorioPorId } from "@/lib/reportar/mock-data";
import type { ReporteDraft, ReporteStep } from "@/lib/reportar/types";
import { ReportarStepActions, ReportarStepShell } from "@/components/reportar/reportar-step-shell";

export function ReportarReviewStep({
  draft,
  onEdit,
  onConfirm,
}: {
  draft: ReporteDraft;
  onEdit: (
    step: Extract<ReporteStep, "categoria" | "detalle" | "ubicacion" | "evidencias">,
  ) => void;
  onConfirm: () => void;
}) {
  const categoria = categoriaConfig(draft.categoria);
  const CategoriaIcon = categoria?.Icon ?? Info;
  const subcategoria = subcategoriaPorId(draft.categoria, draft.subcategoria);
  const subcategoriaPadre = subcategoriaPorId(draft.categoria, draft.subcategoriaPadre);
  const subcategoriaResumen = subcategoria
    ? subcategoriaPadre
      ? `${subcategoriaPadre.label} · ${subcategoria.label}`
      : subcategoria.label
    : "Sin subcategoría";
  const territorio = territorioPorId(draft.territorioId);
  const territorioPadre = territorioPorId(draft.territorioPadreId);
  const contexto = territorio && !territorioPadre ? contextoVereda(territorio) : null;
  const referenciaTerritorial = territorioPadre?.nombre ?? contexto;
  const comunidadResumen = territorio
    ? `Comunidad · ${territorio.nombre}`
    : "Sin comunidad seleccionada";
  const ubicacionResumen = draft.ubicacion
    ? "Ubicación GPS compartida"
    : draft.ubicacionEstado === "no-confirmada"
      ? "Ubicación GPS no confirmada"
      : "Sin ubicación GPS compartida";
  const evidenciaResumen =
    draft.evidencias.length === 0
      ? "Sin evidencias adjuntas"
      : draft.evidencias.length === 1
        ? "1 evidencia adjunta"
        : `${draft.evidencias.length} evidencias adjuntas`;
  const descripcion = draft.descripcion.trim();
  const referencia = draft.lugar.trim();
  const nombre = draft.nombre.trim();

  return (
    <ReportarStepShell
      eyebrow="Paso 5 · Revisión"
      title="Revisa tu reporte"
      description="Verifica que toda la información sea correcta. Puedes editar cada sección sin perder lo que ya capturaste."
    >
      <div className="reportar-review-list">
        <article className="reportar-review-card">
          <div className="reportar-review-card-main">
            <span className="reportar-review-icon" aria-hidden="true">
              <CategoriaIcon size={25} />
            </span>
            <div className="reportar-review-card-content">
              <span className="reportar-review-label">Tipo de reporte</span>
              <strong>{categoria?.label ?? "Sin categoría seleccionada"}</strong>
              <span>{subcategoriaResumen}</span>
            </div>
          </div>
          <button
            type="button"
            className="reportar-review-edit"
            onClick={() => onEdit("categoria")}
            aria-label="Editar tipo de reporte"
          >
            <Pencil size={16} aria-hidden="true" />
            Editar
          </button>
        </article>

        <article className="reportar-review-card">
          <div className="reportar-review-card-main">
            <span className="reportar-review-icon" aria-hidden="true">
              <MapPin size={25} />
            </span>
            <div className="reportar-review-card-content">
              <span className="reportar-review-label">Lugar del reporte</span>
              <strong>{comunidadResumen}</strong>
              {referenciaTerritorial && <span>Zona: {referenciaTerritorial}</span>}
              {referencia && (
                <span className="reportar-review-inline-detail">
                  <b>Referencia:</b> {referencia}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="reportar-review-edit"
            onClick={() => onEdit("detalle")}
            aria-label="Editar lugar del reporte"
          >
            <Pencil size={16} aria-hidden="true" />
            Editar
          </button>
        </article>

        <article className="reportar-review-card">
          <div className="reportar-review-card-main">
            <span className="reportar-review-icon" aria-hidden="true">
              <MapIcon size={25} />
            </span>
            <div className="reportar-review-card-content">
              <span className="reportar-review-label">Ubicación</span>
              <strong>{ubicacionResumen}</strong>
              {draft.ubicacion && (
                <span>Precisión aproximada: {Math.round(draft.ubicacion.precision)} m</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="reportar-review-edit"
            onClick={() => onEdit("ubicacion")}
            aria-label="Editar ubicación"
          >
            <Pencil size={16} aria-hidden="true" />
            Editar
          </button>
          <div className="reportar-review-card-extra">
            <div className="reportar-review-map-placeholder" aria-label="Vista previa del mapa">
              <MapIcon size={26} aria-hidden="true" />
              <div>
                <strong>Vista previa del mapa</strong>
                <span>Aquí se mostrará la ubicación del reporte.</span>
              </div>
            </div>
          </div>
        </article>

        <article className="reportar-review-card">
          <div className="reportar-review-card-main">
            <span className="reportar-review-icon" aria-hidden="true">
              <Images size={25} />
            </span>
            <div className="reportar-review-card-content">
              <span className="reportar-review-label">Evidencias</span>
              <strong>{evidenciaResumen}</strong>
              {draft.sinEvidencia && (
                <span>{etiquetaMotivoSinEvidencia(draft.sinEvidencia.motivo)}</span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="reportar-review-edit"
            onClick={() => onEdit("evidencias")}
            aria-label="Editar evidencias"
          >
            <Pencil size={16} aria-hidden="true" />
            Editar
          </button>
          <div className="reportar-review-card-extra">
            {draft.evidencias.length > 0 ? (
              <ul
                className="reportar-review-evidence-grid"
                aria-label="Previsualizaciones de evidencias"
              >
                {draft.evidencias.map((evidencia, index) => (
                  <li key={evidencia.id} className="reportar-review-evidence">
                    {evidencia.tipo === "foto" ? (
                      <img
                        src={evidencia.previewUrl}
                        alt={`Vista previa de la fotografía ${index + 1}`}
                      />
                    ) : (
                      <video
                        src={evidencia.previewUrl}
                        controls
                        playsInline
                        preload="metadata"
                        aria-label={`Vista previa del video ${index + 1}`}
                      />
                    )}
                    <span>
                      {evidencia.tipo === "foto" ? "Fotografía" : "Video"}
                      {evidencia.recortada ? " · recortada" : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="reportar-review-empty">No hay archivos adjuntos en este reporte.</p>
            )}
          </div>
        </article>

        {descripcion && (
          <article className="reportar-review-card">
            <div className="reportar-review-card-main">
              <span className="reportar-review-icon" aria-hidden="true">
                <MessageSquare size={25} />
              </span>
              <div className="reportar-review-card-content">
                <span className="reportar-review-label">Descripción del problema</span>
                <p className="reportar-review-quote">“{descripcion}”</p>
              </div>
            </div>
            <button
              type="button"
              className="reportar-review-edit"
              onClick={() => onEdit("categoria")}
              aria-label="Editar descripción del problema"
            >
              <Pencil size={16} aria-hidden="true" />
              Editar
            </button>
          </article>
        )}

        {nombre && (
          <article className="reportar-review-card">
            <div className="reportar-review-card-main">
              <span className="reportar-review-icon" aria-hidden="true">
                <UserRound size={25} />
              </span>
              <div className="reportar-review-card-content">
                <span className="reportar-review-label">Datos de quien reporta</span>
                <strong>{nombre}</strong>
              </div>
            </div>
            <button
              type="button"
              className="reportar-review-edit"
              onClick={() => onEdit("detalle")}
              aria-label="Editar datos de quien reporta"
            >
              <Pencil size={16} aria-hidden="true" />
              Editar
            </button>
          </article>
        )}
      </div>

      <div className="reportar-review-notice">
        <strong>Estado del reporte</strong>
        <p>
          El reporte está preparado localmente. Todavía no se ha enviado al servidor ni se ha creado
          un registro definitivo.
        </p>
      </div>

      <ReportarStepActions>
        <Button type="button" variant="outline" onClick={() => onEdit("evidencias")}>
          <ArrowLeft size={16} aria-hidden="true" />
          Atrás
        </Button>
        <Button type="button" onClick={onConfirm}>
          <Send size={16} aria-hidden="true" />
          Preparar reporte
        </Button>
      </ReportarStepActions>
    </ReportarStepShell>
  );
}
