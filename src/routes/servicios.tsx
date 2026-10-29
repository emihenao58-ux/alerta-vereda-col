import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { Vacio, TituloModulo } from "@/components/carta";
import { TarjetaReportePublica } from "@/components/reportes/tarjeta-reporte-publica";
import { consultarCartelera } from "@/lib/mi-vereda-cartelera";
import { esPublicacionPublica } from "@/lib/reportes-publicos";

export const Route = createFileRoute("/servicios")({
  head: () => ({
    meta: [
      { title: "Cortes de agua, luz y señal · AlertaVereda Ebéjico" },
      {
        name: "description",
        content: "Cortes y restablecimientos de agua, energía y señal en las veredas de Ebéjico.",
      },
      { property: "og:title", content: "Servicios · AlertaVereda" },
      {
        property: "og:description",
        content: "Estado del acueducto veredal, la energía y la señal.",
      },
    ],
  }),
  component: Servicios,
});

function Servicios() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["servicios"],
    queryFn: () =>
      consultarCartelera({
        p_categoria: "servicio",
        p_limit: 100,
        p_excluir_nivel_normal: false,
      }),
  });
  const publicaciones = data?.filter(esPublicacionPublica) ?? [];

  return (
    <AppShell>
      <TituloModulo titulo="Servicios" bajada="Cortes de agua, luz o señal en la vereda." />
      {isLoading && <Vacio texto="Cargando servicios…" />}
      {isError && <Vacio texto="No fue posible cargar los servicios. Intenta más tarde." />}
      {!isLoading && !isError && publicaciones.length === 0 && (
        <Vacio texto="Sin novedades públicas de servicios por ahora." />
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
