import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, ClipboardList, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { consultarVeredasAdmin } from "@/lib/admin-data";
import { adminQueryKeys } from "@/lib/admin-query-keys";
import { getReportPageCount, getReportPageRange } from "@/lib/admin-report-pagination";
import { ETIQUETAS_ESTADO_PUBLICO, type EstadoPublico } from "@/lib/reportes-publicos";
import { LABEL_TIPO_REPORTE, fecha } from "@/lib/alerta";
import type { Database } from "@/integrations/supabase/types";
import "@/components/admin/centro-gestion.css";

type Reporte = Pick<
  Database["public"]["Tables"]["reportes"]["Row"],
  "id" | "titulo" | "descripcion" | "categoria" | "estado" | "created_at" | "vereda_id" | "lugar"
>;

type EstadoFiltro = "all" | "pending" | "reviewed";
type Orden = "newest" | "oldest";

function etiquetaEstado(estado: string) {
  if (estado === "pendiente") return "Pendiente";
  return ETIQUETAS_ESTADO_PUBLICO[estado as EstadoPublico] ?? estado;
}

function categoriaEtiqueta(categoria: string) {
  return LABEL_TIPO_REPORTE[categoria as keyof typeof LABEL_TIPO_REPORTE] ?? categoria;
}

export function CentroGestionReportes() {
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoFiltro>("pending");
  const [categoria, setCategoria] = useState("all");
  const [veredaId, setVeredaId] = useState("");
  const [orden, setOrden] = useState<Orden>("newest");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setBusqueda(textoBusqueda.trim());
      setPage(0);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [textoBusqueda]);

  const veredas = useQuery({
    queryKey: adminQueryKeys.veredas.options,
    queryFn: consultarVeredasAdmin,
    staleTime: 30_000,
  });

  const filtrosReporte = {
    status: estado,
    category: categoria,
    veredaId,
    search: busqueda,
  };

  const totalReportes = useQuery({
    queryKey: adminQueryKeys.reports.listingCount(filtrosReporte),
    queryFn: async () => {
      let query = supabase.from("reportes").select("id", { count: "exact", head: true });

      if (estado === "pending") query = query.eq("estado", "pendiente");
      if (estado === "reviewed") query = query.neq("estado", "pendiente");
      if (categoria === "aviso") query = query.in("categoria", ["aviso", "otro"]);
      else if (categoria !== "all") query = query.eq("categoria", categoria);
      if (veredaId) query = query.eq("vereda_id", veredaId);
      if (busqueda) {
        const literal = busqueda.replace(/[\\%_]/g, "\\$&");
        query = query.ilike("titulo", `%${literal}%`);
      }

      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
  });

  const reportes = useQuery({
    queryKey: adminQueryKeys.reports.listing({
      page,
      pageSize,
      order: orden,
      status: estado,
      category: categoria,
      veredaId,
      search: busqueda,
    }),
    queryFn: async () => {
      const { from: desde, to: hasta } = getReportPageRange(page, pageSize);
      let query = supabase
        .from("reportes")
        .select("id, titulo, descripcion, categoria, estado, created_at, vereda_id, lugar");

      if (estado === "pending") query = query.eq("estado", "pendiente");
      if (estado === "reviewed") query = query.neq("estado", "pendiente");
      if (categoria === "aviso") query = query.in("categoria", ["aviso", "otro"]);
      else if (categoria !== "all") query = query.eq("categoria", categoria);
      if (veredaId) query = query.eq("vereda_id", veredaId);
      if (busqueda) {
        const literal = busqueda.replace(/[\\%_]/g, "\\$&");
        query = query.ilike("titulo", `%${literal}%`);
      }

      const ascending = orden === "oldest";
      const { data, error } = await query
        .order("created_at", { ascending })
        .order("id", { ascending })
        .range(desde, hasta);
      if (error) throw error;
      return (data ?? []) as Reporte[];
    },
    refetchOnWindowFocus: true,
  });

  const total = totalReportes.data ?? 0;
  const totalPages = getReportPageCount(total, pageSize);
  const items = reportes.data ?? [];
  const nombresVeredas = new Map((veredas.data ?? []).map((vereda) => [vereda.id, vereda.nombre]));
  const listadoError = Boolean(reportes.error || totalReportes.error);
  const listadoCargando = reportes.isLoading || totalReportes.isLoading;
  const listadoActualizando = reportes.isFetching || totalReportes.isFetching;
  const totalConocido = totalReportes.data !== undefined;

  useEffect(() => {
    if (totalConocido && page >= totalPages) {
      setPage(Math.max(0, totalPages - 1));
    }
  }, [page, totalConocido, totalPages]);

  const resetPage = () => setPage(0);
  const reintentar = () => {
    void Promise.all([reportes.refetch(), totalReportes.refetch()]);
  };

  return (
    <section className="gestion-report-list-page" aria-labelledby="gestion-report-list-title">
      <header className="gestion-report-list-heading">
        <div>
          <Link to="/admin/gestion" className="gestion-back-link">
            <ArrowLeft size={16} aria-hidden="true" />
            Volver al Centro de Gestión
          </Link>
          <p className="gestion-kicker">Supervisión territorial</p>
          <h1 id="gestion-report-list-title">Reportes para revisión</h1>
          <p>
            Prioriza los reportes pendientes, consulta sus detalles y aplica las decisiones
            administrativas permitidas.
          </p>
        </div>
        <span className="gestion-report-list-mark" aria-hidden="true">
          <ClipboardList size={27} />
        </span>
      </header>

      <section className="gestion-report-filters" aria-label="Filtros de reportes">
        <label className="gestion-report-search">
          <span>Buscar por título</span>
          <span className="gestion-search-control">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={textoBusqueda}
              onChange={(event) => setTextoBusqueda(event.target.value)}
              placeholder="Escribe un título…"
            />
          </span>
        </label>

        <label>
          <span>Estado</span>
          <select
            value={estado}
            onChange={(event) => {
              setEstado(event.target.value as EstadoFiltro);
              resetPage();
            }}
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes de verificación</option>
            <option value="reviewed">Revisados</option>
          </select>
        </label>

        <label>
          <span>Tipo</span>
          <select
            value={categoria}
            onChange={(event) => {
              setCategoria(event.target.value);
              resetPage();
            }}
          >
            <option value="all">Todos los tipos</option>
            <option value="emergencia">Emergencias</option>
            <option value="via">Vías</option>
            <option value="servicio">Servicios</option>
            <option value="aviso">Avisos</option>
          </select>
        </label>

        <label>
          <span>Vereda</span>
          <select
            value={veredaId}
            onChange={(event) => {
              setVeredaId(event.target.value);
              resetPage();
            }}
          >
            <option value="">Todas las veredas</option>
            {(veredas.data ?? []).map((vereda) => (
              <option key={vereda.id} value={vereda.id}>
                {vereda.nombre}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Orden</span>
          <select
            value={orden}
            onChange={(event) => {
              setOrden(event.target.value as Orden);
              resetPage();
            }}
          >
            <option value="newest">Más recientes primero</option>
            <option value="oldest">Más antiguos primero</option>
          </select>
        </label>

        <label>
          <span>Por página</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              resetPage();
            }}
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
        </label>
      </section>

      <div className="gestion-report-list-summary" aria-live="polite">
        {listadoCargando
          ? "Cargando reportes…"
          : listadoError
            ? "No fue posible actualizar el listado."
            : total === 0
              ? "No hay reportes que coincidan con los filtros."
              : `Mostrando ${page * pageSize + 1}–${Math.min(
                  (page + 1) * pageSize,
                  total,
                ).toLocaleString("es-CO")} de ${total.toLocaleString("es-CO")} reportes`}
        {listadoActualizando && !listadoCargando && <span>Actualizando…</span>}
      </div>

      {listadoError ? (
        <div className="gestion-list-message is-error" role="alert">
          <strong>No pudimos cargar los reportes.</strong>
          <p>Revisa tu conexión y vuelve a intentarlo.</p>
          <button
            type="button"
            className="gestion-retry-button"
            onClick={reintentar}
            disabled={listadoActualizando}
          >
            Reintentar
          </button>
        </div>
      ) : listadoCargando ? (
        <div className="gestion-list-message" role="status">
          Cargando la página de reportes…
        </div>
      ) : items.length === 0 ? (
        <div className="gestion-list-message">
          No hay reportes que coincidan con la búsqueda y los filtros seleccionados.
        </div>
      ) : (
        <ul className="gestion-report-list">
          {items.map((reporte) => (
            <li key={reporte.id}>
              <article className="gestion-report-row">
                <span
                  className={`gestion-report-type-icon gestion-report-type-${reporte.categoria}`}
                  aria-hidden="true"
                >
                  <ClipboardList size={18} />
                </span>
                <div className="gestion-report-row-main">
                  <h2>
                    <Link
                      to="/reportes/$id"
                      params={{ id: reporte.id }}
                      search={{
                        origen: "todos",
                        tabla: undefined,
                        contexto: "reportes",
                        registro: "reporte",
                      }}
                      className="gestion-report-title-link"
                    >
                      {reporte.titulo}
                    </Link>
                  </h2>
                  <p className="gestion-report-row-description">
                    {reporte.descripcion || "Sin descripción adicional."}
                  </p>
                  <div className="gestion-report-row-meta">
                    <span>{categoriaEtiqueta(reporte.categoria)}</span>
                    <span>{nombresVeredas.get(reporte.vereda_id) ?? "Vereda no disponible"}</span>
                    {reporte.lugar && <span>{reporte.lugar}</span>}
                    <time dateTime={reporte.created_at}>{fecha(reporte.created_at)}</time>
                  </div>
                </div>
                <span
                  className={`gestion-state-badge ${
                    reporte.estado === "pendiente" ? "is-pending" : ""
                  }`}
                >
                  {etiquetaEstado(reporte.estado)}
                </span>
              </article>
            </li>
          ))}
        </ul>
      )}

      <nav className="gestion-pagination" aria-label="Paginación de reportes">
        <button
          type="button"
          className="gestion-page-button"
          disabled={!totalConocido || listadoError || page <= 0 || listadoActualizando}
          onClick={() => setPage((current) => Math.max(0, current - 1))}
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Anterior
        </button>
        <span>
          {totalConocido
            ? `Página ${Math.min(page + 1, totalPages)} de ${totalPages}`
            : "Cargando páginas…"}
        </span>
        <button
          type="button"
          className="gestion-page-button"
          disabled={!totalConocido || listadoError || page + 1 >= totalPages || listadoActualizando}
          onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))}
        >
          Siguiente
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </nav>
    </section>
  );
}
