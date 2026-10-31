import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, MapPinned } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Vacio } from "@/components/carta";
import { CabeceraSeccionPublica } from "@/components/reportes/cabecera-seccion-publica";
import {
  FiltrosEstadoPublico,
  type FiltroEstadoPublico,
} from "@/components/reportes/filtros-estado-publico";
import { TarjetaReportePublica } from "@/components/reportes/tarjeta-reporte-publica";
import { ViasRoadIcon } from "@/components/vias-road-icon";
import { consultarCartelera } from "@/lib/mi-vereda-cartelera";
import type { EstadoPublico } from "@/lib/reportes-publicos";
import {
  condicionViaDe,
  estadoGeneralViaDe,
  esPublicacionViasPublica,
  etiquetaCondicionViaDe,
} from "@/lib/vias-publicas";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/vias")({
  head: () => ({
    meta: [
      { title: "Estado de las vías · AlertaVereda Ebéjico" },
      {
        name: "description",
        content:
          "Consulta reportes públicos sobre las vías veredales de Ebéjico y distingue su estado general de la condición vial.",
      },
      { property: "og:title", content: "Vías · AlertaVereda" },
      {
        property: "og:description",
        content: "Reportes sobre el estado y las condiciones de las vías veredales.",
      },
    ],
  }),
  component: Vias,
});

function Vias() {
  const [filtro, setFiltro] = useState<FiltroEstadoPublico>("todos");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["vias"],
    queryFn: () =>
      consultarCartelera({
        p_categoria: "via",
        p_limit: 100,
        p_excluir_nivel_normal: false,
      }),
  });

  const publicaciones = useMemo(() => data?.filter(esPublicacionViasPublica) ?? [], [data]);
  const { counts, noClasificadas } = useMemo(() => {
    const nextCounts: Partial<Record<EstadoPublico, number>> = {
      verificado_activo: 0,
      en_atencion: 0,
      verificado_solucionado: 0,
      cerrado_sin_solucion: 0,
    };
    let desconocidas = 0;

    for (const publicacion of publicaciones) {
      const estado = estadoGeneralViaDe(publicacion);
      if (!estado || estado === "no_clasificado") {
        desconocidas += 1;
      } else {
        nextCounts[estado] = (nextCounts[estado] ?? 0) + 1;
      }
    }

    return { counts: nextCounts, noClasificadas: desconocidas };
  }, [publicaciones]);
  const publicacionesFiltradas = useMemo(
    () =>
      filtro === "todos"
        ? publicaciones
        : publicaciones.filter((publicacion) => estadoGeneralViaDe(publicacion) === filtro),
    [filtro, publicaciones],
  );

  return (
    <AppShell>
      <div className="vias-page">
        <Link to="/reportes" className="reportes-back-link">
          <ArrowLeft size={17} aria-hidden="true" /> Volver a reportes
        </Link>
        <CabeceraSeccionPublica
          variante="vias"
          Icon={ViasRoadIcon}
          titulo="Vías"
          bajada="Reportes sobre el estado y las condiciones de las vías."
          accion={
            <Link
              to="/reportar"
              className="vias-cta-reportar"
              aria-label="Reportar un problema vial"
            >
              <ViasRoadIcon size={25} aria-hidden="true" />
              <span>Reportar</span>
              <ChevronRight size={23} aria-hidden="true" />
            </Link>
          }
        />

        {!isLoading && !isError && (
          <section className="vias-results" aria-labelledby="vias-list-title">
            <div className="vias-results-heading">
              <div>
                <p className="reportes-eyebrow">Consulta pública</p>
                <h2 id="vias-list-title">Reportes viales</h2>
              </div>
              <span>
                {publicaciones.length} {publicaciones.length === 1 ? "reporte" : "reportes"}
              </span>
            </div>
            <FiltrosEstadoPublico
              value={filtro}
              counts={counts}
              onChange={setFiltro}
              incluirEnRevision={false}
              ariaLabel="Filtrar vías por estado general del reporte"
            />
            {noClasificadas > 0 && (
              <p className="vias-status-note" role="note">
                {noClasificadas} {noClasificadas === 1 ? "reporte conserva" : "reportes conservan"}{" "}
                su visibilidad pública, pero la fuente no permite clasificar su estado general. La
                condición vial se muestra por separado cuando está disponible.
              </p>
            )}
          </section>
        )}

        {isLoading && <Vacio texto="Cargando vías…" />}
        {isError && <Vacio texto="No fue posible cargar las vías. Intenta más tarde." />}
        {!isLoading && !isError && publicaciones.length === 0 && (
          <Vacio texto="Todavía no hay vías públicas registradas." />
        )}
        {!isLoading &&
          !isError &&
          publicaciones.length > 0 &&
          publicacionesFiltradas.length === 0 && (
            <Vacio texto="No hay vías públicas con este estado general." />
          )}
        {!isLoading && !isError && publicacionesFiltradas.length > 0 && (
          <div className="reportes-public-list">
            {publicacionesFiltradas.map((publicacion) => {
              const condicion = condicionViaDe(publicacion);
              const estado = estadoGeneralViaDe(publicacion);
              if (!estado) return null;

              return (
                <TarjetaReportePublica
                  key={`${publicacion.publicacion_tabla}-${publicacion.publicacion_id}`}
                  publicacion={publicacion}
                  mostrarCategoria={false}
                  origenLista="vias"
                  estadoPublicoOverride={estado}
                  metadatosCategoria={
                    <p className="vias-card-condition">
                      <span>Condición de la vía</span>
                      <strong data-condicion={condicion ?? "no_disponible"}>
                        {etiquetaCondicionViaDe(publicacion) ?? "No disponible"}
                      </strong>
                    </p>
                  }
                />
              );
            })}
          </div>
        )}

        <Link to="/mapa" className="seccion-publica-map-link">
          <MapPinned size={32} aria-hidden="true" />
          <span>
            <strong>Ver mapa de vías</strong>
            <small>
              El mapa todavía está en construcción; aún no muestra reportes viales geolocalizados.
            </small>
          </span>
          <ChevronRight size={24} aria-hidden="true" />
        </Link>
      </div>
    </AppShell>
  );
}
