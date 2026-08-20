import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Carta, TituloModulo, Vacio } from "@/components/carta";
import { severidadDeNivel, fecha } from "@/lib/alerta";

export const Route = createFileRoute("/vias")({
  head: () => ({
    meta: [
      { title: "Estado de las vías · AlertaVereda Ebéjico" },
      {
        name: "description",
        content:
          "Consulta si las vías veredales de Ebéjico están habilitadas, con precaución, afectadas o cerradas.",
      },
      { property: "og:title", content: "Estado de las vías · AlertaVereda" },
      {
        property: "og:description",
        content: "Habilitada, precaución, afectada o cerrada: el estado de cada vía veredal.",
      },
    ],
  }),
  component: Vias,
});

function Vias() {
  const { data, isLoading } = useQuery({
    queryKey: ["vias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vias")
        .select("*, veredas(nombre)")
        .is("cerrado_en", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell>
      <TituloModulo titulo="Vías" bajada="Cómo está hoy el paso por cada vía de la vereda." />
      {isLoading && <Vacio texto="Cargando…" />}
      {data?.length === 0 && <Vacio texto="Todavía no hay vías registradas." />}
      {data?.map((v) => (
        <Carta
          key={v.id}
          titulo={v.titulo}
          severidad={severidadDeNivel(v.nivel)}
          etiqueta={v.estado}
          meta={`${v.veredas?.nombre ?? ""} · actualizado ${fecha(v.created_at)}`}
        >
          {v.descripcion}
          {v.foto_url && <img src={v.foto_url} alt={v.titulo} className="mt-2 w-full rounded-md" />}
        </Carta>
      ))}
    </AppShell>
  );
}