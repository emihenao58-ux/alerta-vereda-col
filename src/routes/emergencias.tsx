import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Carta, TituloModulo, Vacio } from "@/components/carta";
import { severidadDeEmergencia, fecha } from "@/lib/alerta";

export const Route = createFileRoute("/emergencias")({
  head: () => ({
    meta: [
      { title: "Emergencias activas · AlertaVereda Ebéjico" },
      {
        name: "description",
        content:
          "Emergencias activas reportadas y verificadas en las veredas de Ebéjico, Antioquia.",
      },
      { property: "og:title", content: "Emergencias activas · AlertaVereda" },
      {
        property: "og:description",
        content: "Situaciones urgentes verificadas por la Junta de Acción Comunal.",
      },
    ],
  }),
  component: Emergencias,
});

function Emergencias() {
  const { data, isLoading } = useQuery({
    queryKey: ["emergencias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("emergencias")
        .select("*, veredas(nombre)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell>
      <TituloModulo
        titulo="Emergencias"
        bajada="Situaciones urgentes verificadas por la Junta de Acción Comunal."
      />
      {isLoading && <Vacio texto="Cargando…" />}
      {data?.length === 0 && <Vacio texto="No hay emergencias activas en este momento." />}
      {data?.map((e) => (
        <Carta
          key={e.id}
          titulo={e.titulo}
          severidad={severidadDeEmergencia(e.estado)}
          etiqueta={e.estado?.toLowerCase().trim() === "resuelta" || e.estado?.toLowerCase().trim() === "solucionada" ? "Solucionado" : undefined}
          meta={`${e.veredas?.nombre ?? ""} · ${e.lugar ?? "sin ubicación"} · ${fecha(e.created_at)}`}
        >
          {e.descripcion}
        </Carta>
      ))}
    </AppShell>
  );
}
