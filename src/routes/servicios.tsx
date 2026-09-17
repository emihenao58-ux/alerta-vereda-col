import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Carta, TituloModulo, Vacio } from "@/components/carta";
import { LABEL_TIPO_SERVICIO, URL_FOTO, severidadDeNivel, fecha } from "@/lib/alerta";
import { consultarCartelera } from "@/lib/mi-vereda-cartelera";

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
  const { data, isLoading } = useQuery({
    queryKey: ["servicios"],
    queryFn: () =>
      consultarCartelera({
        p_categoria: "servicio",
        p_limit: 100,
        p_excluir_nivel_normal: false,
      }),
  });

  return (
    <AppShell>
      <TituloModulo titulo="Servicios" bajada="Cortes de agua, luz o señal en la vereda." />
      {isLoading && <Vacio texto="Cargando…" />}
      {data?.length === 0 && <Vacio texto="Sin novedades de servicios por ahora." />}
      {data?.map((s) => (
        <Carta
          key={s.publicacion_id}
          titulo={
            s.tipo
              ? (LABEL_TIPO_SERVICIO[s.tipo as keyof typeof LABEL_TIPO_SERVICIO] ?? "Servicio")
              : "Servicio"
          }
          severidad={severidadDeNivel(s.nivel)}
          etiqueta={s.estado_operativo ?? ""}
          meta={`${s.vereda_nombre ?? ""} · ${fecha(s.created_at)}`}
        >
          {s.descripcion}
          {URL_FOTO(s.foto_url) && (
            <img src={URL_FOTO(s.foto_url)!} alt={s.titulo} className="mt-2 w-full rounded-md" />
          )}
        </Carta>
      ))}
    </AppShell>
  );
}
