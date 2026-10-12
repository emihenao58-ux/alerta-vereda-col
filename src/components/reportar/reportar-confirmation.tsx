import {
  Camera,
  CheckCircle2,
  Clock3,
  Home,
  Images,
  Map as MapIcon,
  MapPin,
  ShieldAlert,
  ShieldCheck,
  Video,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  categoriaConfig,
  etiquetaMotivoSinEvidencia,
  subcategoriaPorId,
} from "@/lib/reportar/catalogo";
import { contextoVereda, territorioPorId } from "@/lib/reportar/mock-data";
import type { ReporteDraft, ReporteEvidencia, TipoLugar } from "@/lib/reportar/types";
import type { MockSubmissionResult } from "@/lib/reportar/mock-submit";
import { ReportarStepShell } from "@/components/reportar/reportar-step-shell";

function formatearFecha(valor: string) {
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}

function etiquetaTipoLugar(tipo: TipoLugar | null) {
  if (tipo === "corregimiento") return "Corregimiento";
  if (tipo === "vereda") return "Vereda";
  if (tipo === "casco_urbano") return "Cabecera municipal";
  return "Lugar";
}

function etiquetaFuente(evidencia: ReporteEvidencia) {
  return evidencia.fuente === "camara" ? "Capturada desde la cámara" : "Seleccionada de galería";
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
  const CategoriaIcon = categoria?.Icon ?? Images;
  const subcategoria = subcategoriaPorId(draft.categoria, draft.subcategoria);
  const subcategoriaPadre = subcategoriaPorId(draft.categoria, draft.subcategoriaPadre);
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

  return (
    <ReportarStepShell
      eyebrow="Reporte preparado"
      title="Tu reporte está listo"
      description="Revisa la información que quedó preparada en este dispositivo. Todavía no se ha enviado ni publicado."
    >
      <div className="reportar-confirmation-card">
        <CheckCircle2 size={42} aria-hidden="true" />
        <strong>Reporte preparado localmente</strong>
        <p>
          No se creó un registro en Supabase ni se subieron archivos. La marca de agua de
          publicación se aplicará únicamente cuando exista un envío real.
        </p>
      </div>

      <div className="reportar-confirmation-summary" aria-label="Resumen del reporte preparado">
        <article className="reportar-confirmation-summary-card">
          <span className="reportar-confirmation-summary-icon" aria-hidden="true">
            <CategoriaIcon size={22} />
          </span>
          <div>
            <span className="reportar-confirmation-summary-label">Tipo de reporte</span>
            <strong>{categoria?.label ?? "Categoría no disponible"}</strong>
            <small>{subcategoriaTexto}</small>
          </div>
        </article>

        <article className="reportar-confirmation-summary-card">
          <span className="reportar-confirmation-summary-icon" aria-hidden="true">
            <MapPin size={22} />
          </span>
          <div>
            <span className="reportar-confirmation-summary-label">Lugar del reporte</span>
            <strong>{territorioTexto}</strong>
            {contextoTexto && <small>Zona: {contextoTexto}</small>}
            {referencia && <small>Referencia: {referencia}</small>}
          </div>
        </article>

        {descripcion && (
          <article className="reportar-confirmation-summary-card reportar-confirmation-summary-card-wide">
            <span className="reportar-confirmation-summary-icon" aria-hidden="true">
              <Images size={22} />
            </span>
            <div>
              <span className="reportar-confirmation-summary-label">Descripción</span>
              <p className="reportar-confirmation-summary-quote">“{descripcion}”</p>
            </div>
          </article>
        )}

        <article className="reportar-confirmation-summary-card reportar-confirmation-summary-card-wide">
          <span className="reportar-confirmation-summary-icon" aria-hidden="true">
            <Clock3 size={22} />
          </span>
          <div>
            <span className="reportar-confirmation-summary-label">Preparación local</span>
            <strong>Reporte preparado el {formatearFecha(result.submittedAt)}</strong>
            <small>Esta fecha no representa la fecha del incidente.</small>
          </div>
        </article>

        <article className="reportar-confirmation-summary-card reportar-confirmation-summary-card-wide">
          <span className="reportar-confirmation-summary-icon" aria-hidden="true">
            <Images size={22} />
          </span>
          <div className="reportar-confirmation-evidence-content">
            <span className="reportar-confirmation-summary-label">Evidencias</span>
            {draft.evidencias.length > 0 ? (
              <ul
                className="reportar-confirmation-evidence-grid"
                aria-label="Evidencias del reporte"
              >
                {draft.evidencias.map((evidencia, index) => (
                  <li key={evidencia.id} className="reportar-confirmation-evidence">
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
                      {evidencia.tipo === "foto" ? <Camera size={14} /> : <Video size={14} />}
                      {evidencia.tipo === "foto" ? "Fotografía" : "Video"}
                      {evidencia.duracionSegundos ? ` · ${evidencia.duracionSegundos}s` : ""}
                    </span>
                    <small>{etiquetaFuente(evidencia)}</small>
                    {evidencia.fuente === "camara" && (
                      <small>Capturada el {formatearFecha(evidencia.capturadaEn)}</small>
                    )}
                  </li>
                ))}
              </ul>
            ) : draft.sinEvidencia ? (
              <div className="reportar-confirmation-empty-evidence">
                <strong>Sin evidencia fotográfica</strong>
                <span>{etiquetaMotivoSinEvidencia(draft.sinEvidencia.motivo)}</span>
                {draft.sinEvidencia.detalle.trim() && <small>{draft.sinEvidencia.detalle}</small>}
              </div>
            ) : (
              <div className="reportar-confirmation-empty-evidence">
                <strong>No se adjuntaron evidencias</strong>
                <span>La evidencia es opcional para este tipo de reporte.</span>
              </div>
            )}
          </div>
        </article>

        {gpsConfirmado && draft.ubicacion && (
          <article className="reportar-confirmation-summary-card reportar-confirmation-summary-card-wide">
            <span className="reportar-confirmation-summary-icon" aria-hidden="true">
              <MapIcon size={22} />
            </span>
            <div>
              <span className="reportar-confirmation-summary-label">Ubicación GPS</span>
              <strong>Ubicación GPS confirmada</strong>
              {draft.ubicacion.precision > 0 && (
                <small>Precisión aproximada: {Math.round(draft.ubicacion.precision)} m</small>
              )}
              <small className="reportar-confirmation-map-note">
                <MapPin size={14} /> Mapa pendiente de integración
              </small>
            </div>
          </article>
        )}
      </div>

      <div className="reportar-confirmation-note">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>
          La información y las evidencias permanecieron en este dispositivo durante el recorrido.
        </span>
      </div>

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

      <div className="reportar-step-actions">
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
    </ReportarStepShell>
  );
}
