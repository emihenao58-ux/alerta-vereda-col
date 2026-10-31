import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Droplet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Vacio } from "@/components/carta";
import { CabeceraSeccionPublica } from "@/components/reportes/cabecera-seccion-publica";
import {
  FiltrosEstadoPublico,
  type FiltroEstadoPublico,
} from "@/components/reportes/filtros-estado-publico";
import { TarjetaReportePublica } from "@/components/reportes/tarjeta-reporte-publica";
import { consultarCartelera } from "@/lib/mi-vereda-cartelera";
import type { EstadoPublico } from "@/lib/reportes-publicos";
import {
  condicionOperativaServicioDe,
  estadoGeneralServicioDe,
  esPublicacionServicioPublica,
  tipoServicioCatalogoDe,
  tipoServicioSinEquivalenciaDe,
  TIPOS_SERVICIO,
  type TipoServicioCodigo,
} from "@/lib/servicios-publicos";
import "./servicios.css";

export const Route = createFileRoute("/servicios")({
  head: () => ({
    meta: [
      { title: "Servicios públicos · AlertaVereda Ebéjico" },
      {
        name: "description",
        content:
          "Consulta reportes públicos sobre agua, electricidad, señal, gas y otros servicios.",
      },
      { property: "og:title", content: "Servicios · AlertaVereda" },
      {
        property: "og:description",
        content: "Reportes comunitarios de servicios por tipo, condición y estado general.",
      },
    ],
  }),
  component: Servicios,
});

type FiltroTipoServicio = "todos" | TipoServicioCodigo;

function Servicios() {
  const [filtroTipo, setFiltroTipo] = useState<FiltroTipoServicio>("todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoPublico>("todos");
  const { data, isLoading, isError } = useQueryServicios();

  const publicaciones = useMemo(() => (data ?? []).filter(esPublicacionServicioPublica), [data]);

  const publicacionesPorTipo = useMemo(
    () =>
      filtroTipo === "todos"
        ? publicaciones
        : publicaciones.filter((publicacion) => publicacion.tipo === filtroTipo),
    [filtroTipo, publicaciones],
  );

  const publicacionesFiltradas = useMemo(
    () =>
      filtroEstado === "todos"
        ? publicacionesPorTipo
        : publicacionesPorTipo.filter(
            (publicacion) => estadoGeneralServicioDe(publicacion) === filtroEstado,
          ),
    [filtroEstado, publicacionesPorTipo],
  );

  const conteosEstado = useMemo(() => {
    const counts: Partial<Record<EstadoPublico, number>> = {};
    for (const publicacion of publicacionesPorTipo) {
      const estado = estadoGeneralServicioDe(publicacion);
      if (estado) counts[estado] = (counts[estado] ?? 0) + 1;
    }
    return counts;
  }, [publicacionesPorTipo]);

  const publicacionesParaConteosTipo = useMemo(
    () =>
      filtroEstado === "todos"
        ? publicaciones
        : publicaciones.filter(
            (publicacion) => estadoGeneralServicioDe(publicacion) === filtroEstado,
          ),
    [filtroEstado, publicaciones],
  );

  const conteosTipo = useMemo(() => {
    const counts = new Map<string, number>();
    for (const publicacion of publicacionesParaConteosTipo) {
      if (TIPOS_SERVICIO.some((opcion) => opcion.id === publicacion.tipo) && publicacion.tipo) {
        counts.set(publicacion.tipo, (counts.get(publicacion.tipo) ?? 0) + 1);
      }
    }
    return counts;
  }, [publicacionesParaConteosTipo]);

  const tiposSinEquivalencia = useMemo(
    () =>
      Array.from(
        new Set(
          publicaciones
            .map((publicacion) => tipoServicioSinEquivalenciaDe(publicacion.tipo))
            .filter((tipo): tipo is string => tipo !== null),
        ),
      ),
    [publicaciones],
  );
  const estadosNoDisponibles = publicacionesPorTipo.filter(
    (publicacion) => estadoGeneralServicioDe(publicacion) === "no_clasificado",
  ).length;

  return (
    <AppShell wide>
      <div className="servicios-page">
        <Link to="/reportes" className="reportes-back-link">
          <ArrowLeft size={17} aria-hidden="true" /> Volver a reportes
        </Link>

        <CabeceraSeccionPublica
          variante="servicios"
          Icon={Droplet}
          titulo="Servicios"
          bajada="Consulta afectaciones en los servicios de las veredas de Ebéjico."
        />

        {!isLoading && !isError && (
          <section className="servicios-filter-panel" aria-label="Filtros de reportes de servicios">
            <div className="servicios-filter-group">
              <h2 className="servicios-filter-title" id="servicios-type-filter-title">
                Tipo de servicio
              </h2>
              <div
                className="servicios-filter-row"
                role="group"
                aria-labelledby="servicios-type-filter-title"
              >
                <button
                  type="button"
                  className={`servicios-filter-option${filtroTipo === "todos" ? " is-active" : ""}`}
                  aria-pressed={filtroTipo === "todos"}
                  onClick={() => setFiltroTipo("todos")}
                >
                  Todos <small>{publicacionesParaConteosTipo.length}</small>
                </button>
                {TIPOS_SERVICIO.map(({ id, label, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    className={`servicios-filter-option${filtroTipo === id ? " is-active" : ""}`}
                    aria-pressed={filtroTipo === id}
                    onClick={() => setFiltroTipo(id)}
                  >
                    <Icon size={15} aria-hidden="true" />
                    {label}
                    <small>{conteosTipo.get(id) ?? 0}</small>
                  </button>
                ))}
              </div>
              <p className="servicios-filter-hint">Desliza para ver todos los tipos</p>
            </div>

            <div className="servicios-filter-group">
              <h2 className="servicios-filter-title" id="servicios-state-filter-title">
                Estado general del reporte
              </h2>
              <FiltrosEstadoPublico
                value={filtroEstado}
                counts={conteosEstado}
                onChange={setFiltroEstado}
                incluirEnRevision={false}
                ariaLabel="Filtrar servicios por estado general del reporte"
              />
              <p className="servicios-filter-hint">Desliza para ver todos los estados</p>
            </div>
          </section>
        )}

        {!isLoading &&
          !isError &&
          (tiposSinEquivalencia.length > 0 || estadosNoDisponibles > 0) && (
            <aside className="servicios-notes" aria-label="Aclaraciones de los datos públicos">
              {tiposSinEquivalencia.length > 0 && (
                <p className="servicios-note" role="note">
                  Los valores de tipo {tiposSinEquivalencia.map((tipo) => `«${tipo}»`).join(", ")}{" "}
                  no coinciden exactamente con el catálogo actual. Se conservan en «Todos» y no se
                  asignan a otro filtro sin una equivalencia confirmada.
                </p>
              )}
              {estadosNoDisponibles > 0 && (
                <p className="servicios-note" role="note">
                  {estadosNoDisponibles === 1
                    ? "Un reporte conserva"
                    : `${estadosNoDisponibles} reportes conservan`}{" "}
                  un estado general no disponible. La condición del servicio no se usa para
                  inferirlo.
                </p>
              )}
            </aside>
          )}

        {isLoading && <Vacio texto="Cargando reportes de servicios…" />}
        {isError && (
          <Vacio texto="No fue posible cargar los reportes de servicios. Intenta más tarde." />
        )}
        {!isLoading && !isError && publicaciones.length === 0 && (
          <Vacio texto="Sin novedades públicas de servicios por ahora." />
        )}
        {!isLoading &&
          !isError &&
          publicaciones.length > 0 &&
          publicacionesFiltradas.length === 0 && (
            <Vacio texto="No hay reportes públicos para los filtros seleccionados." />
          )}
        {!isLoading && !isError && publicacionesFiltradas.length > 0 && (
          <>
            <div className="servicios-results-heading">
              <h2>Reportes de servicios</h2>
              <span className="servicios-results-count">
                {publicacionesFiltradas.length}{" "}
                {publicacionesFiltradas.length === 1 ? "reporte" : "reportes"}
              </span>
            </div>
            <div className="reportes-public-list">
              {publicacionesFiltradas.map((publicacion) => {
                const estado = estadoGeneralServicioDe(publicacion);
                if (!estado) return null;

                const tipo = tipoServicioCatalogoDe(publicacion.tipo);
                const valorSinEquivalencia = tipoServicioSinEquivalenciaDe(publicacion.tipo);
                const IconoTipo = tipo?.Icon;
                const condicion = condicionOperativaServicioDe(publicacion);

                return (
                  <TarjetaReportePublica
                    key={`${publicacion.publicacion_tabla}-${publicacion.publicacion_id}`}
                    publicacion={publicacion}
                    mostrarCategoria={false}
                    origenLista="servicios"
                    estadoPublicoOverride={estado}
                    metadatosCategoria={
                      <dl className="servicios-card-meta">
                        <div>
                          <dt>Tipo de servicio</dt>
                          <dd
                            className={
                              valorSinEquivalencia ? "servicios-card-type-unmapped" : undefined
                            }
                          >
                            {IconoTipo && <IconoTipo size={15} aria-hidden="true" />}
                            {tipo?.label ??
                              (valorSinEquivalencia
                                ? `Sin equivalencia confirmada · ${valorSinEquivalencia}`
                                : "Tipo de servicio no disponible")}
                          </dd>
                        </div>
                        <div>
                          <dt>Condición operativa</dt>
                          <dd>{condicion ?? "No disponible"}</dd>
                        </div>
                      </dl>
                    }
                  />
                );
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}

function useQueryServicios() {
  return useQuery({
    queryKey: ["servicios"],
    queryFn: () =>
      consultarCartelera({
        p_categoria: "servicio",
        p_limit: 100,
        p_excluir_nivel_normal: false,
      }),
  });
}
