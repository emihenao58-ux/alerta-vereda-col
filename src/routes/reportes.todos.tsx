import { useInfiniteQuery, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { ReportesSurface } from "@/components/reportes/reportes-surface";
import { TarjetaReportePublica } from "@/components/reportes/tarjeta-reporte-publica";
import { Vacio } from "@/components/carta";
import {
  ETIQUETAS_CATEGORIA_PUBLICA,
  esPublicacionPublica,
  type EstadoPublico,
} from "@/lib/reportes-publicos";
import {
  consultarCartelera,
  type MiVeredaCategoria,
  type MiVeredaPublicacion,
} from "@/lib/mi-vereda-cartelera";
import {
  consultarHistorialSuperadmin,
  type AdminHistoryItem,
  type AdminHistoryStatus,
} from "@/lib/admin-data";
import {
  validarBusquedaReportesAdmin,
  type ContextoAdminReportes,
} from "@/lib/reportes-contexto-admin";

const PAGE_SIZE = 10;
const MAX_PAGES = 10;
type OrdenReportes = "recientes" | "antiguos";

export const Route = createFileRoute("/reportes/todos")({
  validateSearch: validarBusquedaReportesAdmin,
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
  const { contexto } = Route.useSearch();

  if (contexto === "historial") return <HistorialSuperadmin />;
  return <ListaPublica contexto={contexto} />;
}

function ListaPublica({ contexto }: { contexto?: ContextoAdminReportes | undefined }) {
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
    <ReportesSurface contexto={contexto} wide>
      <div className="reportes-todos-page">
        <Link to="/reportes" search={{ contexto }} className="reportes-back-link">
          <ArrowLeft size={17} aria-hidden="true" /> Volver a categorías
        </Link>

        <header className="reportes-todos-header">
          <p className="reportes-eyebrow">
            {contexto ? "Publicaciones comunitarias" : "Consulta comunitaria"}
          </p>
          <h1>{contexto ? "Todas las publicaciones" : "Todos los reportes"}</h1>
          <p>
            {contexto
              ? "Consulta las publicaciones con visibilidad comunitaria autorizada. Las emergencias en revisión conservan su etiqueta de no verificadas."
              : "Consulta las publicaciones con visibilidad pública autorizada, incluidas emergencias en revisión."}
          </p>
        </header>

        <section
          className="reportes-filters"
          aria-label={contexto ? "Filtros de publicaciones" : "Filtros de reportes"}
        >
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
                <h2>
                  {publicaciones.length} {contexto ? "publicaciones cargadas" : "reportes cargados"}
                </h2>
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
                  contextoSuperadmin={contexto}
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
    </ReportesSurface>
  );
}

type EstadoFiltroHistorial = "todos" | AdminHistoryStatus;
type CategoriaFiltroHistorial = "todas" | MiVeredaCategoria;

function HistorialSuperadmin() {
  const { esSuperadmin } = useAuth();
  const [busqueda, setBusqueda] = useState("");
  const [termino, setTermino] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [estado, setEstado] = useState<EstadoFiltroHistorial>("todos");
  const [categoria, setCategoria] = useState<CategoriaFiltroHistorial>("todas");
  const [orden, setOrden] = useState<OrdenReportes>("recientes");
  const [pagina, setPagina] = useState(0);

  const consulta = useQuery({
    queryKey: ["historial-superadmin"],
    queryFn: consultarHistorialSuperadmin,
    enabled: esSuperadmin,
    staleTime: 30_000,
  });

  const rangoInvalido = Boolean(fechaDesde && fechaHasta && fechaDesde > fechaHasta);
  const resultados = useMemo(() => {
    const terminoNormalizado = termino.trim().toLocaleLowerCase("es-CO");
    const desde = fechaDesde ? limiteInferior(fechaDesde) : null;
    const hasta = fechaHasta ? limiteSuperior(fechaHasta) : null;

    return [...(consulta.data ?? [])]
      .filter((item) => (estado === "todos" ? true : item.estado === estado))
      .filter((item) => (categoria === "todas" ? true : item.publicacion.categoria === categoria))
      .filter((item) =>
        terminoNormalizado ? textoBuscable(item.publicacion).includes(terminoNormalizado) : true,
      )
      .filter((item) => {
        const fecha = Date.parse(item.fecha);
        return (desde === null || fecha >= desde) && (hasta === null || fecha <= hasta);
      })
      .sort((a, b) => {
        const diferencia = Date.parse(a.fecha) - Date.parse(b.fecha);
        return orden === "recientes" ? -diferencia : diferencia;
      });
  }, [categoria, consulta.data, estado, fechaDesde, fechaHasta, orden, termino]);

  const paginas = Math.max(1, Math.ceil(resultados.length / PAGE_SIZE));
  const paginaSegura = Math.min(pagina, paginas - 1);
  const resultadosPagina = resultados.slice(
    paginaSegura * PAGE_SIZE,
    (paginaSegura + 1) * PAGE_SIZE,
  );
  const rangoInicio = resultados.length === 0 ? 0 : paginaSegura * PAGE_SIZE + 1;
  const rangoFin = Math.min((paginaSegura + 1) * PAGE_SIZE, resultados.length);
  const hayFiltros = Boolean(
    termino ||
    fechaDesde ||
    fechaHasta ||
    estado !== "todos" ||
    categoria !== "todas" ||
    orden !== "recientes",
  );

  useEffect(() => {
    if (pagina !== paginaSegura) setPagina(paginaSegura);
  }, [pagina, paginaSegura]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setTermino("");
    setFechaDesde("");
    setFechaHasta("");
    setEstado("todos");
    setCategoria("todas");
    setOrden("recientes");
    setPagina(0);
  };

  return (
    <ReportesSurface contexto="historial" wide>
      <div className="reportes-todos-page">
        <Link to="/admin/gestion" className="reportes-back-link">
          <ArrowLeft size={17} aria-hidden="true" /> Volver al Centro de Gestión
        </Link>

        <header className="reportes-todos-header">
          <p className="reportes-eyebrow">Trazabilidad administrativa</p>
          <h1>Historial de publicaciones</h1>
          <p>
            Consulta publicaciones solucionadas o cerradas y reportes rechazados. Los registros
            rechazados se muestran solo para Superadmin.
          </p>
        </header>

        <section className="reportes-filters" aria-label="Filtros del historial">
          <form
            className="reportes-search-form"
            onSubmit={(event) => {
              event.preventDefault();
              setTermino(busqueda);
              setPagina(0);
            }}
          >
            <label htmlFor="historial-busqueda" className="sr-only">
              Buscar por título o descripción
            </label>
            <Search size={18} aria-hidden="true" />
            <input
              id="historial-busqueda"
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar por título o descripción…"
            />
            <button type="submit">Buscar</button>
          </form>

          <div className="reportes-filter-row">
            <div className="reportes-date-fields" aria-label="Filtrar por fecha del registro">
              <label className="reportes-filter-field">
                <span>
                  <CalendarDays size={15} aria-hidden="true" /> Desde
                </span>
                <input
                  type="date"
                  value={fechaDesde}
                  max={fechaHasta || undefined}
                  onChange={(event) => {
                    setFechaDesde(event.target.value);
                    setPagina(0);
                  }}
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
                  onChange={(event) => {
                    setFechaHasta(event.target.value);
                    setPagina(0);
                  }}
                  aria-label="Fecha hasta"
                />
              </label>
            </div>

            <label className="reportes-filter-field">
              <span>Estado</span>
              <select
                value={estado}
                onChange={(event) => {
                  setEstado(event.target.value as EstadoFiltroHistorial);
                  setPagina(0);
                }}
              >
                <option value="todos">Todos</option>
                <option value="solucionado">Solucionados</option>
                <option value="cerrado">Cerrados sin solución</option>
                <option value="rechazado">Rechazados</option>
              </select>
            </label>

            <label className="reportes-filter-field">
              <span>Categoría</span>
              <select
                value={categoria}
                onChange={(event) => {
                  setCategoria(event.target.value as CategoriaFiltroHistorial);
                  setPagina(0);
                }}
              >
                <option value="todas">Todas las categorías</option>
                {Object.entries(ETIQUETAS_CATEGORIA_PUBLICA).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>

            <label className="reportes-filter-field reportes-sort-field">
              <span>Ordenar por fecha</span>
              <select
                value={orden}
                onChange={(event) => {
                  setOrden(event.target.value as OrdenReportes);
                  setPagina(0);
                }}
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

        {consulta.isPending && <Vacio texto="Cargando el historial…" />}
        {consulta.isError && (
          <div className="reportes-inline-error" role="alert">
            <strong>No pudimos cargar el historial.</strong>
            <span>Revisa el acceso administrativo y vuelve a intentarlo.</span>
            <button type="button" onClick={() => void consulta.refetch()}>
              Intentar de nuevo
            </button>
          </div>
        )}
        {!consulta.isPending && !consulta.isError && (rangoInvalido || resultados.length === 0) && (
          <Vacio
            texto={
              rangoInvalido
                ? "Corrige el rango de fechas para consultar el historial."
                : "No encontramos registros de historial con estos criterios."
            }
          />
        )}

        {!consulta.isPending && !consulta.isError && !rangoInvalido && resultados.length > 0 && (
          <section className="reportes-todos-results" aria-live="polite">
            <div className="reportes-results-heading">
              <div>
                <p className="reportes-eyebrow">Resultados del historial</p>
                <h2>
                  Mostrando {rangoInicio}–{rangoFin} de {resultados.length.toLocaleString("es-CO")}{" "}
                  registros
                </h2>
              </div>
            </div>
            <div className="reportes-public-list">
              {resultadosPagina.map((item: AdminHistoryItem) => {
                const estadoPublico: EstadoPublico | undefined =
                  item.estado === "solucionado"
                    ? "verificado_solucionado"
                    : item.estado === "cerrado"
                      ? "cerrado_sin_solucion"
                      : undefined;
                return (
                  <TarjetaReportePublica
                    key={item.id}
                    publicacion={item.publicacion}
                    mostrarCategoria
                    origenLista="todos"
                    contextoSuperadmin="historial"
                    tipoRegistroAdmin={item.tipoRegistro}
                    estadoPublicoOverride={estadoPublico}
                    estadoAdminOverride={item.estado === "rechazado" ? "rechazado" : undefined}
                    metadatosCategoria={
                      item.estado === "rechazado" ? (
                        <p className="reporte-history-rejection-note">Reporte rechazado</p>
                      ) : null
                    }
                  />
                );
              })}
            </div>
          </section>
        )}

        {!consulta.isError && resultados.length > 0 && (
          <nav
            className="reportes-load-more reportes-history-pagination"
            aria-label="Paginación del historial"
          >
            <button
              type="button"
              className="reportes-page-control"
              disabled={paginaSegura <= 0}
              onClick={() => setPagina((actual) => Math.max(0, actual - 1))}
            >
              <ArrowLeft size={16} aria-hidden="true" /> Anterior
            </button>
            <span>
              Página {paginaSegura + 1} de {paginas}
            </span>
            <button
              type="button"
              className="reportes-page-control"
              disabled={paginaSegura + 1 >= paginas}
              onClick={() => setPagina((actual) => Math.min(paginas - 1, actual + 1))}
            >
              Siguiente <ArrowRight size={16} aria-hidden="true" />
            </button>
          </nav>
        )}
      </div>
    </ReportesSurface>
  );
}
