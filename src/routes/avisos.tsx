import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Carta, TituloModulo, Vacio } from "@/components/carta";
import { fecha } from "@/lib/alerta";
import { consultarCartelera } from "@/lib/mi-vereda-cartelera";

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
    queryFn: () =>
      consultarCartelera({
        p_categoria: "aviso",
        p_limit: 100,
        p_excluir_nivel_normal: false,
      }),
  });

  return (
    <AppShell>
      <TituloModulo
        titulo="Avisos"
        bajada="Reuniones y actividades de la Junta de Acción Comunal."
      />
      {isLoading && <Vacio texto="Cargando…" />}
      {data?.length === 0 && <Vacio texto="No hay avisos publicados." />}
      {data?.map((a) => (
        <Carta
          key={a.publicacion_id}
          titulo={a.titulo}
          acento="#C99A2E"
          meta={`${a.vereda_nombre ?? ""}${a.lugar ? ` · ${a.lugar}` : ""}${a.fecha_evento ? ` · ${fecha(a.fecha_evento)}` : ""}`}
        >
          {a.descripcion}
        </Carta>
      ))}
    </AppShell>
  );
}
