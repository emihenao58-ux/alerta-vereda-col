import { useMemo, useState } from "react";
import { ArrowLeft, Megaphone } from "lucide-react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Vacio } from "@/components/carta";
import { CabeceraSeccionPublica } from "@/components/reportes/cabecera-seccion-publica";
import {
  EtiquetaProcedenciaAviso,
  type ProcedenciaAvisoPublica,
} from "@/components/reportes/etiqueta-procedencia-aviso";
import {
  FiltrosEstadoPublico,
  type FiltroEstadoPublico,
} from "@/components/reportes/filtros-estado-publico";
import { TarjetaReportePublica } from "@/components/reportes/tarjeta-reporte-publica";
import { consultarCartelera } from "@/lib/mi-vereda-cartelera";
import {
  estadoGeneralAvisoDe,
  esAvisoPublico,
  FILTROS_TIPO_AVISO,
  tipoAvisoFiltroDe,
  etiquetaTipoAvisoDe,
  type TipoFiltroAviso,
} from "@/lib/avisos-publicos";
import type { EstadoPublico } from "@/lib/reportes-publicos";
import "./avisos.css";

export const Route = createFileRoute("/avisos")({
  head: () => ({
    meta: [
      { title: "Avisos comunitarios · AlertaVereda" },
      {
        name: "description",
        content: "Reuniones, actividades y avisos públicos de las veredas de Ebéjico.",
      },
      { property: "og:title", content: "Avisos comunitarios · AlertaVereda" },
      {
        property: "og:description",
        content: "Consulta avisos comunitarios con filtros claros y estados disponibles.",
      },
    ],
  }),
  component: Avisos,
});

function Avisos() {
  const [filtroTipo, setFiltroTipo] = useState<TipoFiltroAviso | "todos">("todos");
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstadoPublico>("todos");
  const { data, isLoading, isError } = useQueryAvisos();
  const publicaciones = useMemo(() => data?.filter(esAvisoPublico) ?? [], [data]);

  const { conteosTipo, conteosEstado, sinTipoFiltrable, sinEstadoClasificado } = useMemo(() => {
    const nextTipos = new Map<TipoFiltroAviso, number>(
      FILTROS_TIPO_AVISO.map(({ id }) => [id, 0] as const),
    );
    const nextEstados: Partial<Record<EstadoPublico, number>> = {
      verificado_activo: 0,
      en_atencion: 0,
      verificado_solucionado: 0,
      cerrado_sin_solucion: 0,
    };
    let sinTipo = 0;
    let sinEstado = 0;

    for (const publicacion of publicaciones) {
      const tipo = tipoAvisoFiltroDe(publicacion.tipo);
      if (tipo) nextTipos.set(tipo, (nextTipos.get(tipo) ?? 0) + 1);
      else sinTipo += 1;

      const estado = estadoGeneralAvisoDe(publicacion);
      if (estado === "no_clasificado") sinEstado += 1;
      else if (estado) nextEstados[estado] = (nextEstados[estado] ?? 0) + 1;
    }

    return {
      conteosTipo: nextTipos,
      conteosEstado: nextEstados,
      sinTipoFiltrable: sinTipo,
      sinEstadoClasificado: sinEstado,
    };
  }, [publicaciones]);

  const publicacionesFiltradas = useMemo(
    () =>
      publicaciones.filter((publicacion) => {
        const estado = estadoGeneralAvisoDe(publicacion);
        const coincideTipo =
          filtroTipo === "todos" || tipoAvisoFiltroDe(publicacion.tipo) === filtroTipo;
        const coincideEstado = filtroEstado === "todos" || estado === filtroEstado;
        return coincideTipo && coincideEstado;
      }),
    [filtroEstado, filtroTipo, publicaciones],
  );

  return (
    <AppShell wide>
      <div className="avisos-page">
        <Link to="/reportes" className="reportes-back-link">
          <ArrowLeft size={17} aria-hidden="true" /> Volver a reportes
        </Link>

        <CabeceraSeccionPublica
          variante="avisos"
          Icon={Megaphone}
          titulo="Avisos"
          bajada="Reuniones, actividades y otra información útil para la comunidad."
        />

        {!isLoading && !isError && (
          <section className="avisos-filter-panel" aria-label="Filtros de avisos">
            <div className="avisos-filter-group">
              <label htmlFor="avisos-tipo-filter">Tipo de aviso</label>
              <select
                id="avisos-tipo-filter"
                className="avisos-type-select"
                value={filtroTipo}
                onChange={(event) =>
                  setFiltroTipo(event.currentTarget.value as TipoFiltroAviso | "todos")
                }
              >
                <option value="todos">Todos los tipos ({publicaciones.length})</option>
                {FILTROS_TIPO_AVISO.map(({ id, etiqueta }) => (
                  <option key={id} value={id}>
                    {etiqueta} ({conteosTipo.get(id) ?? 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="avisos-filter-group">
              <h2 id="avisos-state-filter-title">Estado general del aviso</h2>
              <FiltrosEstadoPublico
                value={filtroEstado}
                counts={conteosEstado}
                onChange={setFiltroEstado}
                incluirEnRevision={false}
                ariaLabel="Filtrar avisos por estado general"
              />
            </div>

            {(sinTipoFiltrable > 0 || sinEstadoClasificado > 0) && (
              <div className="avisos-filter-note" role="note">
                {sinTipoFiltrable > 0 && (
                  <span>
                    {sinTipoFiltrable}{" "}
                    {sinTipoFiltrable === 1 ? "aviso no tiene" : "avisos no tienen"} un tipo con
                    filtro disponible; se conserva{sinTipoFiltrable === 1 ? "" : "n"} en «Todos».
                  </span>
                )}
                {sinEstadoClasificado > 0 && (
                  <span>
                    {sinEstadoClasificado}{" "}
                    {sinEstadoClasificado === 1 ? "aviso conserva" : "avisos conservan"} «Estado no
                    disponible» y aparece{sinEstadoClasificado === 1 ? "" : "n"} en «Todos».
                  </span>
                )}
              </div>
            )}
          </section>
        )}

        {isLoading && <Vacio texto="Cargando avisos…" />}
        {isError && <Vacio texto="No fue posible cargar los avisos. Intenta más tarde." />}
        {!isLoading && !isError && publicaciones.length === 0 && (
          <Vacio texto="Todavía no hay avisos públicos registrados." />
        )}
        {!isLoading &&
          !isError &&
          publicaciones.length > 0 &&
          publicacionesFiltradas.length === 0 && (
            <Vacio texto="No hay avisos públicos con estos filtros." />
          )}

        {!isLoading && !isError && publicacionesFiltradas.length > 0 && (
          <section className="avisos-results" aria-labelledby="avisos-list-title">
            <div className="avisos-results-heading">
              <div>
                <p className="reportes-eyebrow">Consulta pública</p>
                <h2 id="avisos-list-title">Avisos de la comunidad</h2>
              </div>
              <span className="avisos-results-count">
                {publicacionesFiltradas.length}{" "}
                {publicacionesFiltradas.length === 1 ? "aviso" : "avisos"}
              </span>
            </div>
            <div className="reportes-public-list">
              {publicacionesFiltradas.map((publicacion) => {
                const estado = estadoGeneralAvisoDe(publicacion);
                if (!estado) return null;
                const tipo = etiquetaTipoAvisoDe(publicacion.tipo);
                // La RPC pública actual no entrega una procedencia autorizada.
                const procedencia: ProcedenciaAvisoPublica | null = null;
                return (
                  <TarjetaReportePublica
                    key={`${publicacion.publicacion_tabla}-${publicacion.publicacion_id}`}
                    publicacion={publicacion}
                    mostrarCategoria={false}
                    origenLista="avisos"
                    estadoPublicoOverride={estado}
                    metadatosCategoria={
                      <div className="avisos-card-meta">
                        <span className="avisos-type-chip">
                          {tipo ?? "Tipo de aviso no disponible"}
                        </span>
                        <EtiquetaProcedenciaAviso procedencia={procedencia} />
                      </div>
                    }
                  />
                );
              })}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}

function useQueryAvisos() {
  return useQuery({
    queryKey: ["avisos"],
    queryFn: () =>
      consultarCartelera({
        p_categoria: "aviso",
        p_limit: 100,
        p_excluir_nivel_normal: false,
      }),
  });
}
