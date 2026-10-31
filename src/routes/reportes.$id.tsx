import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, MapPin, Navigation, TriangleAlert } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  EtiquetaProcedenciaAviso,
  type ProcedenciaAvisoPublica,
} from "@/components/reportes/etiqueta-procedencia-aviso";
import { EstadoPublicoChip } from "@/components/reportes/estado-publico";
import { FotoEvidenciaPublica } from "@/components/reportes/evidencia-publica";
import { InformacionPublicacion } from "@/components/reportes/metadatos-publicacion";
import { Vacio } from "@/components/carta";
import { URL_FOTO } from "@/lib/alerta";
import { estadoGeneralAvisoDe, etiquetaTipoAvisoDe } from "@/lib/avisos-publicos";
import { normalizarOrigenListaReporte, ORIGENES_LISTA_REPORTE } from "@/lib/reportes-navegacion";
import {
  estadoGeneralViaDe,
  esPublicacionViasPublica,
  etiquetaCondicionViaDe,
} from "@/lib/vias-publicas";
import {
  ETIQUETAS_CATEGORIA_PUBLICA,
  coordenadasPublicasDe,
  esEmergenciaEnRevision,
  estadoPublicoDe,
  fechaHoraPublica,
  ilustracionPublicaDe,
  severidadPublicaDe,
  ETIQUETAS_SEVERIDAD_PUBLICA,
  consultarReportePublicoPorId,
} from "@/lib/reportes-publicos";
import {
  condicionOperativaServicioDe,
  etiquetaTipoServicioDe,
  estadoGeneralServicioDe,
} from "@/lib/servicios-publicos";

export const Route = createFileRoute("/reportes/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    origen: normalizarOrigenListaReporte(search["origen"]),
  }),
  head: () => ({
    meta: [
      { title: "Detalle del reporte · AlertaVereda" },
      {
        name: "description",
        content: "Consulta el detalle de un reporte público de AlertaVereda.",
      },
    ],
  }),
  component: ReporteDetalle,
});

function ReporteDetalle() {
  const { id } = Route.useParams();
  const { origen } = Route.useSearch();
  const retorno = ORIGENES_LISTA_REPORTE[origen];
  const reporte = useQuery({
    queryKey: ["reporte-publico-detalle", id],
    queryFn: () => consultarReportePublicoPorId(decodeURIComponent(id)),
  });

  if (reporte.isLoading) {
    return (
      <AppShell wide>
        <Vacio texto="Cargando el detalle del reporte…" />
      </AppShell>
    );
  }

  if (reporte.isError) {
    return (
      <AppShell wide>
        <div className="report-detail-message" role="alert">
          No pudimos consultar este reporte. Revisa la conexión e inténtalo nuevamente.
        </div>
      </AppShell>
    );
  }

  if (!reporte.data) {
    return (
      <AppShell wide>
        <div className="report-detail-message">
          <h1>Reporte no disponible</h1>
          <p>
            Este reporte no existe, fue retirado de la consulta pública o ya no está disponible.
          </p>
          <Link to={retorno.ruta} className="report-detail-back-button">
            <ArrowLeft size={17} aria-hidden="true" /> {retorno.etiqueta}
          </Link>
        </div>
      </AppShell>
    );
  }

  const publicacion = reporte.data;
  const estado =
    publicacion.categoria === "via"
      ? esPublicacionViasPublica(publicacion)
        ? estadoGeneralViaDe(publicacion)
        : null
      : publicacion.categoria === "servicio"
        ? estadoGeneralServicioDe(publicacion)
        : publicacion.categoria === "aviso"
          ? estadoGeneralAvisoDe(publicacion)
          : estadoPublicoDe(publicacion);
  if (!estado) {
    return (
      <AppShell wide>
        <div className="report-detail-message">
          Este reporte no está disponible para consulta pública.
        </div>
      </AppShell>
    );
  }

  const fecha = publicacion.fecha_evento ?? publicacion.created_at;
  const fotoUrl = URL_FOTO(publicacion.foto_url);
  const emergenciaSinVerificar = esEmergenciaEnRevision(publicacion);
  const severidad = severidadPublicaDe(publicacion);
  const ubicacion = publicacion.vereda_nombre ?? publicacion.lugar;
  const procedenciaAviso: ProcedenciaAvisoPublica | null = null;

  return (
    <AppShell wide>
      <div className="report-detail-page">
        <Link to={retorno.ruta} className="reportes-back-link">
          <ArrowLeft size={17} aria-hidden="true" />
          {retorno.etiqueta}
        </Link>

        <header className="report-detail-header">
          <div className="report-detail-heading-line">
            <span
              className={`report-detail-category report-detail-category-${publicacion.categoria}`}
            >
              {ETIQUETAS_CATEGORIA_PUBLICA[publicacion.categoria]}
            </span>
            <EstadoPublicoChip estado={estado} />
          </div>
          <h1>{publicacion.titulo}</h1>
          <p className="report-detail-subtitle">
            Consulta pública de una publicación de AlertaVereda. El identificador público corto se
            incorporará cuando esté disponible el contrato de Supabase.
          </p>
        </header>

        {publicacion.categoria === "aviso" && (
          <EtiquetaProcedenciaAviso procedencia={procedenciaAviso} />
        )}

        {emergenciaSinVerificar && (
          <aside className="report-detail-unverified" role="note">
            <TriangleAlert size={19} aria-hidden="true" />
            <div>
              <strong>Emergencia no verificada</strong>
              <p>La información aún no ha sido confirmada oficialmente. Actúa con precaución.</p>
            </div>
          </aside>
        )}

        <div className="report-detail-layout">
          <section className="report-detail-media-panel" aria-label="Evidencias del reporte">
            {fotoUrl ? (
              <FotoEvidenciaPublica
                src={emergenciaSinVerificar ? null : fotoUrl}
                alt={`Evidencia fotográfica de ${publicacion.titulo}`}
                contexto={{
                  vereda: publicacion.vereda_nombre,
                  tomadaEn: publicacion.capturado_en ?? null,
                  publicadaEn: publicacion.created_at,
                  coordenadas: coordenadasPublicasDe(publicacion),
                }}
                emergenciaSinVerificar={emergenciaSinVerificar}
              />
            ) : (
              <div className="report-detail-fallback-media">
                <img src={ilustracionPublicaDe(publicacion)} alt="" />
                <p>Ilustración representativa · este reporte no tiene evidencias adjuntas.</p>
              </div>
            )}
            <p className="report-detail-media-note">
              {fotoUrl
                ? "Abre la fotografía para verla ampliada con una superposición contextual no destructiva."
                : "Esta ilustración representa la categoría y no corresponde a una evidencia ciudadana."}
            </p>
          </section>

          <section className="report-detail-info" aria-labelledby="report-detail-info-title">
            <div className="report-detail-info-heading">
              <p className="reportes-eyebrow">Información del reporte</p>
              <h2 id="report-detail-info-title">Lo que sabemos</h2>
            </div>

            <dl className="report-detail-facts">
              <div>
                <dt>
                  <MapPin size={16} aria-hidden="true" /> Vereda o lugar
                </dt>
                <dd>{ubicacion ?? "Ubicación no disponible"}</dd>
              </div>
              <div>
                <dt>
                  <CalendarDays size={16} aria-hidden="true" /> Fecha y hora
                </dt>
                <dd>{fechaHoraPublica(fecha)}</dd>
              </div>
              {publicacion.lugar && publicacion.vereda_nombre && (
                <div>
                  <dt>
                    <Navigation size={16} aria-hidden="true" /> Referencia
                  </dt>
                  <dd>{publicacion.lugar}</dd>
                </div>
              )}
              {publicacion.categoria === "via" && (
                <div>
                  <dt>Condición de la vía</dt>
                  <dd>{etiquetaCondicionViaDe(publicacion) ?? "No disponible"}</dd>
                </div>
              )}
              {publicacion.categoria === "servicio" && (
                <>
                  <div>
                    <dt>Tipo de servicio</dt>
                    <dd>{etiquetaTipoServicioDe(publicacion.tipo)}</dd>
                  </div>
                  <div>
                    <dt>Condición operativa</dt>
                    <dd>{condicionOperativaServicioDe(publicacion) ?? "No disponible"}</dd>
                  </div>
                </>
              )}
              {publicacion.categoria === "aviso" && (
                <div>
                  <dt>Tipo de aviso</dt>
                  <dd>{etiquetaTipoAvisoDe(publicacion.tipo) ?? "Tipo de aviso no disponible"}</dd>
                </div>
              )}
              {severidad && (
                <div>
                  <dt>Severidad</dt>
                  <dd>
                    <span className={`reporte-severidad-chip reporte-severidad-${severidad}`}>
                      <span aria-hidden="true" className="reporte-severidad-dot" />
                      {ETIQUETAS_SEVERIDAD_PUBLICA[severidad]}
                    </span>
                  </dd>
                </div>
              )}
            </dl>

            {publicacion.categoria === "emergencia" && (
              <InformacionPublicacion publicadaEn={publicacion.created_at} />
            )}

            <div className="report-detail-description">
              <h3>Descripción</h3>
              <p>{publicacion.descripcion || "No hay una descripción adicional disponible."}</p>
            </div>

            <div className="report-detail-location-note">
              <Navigation size={18} aria-hidden="true" />
              <p>
                Las coordenadas solo se muestran cuando existe una fuente geográfica válida y una
                autorización pública segura. No se han inventado coordenadas para este reporte.
              </p>
            </div>
          </section>
        </div>
      </div>
    </AppShell>
  );
}
