import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Carta, TituloModulo, Vacio } from "@/components/carta";
import {
  estadoDeServicio,
  LABEL_SERVICIO,
  LABEL_TIPO_SERVICIO,
  SEVERIDAD_DE_SERVICIO,
  fecha,
} from "@/lib/alerta";
import type { TipoServicio } from "@/lib/alerta";

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
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servicios")
        .select("*, veredas(nombre)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <AppShell>
      <TituloModulo titulo="Servicios" bajada="Cortes de agua, luz o señal en la vereda." />
      {isLoading && <Vacio texto="Cargando…" />}
      {data?.length === 0 && <Vacio texto="Sin novedades de servicios por ahora." />}
      {data?.map((s) => (
        <Carta
          key={s.id}
          titulo={s.tipo ? ((LABEL_TIPO_SERVICIO as Record<string, string>)[s.tipo] ?? "Servicio") : "Servicio"}
          severidad={SEVERIDAD_DE_SERVICIO[estadoDeServicio(s.estado)]}
          etiqueta={LABEL_SERVICIO[estadoDeServicio(s.estado)]}
          meta={`${s.veredas?.nombre ?? ""} · ${fecha(s.created_at)}`}
        >
          {s.descripcion}
        </Carta>
      ))}
    </AppShell>
  );
}
