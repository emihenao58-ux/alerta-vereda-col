import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowRight,
  Megaphone,
  Plus,
  Route as RouteIcon,
  Waves,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CartaCompacta, ChipSeveridad, Vacio } from "@/components/carta";
import { URL_FOTO, severidadDeNivel } from "@/lib/alerta";
import { consultarCartelera, type MiVeredaPublicacion } from "@/lib/mi-vereda-cartelera";

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
  { to: "/emergencias", label: "Emergencias", color: "#C23B2E" },
  { to: "/vias", label: "Vías", color: "#DB7B33" },
  { to: "/servicios", label: "Servicios", color: "#2F5D45" },
  { to: "/avisos", label: "Avisos", color: "#C99A2E" },
] as const;

type Atajo = (typeof ATAJOS)[number];
type TarjetaInicioRuta = "/emergencias" | "/vias" | "/servicios" | "/avisos";

const ICONOS_ATAJO: Record<Atajo["to"], LucideIcon> = {
  "/emergencias": AlertTriangle,
  "/vias": RouteIcon,
  "/servicios": Waves,
  "/avisos": Megaphone,
};

const DESCRIPCIONES_ATAJO: Record<Atajo["to"], string> = {
  "/emergencias": "Reporta situaciones urgentes.",
  "/vias": "Reporta daños o bloqueos en la vía.",
  "/servicios": "Reporta fallas en servicios públicos.",
  "/avisos": "Comparte información importante.",
};

const ACENTOS_CATEGORIA: Record<TarjetaInicioRuta, string> = {
  "/emergencias": "#C23B2E",
  "/vias": "#DB7B33",
  "/servicios": "#2F5D45",
  "/avisos": "#C99A2E",
};

function Portada() {
  const { data, isError, isLoading } = useQuery({
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
      <div className="inicio-page">
        <section className="inicio-hero" aria-labelledby="inicio-titulo">
          <div>
            <p className="eyebrow">Cartelera comunitaria</p>
            <h1 id="inicio-titulo">¿Qué está pasando en la vereda?</h1>
            <p className="inicio-hero-lead">Reporta, consulta y mantente informado.</p>
          </div>
          <blockquote className="inicio-verse">
            <span className="inicio-verse-symbol" aria-hidden="true">
              †
            </span>
            <div>
              <p>“Sobrellevad los unos las cargas de los otros.”</p>
              <cite>Gálatas 6:2</cite>
            </div>
          </blockquote>
        </section>

        <nav className="inicio-category-grid" aria-label="Categorías de la cartelera">
          {ATAJOS.map((atajo) => {
            const Icono = ICONOS_ATAJO[atajo.to];
            return (
              <Link
                key={atajo.to}
                to={atajo.to}
                className="inicio-category-card"
                style={{ backgroundColor: atajo.color }}
              >
                <span className="inicio-category-card-inner">
                  <span className="inicio-category-icon" aria-hidden="true">
                    <Icono size={23} strokeWidth={2.2} />
                  </span>
                  <span>
                    <strong>{atajo.label}</strong>
                    <small>{DESCRIPCIONES_ATAJO[atajo.to]}</small>
                  </span>
                  <span className="inicio-category-arrow" aria-hidden="true">
                    →
                  </span>
                </span>
              </Link>
            );
          })}
        </nav>

        <Link to="/reportar" className="inicio-report-cta">
          <Plus size={24} strokeWidth={2.5} aria-hidden="true" />
          Reportar algo en mi vereda
          <ArrowRight size={18} aria-hidden="true" />
        </Link>

        {isLoading && <Vacio texto="Cargando la cartelera…" />}
        {isError && (
          <Vacio texto="No fue posible cargar la cartelera. Intenta de nuevo más tarde." />
        )}
        {sinNovedades && (
          <div className="inicio-status">
            <ChipSeveridad severidad="normal" texto="Normal" />
            <p>Sin novedades urgentes reportadas hoy.</p>
          </div>
        )}

        <section className="inicio-feed" aria-labelledby="inicio-feed-titulo">
          <div className="inicio-feed-heading">
            <div>
              <h2 id="inicio-feed-titulo">Lo que pasa hoy</h2>
              <p>Publicaciones activas de la cartelera comunitaria.</p>
            </div>
          </div>

          {data?.emergencias.map((publicacion) => (
            <TarjetaInicio
              key={publicacion.publicacion_id}
              to="/emergencias"
              publicacion={publicacion}
              categoria="emergencia"
            />
          ))}
          {data?.vias.map((publicacion) => (
            <TarjetaInicio
              key={publicacion.publicacion_id}
              to="/vias"
              publicacion={publicacion}
              categoria="via"
            />
          ))}
          {data?.servicios.map((publicacion) => (
            <TarjetaInicio
              key={publicacion.publicacion_id}
              to="/servicios"
              publicacion={publicacion}
              categoria="servicio"
            />
          ))}
          {data?.avisos.map((publicacion) => (
            <TarjetaInicio
              key={publicacion.publicacion_id}
              to="/avisos"
              publicacion={publicacion}
              categoria="aviso"
            />
          ))}
        </section>
      </div>
    </AppShell>
  );
}

function TarjetaInicio({
  to,
  publicacion,
  categoria,
}: {
  to: TarjetaInicioRuta;
  publicacion: MiVeredaPublicacion;
  categoria: "emergencia" | "via" | "servicio" | "aviso";
}) {
  return (
    <Link to={to} className="carta-compacta-link">
      <CartaCompacta
        categoria={categoria}
        titulo={publicacion.titulo}
        descripcion={publicacion.descripcion}
        fotoUrl={URL_FOTO(publicacion.foto_url)}
        vereda={publicacion.vereda_nombre ?? publicacion.lugar}
        momento={tiempoRelativo(publicacion.fecha_evento ?? publicacion.created_at)}
        severidad={severidadDeNivel(publicacion.nivel)}
        etiqueta={publicacion.estado_operativo ?? undefined}
        acento={ACENTOS_CATEGORIA[to]}
      />
    </Link>
  );
}

function tiempoRelativo(valor: string | null | undefined) {
  if (!valor) return null;
  const diferencia = Date.now() - new Date(valor).getTime();
  const minutos = Math.max(0, Math.round(diferencia / 60_000));
  if (minutos < 1) return "Ahora";
  if (minutos < 60) return `Hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `Hace ${horas} h`;
  const dias = Math.round(horas / 24);
  if (dias < 7) return `Hace ${dias} ${dias === 1 ? "día" : "días"}`;
  return new Date(valor).toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
  });
}
