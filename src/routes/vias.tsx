import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Vacio, TituloModulo } from "@/components/carta";
import { TarjetaReportePublica } from "@/components/reportes/tarjeta-reporte-publica";
import { consultarCartelera } from "@/lib/mi-vereda-cartelera";
import { esPublicacionPublica } from "@/lib/reportes-publicos";

export const Route = createFileRoute("/vias")({
  head: () => ({
    meta: [
      { title: "Estado de las vías · AlertaVereda Ebéjico" },
      {
        name: "description",
        content:
          "Consulta si las vías veredales de Ebéjico están habilitadas, con precaución, afectadas o cerradas.",
      },
      { property: "og:title", content: "Vías · AlertaVereda" },
      {
        property: "og:description",
        content: "Habilitada, precaución, afectada o cerrada: el estado de cada vía veredal.",
      },
    ],
  }),
  component: Vias,
});

function Vias() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vias"],
    queryFn: () =>
      consultarCartelera({
        p_categoria: "via",
        p_limit: 100,
        p_excluir_nivel_normal: false,
      }),
  });
  const publicaciones = data?.filter(esPublicacionPublica) ?? [];

  return (
    <AppShell>
      <TituloModulo titulo="Vías" bajada="Cómo está hoy el paso por cada vía de la vereda." />
      {isLoading && <Vacio texto="Cargando vías…" />}
      {isError && <Vacio texto="No fue posible cargar las vías. Intenta más tarde." />}
      {!isLoading && !isError && publicaciones.length === 0 && (
        <Vacio texto="Todavía no hay vías públicas registradas." />
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
