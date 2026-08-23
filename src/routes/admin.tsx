import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Carta, TituloModulo, Vacio } from "@/components/carta";
import { AdminSupervision } from "@/components/admin-supervision";
import { useAuth } from "@/hooks/use-auth";
import {
  fecha,
  LABEL_RESULTADO_CIERRE,
  LABEL_SEVERIDAD,
  COLOR_SEVERIDAD,
  URL_FOTO,
  type ResultadoCierre,
  type Severidad,
} from "@/lib/alerta";
import type { Database } from "@/integrations/supabase/types";

type Reporte = Database["public"]["Tables"]["reportes"]["Row"] & {
  veredas: { nombre: string } | null;
};
type TablaPublicacion = "emergencias" | "vias" | "servicios" | "avisos";
type EstadoEmergencia = "Activa" | "En observación";
type EstadoServicio = "Normal" | "Intermitente" | "Interrumpido";
type TipoServicio = "agua" | "energia" | "senal" | "internet" | "luz" | "otro";

const LABEL_CATEGORIA: Record<string, string> = {
  emergencia: "Emergencia",
  via: "Vía",
  servicio: "Servicio",
  otro: "Aviso",
  aviso: "Aviso",
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de administración · AlertaVereda Ebéjico" },
      {
        name: "description",
        content: "Verifica los reportes dentro del alcance territorial autorizado.",
      },
    ],
  }),
  component: Admin,
});

function Admin() {
  const { usuario, perfil, esAdmin, esSuperadmin, solicitudPendiente, cargando } = useAuth();
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
      for (const result of [emergencias, vias, servicios, avisos])
        if (result.error) throw result.error;
      return {
        emergencias: emergencias.data ?? [],
        vias: vias.data ?? [],
        servicios: servicios.data ?? [],
        avisos: avisos.data ?? [],
      };
    },
  });

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
    mutationFn: async ({
      tabla,
      id,
      resultado,
      motivo,
    }: {
      tabla: TablaPublicacion;
      id: string;
      resultado: ResultadoCierre;
      motivo?: string;
    }) => {
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

  if (cargando)
    return (
      <AppShell>
        <Vacio texto="Cargando…" />
      </AppShell>
    );

  if (!usuario) {
    return (
      <AppShell>
        <TituloModulo
          titulo="Panel de administración"
          bajada="Solo para administradores autorizados."
        />
        <p className="carta mt-4 text-sm">
          <Link to="/auth" className="font-semibold underline underline-offset-4">
            Inicia sesión
          </Link>{" "}
          para continuar.
        </p>
      </AppShell>
    );
  }

  if (solicitudPendiente || !esAdmin) {
    return (
      <AppShell>
        <TituloModulo
          titulo="Panel de administración"
          bajada="Solo para administradores autorizados."
        />
        <Vacio
          texto={
            solicitudPendiente
              ? "Tu solicitud está pendiente de revisión por el superadmin."
              : perfil?.estado_cuenta === "suspendida"
                ? "Tu acceso administrativo está suspendido."
                : "Tu cuenta no tiene permisos administrativos."
          }
        />
      </AppShell>
    );
  }

  const pendientes = reportes.data?.filter((reporte) => reporte.estado === "pendiente") ?? [];
  const revisados = reportes.data?.filter((reporte) => reporte.estado !== "pendiente") ?? [];

  return (
    <AppShell>
      <TituloModulo
        titulo={esSuperadmin ? "Panel de superadmin" : "Panel de administración"}
        bajada={
          esSuperadmin
            ? "Supervisa solicitudes y publicaciones de todas las veredas."
            : "Gestiona únicamente la vereda que tienes asignada."
        }
      />

      <h2 className="mt-6 text-lg font-semibold">Pendientes de revisión ({pendientes.length})</h2>
      {pendientes.length === 0 && <Vacio texto="No hay reportes pendientes." />}
      {pendientes.map((reporte) => (
        <Carta
          key={reporte.id}
          titulo={reporte.titulo}
          meta={`${LABEL_CATEGORIA[reporte.categoria] ?? reporte.categoria} · ${reporte.veredas?.nombre ?? ""} · ${fecha(reporte.created_at)}`}
        >
          <p>{reporte.descripcion}</p>
          {reporte.lugar && <p className="mt-1">Lugar: {reporte.lugar}</p>}
          {URL_FOTO(reporte.foto_url) && (
            <img
              src={URL_FOTO(reporte.foto_url)!}
              alt="Foto del reporte"
              className="mt-2 max-h-64 rounded-md border"
            />
          )}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Nivel
              <select
                className="mt-1 w-full rounded-md border bg-[color:var(--card)] px-3 py-2 text-sm"
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
                  className="mt-1 w-full rounded-md border bg-[color:var(--card)] px-3 py-2 text-sm"
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
                    className="mt-1 w-full rounded-md border bg-[color:var(--card)] px-3 py-2 text-sm"
                    value={tiposServicio[reporte.id] ?? "agua"}
                    onChange={(event) =>
                      setTiposServicio((actual) => ({
                        ...actual,
                        [reporte.id]: event.target.value as TipoServicio,
                      }))
                    }
                  >
                    {(["agua", "energia", "senal", "internet", "luz", "otro"] as const).map(
                      (tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="text-sm font-medium">
                  Estado del servicio
                  <select
                    className="mt-1 w-full rounded-md border bg-[color:var(--card)] px-3 py-2 text-sm"
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
              className="rounded-md bg-[color:var(--bosque)] px-3 py-2 text-sm font-semibold text-[color:var(--card)]"
            >
              Verificar y publicar
            </button>
            <input
              className="min-w-52 flex-1 rounded-md border px-3 py-2 text-sm"
              placeholder="Motivo de rechazo"
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
              className="rounded-md border px-3 py-2 text-sm font-semibold"
            >
              Rechazar
            </button>
          </div>
        </Carta>
      ))}

      <h2 className="mt-8 text-lg font-semibold">Publicaciones activas</h2>
      <p className="mt-1 text-sm text-[color:var(--tinta-suave)]">
        Cerrar o retirar conserva la fila y la auditoría; no se borra.
      </p>
      <PublicacionesVigentes
        publicaciones={publicaciones.data}
        onCerrar={cerrar.mutate}
        cerrando={cerrar.isPending}
      />

      <h2 className="mt-8 text-lg font-semibold">Reportes revisados</h2>
      {revisados.length === 0 && <Vacio texto="Todavía no hay reportes revisados." />}
      {revisados.map((reporte) => (
        <Carta
          key={reporte.id}
          titulo={reporte.titulo}
          meta={`${reporte.estado} · ${fecha(reporte.revisado_en)}`}
        >
          {reporte.descripcion}
        </Carta>
      ))}

      {esSuperadmin && <AdminSupervision correoActual={usuario.email} />}
    </AppShell>
  );
}

type Publicacion = {
  id: string;
  titulo: string;
  vereda_id: string;
  estado?: string | null;
  cerrado_en: string | null;
  resultado: string | null;
  razon_cierre: string | null;
};

type Publicaciones = {
  emergencias: Publicacion[];
  vias: Publicacion[];
  servicios: Publicacion[];
  avisos: Publicacion[];
};

function PublicacionesVigentes({
  publicaciones,
  onCerrar,
  cerrando,
}: {
  publicaciones: Publicaciones | undefined;
  onCerrar: (args: {
    tabla: TablaPublicacion;
    id: string;
    resultado: ResultadoCierre;
    motivo?: string;
  }) => void;
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
    <div className="mt-3 space-y-3">
      {vigentes.length === 0 && <Vacio texto="No hay publicaciones activas." />}
      {vigentes.map((publicacion) => {
        const enEdicion = pendiente?.id === publicacion.id && pendiente.tabla === publicacion.tabla;
        return (
          <Carta
            key={`${publicacion.tabla}-${publicacion.id}`}
            titulo={publicacion.titulo}
            meta={`${publicacion.tabla} · ${publicacion.estado ?? "—"}`}
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
                  rows={2}
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={cerrando}
                    className="rounded-md border px-3 py-2 text-sm font-semibold"
                  >
                    {pendiente.resultado === "retirado" ? "Retirar" : "Cerrar como no solucionado"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendiente(null);
                      setRazon("");
                    }}
                    className="rounded-md px-3 py-2 text-sm"
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
                  className="rounded-md bg-[color:var(--bosque)] px-3 py-2 text-sm font-semibold text-[color:var(--card)]"
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
                  className="rounded-md border px-3 py-2 text-sm font-semibold"
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
                  className="rounded-md bg-[color:var(--terracota)] px-3 py-2 text-sm font-semibold text-[color:var(--card)]"
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
