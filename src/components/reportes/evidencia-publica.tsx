import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, Eye, X } from "lucide-react";

type ContextoEvidencia = {
  vereda: string | null;
  /** Momento real de captura, si el contrato lo entrega y es verificable. */
  tomadaEn: string | null;
  /** Momento real de publicación/recepción del reporte. */
  publicadaEn: string | null;
  coordenadas: { latitud: number; longitud: number } | null;
};

type FotoEvidenciaPublicaProps = {
  /** URL de un derivado público autorizado; nunca debe ser el original protegido. */
  src: string | null;
  alt: string;
  contexto: ContextoEvidencia;
  emergenciaSinVerificar?: boolean;
  mostrarMarcaEnVisor?: boolean;
  compacta?: boolean;
};

export function FotoEvidenciaPublica({
  src,
  alt,
  contexto,
  emergenciaSinVerificar = false,
  mostrarMarcaEnVisor = true,
  compacta = false,
}: FotoEvidenciaPublicaProps) {
  const [mostrarAdvertencia, setMostrarAdvertencia] = useState(false);
  const [visorAbierto, setVisorAbierto] = useState(false);
  const [revelada, setRevelada] = useState(!emergenciaSinVerificar);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const focoAntesDeVisor = useRef<HTMLElement | null>(null);
  const dialogTitleId = useId();
  const viewerTitleId = useId();

  useEffect(() => {
    if (!mostrarAdvertencia) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMostrarAdvertencia(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mostrarAdvertencia]);

  useEffect(() => {
    if (!visorAbierto) return;

    const focoAnterior = focoAntesDeVisor.current;
    const overflowAnterior = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setVisorAbierto(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflowAnterior;
      focoAnterior?.focus();
    };
  }, [visorAbierto]);

  const protegida = emergenciaSinVerificar && !revelada;
  const puedeRevelar = Boolean(src);
  const puedeAbrirVisor = Boolean(src) && (!emergenciaSinVerificar || revelada);

  const abrirVisor = () => {
    if (!src) return;
    focoAntesDeVisor.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setVisorAbierto(true);
  };

  const manejarClickFotografia = () => {
    if (emergenciaSinVerificar && !revelada) {
      setMostrarAdvertencia(true);
      return;
    }
    abrirVisor();
  };

  const contenido = (
    <>
      {src ? (
        <img
          src={src}
          alt={alt}
          className={`reporte-evidencia-photo ${protegida ? "reporte-evidencia-photo-blurred" : ""}`}
          loading={compacta ? "lazy" : "eager"}
          decoding="async"
        />
      ) : (
        <div className="reporte-evidencia-placeholder" role="img" aria-label="Evidencia protegida">
          <AlertTriangle size={26} aria-hidden="true" />
          <span>Evidencia protegida</span>
        </div>
      )}
    </>
  );

  return (
    <div className={`reporte-evidencia-frame ${compacta ? "reporte-evidencia-frame-compact" : ""}`}>
      <button
        type="button"
        className="reporte-evidencia-trigger"
        onClick={manejarClickFotografia}
        aria-label={
          protegida
            ? "Leer advertencia antes de ver la fotografía"
            : `Abrir fotografía ampliada: ${alt}`
        }
      >
        {contenido}
      </button>

      {mostrarAdvertencia &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="reporte-evidence-dialog-backdrop" role="presentation">
            <section
              className="reporte-evidence-dialog"
              role="dialog"
              aria-modal="true"
              aria-labelledby={dialogTitleId}
            >
              <button
                type="button"
                className="reporte-evidence-dialog-close"
                onClick={() => setMostrarAdvertencia(false)}
                aria-label="Cerrar advertencia"
              >
                <X size={18} aria-hidden="true" />
              </button>
              <div className="reporte-evidence-dialog-icon" aria-hidden="true">
                <AlertTriangle size={24} />
              </div>
              <p className="reporte-evidence-dialog-kicker">Antes de ver la imagen</p>
              <h3 id={dialogTitleId}>Emergencia aún no verificada</h3>
              <p>
                La información todavía no ha sido verificada. La imagen podría contener contenido
                sensible o impactante.
              </p>
              {!puedeRevelar && (
                <p className="reporte-evidence-dialog-limit">
                  La imagen original permanece protegida hasta que exista una copia pública segura.
                </p>
              )}
              <div className="reporte-evidence-dialog-actions">
                <button
                  type="button"
                  className="reporte-evidence-dialog-primary"
                  onClick={() => {
                    if (!puedeRevelar) return;
                    setRevelada(true);
                    setMostrarAdvertencia(false);
                    abrirVisor();
                  }}
                  disabled={!puedeRevelar}
                >
                  <Eye size={16} aria-hidden="true" /> Ver imagen
                </button>
                <button
                  type="button"
                  className="reporte-evidence-dialog-secondary"
                  onClick={() => setMostrarAdvertencia(false)}
                >
                  Volver
                </button>
              </div>
            </section>
          </div>,
          document.body,
        )}

      {visorAbierto &&
        src &&
        puedeAbrirVisor &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="reporte-evidence-viewer-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setVisorAbierto(false);
            }}
          >
            <section
              className="reporte-evidence-viewer"
              role="dialog"
              aria-modal="true"
              aria-labelledby={viewerTitleId}
            >
              <div className="reporte-evidence-viewer-toolbar">
                <p id={viewerTitleId}>Fotografía de evidencia</p>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className="reporte-evidence-viewer-close"
                  onClick={() => setVisorAbierto(false)}
                  aria-label="Cerrar visor de fotografía"
                >
                  <X size={20} aria-hidden="true" />
                </button>
              </div>
              <div className="reporte-evidence-viewer-media">
                <img src={src} alt={alt} />
                {mostrarMarcaEnVisor && <MarcaAguaFoto contexto={contexto} />}
              </div>
              <p className="reporte-evidence-viewer-note">
                La marca de agua es una superposición visual y no modifica la fotografía original.
              </p>
            </section>
          </div>,
          document.body,
        )}
    </div>
  );
}

function momentosContexto(contexto: ContextoEvidencia) {
  const tomada = formatearMomento(contexto.tomadaEn);
  const publicada = formatearMomento(contexto.publicadaEn);
  const mismaFecha =
    contexto.tomadaEn &&
    contexto.publicadaEn &&
    new Date(contexto.tomadaEn).getTime() === new Date(contexto.publicadaEn).getTime();

  if (mismaFecha && tomada) return [`Tomada y publicada: ${tomada}`];
  return [tomada ? `Tomada: ${tomada}` : null, publicada ? `Publicada: ${publicada}` : null].filter(
    (item): item is string => Boolean(item),
  );
}

function formatearMomento(valor: string | null) {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(fecha);
}

function formatearCoordenadas(coordenadas: { latitud: number; longitud: number }) {
  return `Latitud: ${coordenadas.latitud.toFixed(5)} · Longitud: ${coordenadas.longitud.toFixed(5)}`;
}

function MarcaAguaFoto({ contexto }: { contexto: ContextoEvidencia }) {
  const momentos = momentosContexto(contexto);
  const vereda = contexto.vereda?.trim();
  const coordenadas = contexto.coordenadas ? formatearCoordenadas(contexto.coordenadas) : null;

  return (
    <>
      <div className="reporte-watermark-photo-brand" aria-hidden="true">
        <img src="/images/branding/alertavereda-icono.png" alt="" />
        <span>AlertaVereda</span>
      </div>
      {(vereda || momentos.length > 0) && (
        <div className="reporte-watermark-photo-context" aria-hidden="true">
          {vereda && <span>Vereda: {vereda}</span>}
          {momentos.map((momento) => (
            <span key={momento}>{momento}</span>
          ))}
          {coordenadas && <span>{coordenadas}</span>}
        </div>
      )}
    </>
  );
}

type VideoEvidenciaPublicaProps = {
  src: string;
  contexto: ContextoEvidencia;
  poster?: string;
};

/**
 * Reproductor preparado para el contrato futuro de video. No se monta mientras
 * la cartelera no entregue una URL de video persistente.
 */
export function VideoEvidenciaPublica({ src, contexto, poster }: VideoEvidenciaPublicaProps) {
  const [duracion, setDuracion] = useState(0);
  const [tiempo, setTiempo] = useState(0);
  const [finalizado, setFinalizado] = useState(false);
  const mostrarFranjaFinal = finalizado || (duracion > 2 && tiempo >= duracion - 2);

  return (
    <div className="reporte-video-frame">
      <video
        className="reporte-video-player"
        controls
        preload="metadata"
        poster={poster}
        src={src}
        onLoadedMetadata={(event) => setDuracion(event.currentTarget.duration)}
        onTimeUpdate={(event) => {
          setTiempo(event.currentTarget.currentTime);
          setFinalizado(false);
        }}
        onEnded={() => setFinalizado(true)}
      />
      <div className="reporte-watermark-video-brand" aria-hidden="true">
        <img src="/images/branding/alertavereda-icono.png" alt="" />
      </div>
      {mostrarFranjaFinal && (
        <div className="reporte-watermark-video-context" aria-live="polite">
          <Check size={16} aria-hidden="true" />
          {contexto.vereda && <span>Vereda: {contexto.vereda}</span>}
          {momentosContexto(contexto).map((momento) => (
            <span key={momento}>{momento}</span>
          ))}
          {contexto.coordenadas && <span>{formatearCoordenadas(contexto.coordenadas)}</span>}
        </div>
      )}
    </div>
  );
}
