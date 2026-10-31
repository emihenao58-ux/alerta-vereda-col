import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, MapPinned, PhoneCall, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Vacio } from "@/components/carta";
import { CabeceraSeccionPublica } from "@/components/reportes/cabecera-seccion-publica";
import {
  FiltrosEstadoPublico,
  type FiltroEstadoPublico,
} from "@/components/reportes/filtros-estado-publico";
import { TarjetaReportePublica } from "@/components/reportes/tarjeta-reporte-publica";
import { consultarCartelera } from "@/lib/mi-vereda-cartelera";
import { esPublicacionPublica, estadoPublicoDe } from "@/lib/reportes-publicos";

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
  const [filtro, setFiltro] = useState<FiltroEstadoPublico>("todos");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["emergencias"],
    queryFn: () =>
      consultarCartelera({
        p_categoria: "emergencia",
        p_limit: 100,
        p_excluir_nivel_normal: false,
      }),
  });
  const publicaciones = useMemo(() => data?.filter(esPublicacionPublica) ?? [], [data]);
  const counts = useMemo(
    () =>
      publicaciones.reduce<Record<string, number>>((acc, publicacion) => {
        const estado = estadoPublicoDe(publicacion);
        if (estado) acc[estado] = (acc[estado] ?? 0) + 1;
        return acc;
      }, {}),
    [publicaciones],
  );
  const publicacionesFiltradas =
    filtro === "todos"
      ? publicaciones
      : publicaciones.filter((publicacion) => estadoPublicoDe(publicacion) === filtro);

  return (
    <AppShell>
      <div className="emergencias-page">
        <Link to="/reportes" className="reportes-back-link">
          <ArrowLeft size={17} aria-hidden="true" /> Volver a reportes
        </Link>
        <CabeceraSeccionPublica
          variante="emergencias"
          Icon={TriangleAlert}
          titulo="Emergencias"
          bajada="Situaciones que requieren atención inmediata en las veredas de Ebéjico."
          accion={
            <a className="emergencias-cta-123" href="tel:123">
              <PhoneCall size={24} aria-hidden="true" />
              <span>Llamar al 123</span>
              <ChevronRight size={24} aria-hidden="true" />
            </a>
          }
        />

        {!isLoading && !isError && (
          <section className="emergencias-results" aria-labelledby="emergencias-list-title">
            <div className="emergencias-results-heading">
              <div>
                <p className="reportes-eyebrow">Consulta pública</p>
                <h2 id="emergencias-list-title">Situaciones reportadas</h2>
              </div>
              <span>
                {publicaciones.length} {publicaciones.length === 1 ? "reporte" : "reportes"}
              </span>
            </div>
            <FiltrosEstadoPublico value={filtro} counts={counts} onChange={setFiltro} />
            {counts["no_clasificado"] ? (
              <p className="emergencias-status-note" role="note">
                Algunos reportes se conservan visibles, pero su estado todavía no está disponible en
                la fuente pública.
              </p>
            ) : null}
          </section>
        )}

        {isLoading && <Vacio texto="Cargando emergencias…" />}
        {isError && <Vacio texto="No fue posible cargar las emergencias. Intenta más tarde." />}
        {!isLoading && !isError && publicaciones.length === 0 && (
          <Vacio texto="No hay emergencias públicas para mostrar." />
        )}
        {!isLoading &&
          !isError &&
          publicaciones.length > 0 &&
          publicacionesFiltradas.length === 0 && (
            <Vacio texto="No hay emergencias con este estado." />
          )}
        {!isLoading && !isError && publicacionesFiltradas.length > 0 && (
          <div className="reportes-public-list">
            {publicacionesFiltradas.map((publicacion) => (
              <TarjetaReportePublica
                key={`${publicacion.publicacion_tabla}-${publicacion.publicacion_id}`}
                publicacion={publicacion}
                mostrarCategoria={false}
                origenLista="emergencias"
              />
            ))}
          </div>
        )}

        <Link to="/mapa" className="seccion-publica-map-link">
          <MapPinned size={32} aria-hidden="true" />
          <span>
            <strong>Ver mapa de emergencias</strong>
            <small>
              La ruta del mapa está preparada; su contenido se incorporará posteriormente.
            </small>
          </span>
          <ChevronRight size={24} aria-hidden="true" />
        </Link>
      </div>
    </AppShell>
  );
}
