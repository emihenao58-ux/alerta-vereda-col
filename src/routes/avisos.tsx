import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Vacio, TituloModulo } from "@/components/carta";
import { TarjetaReportePublica } from "@/components/reportes/tarjeta-reporte-publica";
import { consultarCartelera } from "@/lib/mi-vereda-cartelera";
import { esPublicacionPublica } from "@/lib/reportes-publicos";

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
  const { data, isLoading, isError } = useQuery({
    queryKey: ["avisos"],
    queryFn: () =>
      consultarCartelera({
        p_categoria: "aviso",
        p_limit: 100,
        p_excluir_nivel_normal: false,
      }),
  });
  const publicaciones = data?.filter(esPublicacionPublica) ?? [];

  return (
    <AppShell>
      <TituloModulo
        titulo="Avisos"
        bajada="Reuniones y actividades de la Junta de Acción Comunal."
      />
      {isLoading && <Vacio texto="Cargando avisos…" />}
      {isError && <Vacio texto="No fue posible cargar los avisos. Intenta más tarde." />}
      {!isLoading && !isError && publicaciones.length === 0 && (
        <Vacio texto="No hay avisos públicos publicados." />
      )}
      <div className="reportes-public-list">
        {publicaciones.map((publicacion) => (
          <TarjetaReportePublica
            key={`${publicacion.publicacion_tabla}-${publicacion.publicacion_id}`}
            publicacion={publicacion}
            mostrarCategoria={false}
          />
        ))}
      </div>
    </AppShell>
  );
}
