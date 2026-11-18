import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, ChevronDown, ChevronUp, RotateCcw, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { TarjetaReportePublica } from "@/components/reportes/tarjeta-reporte-publica";
import { Vacio } from "@/components/carta";
import { esPublicacionPublica } from "@/lib/reportes-publicos";
import { consultarCartelera, type MiVeredaPublicacion } from "@/lib/mi-vereda-cartelera";

const PAGE_SIZE = 10;
const MAX_PAGES = 10;
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
  const queryClient = useQueryClient();
  const queryKey = ["reportes-publicos", termino] as const;
  const [finOffsets, setFinOffsets] = useState<Map<string, number>>(() => new Map());
  const [inicioOffsets, setInicioOffsets] = useState<Map<string, number>>(() => new Map());

  const consulta = useInfiniteQuery({
    queryKey,
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
    getNextPageParam: (ultimaPagina, _paginas, ultimoOffset) =>
      ultimaPagina.length === PAGE_SIZE ? ultimoOffset + PAGE_SIZE : undefined,
    getPreviousPageParam: (_primeraPagina, _paginas, primerOffset) =>
      primerOffset > 0 ? Math.max(0, primerOffset - PAGE_SIZE) : undefined,
    maxPages: MAX_PAGES,
    retry: 1,
    retryDelay: 800,
  });

  const primerOffset = Number(consulta.data?.pageParams.at(0) ?? 0);
  const ultimoOffset = Number(consulta.data?.pageParams.at(-1) ?? 0);
  const puedeCargarRecientes =
    Boolean(consulta.hasPreviousPage) && inicioOffsets.get(termino) !== primerOffset;
  const puedeCargarAntiguos =
    Boolean(consulta.hasNextPage) && finOffsets.get(termino) !== ultimoOffset;

  const cargarPaginaAnterior = async () => {
    const datosAnteriores = consulta.data;
    if (!datosAnteriores || !consulta.hasPreviousPage) return;

    const offsetAnterior = Number(datosAnteriores.pageParams.at(0) ?? 0);
    const resultado = await consulta.fetchPreviousPage();
    if (resultado.data?.pages.at(0)?.length === 0) {
      queryClient.setQueryData(queryKey, datosAnteriores);
      setInicioOffsets((actuales) => new Map(actuales).set(termino, offsetAnterior));
    }
  };

  const cargarPaginaSiguiente = async () => {
    const datosAnteriores = consulta.data;
    if (!datosAnteriores || !consulta.hasNextPage) return;

    const offsetActual = Number(datosAnteriores.pageParams.at(-1) ?? 0);
    const resultado = await consulta.fetchNextPage();
    if (resultado.data?.pages.at(-1)?.length === 0) {
      queryClient.setQueryData(queryKey, datosAnteriores);
      setFinOffsets((actuales) => new Map(actuales).set(termino, offsetActual));
    }
  };

  const publicaciones = useMemo(() => {
    const terminoNormalizado = termino.trim().toLocaleLowerCase("es-CO");
    const desde = fechaDesde ? limiteInferior(fechaDesde) : null;
    const hasta = fechaHasta ? limiteSuperior(fechaHasta) : null;
    const paginas = (consulta.data?.pages.flat() ?? []) as MiVeredaPublicacion[];
    const unicas = new Map<string, MiVeredaPublicacion>();
    for (const publicacion of paginas) {
      unicas.set(`${publicacion.publicacion_tabla}-${publicacion.publicacion_id}`, publicacion);
    }

    return [
      ...[...unicas.values()]
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
              {puedeCargarAntiguos && <span>Hay más resultados disponibles</span>}
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

        {!consulta.isError && puedeCargarRecientes && (
          <button
            type="button"
            className="reportes-load-more"
            onClick={() => void cargarPaginaAnterior()}
            disabled={consulta.isFetchingPreviousPage || consulta.isFetchingNextPage}
          >
            <ChevronUp size={18} aria-hidden="true" />
            {consulta.isFetchingPreviousPage ? "Cargando…" : "Ver reportes más recientes"}
          </button>
        )}

        {!consulta.isError && puedeCargarAntiguos && (
          <button
            type="button"
            className="reportes-load-more"
            onClick={() => void cargarPaginaSiguiente()}
            disabled={consulta.isFetchingNextPage || consulta.isFetchingPreviousPage}
          >
            <ChevronDown size={18} aria-hidden="true" />
            {consulta.isFetchingNextPage
              ? "Cargando…"
              : consulta.data?.pages.length === MAX_PAGES
                ? "Ver reportes más antiguos"
                : "Cargar 10 reportes más"}
          </button>
        )}
      </div>
    </AppShell>
  );
}
