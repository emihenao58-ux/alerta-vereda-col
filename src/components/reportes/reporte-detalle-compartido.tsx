import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  Hash,
  Image as ImageIcon,
  MapPin,
  Navigation,
  Tag,
  TriangleAlert,
  UserRound,
  Video,
} from "lucide-react";
import {
  EtiquetaProcedenciaAviso,
  type ProcedenciaAvisoPublica,
} from "@/components/reportes/etiqueta-procedencia-aviso";
import { EstadoPublicoChip } from "@/components/reportes/estado-publico";
import { FotoEvidenciaPublica } from "@/components/reportes/evidencia-publica";
import { InformacionPublicacion } from "@/components/reportes/metadatos-publicacion";
import { ReportarEvidencePreview } from "@/components/reportar/reportar-evidence-preview";
import { etiquetaTipoAvisoDe } from "@/lib/avisos-publicos";
import {
  categoriaConfig,
  etiquetaMotivoSinEvidencia,
  subcategoriaPorId,
} from "@/lib/reportar/catalogo";
import { etiquetaTipoLugar, territorioPorId } from "@/lib/reportar/mock-data";
import { condicionOperativaServicioDe, etiquetaTipoServicioDe } from "@/lib/servicios-publicos";
import { etiquetaCondicionViaDe } from "@/lib/vias-publicas";
import {
  ETIQUETAS_CATEGORIA_PUBLICA,
  ETIQUETAS_SEVERIDAD_PUBLICA,
  coordenadasPublicasDe,
  fechaHoraPublica,
  ilustracionPublicaDe,
  type EstadoPublico,
  type SeveridadPublica,
} from "@/lib/reportes-publicos";
import type { MiVeredaPublicacion } from "@/lib/mi-vereda-cartelera";
import type { ReporteLocal } from "@/lib/reportar/local-history";
import type { ReporteEvidencia } from "@/lib/reportar/types";

type ReporteDetallePublicoProps = {
  modo: "publico";
  publicacion: MiVeredaPublicacion;
  estado: EstadoPublico;
  fecha: string;
  fotoUrl: string | null;
  emergenciaSinVerificar: boolean;
  severidad: SeveridadPublica | null;
  ubicacion: string | null;
  procedenciaAviso: ProcedenciaAvisoPublica | null;
  navegacion: ReactNode;
};

type ReporteDetalleLocalProps = {
  modo: "local";
  reporte: ReporteLocal;
  onVolver: () => void;
};

type ReporteDetalleCompartidoProps = ReporteDetallePublicoProps | ReporteDetalleLocalProps;

type ReporteDetalleEstructuraProps = {
  navegacion: ReactNode;
  titulo: string;
  tituloId?: string;
  subtitulo: string;
  insigniaCategoria: ReactNode;
  insigniaEstado: ReactNode;
  aviso?: ReactNode;
  multimedia: ReactNode;
  notaMultimedia: string;
  hechos: ReactNode;
  metadatos?: ReactNode;
  descripcion?: ReactNode;
  notaUbicacion?: ReactNode;
};

export function ReporteDetalleCompartido(props: ReporteDetalleCompartidoProps) {
  if (props.modo === "publico") return <DetallePublico {...props} />;
  return <DetalleLocal {...props} />;
}

function ReporteDetalleEstructura({
  navegacion,
  titulo,
  tituloId,
  subtitulo,
  insigniaCategoria,
  insigniaEstado,
  aviso,
  multimedia,
  notaMultimedia,
  hechos,
  metadatos,
  descripcion,
  notaUbicacion,
}: ReporteDetalleEstructuraProps) {
  return (
    <div className="report-detail-page">
      {navegacion}

      <header className="report-detail-header">
        <div className="report-detail-heading-line">
          {insigniaCategoria}
          {insigniaEstado}
        </div>
        <h1 id={tituloId}>{titulo}</h1>
        <p className="report-detail-subtitle">{subtitulo}</p>
      </header>

      {aviso}

      <div className="report-detail-layout">
        <section className="report-detail-media-panel" aria-label="Evidencias del reporte">
          {multimedia}
          <p className="report-detail-media-note">{notaMultimedia}</p>
        </section>

        <section className="report-detail-info" aria-labelledby="report-detail-info-title">
          <div className="report-detail-info-heading">
            <p className="reportes-eyebrow">Información del reporte</p>
            <h2 id="report-detail-info-title">Lo que sabemos</h2>
          </div>

          <dl className="report-detail-facts">{hechos}</dl>

          {metadatos}
          {descripcion}
          {notaUbicacion}
        </section>
      </div>
    </div>
  );
}

function DetallePublico(props: ReporteDetallePublicoProps) {
  const {
    publicacion,
    estado,
    fecha,
    fotoUrl,
    emergenciaSinVerificar,
    severidad,
    ubicacion,
    procedenciaAviso,
    navegacion,
  } = props;

  return (
    <ReporteDetalleEstructura
      navegacion={navegacion}
      titulo={publicacion.titulo}
      subtitulo="Consulta pública de una publicación de AlertaVereda. El identificador público corto se incorporará cuando esté disponible el contrato de Supabase."
      insigniaCategoria={
        <span className={`report-detail-category report-detail-category-${publicacion.categoria}`}>
          {ETIQUETAS_CATEGORIA_PUBLICA[publicacion.categoria]}
        </span>
      }
      insigniaEstado={<EstadoPublicoChip estado={estado} />}
      aviso={
        <>
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
        </>
      }
      multimedia={
        fotoUrl ? (
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
        )
      }
      notaMultimedia={
        fotoUrl
          ? "Abre la fotografía para verla ampliada con una superposición contextual no destructiva."
          : "Esta ilustración representa la categoría y no corresponde a una evidencia ciudadana."
      }
      hechos={
        <>
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
              <dd>{etiquetaCondicionVia(publicacion)}</dd>
            </div>
          )}
          {publicacion.categoria === "servicio" && (
            <>
              <div>
                <dt>Tipo de servicio</dt>
                <dd>{etiquetaTipoServicio(publicacion)}</dd>
              </div>
              <div>
                <dt>Condición operativa</dt>
                <dd>{condicionOperativaServicio(publicacion)}</dd>
              </div>
            </>
          )}
          {publicacion.categoria === "aviso" && (
            <div>
              <dt>Tipo de aviso</dt>
              <dd>{etiquetaTipoAviso(publicacion)}</dd>
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
        </>
      }
      metadatos={
        publicacion.categoria === "emergencia" ? (
          <InformacionPublicacion publicadaEn={publicacion.created_at} />
        ) : undefined
      }
      descripcion={
        <div className="report-detail-description">
          <h3>Descripción</h3>
          <p>{publicacion.descripcion || "No hay una descripción adicional disponible."}</p>
        </div>
      }
      notaUbicacion={
        <div className="report-detail-location-note">
          <Navigation size={18} aria-hidden="true" />
          <p>
            Las coordenadas solo se muestran cuando existe una fuente geográfica válida y una
            autorización pública segura. No se han inventado coordenadas para este reporte.
          </p>
        </div>
      }
    />
  );
}

function etiquetaCondicionVia(publicacion: MiVeredaPublicacion) {
  return etiquetaCondicionViaDe(publicacion) ?? "No disponible";
}

function etiquetaTipoServicio(publicacion: MiVeredaPublicacion) {
  return etiquetaTipoServicioDe(publicacion.tipo);
}

function condicionOperativaServicio(publicacion: MiVeredaPublicacion) {
  return condicionOperativaServicioDe(publicacion) ?? "No disponible";
}

function etiquetaTipoAviso(publicacion: MiVeredaPublicacion) {
  return etiquetaTipoAvisoDe(publicacion.tipo) ?? "Tipo de aviso no disponible";
}

function DetalleLocal({ reporte, onVolver }: ReporteDetalleLocalProps) {
  const { datos } = reporte;
  const categoria = categoriaConfig(datos.categoria);
  const subcategoria = subcategoriaPorId(datos.categoria, datos.subcategoria);
  const territorio = territorioPorId(datos.territorioId);
  const titulo = subcategoria?.label ?? categoria?.label ?? "Reporte local";
  const categoriaVisual = datos.categoria === "otro" ? "aviso" : datos.categoria;
  const fecha = fechaHoraLocal(reporte.registradoEn);
  const ubicacion = ubicacionLocalValida(datos.ubicacion);
  const tipoLugar = datos.tipoLugar ? etiquetaTipoLugar(datos.tipoLugar) : null;
  const videosMencionados = datos.evidencias.filter(
    (evidencia) => evidencia.tipo === "video",
  ).length;
  const videosNoGuardados = Math.max(0, videosMencionados - reporte.videos.length);

  return (
    <ReporteDetalleEstructura
      navegacion={
        <button
          type="button"
          className="reportes-back-link border-0 bg-transparent p-0"
          style={{ fontFamily: "inherit", cursor: "pointer" }}
          onClick={onVolver}
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Volver a Mis reportes
        </button>
      }
      titulo={titulo}
      tituloId="reporte-detalle-local-title"
      subtitulo="Detalle de un reporte guardado localmente en este dispositivo."
      insigniaCategoria={
        <span className={`report-detail-category report-detail-category-${categoriaVisual}`}>
          {categoria?.label ?? datos.categoria}
        </span>
      }
      insigniaEstado={
        <span className="mis-reportes-card-status" data-status={reporte.estado}>
          <Clock3 size={14} strokeWidth={2.2} aria-hidden="true" />
          {reporte.estado}
        </span>
      }
      aviso={
        <aside className="mis-reportes-local-note" role="note">
          <span className="mis-reportes-local-note-icon" aria-hidden="true">
            <Clock3 size={19} strokeWidth={2.1} />
          </span>
          <div>
            <strong>Registro local de este dispositivo</strong>
            <p>
              El estado mostrado es local y no confirma recepción, publicación ni revisión o
              verificación oficial del reporte.
            </p>
          </div>
        </aside>
      }
      multimedia={
        <>
          <FotografiasLocales reporte={reporte} />
          <VideosLocales reporte={reporte} />
        </>
      }
      notaMultimedia={notaEvidencias(reporte)}
      hechos={
        <>
          <div>
            <dt>
              <Hash size={16} aria-hidden="true" /> Identificador local
            </dt>
            <dd>{reporte.id}</dd>
          </div>
          <div>
            <dt>
              <CalendarDays size={16} aria-hidden="true" /> Fecha y hora
            </dt>
            <dd>{fecha}</dd>
          </div>
          <div>
            <dt>
              <UserRound size={16} aria-hidden="true" /> Origen del reporte
            </dt>
            <dd>
              {reporte.origen === "jac"
                ? `JAC · ${reporte.identidadAdministrativa?.nombre ?? "Identidad no conservada en este registro anterior"}`
                : "Comunitario"}
            </dd>
          </div>
          <div>
            <dt>
              <MapPin size={16} aria-hidden="true" /> Vereda o lugar
            </dt>
            <dd>
              {[tipoLugar, territorio?.nombre ?? datos.territorioId].filter(Boolean).join(" · ")}
            </dd>
          </div>
          {subcategoria && (
            <div>
              <dt>
                <Tag size={16} aria-hidden="true" /> Categoría y tipo
              </dt>
              <dd>
                {categoria?.label ?? datos.categoria} · {subcategoria.label}
              </dd>
            </div>
          )}
          {datos.nombre.trim() && (
            <div>
              <dt>
                <UserRound size={16} aria-hidden="true" /> Nombre al reportar
              </dt>
              <dd>{datos.nombre}</dd>
            </div>
          )}
          {datos.lugar.trim() && (
            <div>
              <dt>
                <Navigation size={16} aria-hidden="true" /> Referencia
              </dt>
              <dd>{datos.lugar}</dd>
            </div>
          )}
          {ubicacion && (
            <>
              <div>
                <dt>
                  <Navigation size={16} aria-hidden="true" /> Coordenadas
                </dt>
                <dd>
                  Latitud: {ubicacion.latitud.toFixed(5)} · Longitud:{" "}
                  {ubicacion.longitud.toFixed(5)}
                </dd>
              </div>
              {Number.isFinite(ubicacion.precision) && (
                <div>
                  <dt>Precisión aproximada</dt>
                  <dd>{Math.round(ubicacion.precision)} m</dd>
                </div>
              )}
            </>
          )}
          <div>
            <dt>
              <ImageIcon size={16} aria-hidden="true" /> Evidencias
            </dt>
            <dd>
              {reporte.fotografias.length} fotografía(s) procesada(s) y {reporte.videos.length}{" "}
              video(s) optimizado(s) guardado(s). Los archivos originales no se conservan.
            </dd>
          </div>
          {videosNoGuardados > 0 && (
            <div>
              <dt>Video de un registro anterior</dt>
              <dd>
                Este registro contiene los datos del video, pero el archivo no se guardó con la
                versión anterior del historial.
              </dd>
            </div>
          )}
          {datos.sinEvidencia && (
            <div>
              <dt>Motivo sin evidencia</dt>
              <dd>
                {etiquetaMotivoSinEvidencia(datos.sinEvidencia.motivo)}
                {datos.sinEvidencia.detalle.trim() ? ` · ${datos.sinEvidencia.detalle}` : ""}
              </dd>
            </div>
          )}
        </>
      }
      descripcion={
        datos.descripcion.trim() ? (
          <div className="report-detail-description">
            <h3>Descripción</h3>
            <p>{datos.descripcion}</p>
          </div>
        ) : undefined
      }
      notaUbicacion={
        ubicacion ? (
          <div className="report-detail-location-note">
            <Navigation size={18} aria-hidden="true" />
            <p>
              El mapa comunitario de AlertaVereda está en preparación. Estas coordenadas se muestran
              desde el historial local y no se envían a servicios de mapas externos.
            </p>
          </div>
        ) : undefined
      }
    />
  );
}

function FotografiasLocales({ reporte }: { reporte: ReporteLocal }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [fotografiaAbiertaId, setFotografiaAbiertaId] = useState<string | null>(null);

  useEffect(() => {
    const urlsTemporales: Record<string, string> = {};
    if (typeof URL.createObjectURL === "function") {
      reporte.fotografias.forEach((foto) => {
        try {
          urlsTemporales[foto.evidenciaId] = URL.createObjectURL(foto.archivo);
        } catch {
          // El registro sigue en IndexedDB aunque esta sesión no pueda crear su vista temporal.
        }
      });
    }
    setUrls(urlsTemporales);
    return () => Object.values(urlsTemporales).forEach((url) => URL.revokeObjectURL(url));
  }, [reporte.fotografias]);

  const fotografiaSeleccionada = reporte.fotografias.find(
    (foto) => foto.evidenciaId === fotografiaAbiertaId,
  );
  const metadataSeleccionada = reporte.datos.evidencias.find(
    (evidencia) => evidencia.id === fotografiaAbiertaId,
  );
  const urlSeleccionada = fotografiaAbiertaId ? urls[fotografiaAbiertaId] : null;
  const evidenciaVisualizada = useMemo<ReporteEvidencia | null>(() => {
    if (!fotografiaSeleccionada || !urlSeleccionada) return null;
    return {
      id: fotografiaSeleccionada.evidenciaId,
      tipo: "foto",
      archivo: new File([fotografiaSeleccionada.archivo], "fotografia-procesada-local", {
        type: fotografiaSeleccionada.tipoMime,
      }),
      previewUrl: urlSeleccionada,
      fuente: metadataSeleccionada?.fuente ?? "galeria",
      procesamiento: fotografiaSeleccionada.procesamiento,
      dimensiones: metadataSeleccionada?.dimensiones ?? null,
      capturadaEn: metadataSeleccionada?.capturadaEn ?? null,
      incorporadaEn: metadataSeleccionada?.incorporadaEn ?? reporte.registradoEn,
    };
  }, [fotografiaSeleccionada, metadataSeleccionada, reporte.registradoEn, urlSeleccionada]);

  const primeraFotografia = reporte.fotografias[0];
  const primeraUrl = primeraFotografia ? urls[primeraFotografia.evidenciaId] : null;
  const otrasFotografias = reporte.fotografias.slice(1);

  return (
    <>
      {reporte.fotografias.length === 0 ? (
        reporte.videos.length === 0 ? (
          <div
            className="report-detail-fallback-media"
            role="img"
            aria-label="Este reporte no tiene fotografías procesadas"
          >
            <ImageIcon size={42} strokeWidth={1.7} aria-hidden="true" />
            <p>Este reporte no tiene fotografías procesadas guardadas.</p>
          </div>
        ) : null
      ) : primeraFotografia && primeraUrl ? (
        <>
          <div className="reporte-evidencia-frame">
            <button
              type="button"
              className="reporte-evidencia-trigger"
              style={{ cursor: "zoom-in" }}
              onClick={() => setFotografiaAbiertaId(primeraFotografia.evidenciaId)}
              aria-label="Ampliar fotografía 1"
            >
              <img
                src={primeraUrl}
                alt="Fotografía procesada del reporte guardado localmente"
                className="reporte-evidencia-photo"
                decoding="async"
              />
            </button>
          </div>
          {otrasFotografias.length > 0 && (
            <section
              className="mis-reportes-local-photos"
              aria-label="Otras fotografías procesadas"
            >
              <h3>Otras fotografías procesadas ({otrasFotografias.length})</h3>
              <div className="mis-reportes-local-photo-grid">
                {otrasFotografias.map((foto, index) => {
                  const url = urls[foto.evidenciaId];
                  return url ? (
                    <button
                      key={foto.evidenciaId}
                      type="button"
                      className="mis-reportes-local-photo"
                      aria-label={`Ampliar fotografía ${index + 2}`}
                      onClick={() => setFotografiaAbiertaId(foto.evidenciaId)}
                    >
                      <img src={url} alt="" />
                      <span>Ampliar foto {index + 2}</span>
                    </button>
                  ) : null;
                })}
              </div>
            </section>
          )}
        </>
      ) : (
        <div className="report-detail-fallback-media" role="status">
          <ImageIcon size={42} strokeWidth={1.7} aria-hidden="true" />
          <p>Preparando las fotografías guardadas en este dispositivo…</p>
        </div>
      )}
      {evidenciaVisualizada && (
        <ReportarEvidencePreview
          evidencia={evidenciaVisualizada}
          onClose={() => setFotografiaAbiertaId(null)}
        />
      )}
    </>
  );
}

function VideosLocales({ reporte }: { reporte: ReporteLocal }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [videoAbiertoId, setVideoAbiertoId] = useState<string | null>(null);

  useEffect(() => {
    const urlsTemporales: Record<string, string> = {};
    if (typeof URL.createObjectURL === "function") {
      reporte.videos.forEach((video) => {
        try {
          urlsTemporales[video.evidenciaId] = URL.createObjectURL(video.archivo);
        } catch {
          // La evidencia permanece guardada aunque no pueda generarse una URL temporal.
        }
      });
    }
    setUrls(urlsTemporales);
    return () => Object.values(urlsTemporales).forEach((url) => URL.revokeObjectURL(url));
  }, [reporte.videos]);

  const videoSeleccionado = reporte.videos.find((video) => video.evidenciaId === videoAbiertoId);
  const metadataSeleccionada = reporte.datos.evidencias.find(
    (evidencia) => evidencia.id === videoAbiertoId,
  );
  const urlSeleccionada = videoAbiertoId ? urls[videoAbiertoId] : null;
  const evidenciaVisualizada = useMemo<ReporteEvidencia | null>(() => {
    if (!videoSeleccionado || !urlSeleccionada) return null;
    return {
      id: videoSeleccionado.evidenciaId,
      tipo: "video",
      archivo: new File([videoSeleccionado.archivo], "video-optimizado-local", {
        type: videoSeleccionado.tipoMime,
      }),
      previewUrl: urlSeleccionada,
      fuente: metadataSeleccionada?.fuente ?? "galeria",
      procesamiento: "procesada",
      dimensiones: metadataSeleccionada?.dimensiones ?? videoSeleccionado.dimensiones,
      capturadaEn: metadataSeleccionada?.capturadaEn ?? null,
      incorporadaEn: metadataSeleccionada?.incorporadaEn ?? reporte.registradoEn,
      duracionSegundos: videoSeleccionado.duracionSegundos,
    };
  }, [metadataSeleccionada, reporte.registradoEn, urlSeleccionada, videoSeleccionado]);

  return (
    <>
      {reporte.videos.length > 0 && (
        <section className="mis-reportes-local-photos" aria-label="Videos optimizados">
          <h3>Videos optimizados ({reporte.videos.length})</h3>
          <div className="mis-reportes-local-photo-grid">
            {reporte.videos.map((video, index) =>
              urls[video.evidenciaId] ? (
                <button
                  key={video.evidenciaId}
                  type="button"
                  className="mis-reportes-local-photo"
                  style={{ display: "grid", placeItems: "center", color: "var(--bosque)" }}
                  aria-label={`Reproducir video ${index + 1}`}
                  onClick={() => setVideoAbiertoId(video.evidenciaId)}
                >
                  <Video size={35} strokeWidth={1.8} aria-hidden="true" />
                  <span>Reproducir video {index + 1}</span>
                </button>
              ) : null,
            )}
          </div>
        </section>
      )}
      {evidenciaVisualizada && (
        <ReportarEvidencePreview
          evidencia={evidenciaVisualizada}
          onClose={() => setVideoAbiertoId(null)}
        />
      )}
    </>
  );
}

function notaEvidencias(reporte: ReporteLocal) {
  if (reporte.fotografias.length > 0 || reporte.videos.length > 0) {
    return "Las fotografías procesadas y los videos optimizados se conservan en IndexedDB de este dispositivo. Abre una evidencia para verla o reproducirla; los archivos originales no se guardan.";
  }
  if (reporte.datos.evidencias.length > 0) {
    return "El historial conserva los metadatos de evidencia, pero no hay archivos multimedia procesados guardados para mostrar.";
  }
  return "Este registro local no tiene fotografías o videos procesados guardados.";
}

function fechaHoraLocal(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleString("es-CO", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ubicacionLocalValida(
  value: ReporteLocal["datos"]["ubicacion"],
): ReporteLocal["datos"]["ubicacion"] {
  if (!value) return null;
  if (
    !Number.isFinite(value.latitud) ||
    !Number.isFinite(value.longitud) ||
    value.latitud < -90 ||
    value.latitud > 90 ||
    value.longitud < -180 ||
    value.longitud > 180
  ) {
    return null;
  }
  return value;
}
