import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Carta, ChipSeveridad, Vacio } from "@/components/carta";
import { URL_FOTO, severidadDeNivel, fecha } from "@/lib/alerta";
import { consultarCartelera } from "@/lib/mi-vereda-cartelera";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AlertaVereda · Alertas de las veredas de Ebéjico" },
      {
        name: "description",
        content:
          "Cartelera comunitaria de Ebéjico, Antioquia: emergencias, estado de las vías, cortes de servicios y avisos de la JAC en un solo lugar.",
      },
      { property: "og:title", content: "AlertaVereda · Ebéjico, Antioquia" },
      {
        property: "og:description",
        content: "Qué está pasando hoy en tu vereda: emergencias, vías, servicios y avisos.",
      },
    ],
  }),
  component: Portada,
});

const ATAJOS = [
  { to: "/mi-vereda", label: "Mi Vereda", color: "#5C7A47" },
  { to: "/emergencias", label: "Emergencias", color: "#C23B2E" },
  { to: "/vias", label: "Vías", color: "#DB7B33" },
  { to: "/servicios", label: "Servicios", color: "#2F5D45" },
  { to: "/avisos", label: "Avisos", color: "#C99A2E" },
] as const;

function Portada() {
  const { data, isLoading } = useQuery({
    queryKey: ["portada"],
    queryFn: async () => {
      const [emergencias, vias, servicios, avisos] = await Promise.all([
        consultarCartelera({
          p_categoria: "emergencia",
          p_limit: 3,
          p_excluir_nivel_normal: true,
        }),
        consultarCartelera({
          p_categoria: "via",
          p_limit: 3,
          p_excluir_nivel_normal: true,
        }),
        consultarCartelera({
          p_categoria: "servicio",
          p_limit: 3,
          p_excluir_nivel_normal: true,
        }),
        consultarCartelera({
          p_categoria: "aviso",
          p_limit: 2,
          p_excluir_nivel_normal: false,
        }),
      ]);
      return { emergencias, vias, servicios, avisos };
    },
  });

  const sinNovedades =
    !isLoading &&
    data &&
    data.emergencias.length === 0 &&
    data.vias.length === 0 &&
    data.servicios.length === 0;

  return (
    <AppShell>
      <section>
        <h1 className="text-3xl leading-tight font-bold">¿Qué está pasando en la vereda?</h1>
        <p className="mt-1 text-sm text-[color:var(--tinta-suave)]">
          Cartelera comunitaria de las veredas de Ebéjico, Antioquia.
        </p>
      </section>

      <nav className="mt-4 grid grid-cols-2 gap-2">
        {ATAJOS.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="rounded-md px-4 py-4 text-center font-semibold text-[color:var(--card)]"
            style={{ backgroundColor: a.color }}
          >
            {a.label}
          </Link>
        ))}
      </nav>

      <Link
        to="/reportar"
        className="mt-2 block rounded-md bg-[color:var(--terracota)] px-4 py-4 text-center font-semibold text-[color:var(--card)]"
      >
        Reportar algo en mi vereda
      </Link>

      {isLoading && <Vacio texto="Cargando la cartelera…" />}
      {sinNovedades && (
        <div className="mt-6 flex items-center gap-2 rounded-md bg-[color:var(--kraft-oscuro)] p-4">
          <ChipSeveridad severidad="normal" />
          <p className="text-sm">Sin novedades urgentes reportadas hoy.</p>
        </div>
      )}

      {data?.emergencias.map((e) => (
        <Carta
          key={e.publicacion_id}
          titulo={e.titulo}
          severidad={severidadDeNivel(e.nivel)}
          etiqueta={e.estado_operativo ?? "Activa"}
          meta={`Emergencia · ${e.vereda_nombre ?? ""} · ${fecha(e.created_at)}`}
        >
          {e.descripcion}
          {URL_FOTO(e.foto_url) && (
            <img src={URL_FOTO(e.foto_url)!} alt={e.titulo} className="mt-2 w-full rounded-md" />
          )}
        </Carta>
      ))}

      {data?.vias.map((v) => (
        <Carta
          key={v.publicacion_id}
          titulo={v.titulo}
          severidad={severidadDeNivel(v.nivel)}
          etiqueta={v.estado_operativo ?? ""}
          meta={`Vía · ${v.vereda_nombre ?? ""} · ${fecha(v.created_at)}`}
        >
          {v.descripcion}
          {URL_FOTO(v.foto_url) && (
            <img src={URL_FOTO(v.foto_url)!} alt={v.titulo} className="mt-2 w-full rounded-md" />
          )}
        </Carta>
      ))}

      {data?.servicios.map((s) => (
        <Carta
          key={s.publicacion_id}
          titulo={s.tipo ? `Servicio de ${s.tipo === "senal" ? "señal" : s.tipo}` : "Servicio"}
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

      {data?.avisos.map((a) => (
        <Carta
          key={a.publicacion_id}
          titulo={a.titulo}
          acento="#C99A2E"
          meta={`Aviso de la JAC · ${a.vereda_nombre ?? ""}${a.lugar ? ` · ${a.lugar}` : ""}${a.fecha_evento ? ` · ${fecha(a.fecha_evento)}` : ""}`}
        >
          {a.descripcion}
        </Carta>
      ))}
    </AppShell>
  );
}
