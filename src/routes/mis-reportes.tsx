import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronRight,
  ClipboardList,
  Clock3,
  Image as ImageIcon,
  Info,
  MapPin,
  UserRound,
  Video,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ModuleSectionHeading } from "@/components/module-section-heading";
import { ReporteDetalleCompartido } from "@/components/reportes/reporte-detalle-compartido";
import { usePerfilLocal } from "@/hooks/use-perfil-local";
import { useReportesLocales } from "@/hooks/use-reportes-locales";
import { categoriaConfig, subcategoriaPorId } from "@/lib/reportar/catalogo";
import { etiquetaTipoLugar, territorioPorId } from "@/lib/reportar/mock-data";
import type { EstadoReporteLocal, ReporteLocal } from "@/lib/reportar/local-history";

type EstadoReporte = EstadoReporteLocal;

export const Route = createFileRoute("/mis-reportes")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(search["demo"] === 1 || search["demo"] === "1" ? { demo: 1 as const } : {}),
  }),
  component: MisReportesPage,
});

function MisReportesPage() {
  const { demo } = Route.useSearch();
  const { perfil } = usePerfilLocal();
  const { reportes, cargando, error, recargar } = useReportesLocales();
  const mostrarDemostracion = import.meta.env.DEV && demo === 1;
  const nombrePerfil = perfil
    ? [perfil.nombre, perfil.apellido].filter(Boolean).join(" ")
    : "Perfil local";
  const [reporteSeleccionadoId, setReporteSeleccionadoId] = useState<string | null>(null);
  const reporteSeleccionado =
    reportes.find((reporte) => reporte.id === reporteSeleccionadoId) ?? null;
  const posicionListaRef = useRef<number | null>(null);
  const tarjetaOrigenRef = useRef<HTMLButtonElement | null>(null);

  useLayoutEffect(() => {
    if (reporteSeleccionadoId) {
      window.scrollTo({ top: 0, behavior: "auto" });
      return;
    }
    if (posicionListaRef.current !== null) {
      const posicionLista = posicionListaRef.current;
      posicionListaRef.current = null;
      tarjetaOrigenRef.current?.focus({ preventScroll: true });
      const timeout = window.setTimeout(() => {
        window.scrollTo({ top: posicionLista, behavior: "instant" as ScrollBehavior });
      }, 50);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [reporteSeleccionadoId]);

  useEffect(() => {
    if (
      reporteSeleccionadoId &&
      !reportes.some((reporte) => reporte.id === reporteSeleccionadoId)
    ) {
      setReporteSeleccionadoId(null);
    }
  }, [reporteSeleccionadoId, reportes]);

  const abrirDetalle = (id: string, posicion: number, tarjeta: HTMLButtonElement) => {
    posicionListaRef.current = posicion;
    tarjetaOrigenRef.current = tarjeta;
    setReporteSeleccionadoId(id);
  };

  const volverALista = () => setReporteSeleccionadoId(null);

  return (
    <AppShell>
      <section
        className="mis-reportes-page"
        aria-labelledby={
          reporteSeleccionado ? "reporte-detalle-local-title" : "m4-section-heading-title"
        }
      >
        <div hidden={Boolean(reporteSeleccionado)} aria-hidden={Boolean(reporteSeleccionado)}>
          <ModuleSectionHeading title="Mis reportes" />
          <section className="mis-reportes-identidad" aria-label="Identificación del usuario">
            <span className="mis-reportes-identidad-icon" aria-hidden="true">
              <UserRound size={31} strokeWidth={1.9} />
            </span>
            <div className="mis-reportes-identidad-copy">
              <h2>{nombrePerfil}</h2>
              <p>Tus reportes registrados en este dispositivo</p>
            </div>
          </section>

          {mostrarDemostracion ? (
            <>
              <aside className="mis-reportes-demo-notice" role="note">
                <strong>Demostración de diseño</strong>
                <p>
                  La tarjeta siguiente es ilustrativa y no representa un reporte real ni forma parte
                  de tu historial.
                </p>
              </aside>
              <DemoReportCard />
            </>
          ) : (
            <>
              {cargando && <p role="status">Consultando el historial de este dispositivo…</p>}
              {error && (
                <div className="mis-reportes-local-note" role="alert">
                  <p>{error} No se han borrado tus reportes.</p>
                  <button
                    type="button"
                    className="reportar-text-button"
                    onClick={() => void recargar()}
                  >
                    Reintentar
                  </button>
                </div>
              )}
              {reportes.map((reporte) => (
                <LocalReportCard key={reporte.id} reporte={reporte} onOpen={abrirDetalle} />
              ))}
              {!cargando && !error && reportes.length === 0 && (
                <section
                  className="mis-reportes-empty"
                  role="status"
                  aria-labelledby="mis-reportes-empty-title"
                >
                  <span className="mis-reportes-empty-icon" aria-hidden="true">
                    <ClipboardList size={29} strokeWidth={1.9} />
                  </span>
                  <div>
                    <h2 id="mis-reportes-empty-title">Aún no hay reportes para mostrar</h2>
                    <p>
                      Cuando confirmes un reporte, sus datos aparecerán aquí, guardados en este
                      dispositivo.
                    </p>
                  </div>
                </section>
              )}
            </>
          )}

          <aside className="mis-reportes-local-note">
            <span className="mis-reportes-local-note-icon" aria-hidden="true">
              <Info size={20} strokeWidth={2.1} />
            </span>
            <p>
              Este historial se conserva solo en este dispositivo y no confirma recepción ni
              publicación en un servidor. Se conservan las fotografías y los videos procesados; los
              archivos originales no se guardan. Si borras los datos del navegador, desinstalas la
              aplicación o cambias de dispositivo, podrías perderlo; aún no hay respaldo disponible.
            </p>
          </aside>
        </div>

        {reporteSeleccionado && (
          <ReporteDetalleCompartido
            modo="local"
            reporte={reporteSeleccionado}
            onVolver={volverALista}
          />
        )}
      </section>
    </AppShell>
  );
}

function LocalReportCard({
  reporte,
  onOpen,
}: {
  reporte: ReporteLocal;
  onOpen: (id: string, posicion: number, tarjeta: HTMLButtonElement) => void;
}) {
  const [urlsFotografias, setUrlsFotografias] = useState<Record<string, string>>({});
  const posicionAntesDeAbrirRef = useRef<number | null>(null);
  const { datos } = reporte;

  useEffect(() => {
    const urls: Record<string, string> = {};
    const fotografiasNecesarias = reporte.fotografias.slice(0, 1);
    if (typeof URL.createObjectURL === "function") {
      fotografiasNecesarias.forEach((foto) => {
        try {
          urls[foto.evidenciaId] = URL.createObjectURL(foto.archivo);
        } catch {
          // El registro permanece guardado aunque el navegador no pueda crear una vista temporal.
        }
      });
    }
    setUrlsFotografias(urls);
    return () => Object.values(urls).forEach((url) => URL.revokeObjectURL(url));
  }, [reporte.fotografias]);

  const categoria = categoriaConfig(datos.categoria);
  const subcategoria = subcategoriaPorId(datos.categoria, datos.subcategoria);
  const titulo = subcategoria?.label ?? categoria?.label ?? "Reporte local";
  const territorio = territorioPorId(datos.territorioId);
  const fecha = fechaHoraLocal(reporte.registradoEn);
  const primeraFotografia = reporte.fotografias[0];
  const tieneVideo = reporte.videos.length > 0;
  const primeraFotografiaUrl = primeraFotografia
    ? urlsFotografias[primeraFotografia.evidenciaId]
    : null;

  return (
    <article aria-label={`Reporte local: ${titulo}`}>
      <button
        type="button"
        className="mis-reportes-card w-full text-left"
        onPointerDown={() => {
          posicionAntesDeAbrirRef.current = window.scrollY;
        }}
        onClick={(event) => {
          const posicion = posicionAntesDeAbrirRef.current ?? window.scrollY;
          posicionAntesDeAbrirRef.current = null;
          onOpen(reporte.id, posicion, event.currentTarget);
        }}
        aria-label={`Abrir detalle de: ${titulo}, ${reporte.estado}`}
      >
        <span
          className={`mis-reportes-card-evidence${primeraFotografiaUrl ? " has-photo" : ""}`}
          aria-hidden="true"
        >
          {primeraFotografiaUrl ? (
            <img src={primeraFotografiaUrl} alt="" />
          ) : tieneVideo ? (
            <>
              <Video size={26} strokeWidth={1.8} />
              <span>Video disponible</span>
            </>
          ) : (
            <>
              <ImageIcon size={26} strokeWidth={1.8} />
              <span>{datos.evidencias.length > 0 ? "Sin foto guardada" : "Sin evidencias"}</span>
            </>
          )}
        </span>
        <span className="mis-reportes-card-content">
          <span className="mis-reportes-card-heading">
            <span className="mis-reportes-card-title" role="heading" aria-level={2}>
              {titulo}
            </span>
            <span className="mis-reportes-card-status" data-status={reporte.estado}>
              <Clock3 size={17} strokeWidth={2} aria-hidden="true" />
              {reporte.estado}
            </span>
          </span>
          <span className="mis-reportes-card-meta">
            <MapPin size={18} aria-hidden="true" />
            <span>
              {etiquetaTipoLugar(datos.tipoLugar)} · {territorio?.nombre ?? datos.territorioId}
            </span>
          </span>
          <span className="mis-reportes-card-meta">
            <CalendarDays size={18} aria-hidden="true" />
            <span>{fecha}</span>
          </span>
        </span>
        <ChevronRight
          className="mis-reportes-card-chevron"
          size={22}
          strokeWidth={2.6}
          aria-hidden="true"
        />
      </button>
    </article>
  );
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

function DemoReportCard() {
  const estado: EstadoReporte = "En revisión";
  return (
    <article className="mis-reportes-card" aria-label="Tarjeta de reporte de demostración">
      <div
        className="mis-reportes-card-evidence"
        role="img"
        aria-label="Espacio ilustrativo para evidencia; no es una fotografía real"
      >
        <ImageIcon size={26} strokeWidth={1.8} aria-hidden="true" />
        <span>Imagen de muestra</span>
      </div>
      <div className="mis-reportes-card-content">
        <div className="mis-reportes-card-heading">
          <h2>Reporte de ejemplo</h2>
          <span className="mis-reportes-card-status" data-status={estado}>
            <Clock3 size={17} strokeWidth={2} aria-hidden="true" />
            {estado}
          </span>
        </div>
        <p className="mis-reportes-card-meta">
          <MapPin size={18} strokeWidth={2} aria-hidden="true" />
          <span>Vereda de ejemplo</span>
        </p>
        <p className="mis-reportes-card-meta">
          <CalendarDays size={18} strokeWidth={2} aria-hidden="true" />
          <span>Fecha de ejemplo · hora de ejemplo</span>
        </p>
      </div>
      <ChevronRight
        className="mis-reportes-card-chevron"
        size={22}
        strokeWidth={2.6}
        aria-hidden="true"
      />
    </article>
  );
}
