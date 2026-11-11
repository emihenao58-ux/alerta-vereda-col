import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Carta, Vacio } from "@/components/carta";
import { AdminJacSummary } from "@/components/admin/admin-jac-summary";
import {
  GaleriaEvidencia,
  PurgaPublicacion,
  PurgaReporte,
  type ReportePurgable,
} from "@/components/admin/purga-definitiva";
import { useAuth } from "@/hooks/use-auth";
import {
  ETIQUETA_ESTADO,
  fecha,
  LABEL_SEVERIDAD,
  LABEL_TIPO_SERVICIO,
  URL_FOTO,
  type ResultadoCierre,
  type Severidad,
  type TipoServicio,
} from "@/lib/alerta";
import {
  consultarPublicacionesCerradas,
  type MiVeredaPublicacionCerrada,
} from "@/lib/mi-vereda-cartelera";
import type { Database } from "@/integrations/supabase/types";
import type { VistaPanelJac } from "@/lib/admin-jac-navigation";

export type OperationScope = "local" | "global";

type Reporte = Database["public"]["Tables"]["reportes"]["Row"] & {
  veredas: { nombre: string } | null;
};
type TablaPublicacion = "emergencias" | "vias" | "servicios" | "avisos";
type EstadoEmergencia = "Activa" | "En observación";
type EstadoServicio = "Normal" | "Intermitente" | "Interrumpido";

type Publicacion = {
  id: string;
  titulo: string;
  vereda_id: string;
  estado?: string | null;
  cerrado_en: string | null;
  resultado: string | null;
  razon_cierre: string | null;
  foto_url?: string | null;
};

type Publicaciones = {
  emergencias: Publicacion[];
  vias: Publicacion[];
  servicios: Publicacion[];
  avisos: Publicacion[];
};

type Cierre = {
  tabla: TablaPublicacion;
  id: string;
  resultado: ResultadoCierre;
  motivo?: string;
};

const LABEL_CATEGORIA: Record<string, string> = {
  emergencia: "Emergencia",
  via: "Vía",
  servicio: "Servicio",
  otro: "Aviso",
  aviso: "Aviso",
};

const campo =
  "mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm";

export function AdminOperation({
  scope,
  veredaId,
  view = "todas",
}: {
  scope: OperationScope;
  veredaId?: string | null;
  view?: VistaPanelJac | "todas";
}) {
  const { esAdmin, esAdminVereda, esSuperadmin } = useAuth();
  const qc = useQueryClient();
  const [niveles, setNiveles] = useState<Record<string, Severidad>>({});
  const [estadosEmergencia, setEstadosEmergencia] = useState<Record<string, EstadoEmergencia>>({});
  const [estadosServicio, setEstadosServicio] = useState<Record<string, EstadoServicio>>({});
  const [tiposServicio, setTiposServicio] = useState<Record<string, TipoServicio>>({});
  const [motivosRechazo, setMotivosRechazo] = useState<Record<string, string>>({});

  const reportes = useQuery({
    queryKey: ["reportes-admin"],
    enabled: esAdmin,
    ...(scope === "local" ? { retry: false } : {}),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reportes")
        .select("*, veredas(nombre)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Reporte[];
    },
  });

  const publicaciones = useQuery({
    queryKey: ["publicaciones-admin"],
    enabled: esAdmin,
    ...(scope === "local" ? { retry: false } : {}),
    queryFn: async () => {
      const [emergencias, vias, servicios, avisos] = await Promise.all([
        supabase
          .from("emergencias")
          .select("id, titulo, vereda_id, estado, cerrado_en, resultado, razon_cierre, foto_url")
          .order("created_at", { ascending: false }),
        supabase
          .from("vias")
          .select("id, titulo, vereda_id, estado, cerrado_en, resultado, razon_cierre, foto_url")
          .order("created_at", { ascending: false }),
        supabase
          .from("servicios")
          .select("id, titulo, vereda_id, estado, cerrado_en, resultado, razon_cierre, foto_url")
          .order("created_at", { ascending: false }),
        supabase
          .from("avisos")
          .select("id, titulo, vereda_id, cerrado_en, resultado, razon_cierre")
          .order("created_at", { ascending: false }),
      ]);
      for (const result of [emergencias, vias, servicios, avisos]) {
        if (result.error) throw result.error;
      }
      return {
        emergencias: (emergencias.data ?? []) as Publicacion[],
        vias: (vias.data ?? []) as Publicacion[],
        servicios: (servicios.data ?? []) as Publicacion[],
        avisos: (avisos.data ?? []) as Publicacion[],
      } satisfies Publicaciones;
    },
  });

  const publicacionesCerradas = useQuery({
    queryKey: ["publicaciones-cerradas-admin"],
    enabled: esSuperadmin,
    queryFn: consultarPublicacionesCerradas,
  });

  const veredas = useQuery({
    queryKey: ["veredas-public-admin"],
    enabled: esAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("veredas").select("id, nombre").order("nombre");
      if (error) throw error;
      return data ?? [];
    },
  });

  const nombreVereda = useMemo(
    () => new Map((veredas.data ?? []).map((vereda) => [vereda.id, vereda.nombre])),
    [veredas.data],
  );

  const reportesVisibles = useMemo(
    () => (reportes.data ?? []).filter((reporte) => !veredaId || reporte.vereda_id === veredaId),
    [reportes.data, veredaId],
  );

  const publicacionesVisibles = useMemo(() => {
    if (!publicaciones.data) return undefined;
    return {
      emergencias: publicaciones.data.emergencias.filter(
        (publicacion) => !veredaId || publicacion.vereda_id === veredaId,
      ),
      vias: publicaciones.data.vias.filter(
        (publicacion) => !veredaId || publicacion.vereda_id === veredaId,
      ),
      servicios: publicaciones.data.servicios.filter(
        (publicacion) => !veredaId || publicacion.vereda_id === veredaId,
      ),
      avisos: publicaciones.data.avisos.filter(
        (publicacion) => !veredaId || publicacion.vereda_id === veredaId,
      ),
    } satisfies Publicaciones;
  }, [publicaciones.data, veredaId]);

  const invalidar = () => {
    void qc.invalidateQueries({ queryKey: ["reportes-admin"] });
    void qc.invalidateQueries({ queryKey: ["publicaciones-admin"] });
    void qc.invalidateQueries({ queryKey: ["publicaciones-cerradas-admin"] });
  };

  const aprobar = useMutation({
    mutationFn: async (reporte: Reporte) => {
      const { error } = await supabase.rpc("aprobar_reporte", {
        p_reporte_id: reporte.id,
        p_modo: "crear",
        ...(reporte.categoria === "via"
          ? {
              p_estado_inicial:
                niveles[reporte.id] === "urgente"
                  ? "Cerrada"
                  : niveles[reporte.id] === "atencion"
                    ? "Precaución"
                    : "Habilitada",
            }
          : {}),
        ...(reporte.categoria === "servicio"
          ? {
              p_estado_inicial: estadosServicio[reporte.id] ?? "Normal",
              p_tipo_servicio: tiposServicio[reporte.id] ?? "agua",
            }
          : {}),
        ...(reporte.categoria === "emergencia"
          ? { p_emergencia_estado: estadosEmergencia[reporte.id] ?? "Activa" }
          : {}),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reporte aprobado y publicación creada.");
      invalidar();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rechazar = useMutation({
    mutationFn: async ({ reporte, motivo }: { reporte: Reporte; motivo: string }) => {
      const { error } = await supabase.rpc("rechazar_reporte", {
        p_reporte_id: reporte.id,
        p_motivo: motivo,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reporte rechazado.");
      invalidar();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const cerrar = useMutation({
    mutationFn: async ({ tabla, id, resultado, motivo }: Cierre) => {
      if (resultado === "retirado") {
        const { error } = await supabase.rpc("retirar_publicacion", {
          p_tabla: tabla,
          p_id: id,
          ...(motivo ? { p_motivo: motivo } : {}),
          p_finalizacion_natural: false,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.rpc("cerrar_publicacion", {
          p_tabla: tabla,
          p_id: id,
          p_resultado: resultado,
          ...(motivo ? { p_motivo: motivo } : {}),
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Publicación actualizada sin borrar el historial.");
      invalidar();
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const pendientes = reportesVisibles.filter((reporte) => reporte.estado === "pendiente");
  const revisados = reportesVisibles.filter((reporte) => reporte.estado !== "pendiente");
  const publicacionesActivas = publicacionesVisibles
    ? Object.values(publicacionesVisibles).reduce(
        (total, items) =>
          total + items.filter((publicacion) => publicacion.cerrado_en === null).length,
        0,
      )
    : null;
  const estadoResumenReportes = reportes.error
    ? "error"
    : reportes.data === undefined
      ? "loading"
      : "ready";
  const estadoResumenPublicaciones = publicaciones.error
    ? "error"
    : publicaciones.data === undefined
      ? "loading"
      : "ready";
  const textoPendientes =
    scope === "global" || reportes.data !== undefined
      ? String(pendientes.length)
      : reportes.error
        ? "—"
        : "…";
  const etiquetaPendientes =
    reportes.data !== undefined
      ? `${pendientes.length} reportes pendientes`
      : reportes.error
        ? "Conteo de reportes no disponible"
        : "Cargando conteo de reportes";
  const scopeLabel = scope === "global" ? "todas las veredas" : "tu vereda asignada";

  return (
    <div
      className={`admin-operation${scope === "local" ? " admin-operation-local" : ""}${scope === "local" && view !== "resumen" && view !== "todas" ? " admin-operation-local-view" : ""}`}
    >
      {scope === "global" && (
        <section className="admin-section-intro">
          <div>
            <p className="admin-section-kicker">Operación global</p>
            <h2>Reportes y publicaciones</h2>
            <p>
              Trabajas sobre {scopeLabel}. Las decisiones se ejecutan con las funciones
              transaccionales existentes.
            </p>
          </div>
          <div className="admin-stat-pill" aria-label={`${pendientes.length} reportes pendientes`}>
            <span className="admin-stat-number">{pendientes.length}</span>
            <span>pendientes</span>
          </div>
        </section>
      )}

      {scope === "local" && (view === "resumen" || view === "todas") && (
        <AdminJacSummary
          pendingCount={reportes.data ? pendientes.length : null}
          activePublicationCount={publicaciones.data ? publicacionesActivas : null}
          reviewedCount={reportes.data ? revisados.length : null}
          reportState={estadoResumenReportes}
          publicationState={estadoResumenPublicaciones}
        />
      )}

      {(scope === "global" || view === "todas" || view === "reportes-pendientes") && (
        <section
          className={`admin-panel-card ${scope === "local" ? "admin-jac-operation-pending" : ""}`}
          id={scope === "local" ? "jac-reportes-pendientes" : undefined}
        >
          <div className="admin-panel-heading">
            <div>
              <p className="admin-section-kicker">Bandeja de entrada</p>
              <h3>Reportes pendientes</h3>
            </div>
            <span
              className="admin-count-badge"
              aria-label={scope === "local" ? etiquetaPendientes : undefined}
            >
              {textoPendientes}
            </span>
          </div>
          {scope === "local" && (
            <EstadoConsultaLocal
              etiqueta="los reportes"
              cargando={reportes.isLoading}
              error={reportes.error}
              tieneDatos={reportes.data !== undefined}
              reintentando={reportes.isFetching}
              onReintentar={() => void reportes.refetch()}
            />
          )}
          {pendientes.length === 0 &&
            (scope === "global" || (reportes.isSuccess && !reportes.error)) && (
              <Vacio texto="No hay reportes pendientes en esta vista." />
            )}
          <div className="admin-card-stack">
            {pendientes.map((reporte) => (
              <Carta
                key={reporte.id}
                titulo={reporte.titulo}
                meta={`${LABEL_CATEGORIA[reporte.categoria] ?? reporte.categoria} · ${reporte.veredas?.nombre ?? "Vereda"} · ${fecha(reporte.created_at)}`}
              >
                <p>{reporte.descripcion}</p>
                {reporte.lugar && <p className="mt-1">Lugar: {reporte.lugar}</p>}
                {URL_FOTO(reporte.foto_url) && (
                  <img
                    src={URL_FOTO(reporte.foto_url)!}
                    alt="Foto del reporte"
                    className="mt-2 max-h-64 rounded-md border object-cover"
                  />
                )}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="text-sm font-medium">
                    Nivel
                    <select
                      className={campo}
                      value={niveles[reporte.id] ?? reporte.nivel ?? "normal"}
                      onChange={(event) =>
                        setNiveles((actual) => ({
                          ...actual,
                          [reporte.id]: event.target.value as Severidad,
                        }))
                      }
                    >
                      {(["urgente", "atencion", "normal"] as const).map((nivel) => (
                        <option key={nivel} value={nivel}>
                          {LABEL_SEVERIDAD[nivel]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {reporte.categoria === "emergencia" && (
                    <label className="text-sm font-medium">
                      Estado de emergencia
                      <select
                        className={campo}
                        value={estadosEmergencia[reporte.id] ?? "Activa"}
                        onChange={(event) =>
                          setEstadosEmergencia((actual) => ({
                            ...actual,
                            [reporte.id]: event.target.value as EstadoEmergencia,
                          }))
                        }
                      >
                        <option value="Activa">Activa</option>
                        <option value="En observación">En observación</option>
                      </select>
                    </label>
                  )}
                  {reporte.categoria === "servicio" && (
                    <>
                      <label className="text-sm font-medium">
                        Tipo de servicio
                        <select
                          className={campo}
                          value={tiposServicio[reporte.id] ?? "agua"}
                          onChange={(event) =>
                            setTiposServicio((actual) => ({
                              ...actual,
                              [reporte.id]: event.target.value as TipoServicio,
                            }))
                          }
                        >
                          {(Object.keys(LABEL_TIPO_SERVICIO) as TipoServicio[]).map((tipo) => (
                            <option key={tipo} value={tipo}>
                              {LABEL_TIPO_SERVICIO[tipo]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-sm font-medium">
                        Estado del servicio
                        <select
                          className={campo}
                          value={estadosServicio[reporte.id] ?? "Normal"}
                          onChange={(event) =>
                            setEstadosServicio((actual) => ({
                              ...actual,
                              [reporte.id]: event.target.value as EstadoServicio,
                            }))
                          }
                        >
                          <option value="Normal">Normal</option>
                          <option value="Intermitente">Intermitente</option>
                          <option value="Interrumpido">Interrumpido</option>
                        </select>
                      </label>
                    </>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => aprobar.mutate(reporte)}
                    disabled={aprobar.isPending}
                    className="admin-primary-action"
                  >
                    Verificar y publicar
                  </button>
                  <input
                    className="min-w-52 flex-1 rounded-md border px-3 py-2 text-sm"
                    placeholder="Motivo de rechazo"
                    aria-label={`Motivo de rechazo para ${reporte.titulo}`}
                    value={motivosRechazo[reporte.id] ?? ""}
                    onChange={(event) =>
                      setMotivosRechazo((actual) => ({
                        ...actual,
                        [reporte.id]: event.target.value,
                      }))
                    }
                  />
                  <button
                    type="button"
                    disabled={rechazar.isPending || !(motivosRechazo[reporte.id] ?? "").trim()}
                    onClick={() =>
                      rechazar.mutate({
                        reporte,
                        motivo: (motivosRechazo[reporte.id] ?? "").trim(),
                      })
                    }
                    className="admin-secondary-action"
                  >
                    Rechazar
                  </button>
                  {scope === "global" && esSuperadmin && (
                    <PurgaReporte reporte={reporte as ReportePurgable} onDone={invalidar} />
                  )}
                </div>
              </Carta>
            ))}
          </div>
        </section>
      )}

      {(scope === "global" || view === "todas" || view === "publicaciones-activas") && (
        <section
          className={`admin-panel-card ${scope === "local" ? "admin-jac-operation-active" : ""}`}
          id={scope === "local" ? "jac-publicaciones-activas" : undefined}
        >
          <div className="admin-panel-heading">
            <div>
              <p className="admin-section-kicker">Historial vivo</p>
              <h3>Publicaciones activas</h3>
            </div>
            <p className="admin-panel-note">Cerrar o retirar conserva la fila y la auditoría.</p>
          </div>
          <PublicacionesVigentes
            publicaciones={publicacionesVisibles}
            nombreVereda={nombreVereda}
            onCerrar={cerrar.mutate}
            cerrando={cerrar.isPending}
            cargando={scope === "local" && publicaciones.isLoading}
            error={scope === "local" ? publicaciones.error : null}
            reintentando={publicaciones.isFetching}
            onReintentar={() => void publicaciones.refetch()}
          />
        </section>
      )}

      {scope === "global" && esSuperadmin && (
        <section className="admin-panel-card">
          <div className="admin-panel-heading">
            <div>
              <p className="admin-section-kicker">Purga controlada</p>
              <h3>Publicaciones cerradas</h3>
            </div>
            <p className="admin-panel-note">Incluye solucionadas, no solucionadas y retiradas.</p>
          </div>
          <PublicacionesCerradas
            publicaciones={publicacionesCerradas.data}
            cargando={publicacionesCerradas.isLoading}
            error={publicacionesCerradas.error}
            onDone={invalidar}
          />
        </section>
      )}

      {(scope === "global" || view === "todas" || view === "reportes-revisados") && (
        <section
          className={`admin-panel-card ${scope === "local" ? "admin-jac-operation-reviewed" : ""}`}
          id={scope === "local" ? "jac-reportes-revisados" : undefined}
        >
          <div className="admin-panel-heading">
            <div>
              <p className="admin-section-kicker">Trazabilidad</p>
              <h3>Reportes revisados</h3>
            </div>
          </div>
          {scope === "local" && (
            <EstadoConsultaLocal
              etiqueta="el historial de reportes"
              cargando={reportes.isLoading}
              error={reportes.error}
              tieneDatos={reportes.data !== undefined}
              reintentando={reportes.isFetching}
              onReintentar={() => void reportes.refetch()}
            />
          )}
          {revisados.length === 0 &&
            (scope === "global" || (reportes.isSuccess && !reportes.error)) && (
              <Vacio texto="Todavía no hay reportes revisados en esta vista." />
            )}
          <div className="admin-card-stack">
            {revisados.map((reporte) => (
              <Carta
                key={reporte.id}
                titulo={reporte.titulo}
                meta={`${reporte.estado} · ${fecha(reporte.revisado_en)} · ${reporte.veredas?.nombre ?? "Vereda"}`}
              >
                <GaleriaEvidencia fotos={[reporte.foto_url]} />
                {reporte.descripcion}
                {scope === "global" && esSuperadmin && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <PurgaReporte reporte={reporte as ReportePurgable} onDone={invalidar} />
                  </div>
                )}
              </Carta>
            ))}
          </div>
        </section>
      )}

      {(scope === "global" || esAdminVereda || esSuperadmin) && (
        <p className="admin-operation-note">
          La vista es una ayuda de navegación. La autorización territorial efectiva continúa en RLS
          y en las RPC existentes.
        </p>
      )}
    </div>
  );
}

function EstadoConsultaLocal({
  etiqueta,
  cargando,
  error,
  tieneDatos,
  reintentando,
  onReintentar,
}: {
  etiqueta: string;
  cargando: boolean;
  error: Error | null;
  tieneDatos: boolean;
  reintentando: boolean;
  onReintentar: () => void;
}) {
  if (error && tieneDatos) {
    return (
      <p className="admin-jac-query-stale" role="status">
        No fue posible actualizar {etiqueta}. Se muestran los datos cargados anteriormente.
      </p>
    );
  }

  if (error) {
    return (
      <div className="admin-jac-query-error" role="alert">
        <p>No pudimos cargar {etiqueta}. Intenta de nuevo.</p>
        <button
          type="button"
          className="admin-secondary-action"
          disabled={reintentando}
          onClick={onReintentar}
        >
          {reintentando ? "Reintentando…" : "Reintentar"}
        </button>
      </div>
    );
  }

  if (cargando && !tieneDatos) return <Vacio texto={`Cargando ${etiqueta}…`} />;
  return null;
}

function PublicacionesCerradas({
  publicaciones,
  cargando,
  error,
  onDone,
}: {
  publicaciones: MiVeredaPublicacionCerrada[] | undefined;
  cargando: boolean;
  error: Error | null;
  onDone: () => void;
}) {
  if (cargando) return <Vacio texto="Cargando publicaciones cerradas…" />;
  if (error) {
    return (
      <div className="admin-access-card" role="alert">
        No pudimos cargar las publicaciones cerradas. {error.message}
      </div>
    );
  }
  if (!publicaciones || publicaciones.length === 0) {
    return <Vacio texto="No hay publicaciones cerradas para purgar." />;
  }

  return (
    <div className="admin-card-stack">
      {publicaciones.map((publicacion) => (
        <Carta
          key={`${publicacion.publicacion_tabla}-${publicacion.publicacion_id}`}
          titulo={publicacion.titulo}
          meta={`${publicacion.categoria} · ${publicacion.vereda_nombre ?? "Vereda"} · Cerrada ${fecha(publicacion.cerrado_en)}`}
        >
          <p>{publicacion.descripcion}</p>
          <GaleriaEvidencia fotos={[publicacion.foto_url]} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-[color:var(--admin-muted)]">
              Resultado: <strong>{publicacion.resultado}</strong>
            </span>
            <PurgaPublicacion publicacion={publicacion} onDone={onDone} />
          </div>
        </Carta>
      ))}
    </div>
  );
}

function PublicacionesVigentes({
  publicaciones,
  nombreVereda,
  onCerrar,
  cerrando,
  cargando,
  error,
  reintentando,
  onReintentar,
}: {
  publicaciones: Publicaciones | undefined;
  nombreVereda: Map<string, string>;
  onCerrar: (args: Cierre) => void;
  cerrando: boolean;
  cargando: boolean;
  error: Error | null;
  reintentando: boolean;
  onReintentar: () => void;
}) {
  const [pendiente, setPendiente] = useState<{
    tabla: TablaPublicacion;
    id: string;
    titulo: string;
    resultado: "no_solucionado" | "retirado";
  } | null>(null);
  const [razon, setRazon] = useState("");

  const vigentes = useMemo(() => {
    const todos = [
      ...(publicaciones?.emergencias.map((p) => ({ ...p, tabla: "emergencias" as const })) ?? []),
      ...(publicaciones?.vias.map((p) => ({ ...p, tabla: "vias" as const })) ?? []),
      ...(publicaciones?.servicios.map((p) => ({ ...p, tabla: "servicios" as const })) ?? []),
      ...(publicaciones?.avisos.map((p) => ({ ...p, tabla: "avisos" as const })) ?? []),
    ];
    return todos.filter((p) => p.cerrado_en === null).sort((a, b) => b.id.localeCompare(a.id));
  }, [publicaciones]);

  if (cargando && !publicaciones) return <Vacio texto="Cargando publicaciones activas…" />;
  if (error && !publicaciones) {
    return (
      <EstadoConsultaLocal
        etiqueta="las publicaciones"
        cargando={cargando}
        error={error}
        tieneDatos={false}
        reintentando={reintentando}
        onReintentar={onReintentar}
      />
    );
  }

  return (
    <>
      {error && publicaciones && (
        <EstadoConsultaLocal
          etiqueta="las publicaciones"
          cargando={cargando}
          error={error}
          tieneDatos
          reintentando={reintentando}
          onReintentar={onReintentar}
        />
      )}
      <div className="admin-card-stack">
        {vigentes.length === 0 && !error && (
          <Vacio texto="No hay publicaciones activas en esta vista." />
        )}
        {vigentes.map((publicacion) => {
          const enEdicion =
            pendiente?.id === publicacion.id && pendiente.tabla === publicacion.tabla;
          const tipoEtiqueta =
            publicacion.tabla === "emergencias"
              ? "emergencia"
              : publicacion.tabla === "vias"
                ? "via"
                : publicacion.tabla === "servicios"
                  ? "servicio"
                  : "avisos";
          const estadoVisual = ETIQUETA_ESTADO(
            tipoEtiqueta,
            publicacion.estado,
            publicacion.resultado,
            publicacion.razon_cierre,
          );
          return (
            <Carta
              key={`${publicacion.tabla}-${publicacion.id}`}
              titulo={publicacion.titulo}
              meta={`${nombreVereda.get(publicacion.vereda_id) ?? "Vereda"} · ${estadoVisual}`}
            >
              {enEdicion ? (
                <form
                  className="space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    if (!razon.trim()) {
                      toast.error("Escribe una razón.");
                      return;
                    }
                    onCerrar({
                      tabla: pendiente.tabla,
                      id: pendiente.id,
                      resultado: pendiente.resultado,
                      motivo: razon.trim(),
                    });
                    setPendiente(null);
                    setRazon("");
                  }}
                >
                  <textarea
                    className="w-full rounded-md border p-2 text-sm"
                    value={razon}
                    onChange={(event) => setRazon(event.target.value)}
                    placeholder="Motivo obligatorio"
                    aria-label={`Motivo para actualizar ${publicacion.titulo}`}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button type="submit" disabled={cerrando} className="admin-secondary-action">
                      {pendiente.resultado === "retirado"
                        ? "Retirar"
                        : "Cerrar como no solucionado"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendiente(null);
                        setRazon("");
                      }}
                      className="admin-quiet-action"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={cerrando}
                    onClick={() =>
                      onCerrar({
                        tabla: publicacion.tabla,
                        id: publicacion.id,
                        resultado: "solucionado",
                      })
                    }
                    className="admin-primary-action"
                  >
                    Marcar solucionado
                  </button>
                  <button
                    type="button"
                    disabled={cerrando}
                    onClick={() =>
                      setPendiente({
                        tabla: publicacion.tabla,
                        id: publicacion.id,
                        titulo: publicacion.titulo,
                        resultado: "no_solucionado",
                      })
                    }
                    className="admin-secondary-action"
                  >
                    No solucionado
                  </button>
                  <button
                    type="button"
                    disabled={cerrando}
                    onClick={() =>
                      setPendiente({
                        tabla: publicacion.tabla,
                        id: publicacion.id,
                        titulo: publicacion.titulo,
                        resultado: "retirado",
                      })
                    }
                    className="admin-danger-action"
                  >
                    Retirar
                  </button>
                </div>
              )}
            </Carta>
          );
        })}
      </div>
    </>
  );
}
