import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Carta, TituloModulo, Vacio } from "@/components/carta";
import { fecha } from "@/lib/alerta";

export const Route = createFileRoute("/avisos")({
  head: () => ({
    meta: [
      { title: "Avisos de la Junta de Acción Comunal · AlertaVereda" },
      {
        name: "description",
        content: "Reuniones, convites y actividades de la JAC en las veredas de Ebéjico.",
      },
      { property: "og:title", content: "Avisos comunitarios · AlertaVereda" },
      {
        property: "og:description",
        content: "Reuniones y actividades convocadas por la Junta de Acción Comunal.",
      },
    ],
  }),
  component: Avisos,
});

function Avisos() {
  const { data, isLoading } = useQuery({
    queryKey: ["avisos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("avisos")
        .select("*, veredas(nombre)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell>
      <TituloModulo titulo="Avisos" bajada="Reuniones y actividades de la Junta de Acción Comunal." />
      {isLoading && <Vacio texto="Cargando…" />}
      {data?.length === 0 && <Vacio texto="No hay avisos publicados." />}
      {data?.map((a) => (
        <Carta
          key={a.id}
          titulo={a.titulo}
          acento="#C99A2E"
          meta={`${a.veredas?.nombre ?? ""}${a.lugar ? ` · ${a.lugar}` : ""}${
            a.fecha ? ` · ${fecha(a.fecha)}` : ""
          }`}
        >
          {a.descripcion}
        </Carta>
      ))}
    </AppShell>
  );
}
