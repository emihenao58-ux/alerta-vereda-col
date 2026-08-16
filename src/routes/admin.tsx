import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Carta, TituloModulo, Vacio } from "@/components/carta";
import { useAuth } from "@/hooks/use-auth";
import { LABEL_TIPO_REPORTE, fecha } from "@/lib/alerta";
import type { Database } from "@/integrations/supabase/types";

type Reporte = Database["public"]["Tables"]["reportes"]["Row"] & {
  veredas: { nombre: string } | null;
};

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Panel de la JAC · AlertaVereda Ebéjico" },
      {
        name: "description",
        content: "Revisión y publicación de los reportes enviados por los habitantes de la vereda.",
      },
      { property: "og:title", content: "Panel de la JAC · AlertaVereda" },
      { property: "og:description", content: "Verifica reportes y publícalos en la cartelera." },
    ],
  }),
  component: Admin,
});

/** Convierte un reporte aprobado en la publicación pública correspondiente. */
async function publicar(r: Reporte, revisorId: string) {
  let tabla: "emergencias" | "vias" | "servicios" | "avisos" = "emergencias";
  let fila: Record<string, unknown>;

  if (r.tipo === "via") {
    tabla = "vias";
    fila = {
      vereda_id: r.vereda_id,
      nombre: r.titulo,
      detalle: r.descripcion,
      estado_via: r.severidad === "urgente" ? "cerrada" : r.severidad === "precaucion" ? "afectada" : "habilitada",
      autor_id: revisorId,
    };
  } else if (r.tipo === "servicio") {
    tabla = "servicios";
    fila = {
      vereda_id: r.vereda_id,
      tipo: "agua",
      estado_servicio: r.severidad === "urgente" ? "suspendido" : "intermitente",
      descripcion: `${r.titulo}. ${r.descripcion}`,
      autor_id: revisorId,
    };
  } else if (r.tipo === "aviso") {
    tabla = "avisos";
    fila = {
      vereda_id: r.vereda_id,
      titulo: r.titulo,
      cuerpo: r.descripcion,
      lugar: r.ubicacion,
      autor_id: revisorId,
    };
  } else {
    fila = {
      vereda_id: r.vereda_id,
      titulo: r.titulo,
      descripcion: r.descripcion,
      severidad: r.severidad,
      ubicacion: r.ubicacion,
      autor_id: revisorId,
    };
  }

  const { data, error } = await supabase.from(tabla).insert(fila as never).select("id").single();
  if (error) throw error;

  const { error: e2 } = await supabase
    .from("reportes")
    .update({
      estado: "aprobado",
      revisado_por: revisorId,
      revisado_at: new Date().toISOString(),
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
      if (error) throw error;
      return data as Reporte[];
    },
  });

  const revisar = useMutation({
    mutationFn: async ({ r, aprobar }: { r: Reporte; aprobar: boolean }) => {
      if (!usuario) throw new Error("Sin sesión");
      if (aprobar) return publicar(r, usuario.id);
      const { error } = await supabase
        .from("reportes")
        .update({
          estado: "rechazado",
          revisado_por: usuario.id,
          revisado_at: new Date().toISOString(),
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
        <TituloModulo titulo="Panel de la JAC" bajada="Solo para administradores." />
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
        <TituloModulo titulo="Panel de la JAC" bajada="Solo para administradores." />
        <Vacio texto="Tu cuenta es de habitante. Puedes consultar la cartelera y enviar reportes." />
      </AppShell>
    );
  }

  const pendientes = reportes?.filter((r) => r.estado === "pendiente") ?? [];
  const revisados = reportes?.filter((r) => r.estado !== "pendiente") ?? [];

  return (
    <AppShell>
      <TituloModulo
        titulo="Panel de la JAC"
        bajada="Verifica los reportes de los habitantes antes de publicarlos en la cartelera."
      />

      <h2 className="mt-6 text-lg font-semibold">Pendientes de revisión ({pendientes.length})</h2>
      {pendientes.length === 0 && <Vacio texto="No hay reportes pendientes." />}
      {pendientes.map((r) => (
        <Carta
          key={r.id}
          titulo={r.titulo}
          severidad={r.severidad}
          meta={`${LABEL_TIPO_REPORTE[r.tipo]} · ${r.veredas?.nombre ?? ""} · ${fecha(r.created_at)}`}
        >
          <p>{r.descripcion}</p>
          {r.ubicacion && <p className="mt-1">Lugar: {r.ubicacion}</p>}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => revisar.mutate({ r, aprobar: true })}
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

      <h2 className="mt-8 text-lg font-semibold">Ya revisados</h2>
      {revisados.length === 0 && <Vacio texto="Todavía no has revisado reportes." />}
      {revisados.map((r) => (
        <Carta
          key={r.id}
          titulo={r.titulo}
          meta={`${r.estado === "aprobado" ? "Publicado" : "Rechazado"} · ${fecha(r.revisado_at)}`}
        >
          {r.descripcion}
        </Carta>
      ))}
    </AppShell>
  );
}
