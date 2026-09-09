import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Carta, Vacio } from "@/components/carta";
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
import type { Database } from "@/integrations/supabase/types";

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
}: {
  scope: OperationScope;
  veredaId?: string | null;
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
  const scopeLabel = scope === "global" ? "todas las veredas" : "tu vereda asignada";

  return (
    <div className="admin-operation">
      <section className="admin-section-intro">
        <div>
          <p className="admin-section-kicker">
            {scope === "global" ? "Operación global" : "Alcance territorial"}
          </p>
          <h2>{scope === "global" ? "Reportes y publicaciones" : "Revisión de reportes"}</h2>
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

      <section className="admin-panel-card">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-section-kicker">Bandeja de entrada</p>
            <h3>Reportes pendientes</h3>
          </div>
          <span className="admin-count-badge">{pendientes.length}</span>
        </div>
        {pendientes.length === 0 && <Vacio texto="No hay reportes pendientes en esta vista." />}
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
                    setMotivosRechazo((actual) => ({ ...actual, [reporte.id]: event.target.value }))
                  }
                />
                <button
                  type="button"
                  disabled={rechazar.isPending || !(motivosRechazo[reporte.id] ?? "").trim()}
                  onClick={() =>
                    rechazar.mutate({ reporte, motivo: (motivosRechazo[reporte.id] ?? "").trim() })
                  }
                  className="admin-secondary-action"
                >
                  Rechazar
                </button>
              </div>
            </Carta>
          ))}
        </div>
      </section>

      <section className="admin-panel-card">
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
        />
      </section>

      <section className="admin-panel-card">
        <div className="admin-panel-heading">
          <div>
            <p className="admin-section-kicker">Trazabilidad</p>
            <h3>Reportes revisados</h3>
          </div>
        </div>
        {revisados.length === 0 && (
          <Vacio texto="Todavía no hay reportes revisados en esta vista." />
        )}
        <div className="admin-card-stack">
          {revisados.map((reporte) => (
            <Carta
              key={reporte.id}
              titulo={reporte.titulo}
              meta={`${reporte.estado} · ${fecha(reporte.revisado_en)} · ${reporte.veredas?.nombre ?? "Vereda"}`}
            >
              {reporte.descripcion}
            </Carta>
          ))}
        </div>
      </section>

      {(scope === "global" || esAdminVereda || esSuperadmin) && (
        <p className="admin-operation-note">
          La vista es una ayuda de navegación. La autorización territorial efectiva continúa en RLS
          y en las RPC existentes.
        </p>
      )}
    </div>
  );
}

function PublicacionesVigentes({
  publicaciones,
  nombreVereda,
  onCerrar,
  cerrando,
}: {
  publicaciones: Publicaciones | undefined;
  nombreVereda: Map<string, string>;
  onCerrar: (args: Cierre) => void;
  cerrando: boolean;
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

  return (
    <div className="admin-card-stack">
      {vigentes.length === 0 && <Vacio texto="No hay publicaciones activas en esta vista." />}
      {vigentes.map((publicacion) => {
        const enEdicion = pendiente?.id === publicacion.id && pendiente.tabla === publicacion.tabla;
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
                    {pendiente.resultado === "retirado" ? "Retirar" : "Cerrar como no solucionado"}
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
  );
}
