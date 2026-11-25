import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  BellRing,
  ChartNoAxesCombined,
  Archive,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  Clock3,
  Database,
  FileCheck2,
  FilePenLine,
  FileText,
  HardDrive,
  Mail,
  Megaphone,
  MapPinned,
  MapPlus,
  Settings2,
  ShieldCheck,
  UserRoundCheck,
  UserRoundX,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { RoadIcon } from "@/components/road-icon";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { adminPreviewBridge } from "@/lib/admin-preview-bridge";
import { getThemeTarget, subscribeThemeTarget } from "@/lib/theme-transition";
import { adminQueryKeys } from "@/lib/admin-query-keys";
import { consultarCapacidadAdmin, formatearBytes } from "@/lib/admin-capacity";
import { consultarVeredasAdmin } from "@/lib/admin-data";
import { ETIQUETAS_ESTADO_PUBLICO, type EstadoPublico } from "@/lib/reportes-publicos";
import { LABEL_TIPO_REPORTE, fecha } from "@/lib/alerta";
import "@/components/admin/centro-gestion.css";

type ConteoCategoria = { name: string; value: number; color: string };

const CATEGORIAS_REPORTE: Array<{
  name: string;
  values: string[];
  color: string;
}> = [
  { name: "Emergencias", values: ["emergencia"], color: "#ef4444" },
  { name: "Vías", values: ["via"], color: "#f59e0b" },
  { name: "Servicios", values: ["servicio"], color: "#1684e8" },
  { name: "Avisos", values: ["aviso", "otro"], color: "#0b9b7b" },
];

const ICONOS_CATEGORIA_REPORTE: Record<string, LucideIcon> = {
  emergencia: CircleAlert,
  via: RoadIcon,
  servicio: Settings2,
  aviso: Megaphone,
  otro: Megaphone,
};

type EventoActividadAdmin = {
  accion: string;
  entidad_tipo: string;
  estado_anterior: string | null;
  estado_nuevo: string | null;
};

type PresentacionActividadAdmin = {
  titulo: string;
  descripcion: string;
  Icon: LucideIcon;
};

const PRESENTACION_POR_ACCION_ADMIN: Record<string, PresentacionActividadAdmin> = {
  solicitud_aprobada: {
    titulo: "Solicitud de administrador aprobada",
    descripcion: "Se aprobó la solicitud para el rol de administrador de vereda.",
    Icon: UserRoundCheck,
  },
  solicitud_rechazada: {
    titulo: "Solicitud de administrador rechazada",
    descripcion: "Se registró el rechazo de la solicitud administrativa.",
    Icon: UserRoundX,
  },
  reporte_aprobado_creado: {
    titulo: "Reporte verificado",
    descripcion: "Se verificó el reporte y se creó una publicación.",
    Icon: ShieldCheck,
  },
  reporte_aprobado_actualizado: {
    titulo: "Reporte verificado y actualizado",
    descripcion: "Se verificó el reporte y se actualizó su publicación asociada.",
    Icon: FilePenLine,
  },
  reporte_rechazado: {
    titulo: "Reporte rechazado",
    descripcion: "El reporte pasó de pendiente a rechazado.",
    Icon: CircleX,
  },
  reporte_retirado: {
    titulo: "Publicación retirada",
    descripcion: "Se registró el retiro de una publicación.",
    Icon: Archive,
  },
  asignacion_creada: {
    titulo: "Administrador asignado",
    descripcion: "Se creó una asignación administrativa.",
    Icon: UserRoundCheck,
  },
  asignacion_revocada: {
    titulo: "Asignación administrativa revocada",
    descripcion: "Se revocó una asignación administrativa.",
    Icon: UserRoundX,
  },
  vereda_actualizada: {
    titulo: "Información de vereda actualizada",
    descripcion: "Se registró un cambio en los datos de la vereda.",
    Icon: MapPinned,
  },
  correo_superadmin_cambiado: {
    titulo: "Correo del Superadmin actualizado",
    descripcion: "Se confirmó el cambio de correo del Superadmin.",
    Icon: Mail,
  },
};

const ETIQUETAS_ESTADO_AUDITORIA: Record<string, string> = {
  pendiente: "Pendiente",
  aprobado: "Verificado",
  verificado: "Verificado",
  rechazado: "Rechazado",
  admin_vereda: "Administrador de vereda",
  activa: "Activa",
  revocada: "Revocada",
  "pendiente/rechazada": "Solicitud rechazada",
  solucionado: "Solucionado",
  no_solucionado: "Cerrado sin solución",
  retirado: "Retirado",
};

const TITULOS_ESTADO_DEMO: Record<string, string> = {
  verificado_activo: "Reporte verificado",
  en_atencion: "Reporte en atención",
  verificado_solucionado: "Reporte solucionado",
  cerrado_sin_solucion: "Reporte cerrado sin solución",
  no_clasificado: "Reporte con estado no disponible",
  rechazado: "Reporte rechazado",
  retirado: "Publicación retirada",
};

const ICONOS_ESTADO_AUDITORIA: Record<string, LucideIcon> = {
  verificado_activo: ShieldCheck,
  aprobado: ShieldCheck,
  verificado: ShieldCheck,
  en_atencion: Clock3,
  verificado_solucionado: CircleCheck,
  solucionado: CircleCheck,
  cerrado_sin_solucion: CircleX,
  no_solucionado: CircleX,
  rechazado: CircleX,
  retirado: Archive,
  no_clasificado: CircleHelp,
};

type EstadoServicioSistema = "operativo" | "no-conectado" | "error" | "desconocido";
type ServicioSistemaDemo = {
  id: string;
  label: string;
  Icon: typeof Database;
  estado: EstadoServicioSistema;
};

const SERVICIOS_SISTEMA_DEMO: readonly ServicioSistemaDemo[] = [
  { id: "supabase", label: "Base de datos / Supabase", Icon: Database, estado: "no-conectado" },
  { id: "almacenamiento", label: "Almacenamiento", Icon: HardDrive, estado: "no-conectado" },
  {
    id: "mapas",
    label: "Mapas y geolocalización",
    Icon: MapPinned,
    estado: "no-conectado",
  },
  { id: "notificaciones", label: "Notificaciones", Icon: BellRing, estado: "no-conectado" },
];

const ETIQUETA_ESTADO_SERVICIO: Record<EstadoServicioSistema, string> = {
  operativo: "Operativo",
  "no-conectado": "No conectado",
  error: "Error de conexión",
  desconocido: "Estado desconocido",
};

function etiquetaEstado(estado: string) {
  if (estado === "pendiente") return "Pendiente";
  return ETIQUETAS_ESTADO_PUBLICO[estado as EstadoPublico] ?? estado;
}

const AVISO_ANCHO_LOCAL_KEY = "alertavereda:superadmin:aviso-ancho-no-repetir";
const AVISO_ANCHO_SESSION_KEY = "alertavereda:superadmin:aviso-ancho-mostrado";
let avisoAnchoMostradoEnEstaSesion = false;

function leerBanderaAlmacenamiento(tipo: "local" | "session", clave: string) {
  try {
    const almacenamiento = tipo === "local" ? window.localStorage : window.sessionStorage;
    return almacenamiento.getItem(clave) === "1";
  } catch {
    return false;
  }
}

function AvisoAnchoDisponible() {
  const [visible, setVisible] = useState(false);
  const [noVolverAMostrar, setNoVolverAMostrar] = useState(false);

  useEffect(() => {
    const anchoPequeno = window.matchMedia("(max-width: 760px)");
    const actualizarVisibilidad = () => {
      const yaMostrado =
        avisoAnchoMostradoEnEstaSesion ||
        leerBanderaAlmacenamiento("session", AVISO_ANCHO_SESSION_KEY);
      const ocultadoPermanentemente = leerBanderaAlmacenamiento("local", AVISO_ANCHO_LOCAL_KEY);
      setVisible(anchoPequeno.matches && !yaMostrado && !ocultadoPermanentemente);
    };

    actualizarVisibilidad();
    anchoPequeno.addEventListener("change", actualizarVisibilidad);
    return () => anchoPequeno.removeEventListener("change", actualizarVisibilidad);
  }, []);

  useEffect(() => {
    if (!visible) return;
    avisoAnchoMostradoEnEstaSesion = true;
    try {
      window.sessionStorage.setItem(AVISO_ANCHO_SESSION_KEY, "1");
    } catch {
      // El aviso sigue siendo descartable si el navegador bloquea el almacenamiento de sesión.
    }
  }, [visible]);

  const descartarAviso = () => {
    avisoAnchoMostradoEnEstaSesion = true;
    try {
      window.sessionStorage.setItem(AVISO_ANCHO_SESSION_KEY, "1");
    } catch {
      // El cierre no depende del almacenamiento de sesión.
    }
    if (noVolverAMostrar) {
      try {
        window.localStorage.setItem(AVISO_ANCHO_LOCAL_KEY, "1");
      } catch {
        // La preferencia es opcional; no debe bloquear el uso del panel.
      }
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside className="gestion-mobile-recommendation" role="status" aria-live="polite">
      <div className="gestion-mobile-recommendation-copy">
        <p>
          El panel Superadmin también funciona en celulares, pero recomendamos utilizar un
          computador o una tableta para una experiencia de gestión más cómoda.
        </p>
        <label htmlFor="gestion-mobile-notice-no-repeat">
          <input
            id="gestion-mobile-notice-no-repeat"
            type="checkbox"
            checked={noVolverAMostrar}
            onChange={(event) => setNoVolverAMostrar(event.currentTarget.checked)}
          />
          <span>No volver a mostrar</span>
        </label>
      </div>
      <button type="button" onClick={descartarAviso}>
        Entendido
      </button>
    </aside>
  );
}

function StatCard({
  label,
  value,
  detail,
  loading,
  error,
  Icon,
  tone,
}: {
  label: string;
  value: number | undefined;
  detail: string;
  loading: boolean;
  error: boolean;
  Icon: typeof MapPinned;
  tone: string;
}) {
  return (
    <article className={`gestion-stat-card ${tone}`}>
      <span className="gestion-stat-icon" aria-hidden="true">
        <Icon size={27} strokeWidth={2.1} />
      </span>
      <div className="gestion-stat-copy">
        <span className="gestion-stat-label">{label}</span>
        <strong>
          {loading ? "…" : error || value === undefined ? "—" : value.toLocaleString("es-CO")}
        </strong>
        <span className="gestion-stat-detail">{error ? "Dato no disponible" : detail}</span>
      </div>
    </article>
  );
}

export function CentroGestion() {
  const { esSuperadmin } = useAuth();
  const [veredaSeleccionada, setVeredaSeleccionada] = useState("");
  const [ahora, setAhora] = useState(() => new Date());
  const veredaFiltro = veredaSeleccionada || null;

  useEffect(() => {
    const intervalo = window.setInterval(() => setAhora(new Date()), 60_000);
    return () => window.clearInterval(intervalo);
  }, []);

  const veredas = useQuery({
    queryKey: adminQueryKeys.veredas.options,
    queryFn: consultarVeredasAdmin,
    staleTime: 30_000,
  });

  const veredasActivas = useQuery({
    queryKey: adminQueryKeys.veredas.activeCount,
    queryFn: async () => {
      const { count, error } = await supabase
        .from("veredas")
        .select("id", { count: "exact", head: true })
        .eq("activa", true);
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30_000,
  });

  const reportesTotales = useQuery({
    queryKey: adminQueryKeys.reports.total(veredaFiltro),
    queryFn: async () => {
      let query = supabase.from("reportes").select("id", { count: "exact", head: true });
      if (veredaFiltro) query = query.eq("vereda_id", veredaFiltro);
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30_000,
  });

  const reportesPendientes = useQuery({
    queryKey: adminQueryKeys.reports.pending(veredaFiltro),
    queryFn: async () => {
      let query = supabase
        .from("reportes")
        .select("id", { count: "exact", head: true })
        .eq("estado", "pendiente");
      if (veredaFiltro) query = query.eq("vereda_id", veredaFiltro);
      const { count, error } = await query;
      if (error) throw error;
      return count ?? 0;
    },
    staleTime: 30_000,
  });

  const publicacionesActivas = useQuery({
    queryKey: adminQueryKeys.publications.activeCount(veredaFiltro),
    queryFn: async () => {
      const tablas = ["emergencias", "vias", "servicios", "avisos"] as const;
      const resultados = await Promise.all(
        tablas.map(async (tabla) => {
          let query = supabase
            .from(tabla)
            .select("id", { count: "exact", head: true })
            .is("cerrado_en", null);
          if (veredaFiltro) query = query.eq("vereda_id", veredaFiltro);
          const { count, error } = await query;
          if (error) throw error;
          return count ?? 0;
        }),
      );
      return resultados.reduce((total, conteo) => total + conteo, 0);
    },
    staleTime: 30_000,
  });

  const recientes = useQuery({
    queryKey: adminQueryKeys.reports.recent(veredaFiltro),
    queryFn: async () => {
      let query = supabase
        .from("reportes")
        .select("id, titulo, categoria, estado, created_at, vereda_id")
        .order("created_at", { ascending: false })
        .order("id", { ascending: false });
      if (veredaFiltro) query = query.eq("vereda_id", veredaFiltro);
      const { data, error } = await query.limit(5);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });

  const categorias = useQuery({
    queryKey: adminQueryKeys.reports.categories(veredaFiltro),
    queryFn: async (): Promise<ConteoCategoria[]> =>
      Promise.all(
        CATEGORIAS_REPORTE.map(async ({ name, values, color }) => {
          let query = supabase.from("reportes").select("id", { count: "exact", head: true });
          const categoriaUnica = values[0];
          query =
            values.length === 1 && categoriaUnica
              ? query.eq("categoria", categoriaUnica)
              : query.in("categoria", values);
          if (veredaFiltro) query = query.eq("vereda_id", veredaFiltro);
          const { count, error } = await query;
          if (error) throw error;
          return { name, value: count ?? 0, color };
        }),
      ),
    staleTime: 30_000,
  });

  const actividad = useQuery({
    queryKey: adminQueryKeys.activity.recent,
    enabled: esSuperadmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("auditoria_admin")
        .select("id, accion, entidad_tipo, ocurrido_en, estado_anterior, estado_nuevo")
        .order("ocurrido_en", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 30_000,
  });

  const capacidad = useQuery({
    queryKey: adminQueryKeys.capacity.usage,
    enabled: esSuperadmin,
    queryFn: consultarCapacidadAdmin,
    staleTime: 60_000,
  });

  const totalCategorias = useMemo(
    () => (categorias.data ?? []).reduce((total, categoria) => total + categoria.value, 0),
    [categorias.data],
  );
  const nombresVeredas = useMemo(
    () => new Map((veredas.data ?? []).map((vereda) => [vereda.id, vereda.nombre])),
    [veredas.data],
  );
  const nombreSeleccionado = veredas.data?.find(
    (vereda) => vereda.id === veredaSeleccionada,
  )?.nombre;

  return (
    <div className="gestion-dashboard">
      <AvisoAnchoDisponible />
      <div className="gestion-dashboard-toolbar">
        <small className="gestion-dashboard-timestamp">
          <Clock3 size={14} aria-hidden="true" /> {fechaHoraBogota(ahora)}
        </small>
      </div>
      <header className="gestion-dashboard-heading">
        <div className="gestion-breadcrumb" aria-label="Ubicación">
          <span>Supervisión territorial</span>
          <span aria-hidden="true">/</span>
          <strong>Centro de Gestión</strong>
        </div>
        <div className="gestion-heading-row">
          <span className="gestion-heading-mark" aria-hidden="true">
            <ShieldCheck size={27} strokeWidth={2.1} />
          </span>
          <div className="gestion-heading-copy">
            <p className="gestion-kicker">Supervisión territorial</p>
            <h1>Centro de Gestión</h1>
            <p className="gestion-heading-subtitle">
              Una mirada general sobre lo que está pasando en Ebéjico.
            </p>
          </div>
          <label className="gestion-select-label" htmlFor="supervision-vereda">
            <span>Territorio</span>
            <select
              id="supervision-vereda"
              className="gestion-select"
              value={veredaSeleccionada}
              onChange={(event) => setVeredaSeleccionada(event.target.value)}
              aria-describedby="supervision-vereda-help"
            >
              <option value="">Todas las veredas</option>
              {(veredas.data ?? [])
                .filter((vereda) => vereda.activa)
                .map((vereda) => (
                  <option key={vereda.id} value={vereda.id}>
                    {vereda.nombre}
                  </option>
                ))}
            </select>
            <span id="supervision-vereda-help" className="sr-only">
              El selector filtra los reportes y publicaciones mostrados; no cambia los permisos de
              acceso.
            </span>
          </label>
        </div>
      </header>

      <div className="gestion-dashboard-grid">
        <div className="gestion-primary-column">
          <section className="gestion-stat-grid" aria-label="Indicadores del Centro de Gestión">
            <StatCard
              label="Veredas activas"
              value={veredasActivas.data}
              detail="en el municipio"
              loading={veredasActivas.isLoading}
              error={Boolean(veredasActivas.error)}
              Icon={MapPinned}
              tone="gestion-stat-territory"
            />
            <StatCard
              label="Pendientes de verificación"
              value={reportesPendientes.data}
              detail={nombreSeleccionado ?? "todas las veredas"}
              loading={reportesPendientes.isLoading}
              error={Boolean(reportesPendientes.error)}
              Icon={CircleAlert}
              tone="gestion-stat-pending"
            />
            <StatCard
              label="Reportes totales"
              value={reportesTotales.data}
              detail={nombreSeleccionado ?? "todas las veredas"}
              loading={reportesTotales.isLoading}
              error={Boolean(reportesTotales.error)}
              Icon={FileText}
              tone="gestion-stat-reports"
            />
            <StatCard
              label="Publicaciones activas"
              value={publicacionesActivas.data}
              detail="Emergencias, vías, servicios y avisos"
              loading={publicacionesActivas.isLoading}
              error={Boolean(publicacionesActivas.error)}
              Icon={FileCheck2}
              tone="gestion-stat-active"
            />
          </section>

          <div className="gestion-panel-grid">
            <section className="gestion-panel gestion-territory-panel">
              <div className="gestion-panel-heading">
                <span className="gestion-panel-icon" aria-hidden="true">
                  <MapPlus size={18} />
                </span>
                <div>
                  <h2>Resumen del territorio</h2>
                  <p>Vista referencial; no representa ubicaciones verificadas.</p>
                </div>
                <Link to="/mi-vereda" className="gestion-panel-link">
                  Veredas <ArrowRight size={15} />
                </Link>
              </div>
              <div className="gestion-territory-content">
                <div
                  className="gestion-map-placeholder"
                  role="img"
                  aria-label="Representación territorial provisional, sin ubicaciones reales"
                >
                  <span className="gestion-map-contour gestion-map-contour-one" />
                  <span className="gestion-map-contour gestion-map-contour-two" />
                  <span className="gestion-map-contour gestion-map-contour-three" />
                  <span className="gestion-map-label">Ebéjico · representación provisional</span>
                </div>
                <div className="gestion-territory-summary">
                  <div>
                    <MapPinned size={17} aria-hidden="true" />
                    <span>Veredas activas</span>
                    <strong>
                      {veredasActivas.isLoading
                        ? "…"
                        : veredasActivas.error
                          ? "—"
                          : veredasActivas.data}
                    </strong>
                  </div>
                  <div>
                    <CircleAlert size={17} aria-hidden="true" />
                    <span>Reportes pendientes</span>
                    <strong>
                      {reportesPendientes.isLoading
                        ? "…"
                        : reportesPendientes.error
                          ? "—"
                          : reportesPendientes.data}
                    </strong>
                  </div>
                  <div>
                    <Activity size={17} aria-hidden="true" />
                    <span>Reportes totales</span>
                    <strong>
                      {reportesTotales.isLoading
                        ? "…"
                        : reportesTotales.error
                          ? "—"
                          : reportesTotales.data}
                    </strong>
                  </div>
                  <Link to="/mi-vereda" className="gestion-territory-link">
                    Consultar veredas <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            </section>

            <section className="gestion-panel gestion-category-panel">
              <div className="gestion-panel-heading">
                <span className="gestion-panel-icon" aria-hidden="true">
                  <ChartNoAxesCombined size={18} />
                </span>
                <div>
                  <h2>Reportes por tipo</h2>
                  <p>{nombreSeleccionado ?? "Todas las veredas"}</p>
                </div>
              </div>
              {categorias.isLoading ? (
                <p className="gestion-panel-state" role="status">
                  Cargando categorías…
                </p>
              ) : categorias.error ? (
                <p className="gestion-panel-error" role="alert">
                  No pudimos cargar la distribución por tipo.
                </p>
              ) : totalCategorias === 0 ? (
                <p className="gestion-panel-state">Todavía no hay reportes para clasificar.</p>
              ) : (
                <div className="gestion-chart-content">
                  <div className="gestion-donut-wrap">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categorias.data ?? []}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="62%"
                          outerRadius="88%"
                          paddingAngle={2}
                          stroke="none"
                        >
                          {(categorias.data ?? []).map((item) => (
                            <Cell key={item.name} fill={item.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="gestion-donut-total">
                      <strong>{totalCategorias.toLocaleString("es-CO")}</strong>
                      <span>reportes</span>
                    </div>
                  </div>
                  <ul className="gestion-chart-legend">
                    {(categorias.data ?? []).map((item) => (
                      <li key={item.name}>
                        <span style={{ backgroundColor: item.color }} />
                        <span>{item.name}</span>
                        <strong>{item.value.toLocaleString("es-CO")}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          <div className="gestion-panel-grid gestion-lower-grid">
            <section className="gestion-panel gestion-recent-panel">
              <div className="gestion-panel-heading">
                <span className="gestion-panel-icon" aria-hidden="true">
                  <FileText size={18} />
                </span>
                <div>
                  <h2>Reportes recientes</h2>
                  <p>Los cinco más recientes, sin excluir estados.</p>
                </div>
                <Link to="/admin/reportes" className="gestion-panel-link">
                  Ver todos <ArrowRight size={15} />
                </Link>
              </div>
              {recientes.isLoading ? (
                <p className="gestion-panel-state" role="status">
                  Cargando reportes recientes…
                </p>
              ) : recientes.error ? (
                <p className="gestion-panel-error" role="alert">
                  No pudimos cargar los reportes recientes.
                </p>
              ) : (recientes.data ?? []).length === 0 ? (
                <p className="gestion-panel-state">Todavía no hay reportes disponibles.</p>
              ) : (
                <ul className="gestion-recent-list">
                  {(recientes.data ?? []).map((reporte) => (
                    <li key={reporte.id}>
                      <Link
                        to="/reportes/$id"
                        params={{ id: reporte.id }}
                        search={{
                          origen: "todos",
                          tabla: undefined,
                          contexto: "reportes",
                          registro: "reporte",
                        }}
                        className="gestion-recent-row-link"
                      >
                        <span
                          className={`gestion-report-type-icon gestion-report-type-${reporte.categoria}`}
                          aria-hidden="true"
                        >
                          <IconoCategoriaReporte categoria={reporte.categoria} />
                        </span>
                        <div className="gestion-recent-copy">
                          <strong className="gestion-recent-report-link">{reporte.titulo}</strong>
                          <span>
                            {LABEL_TIPO_REPORTE[
                              reporte.categoria as keyof typeof LABEL_TIPO_REPORTE
                            ] ?? reporte.categoria}{" "}
                            · {nombresVeredas.get(reporte.vereda_id) ?? "Vereda"}
                          </span>
                          <small>{fecha(reporte.created_at)}</small>
                        </div>
                        <span
                          className={`gestion-state-badge ${reporte.estado === "pendiente" ? "is-pending" : ""}`}
                        >
                          {etiquetaEstado(reporte.estado)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="gestion-panel gestion-activity-panel">
              <div className="gestion-panel-heading">
                <span className="gestion-panel-icon" aria-hidden="true">
                  <Activity size={18} />
                </span>
                <div>
                  <h2>Actividad administrativa reciente</h2>
                  <p>Registro existente de auditoría</p>
                </div>
                <Link to="/admin/jac-superadmin" hash="auditoria" className="gestion-panel-link">
                  Ver más <ArrowRight size={15} />
                </Link>
              </div>
              {actividad.isLoading ? (
                <p className="gestion-panel-state" role="status">
                  Cargando actividad…
                </p>
              ) : actividad.error ? (
                <p className="gestion-panel-error" role="alert">
                  No pudimos consultar la actividad administrativa.
                </p>
              ) : (actividad.data ?? []).length === 0 ? (
                <p className="gestion-panel-state">No hay eventos administrativos recientes.</p>
              ) : (
                <ul className="gestion-activity-list">
                  {(actividad.data ?? []).map((evento, index) => {
                    const presentacion = presentarActividadAdmin(evento);
                    const Icon = presentacion.Icon;
                    return (
                      <li key={evento.id}>
                        <span
                          className={`gestion-activity-mark gestion-activity-mark-${index % 4}`}
                          aria-hidden="true"
                        >
                          <Icon size={15} />
                        </span>
                        <div>
                          <strong>{presentacion.titulo}</strong>
                          <span>{presentacion.descripcion}</span>
                          <small>{fecha(evento.ocurrido_en)}</small>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </div>
        </div>

        <aside className="gestion-aside" aria-label="Información del sistema">
          <section className="gestion-panel gestion-capacity-panel">
            <div className="gestion-panel-heading">
              <span className="gestion-panel-icon" aria-hidden="true">
                <Database size={18} />
              </span>
              <div>
                <h2>Capacidad y almacenamiento</h2>
                <p>Uso reportado por la configuración</p>
              </div>
            </div>
            {capacidad.isLoading ? (
              <p className="gestion-panel-state" role="status">
                Cargando capacidad…
              </p>
            ) : capacidad.error ? (
              <p className="gestion-panel-error" role="alert">
                La información de capacidad no está disponible.
              </p>
            ) : capacidad.data ? (
              <div className="gestion-capacity-list">
                <CapacityItem
                  label="Fotos y archivos"
                  Icon={HardDrive}
                  value={capacidad.data.storage_bytes}
                  limit={capacidad.data.storage_limite_bytes}
                  percent={capacidad.data.storage_porcentaje}
                />
                <CapacityItem
                  label="Base de datos"
                  Icon={Database}
                  value={capacidad.data.bd_bytes}
                  limit={capacidad.data.bd_limite_bytes}
                  percent={capacidad.data.bd_porcentaje}
                />
                <p>Indicadores de uso existentes; no son un diagnóstico general de servicios.</p>
              </div>
            ) : null}
          </section>

          <EstadoSistemaCard />

          <GestionIllustrationCard />
        </aside>
      </div>
    </div>
  );
}

function GestionIllustrationCard() {
  const theme = useSyncExternalStore(subscribeThemeTarget, getThemeTarget, () => "light");
  const isDark = theme === "dark";

  return (
    <section className="gestion-illustration-card">
      <img
        src={
          isDark
            ? "/images/admin/centro-gestion/alertavereda-sede-ebejico-noche.png"
            : "/images/admin/centro-gestion/alertavereda-sede-ebejico.png"
        }
        width={1536}
        height={1024}
        alt={`La información oportuna también salva vidas. AlertaVereda · Sede Ebéjico. Paisaje rural ${isDark ? "nocturno" : "diurno"}.`}
        loading="lazy"
      />
    </section>
  );
}

function fechaHoraBogota(date: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    timeZone: "America/Bogota",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function IconoCategoriaReporte({ categoria }: { categoria: string }) {
  const Icon = ICONOS_CATEGORIA_REPORTE[categoria.trim().toLocaleLowerCase("es-CO")] ?? FileText;
  return <Icon size={17} />;
}

function normalizarCodigoActividad(valor: string | null | undefined) {
  return valor?.trim().toLocaleLowerCase("es-CO") ?? "";
}

function etiquetaEstadoAuditoria(estado: string | null) {
  if (!estado) return null;
  const normalizado = normalizarCodigoActividad(estado);
  return (
    ETIQUETAS_ESTADO_PUBLICO[normalizado as EstadoPublico] ??
    ETIQUETAS_ESTADO_AUDITORIA[normalizado] ??
    null
  );
}

function descripcionTransicionActividad(evento: EventoActividadAdmin) {
  const entidad =
    {
      reporte: "del reporte",
      reporte_demo: "del reporte ficticio",
      publicacion: "de la publicación",
      perfil: "del perfil",
      asignacion: "de la asignación administrativa",
      vereda: "de la vereda",
    }[normalizarCodigoActividad(evento.entidad_tipo)] ?? "del registro administrativo";
  const anterior = etiquetaEstadoAuditoria(evento.estado_anterior);
  const nuevo = etiquetaEstadoAuditoria(evento.estado_nuevo);

  if (anterior && nuevo) return `Estado ${entidad}: ${anterior} → ${nuevo}.`;
  if (nuevo) return `Estado ${entidad}: ${nuevo}.`;
  return "Se registró una actividad sobre el registro administrativo.";
}

function presentarActividadAdmin(evento: EventoActividadAdmin): PresentacionActividadAdmin {
  const accion = normalizarCodigoActividad(evento.accion);

  if (accion.startsWith("demo")) {
    const estadoNuevo = normalizarCodigoActividad(evento.estado_nuevo);
    const tituloEstado = TITULOS_ESTADO_DEMO[estadoNuevo];
    return {
      titulo: tituloEstado ? `DEMO · ${tituloEstado}` : "DEMO · Actividad administrativa ficticia",
      descripcion: descripcionTransicionActividad(evento),
      Icon: ICONOS_ESTADO_AUDITORIA[estadoNuevo] ?? Activity,
    };
  }

  if (accion === "reporte_cerrado") {
    const estadoNuevo = normalizarCodigoActividad(evento.estado_nuevo);
    if (estadoNuevo === "no_solucionado" || estadoNuevo === "cerrado_sin_solucion") {
      return {
        titulo: "Publicación cerrada sin solución",
        descripcion: "Se registró el cierre sin solución de la publicación.",
        Icon: CircleX,
      };
    }
    if (estadoNuevo === "solucionado" || estadoNuevo === "verificado_solucionado") {
      return {
        titulo: "Publicación solucionada",
        descripcion: "Se registró la solución de la publicación.",
        Icon: CircleCheck,
      };
    }
    return {
      titulo: "Publicación cerrada",
      descripcion: "Se registró el cierre de una publicación.",
      Icon: FileCheck2,
    };
  }

  return (
    PRESENTACION_POR_ACCION_ADMIN[accion] ?? {
      titulo: "Actividad administrativa registrada",
      descripcion: descripcionTransicionActividad(evento),
      Icon: Activity,
    }
  );
}

function EstadoSistemaCard() {
  return (
    <section id="estado-del-sistema" className="gestion-panel gestion-system-status-panel">
      <div className="gestion-panel-heading">
        <span className="gestion-panel-icon" aria-hidden="true">
          <Activity size={18} />
        </span>
        <div>
          <h2>Estado del sistema</h2>
          <p>Preparación frontend · sin conexiones reales</p>
        </div>
      </div>
      <ul className="gestion-system-status-list">
        {SERVICIOS_SISTEMA_DEMO.map(({ id, label, Icon, estado }) => (
          <li key={id}>
            <span className="gestion-system-status-service">
              <Icon size={15} aria-hidden="true" />
              <span>{label}</span>
            </span>
            <span className={`gestion-system-status-state is-${estado}`}>
              {ETIQUETA_ESTADO_SERVICIO[estado]}
            </span>
          </li>
        ))}
      </ul>
      <p className="gestion-system-status-note">
        Los estados se actualizarán cuando se habilite la supervisión de servicios
      </p>
    </section>
  );
}

function CapacityItem({
  label,
  Icon,
  value,
  limit,
  percent,
}: {
  label: string;
  Icon: typeof Database;
  value: number;
  limit: number | null;
  percent: number | null;
}) {
  const width = percent === null ? 0 : Math.min(Math.max(percent, 0), 100);
  const porcentajeTexto =
    percent === null ? "Porcentaje no disponible" : `${percent.toFixed(1)}% utilizado`;
  const limiteTexto = limit === null ? "Sin límite configurado" : `Límite ${formatearBytes(limit)}`;
  return (
    <div className="gestion-capacity-item">
      <div className="gestion-capacity-heading">
        <span>
          <Icon size={16} aria-hidden="true" />
          {label}
        </span>
        <strong>{formatearBytes(value)}</strong>
      </div>
      <div
        className="gestion-capacity-track"
        role={percent === null ? undefined : "progressbar"}
        aria-valuemin={percent === null ? undefined : 0}
        aria-valuemax={percent === null ? undefined : 100}
        aria-valuenow={percent === null ? undefined : width}
        aria-label={
          percent === null ? undefined : `${label}: ${percent.toFixed(1)} por ciento utilizado`
        }
      >
        <span style={{ width: `${width}%` }} />
      </div>
      <small>
        {porcentajeTexto} · {limiteTexto}
      </small>
    </div>
  );
}
