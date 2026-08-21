import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Carta, TituloModulo, Vacio } from "@/components/carta";
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

const LABEL_CATEGORIA: Record<string, string> = {
  emergencia: "Emergencia",
  via: "Vía",
  servicio: "Servicio",
  otro: "Aviso",
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de administración · AlertaVereda Ebéjico" },
      {
        name: "description",
        content: "Revisión y publicación de los reportes enviados por los habitantes de la vereda.",
      },
      { property: "og:title", content: "Panel de administración · AlertaVereda" },
      { property: "og:description", content: "Verifica reportes y publícalos en la cartelera." },
    ],
  }),
  component: Admin,
});

/** Convierte un reporte aprobado en la publicación pública correspondiente. */
async function publicar(r: Reporte, revisorId: string, nivelElegido?: Severidad) {
  let tabla: "emergencias" | "vias" | "servicios" | "avisos" = "emergencias";
  let fila: Record<string, unknown>;
  // El nivel lo fija el admin al verificar; si no se eligió, se hereda del reporte.
  const nivel = (nivelElegido ?? r.nivel ?? "normal") as "urgente" | "precaucion" | "normal";
  const estadoSegunNivel = (urgente: string, precaucion: string, normal: string) =>
    nivel === "urgente" ? urgente : nivel === "precaucion" ? precaucion : normal;

  if (r.categoria === "via") {
    tabla = "vias";
    fila = {
      vereda_id: r.vereda_id,
      titulo: r.titulo,
      descripcion: r.descripcion,
      lugar: r.lugar,
      nivel,
      estado: estadoSegunNivel("Cerrada", "Precaución", "Habilitada"),
      foto_url: r.foto_url,
      creado_por: revisorId,
    };
  } else if (r.categoria === "servicio") {
    tabla = "servicios";
    fila = {
      vereda_id: r.vereda_id,
      titulo: r.titulo,
      descripcion: r.descripcion,
      lugar: r.lugar,
      nivel,
      tipo: "agua",
      estado: estadoSegunNivel("Interrumpido", "Intermitente", "Normal"),
      foto_url: r.foto_url,
      creado_por: revisorId,
    };
  } else if (r.categoria === "otro") {
    tabla = "avisos";
    fila = {
      vereda_id: r.vereda_id,
      titulo: r.titulo,
      descripcion: r.descripcion,
      lugar: r.lugar,
      creado_por: revisorId,
    };
  } else {
    tabla = "emergencias";
    fila = {
      vereda_id: r.vereda_id,
      titulo: r.titulo,
      descripcion: r.descripcion,
      lugar: r.lugar,
      nivel,
      estado: estadoSegunNivel("Activa", "En observación", "Activa"),
      foto_url: r.foto_url,
      creado_por: revisorId,
    };
  }

  const { data, error } = await supabase.from(tabla).insert(fila as never).select("id").single();
  if (error) throw error;

  const { error: e2 } = await supabase
    .from("reportes")
    .update({
      estado: "aprobado",
      revisado_por: revisorId,
      revisado_en: new Date().toISOString(),
      publicacion_tabla: tabla,
      publicacion_id: data.id,
    })
    .eq("id", r.id);
  if (e2) throw e2;
}

function Admin() {
  const { usuario, esAdmin, cargando } = useAuth();
  const qc = useQueryClient();

  const { data: reportes } = useQuery({
    queryKey: ["reportes-admin"],
    enabled: esAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reportes")
        .select("*, veredas(nombre)")
        .order("created_at", { ascending: false });
        console.log("REPORTES ADMIN:", data);
console.log("ERROR REPORTES ADMIN:", error);
console.log("REPORTES ADMIN DETALLE:", JSON.stringify(data, null, 2));

if (error) throw error;
return data as Reporte[];
    },
  });

  /** Carga las publicaciones vigentes (emergencias, vías, servicios) con sus datos de cierre. */
  const { data: publicaciones } = useQuery({
    queryKey: ["publicaciones-admin"],
    enabled: esAdmin,
    queryFn: async () => {
      const [emergencias, vias, servicios] = await Promise.all([
        supabase.from("emergencias").select("id, titulo, estado, cerrado_en, resultado, razon_cierre, foto_url").order("created_at", { ascending: false }),
        supabase.from("vias").select("id, titulo, estado, cerrado_en, resultado, razon_cierre, foto_url").order("created_at", { ascending: false }),
        supabase.from("servicios").select("id, titulo, estado, cerrado_en, resultado, razon_cierre, foto_url").order("created_at", { ascending: false }),
      ]);
      return {
        emergencias: emergencias.data ?? [],
        vias: vias.data ?? [],
        servicios: servicios.data ?? [],
      };
    },
  });

  const cerrarPublicacion = useMutation({
    mutationFn: async ({
      tabla,
      id,
      resultado,
      razon,
    }: {
      tabla: "emergencias" | "vias" | "servicios";
      id: string;
      resultado: ResultadoCierre;
      razon?: string;
    }) => {
      if (!usuario) throw new Error("Sin sesión");
      const { error } = await supabase
        .from(tabla)
        .update({
          cerrado_en: new Date().toISOString(),
          resultado,
          razon_cierre: razon ?? null,
        } as never)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Publicación cerrada.");
      void qc.invalidateQueries({ queryKey: ["publicaciones-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const revisar = useMutation({
    mutationFn: async ({ r, aprobar, nivel }: { r: Reporte; aprobar: boolean; nivel?: Severidad }) => {
      if (!usuario) throw new Error("Sin sesión");
      if (aprobar) return publicar(r, usuario.id, nivel);
      const { error } = await supabase
        .from("reportes")
        .update({
          estado: "rechazado",
          revisado_por: usuario.id,
          revisado_en: new Date().toISOString(),
        })
        .eq("id", r.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reporte revisado.");
      void qc.invalidateQueries({ queryKey: ["reportes-admin"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (cargando) {
    return (
      <AppShell>
        <Vacio texto="Cargando…" />
      </AppShell>
    );
  }

  if (!usuario) {
    return (
      <AppShell>
        <TituloModulo titulo="Panel de administración" bajada="Solo para administradores." />
        <p className="carta mt-4 text-sm">
          <Link to="/auth" className="font-semibold underline underline-offset-4">
            Inicia sesión
          </Link>{" "}
          con tu cuenta de administrador.
        </p>
      </AppShell>
    );
  }

  if (!esAdmin) {
    return (
      <AppShell>
        <TituloModulo titulo="Panel de administración" bajada="Solo para administradores." />
        <Vacio texto="Tu cuenta es de habitante. Puedes consultar la cartelera y enviar reportes." />
      </AppShell>
    );
  }

  // Nivel elegido por el admin para cada reporte pendiente (por defecto "normal").
  const [niveles, setNiveles] = useState<Record<string, Severidad>>({});

  const pendientes = reportes?.filter((r) => r.estado === "pendiente") ?? [];
  const revisados = reportes?.filter((r) => r.estado !== "pendiente") ?? [];

  console.log("PENDIENTES:", pendientes);
console.log("REVISADOS:", revisados);
  return (
    <AppShell>
      <TituloModulo
        titulo="Panel de administración"
        bajada="Verifica los reportes de los habitantes antes de publicarlos en la cartelera."
      />

      <h2 className="mt-6 text-lg font-semibold">Pendientes de revisión ({pendientes.length})</h2>
      {pendientes.length === 0 && <Vacio texto="No hay reportes pendientes." />}
      {pendientes.map((r) => (
        <Carta
          key={r.id}
          titulo={r.titulo}
          severidad={undefined}
          meta={`${LABEL_CATEGORIA[r.categoria] ?? r.categoria} · ${r.veredas?.nombre ?? ""} · ${fecha(r.created_at)}${r.nombre_reportante ? ` · ${r.nombre_reportante}` : ""}`}
        >
          <p>{r.descripcion}</p>
          {r.lugar && <p className="mt-1">Lugar: {r.lugar}</p>}
          {URL_FOTO(r.foto_url) && (
            <div className="mt-2">
              <img
                src={URL_FOTO(r.foto_url)!}
                alt="Foto del reporte"
                className="max-h-64 w-auto rounded-md border border-[color:var(--border)]"
              />
              <p className="mt-1 text-xs opacity-70">Foto adjunta por el reportante.</p>
            </div>
          )}
          {/* Selector de severidad: lo fija el admin al publicar. */}
          <div className="mt-3">
            <p className="mb-1.5 text-sm font-medium">Nivel de la alerta:</p>
            <div className="flex gap-2">
              {(["urgente", "precaucion", "normal"] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setNiveles((n) => ({ ...n, [r.id]: op }))}
                  className="rounded-md border px-3 py-1.5 text-sm font-semibold transition-colors"
                  style={{
                    borderColor: (niveles[r.id] ?? "normal") === op ? COLOR_SEVERIDAD[op] : "var(--border)",
                    backgroundColor: (niveles[r.id] ?? "normal") === op ? COLOR_SEVERIDAD[op] : "transparent",
                    color: (niveles[r.id] ?? "normal") === op ? "#ffffff" : "inherit",
                  }}
                >
                  {LABEL_SEVERIDAD[op]}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => revisar.mutate({ r, aprobar: true, nivel: niveles[r.id] ?? "normal" })}
              className="rounded-md bg-[color:var(--bosque)] px-3 py-2 text-sm font-semibold text-[color:var(--card)]"
            >
              Verificar y publicar
            </button>
            <button
              onClick={() => revisar.mutate({ r, aprobar: false })}
              className="rounded-md border border-[color:var(--border)] px-3 py-2 text-sm font-semibold"
            >
              Rechazar
            </button>
          </div>
        </Carta>
      ))}

      <h2 className="mt-8 text-lg font-semibold">Publicaciones vigentes</h2>
      <p className="mt-1 text-sm text-[color:var(--tinta-suave)]">
        Emergencias, vías y servicios publicados en la cartelera. Al cerrarlos, desaparecen de la
        cartelera pública.
      </p>
      <PublicacionesVigentes
        publicaciones={publicaciones}
        onCerrar={cerrarPublicacion.mutate}
        cerrando={cerrarPublicacion.isPending}
      />

      <h2 className="mt-8 text-lg font-semibold">Ya revisados</h2>
      {revisados.length === 0 && <Vacio texto="Todavía no has revisado reportes." />}
      {revisados.map((r) => (
        <Carta
          key={r.id}
          titulo={r.titulo}
          meta={`${r.estado === "aprobado" ? "Publicado" : "Rechazado"} · ${fecha(r.revisado_en)}`}
        >
          {r.descripcion}
        </Carta>
      ))}
    </AppShell>
  );
}

/**
 * Sección de publicaciones vigentes con acciones de cierre (Tarea 2):
 * "Marcar solucionado" cierra sin razón; "No solucionado" pide una razón corta obligatoria.
 */
function PublicacionesVigentes({
  publicaciones,
  onCerrar,
  cerrando,
}: {
  publicaciones:
    | {
        emergencias: Array<{ id: string; titulo: string; estado: string | null; cerrado_en: string | null; resultado: string | null; razon_cierre: string | null }>;
        vias: Array<{ id: string; titulo: string; estado: string | null; cerrado_en: string | null; resultado: string | null; razon_cierre: string | null }>;
        servicios: Array<{ id: string; titulo: string; estado: string | null; cerrado_en: string | null; resultado: string | null; razon_cierre: string | null }>;
      }
    | undefined;
  onCerrar: (args: {
    tabla: "emergencias" | "vias" | "servicios";
    id: string;
    resultado: ResultadoCierre;
    razon?: string;
  }) => void;
  cerrando: boolean;
}) {
  const [pendiente, setPendiente] = useState<{ tabla: "emergencias" | "vias" | "servicios"; id: string; titulo: string } | null>(null);
  const [razon, setRazon] = useState("");

  const vigentes = useMemo(() => {
    const todos = [
      ...(publicaciones?.emergencias.map((p) => ({ ...p, tabla: "emergencias" as const })) ?? []),
      ...(publicaciones?.vias.map((p) => ({ ...p, tabla: "vias" as const })) ?? []),
      ...(publicaciones?.servicios.map((p) => ({ ...p, tabla: "servicios" as const })) ?? []),
    ];
    return todos.filter((p) => p.cerrado_en === null).sort((a, b) => b.id.localeCompare(a.id));
  }, [publicaciones]);

  return (
    <div className="mt-3">
      {vigentes.length === 0 && <Vacio texto="No hay publicaciones vigentes en la cartelera." />}
      {vigentes.map((p) => (
        <Carta key={`${p.tabla}-${p.id}`} titulo={p.titulo} meta={`${p.tabla} · estado: ${p.estado ?? "—"}`}>
          {pendiente?.id === p.id ? (
            <form
              className="mt-2"
              onSubmit={(ev) => {
                ev.preventDefault();
                if (razon.trim().length === 0) {
                  toast.error("Escribe una razón corta antes de guardar.");
                  return;
                }
                onCerrar({ tabla: p.tabla, id: p.id, resultado: "no_solucionado", razon: razon.trim() });
                setPendiente(null);
                setRazon("");
              }}
            >
              <p className="mb-1 text-sm">¿Por qué no se solucionó? (obligatorio)</p>
              <textarea
                value={razon}
                onChange={(ev) => setRazon(ev.target.value)}
                maxLength={280}
                rows={2}
                placeholder="Ej.: el cable sigue caído, se avisó a la empresa y quedó pendiente…"
                className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] p-2 text-sm"
              />
              <div className="mt-2 flex gap-2">
                <button
                  type="submit"
                  disabled={cerrando}
                  className="rounded-md border border-[color:var(--border)] px-3 py-2 text-sm font-semibold"
                >
                  Guardar como no solucionado
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
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() =>
                  onCerrar({ tabla: p.tabla, id: p.id, resultado: "solucionado" })
                }
                disabled={cerrando}
                className="rounded-md bg-[color:var(--bosque)] px-3 py-2 text-sm font-semibold text-[color:var(--card)]"
              >
                Marcar solucionado
              </button>
              <button
                onClick={() => setPendiente({ tabla: p.tabla, id: p.id, titulo: p.titulo })}
                disabled={cerrando}
                className="rounded-md border border-[color:var(--border)] px-3 py-2 text-sm font-semibold"
              >
                No solucionado
              </button>
            </div>
          )}
        </Carta>
      ))}
    </div>
  );
}