import { useInfiniteQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, ChevronDown, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TarjetaReportePublica } from "@/components/reportes/tarjeta-reporte-publica";
import { Vacio } from "@/components/carta";
import { esPublicacionPublica } from "@/lib/reportes-publicos";
import { consultarCartelera, type MiVeredaPublicacion } from "@/lib/mi-vereda-cartelera";

const PAGE_SIZE = 100;
type OrdenReportes = "recientes" | "antiguos";

export const Route = createFileRoute("/reportes/todos")({
  head: () => ({
    meta: [
      { title: "Todos los reportes · AlertaVereda" },
      {
        name: "description",
        content: "Consulta los reportes públicos de las veredas de Ebéjico.",
      },
    ],
  }),
  component: TodosLosReportes,
});

function timestampPublicacion(publicacion: MiVeredaPublicacion) {
  const fecha = Date.parse(publicacion.fecha_evento ?? publicacion.created_at);
  return Number.isFinite(fecha) ? fecha : 0;
}

function textoBuscable(publicacion: MiVeredaPublicacion) {
  return `${publicacion.titulo} ${publicacion.descripcion ?? ""}`.toLocaleLowerCase("es-CO");
}

function limiteInferior(fecha: string) {
  return new Date(`${fecha}T00:00:00`).getTime();
}

function limiteSuperior(fecha: string) {
  return new Date(`${fecha}T23:59:59.999`).getTime();
}

function TodosLosReportes() {
  const [busqueda, setBusqueda] = useState("");
  const [termino, setTermino] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [orden, setOrden] = useState<OrdenReportes>("recientes");

  const consulta = useInfiniteQuery({
    queryKey: ["reportes-publicos", termino],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      consultarCartelera({
        p_categoria: null,
        // El servidor acota el conjunto; la comprobación final abajo solo usa título y descripción.
        p_busqueda: termino.trim() || null,
        p_limit: PAGE_SIZE,
        p_offset: pageParam,
        p_excluir_nivel_normal: false,
      }),
    getNextPageParam: (ultimaPagina, paginas) =>
      ultimaPagina.length === PAGE_SIZE ? paginas.length * PAGE_SIZE : undefined,
    retry: 1,
    retryDelay: 800,
  });

  const publicaciones = useMemo(() => {
    const terminoNormalizado = termino.trim().toLocaleLowerCase("es-CO");
    const desde = fechaDesde ? limiteInferior(fechaDesde) : null;
    const hasta = fechaHasta ? limiteSuperior(fechaHasta) : null;
    const paginas = (consulta.data?.pages.flat() ?? []) as MiVeredaPublicacion[];

    return [
      ...paginas
        .filter(esPublicacionPublica)
        .filter((publicacion) =>
          terminoNormalizado ? textoBuscable(publicacion).includes(terminoNormalizado) : true,
        )
        .filter((publicacion) => {
          const fecha = timestampPublicacion(publicacion);
          return (desde === null || fecha >= desde) && (hasta === null || fecha <= hasta);
        }),
    ].sort((a, b) => {
      const diferencia = timestampPublicacion(a) - timestampPublicacion(b);
      return orden === "recientes" ? -diferencia : diferencia;
    });
  }, [consulta.data?.pages, fechaDesde, fechaHasta, orden, termino]);

  const rangoInvalido = Boolean(fechaDesde && fechaHasta && fechaDesde > fechaHasta);
  const hayResultados = publicaciones.length > 0 && !rangoInvalido;
  const hayFiltros = Boolean(termino || fechaDesde || fechaHasta || orden !== "recientes");

  const limpiarFiltros = () => {
    setBusqueda("");
    setTermino("");
    setFechaDesde("");
    setFechaHasta("");
    setOrden("recientes");
  };

  return (
    <AppShell wide>
      <div className="reportes-todos-page">
        <Link to="/reportes" className="reportes-back-link">
          <ArrowLeft size={17} aria-hidden="true" /> Volver a categorías
        </Link>

        <header className="reportes-todos-header">
          <p className="reportes-eyebrow">Consulta comunitaria</p>
          <h1>Todos los reportes</h1>
          <p>
            Consulta las publicaciones con visibilidad pública autorizada, incluidas emergencias en
            revisión.
          </p>
        </header>

        <section className="reportes-filters" aria-label="Filtros de reportes">
          <form
            className="reportes-search-form"
            onSubmit={(event) => {
              event.preventDefault();
              setTermino(busqueda);
            }}
          >
            <label htmlFor="reportes-busqueda" className="sr-only">
              Buscar por título o descripción
            </label>
            <Search size={18} aria-hidden="true" />
            <input
              id="reportes-busqueda"
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por título o descripción…"
            />
            <button type="submit">Buscar</button>
          </form>

          <div className="reportes-filter-row">
            <div className="reportes-date-fields" aria-label="Filtrar por fecha">
              <label className="reportes-filter-field">
                <span>
                  <CalendarDays size={15} aria-hidden="true" /> Desde
                </span>
                <input
                  type="date"
                  value={fechaDesde}
                  max={fechaHasta || undefined}
                  onChange={(event) => setFechaDesde(event.target.value)}
                  aria-label="Fecha desde"
                />
              </label>
              <label className="reportes-filter-field">
                <span>
                  <CalendarDays size={15} aria-hidden="true" /> Hasta
                </span>
                <input
                  type="date"
                  value={fechaHasta}
                  min={fechaDesde || undefined}
                  onChange={(event) => setFechaHasta(event.target.value)}
                  aria-label="Fecha hasta"
                />
              </label>
            </div>

            <label className="reportes-filter-field reportes-sort-field">
              <span>Ordenar por fecha</span>
              <select
                value={orden}
                onChange={(event) => setOrden(event.target.value as OrdenReportes)}
              >
                <option value="recientes">Más recientes primero</option>
                <option value="antiguos">Más antiguos primero</option>
              </select>
            </label>

            {hayFiltros && (
              <button type="button" className="reportes-reset-button" onClick={limpiarFiltros}>
                <RotateCcw size={15} aria-hidden="true" /> Limpiar
              </button>
            )}
          </div>
          {rangoInvalido && (
            <p className="reportes-filter-warning" role="alert">
              La fecha inicial no puede ser posterior a la fecha final.
            </p>
          )}
        </section>

        {consulta.isPending && <Vacio texto="Cargando reportes…" />}
        {consulta.isError && (
          <div className="reportes-inline-error" role="alert">
            <strong>No pudimos cargar los reportes.</strong>
            <span>Revisa la conexión e inténtalo nuevamente.</span>
            <button type="button" onClick={() => void consulta.refetch()}>
              Intentar de nuevo
            </button>
          </div>
        )}
        {!consulta.isPending && !consulta.isError && !hayResultados && (
          <Vacio
            texto={
              rangoInvalido
                ? "Corrige el rango de fechas para consultar los reportes."
                : "No encontramos reportes públicos con estos criterios."
            }
          />
        )}

        {hayResultados && (
          <section className="reportes-todos-results" aria-live="polite">
            <div className="reportes-results-heading">
              <div>
                <p className="reportes-eyebrow">Resultados disponibles</p>
                <h2>{publicaciones.length} reportes cargados</h2>
              </div>
              {consulta.hasNextPage && <span>Hay más resultados disponibles</span>}
            </div>
            <div className="reportes-public-list">
              {publicaciones.map((publicacion) => (
                <TarjetaReportePublica
                  key={`${publicacion.publicacion_tabla}-${publicacion.publicacion_id}`}
                  publicacion={publicacion}
                  mostrarCategoria
                  origenLista="todos"
                />
              ))}
            </div>
          </section>
        )}

        {!consulta.isError && consulta.hasNextPage && (
          <button
            type="button"
            className="reportes-load-more"
            onClick={() => void consulta.fetchNextPage()}
            disabled={consulta.isFetchingNextPage}
          >
            <ChevronDown size={18} aria-hidden="true" />
            {consulta.isFetchingNextPage ? "Cargando…" : "Cargar más reportes"}
          </button>
        )}
      </div>
    </AppShell>
  );
}
