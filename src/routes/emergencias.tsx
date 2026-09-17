import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Carta, TituloModulo, Vacio } from "@/components/carta";
import { URL_FOTO, severidadDeNivel, ETIQUETA_ESTADO, fecha } from "@/lib/alerta";
import { consultarCartelera } from "@/lib/mi-vereda-cartelera";

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
    queryFn: () =>
      consultarCartelera({
        p_categoria: "emergencia",
        p_limit: 100,
        p_excluir_nivel_normal: false,
      }),
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
          key={e.publicacion_id}
          titulo={e.titulo}
          severidad={severidadDeNivel(e.nivel)}
          etiqueta={ETIQUETA_ESTADO("emergencia", e.estado_operativo)}
          meta={`${e.vereda_nombre ?? ""} · ${e.lugar ?? "sin ubicación"} · ${fecha(e.created_at)}`}
        >
          {e.descripcion}
          {URL_FOTO(e.foto_url) && (
            <img src={URL_FOTO(e.foto_url)!} alt={e.titulo} className="mt-2 w-full rounded-md" />
          )}
        </Carta>
      ))}
    </AppShell>
  );
}
