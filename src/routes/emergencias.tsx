import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Vacio, TituloModulo } from "@/components/carta";
import { TarjetaReportePublica } from "@/components/reportes/tarjeta-reporte-publica";
import { consultarCartelera } from "@/lib/mi-vereda-cartelera";
import { esPublicacionPublica } from "@/lib/reportes-publicos";

export const Route = createFileRoute("/emergencias")({
  head: () => ({
    meta: [
      { title: "Emergencias · AlertaVereda Ebéjico" },
      {
        name: "description",
        content:
          "Consulta emergencias y situaciones reportadas en las veredas de Ebéjico, Antioquia.",
      },
      { property: "og:title", content: "Emergencias · AlertaVereda" },
      {
        property: "og:description",
        content: "Información pública sobre emergencias de las veredas de Ebéjico.",
      },
    ],
  }),
  component: Emergencias,
});

function Emergencias() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["emergencias"],
    queryFn: () =>
      consultarCartelera({
        p_categoria: "emergencia",
        p_limit: 100,
        p_excluir_nivel_normal: false,
      }),
  });
  const publicaciones = data?.filter(esPublicacionPublica) ?? [];

  return (
    <AppShell>
      <TituloModulo
        titulo="Emergencias"
        bajada="Consulta situaciones reportadas en las veredas y actúa con información clara."
      />
      {isLoading && <Vacio texto="Cargando emergencias…" />}
      {isError && <Vacio texto="No fue posible cargar las emergencias. Intenta más tarde." />}
      {!isLoading && !isError && publicaciones.length === 0 && (
        <Vacio texto="No hay emergencias públicas para mostrar." />
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
