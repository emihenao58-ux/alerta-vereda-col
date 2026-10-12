import {
  Camera,
  Home,
  Images,
  Map as MapIcon,
  MapPin,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  Video,
} from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  categoriaConfig,
  etiquetaMotivoSinEvidencia,
  subcategoriaPorId,
} from "@/lib/reportar/catalogo";
import { contextoVereda, territorioPorId } from "@/lib/reportar/mock-data";
import type { ReporteDraft, TipoLugar } from "@/lib/reportar/types";
import type { MockSubmissionResult } from "@/lib/reportar/mock-submit";
import { colorTipoReporte } from "@/lib/reportar/visuals";

function etiquetaTipoLugar(tipo: TipoLugar | null) {
  if (tipo === "corregimiento") return "Corregimiento";
  if (tipo === "vereda") return "Vereda";
  if (tipo === "casco_urbano") return "Cabecera municipal";
  return "Lugar";
}

function accentStyle(color: string): CSSProperties {
  return { "--confirmation-accent": color } as CSSProperties;
}

export function ReportarConfirmation({
  draft,
  result,
  pendienteRevision,
  onReset,
}: {
  draft: ReporteDraft;
  result: MockSubmissionResult;
  pendienteRevision: boolean;
  onReset: () => void;
}) {
  const categoria = categoriaConfig(draft.categoria);
  const subcategoria = subcategoriaPorId(draft.categoria, draft.subcategoria);
  const subcategoriaPadre = subcategoriaPorId(draft.categoria, draft.subcategoriaPadre);
  const TipoIcon =
    draft.categoria === "servicio"
      ? (subcategoriaPadre?.Icon ?? subcategoria?.Icon ?? categoria?.Icon ?? Images)
      : (categoria?.Icon ?? subcategoria?.Icon ?? Images);
  const tipoColor = colorTipoReporte(
    draft.categoria,
    subcategoria?.id ?? null,
    subcategoriaPadre?.id ?? null,
    categoria?.color,
  );
  const territorio = territorioPorId(draft.territorioId);
  const territorioPadre = territorioPorId(draft.territorioPadreId);
  const contexto = territorio && draft.tipoLugar === "vereda" ? contextoVereda(territorio) : null;
  const referencia = draft.lugar.trim();
  const descripcion = draft.descripcion.trim();
  const gpsConfirmado = draft.ubicacion !== null && draft.ubicacionEstado === "confirmada";
  const subcategoriaTexto = subcategoria
    ? subcategoriaPadre
      ? `${subcategoriaPadre.label} · ${subcategoria.label}`
      : subcategoria.label
    : "Sin subcategoría";
  const territorioTexto = territorio
    ? `${etiquetaTipoLugar(draft.tipoLugar)} · ${territorio.nombre}`
    : "Lugar no seleccionado";
  const contextoTexto = territorioPadre?.nombre ?? contexto;
  const cantidadEvidencias = draft.evidencias.length;

  return (
    <section
      className="reportar-confirmation-screen carta"
      aria-labelledby="reportar-confirmation-title"
    >
      <div className="reportar-confirmation-hero">
        <span className="reportar-confirmation-mark" aria-hidden="true">
          <img src="/images/reportar/confirmation-check.webp" alt="" />
        </span>
        <p className="reportar-confirmation-kicker">Confirmación local</p>
        <h2 id="reportar-confirmation-title">Tu reporte está listo</h2>
        <p>
          La información quedó preparada en este dispositivo. Todavía no se ha enviado ni publicado.
        </p>
      </div>

      <div className="reportar-confirmation-panel">
        <h3>Resumen de tu reporte</h3>
        <div className="reportar-confirmation-summary-list">
          <article className="reportar-confirmation-summary-row">
            <span
              className="reportar-confirmation-summary-icon"
              style={accentStyle(tipoColor)}
              aria-hidden="true"
            >
              <TipoIcon size={21} />
            </span>
            <div>
              <span className="reportar-confirmation-summary-label">Tipo de reporte</span>
              <strong>{categoria?.label ?? "Categoría no disponible"}</strong>
              <small>{subcategoriaTexto}</small>
            </div>
          </article>

          <article className="reportar-confirmation-summary-row">
            <span
              className="reportar-confirmation-summary-icon"
              style={accentStyle("#E7A836")}
              aria-hidden="true"
            >
              <MapPin size={21} />
            </span>
            <div>
              <span className="reportar-confirmation-summary-label">Lugar</span>
              <strong>{territorioTexto}</strong>
              {contextoTexto && <small>Zona: {contextoTexto}</small>}
              {referencia && <small>Referencia: {referencia}</small>}
            </div>
          </article>

          {gpsConfirmado && draft.ubicacion && (
            <article className="reportar-confirmation-summary-row">
              <span
                className="reportar-confirmation-summary-icon"
                style={accentStyle("#3D83C4")}
                aria-hidden="true"
              >
                <MapIcon size={21} />
              </span>
              <div>
                <span className="reportar-confirmation-summary-label">Ubicación GPS</span>
                <strong>Ubicación GPS confirmada</strong>
                {draft.ubicacion.precision > 0 && (
                  <small>Precisión aproximada: {Math.round(draft.ubicacion.precision)} m</small>
                )}
              </div>
            </article>
          )}

          <article className="reportar-confirmation-summary-row reportar-confirmation-evidence-row">
            <span
              className="reportar-confirmation-summary-icon"
              style={accentStyle("#208666")}
              aria-hidden="true"
            >
              <Images size={21} />
            </span>
            <div>
              <span className="reportar-confirmation-summary-label">Evidencias</span>
              {cantidadEvidencias > 0 ? (
                <>
                  <strong>
                    {cantidadEvidencias} evidencia{cantidadEvidencias === 1 ? "" : "s"} adjunta
                    {cantidadEvidencias === 1 ? "" : "s"}
                  </strong>
                  <ul
                    className="reportar-confirmation-media-grid"
                    aria-label="Miniaturas de las evidencias del reporte"
                  >
                    {draft.evidencias.map((evidencia, index) => (
                      <li key={evidencia.id}>
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
                          {evidencia.tipo === "foto" ? <Camera size={12} /> : <Video size={12} />}
                          {evidencia.tipo === "foto" ? "Foto" : "Video"}
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              ) : draft.sinEvidencia ? (
                <>
                  <strong>Reporte sin evidencia fotográfica</strong>
                  <small>{etiquetaMotivoSinEvidencia(draft.sinEvidencia.motivo)}</small>
                  {draft.sinEvidencia.detalle.trim() && <small>{draft.sinEvidencia.detalle}</small>}
                </>
              ) : (
                <>
                  <strong>Sin evidencias adjuntas</strong>
                  <small>La evidencia es opcional para este tipo de reporte.</small>
                </>
              )}
            </div>
          </article>

          {descripcion && (
            <article className="reportar-confirmation-summary-row reportar-confirmation-description-row">
              <span
                className="reportar-confirmation-summary-icon"
                style={accentStyle("#B86B42")}
                aria-hidden="true"
              >
                <MessageSquare size={21} />
              </span>
              <div>
                <span className="reportar-confirmation-summary-label">Descripción</span>
                <p>“{descripcion}”</p>
              </div>
            </article>
          )}
        </div>
      </div>

      <p className="reportar-confirmation-local-note">
        <ShieldCheck size={16} aria-hidden="true" />
        La información y las evidencias permanecieron en este dispositivo durante el recorrido.
      </p>

      {pendienteRevision && (
        <div className="reportar-security-review-notice" role="status">
          <ShieldAlert size={19} aria-hidden="true" />
          <span>
            <strong>Alerta de seguridad pendiente de revisión</strong>
            <small>
              En esta versión local no se publica automáticamente ni se muestran datos sensibles a
              la comunidad.
            </small>
          </span>
        </div>
      )}

      <div className="reportar-confirmation-actions">
        <Button type="button" variant="outline" onClick={onReset}>
          Crear otro reporte
        </Button>
        <Button asChild type="button">
          <Link to="/">
            <Home size={16} /> Volver a Inicio
          </Link>
        </Button>
      </div>

      <p className="reportar-confirmation-tagline">Juntos cuidamos nuestra comunidad</p>

      <span className="sr-only">
        Modo: {result.mode}. Preparado: {result.submittedAt}. Identificador definitivo pendiente.
      </span>
    </section>
  );
}
