import { createFileRoute, Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ClipboardList, Megaphone } from "lucide-react";
import { AppShell, BotonEmergencias } from "@/components/app-shell";
import { Vacio } from "@/components/carta";
import { TarjetaReportePublica } from "@/components/reportes/tarjeta-reporte-publica";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth } from "@/hooks/use-auth";
import { useNavegacionSesion } from "@/components/navegacion-sesion";
import {
  consultarCartelera,
  type MiVeredaCategoria,
  type MiVeredaPublicacion,
} from "@/lib/mi-vereda-cartelera";
import { estadoPublicoDe, esPublicacionPublica } from "@/lib/reportes-publicos";

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
  component: Inicio,
});

function Inicio() {
  const { pathname } = useLocation();
  const { navegacionActiva } = useNavegacionSesion();

  if (pathname !== "/") return null;

  if (!navegacionActiva) {
    return <PortadaEspecial />;
  }

  return <InicioHabitual />;
}

function PortadaEspecial() {
  const { esAdminVereda, esSuperadmin } = useAuth();
  const { activarNavegacion } = useNavegacionSesion();
  const accesoAdministrativo = esSuperadmin
    ? { to: "/admin/gestion" as const, label: "Centro de Gestión" }
    : esAdminVereda
      ? { to: "/admin/jac" as const, label: "Panel JAC" }
      : null;

  return (
    <div className="portada-especial-page">
      <header className="portada-especial-header">
        <Link to="/" className="portada-especial-brand" aria-label="AlertaVereda, Inicio">
          <span className="portada-especial-mark" aria-hidden="true">
            <img src="/images/branding/alertavereda-icono.png" alt="" width="42" height="42" />
          </span>
          <span>AlertaVereda</span>
        </Link>

        <div className="portada-especial-header-actions">
          {accesoAdministrativo && (
            <Link to={accesoAdministrativo.to} className="portada-role-link">
              {accesoAdministrativo.label}
            </Link>
          )}
          <div className="portada-especial-controls">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="portada-especial-main">
        <div className="portada-especial-content">
          <h1 className="sr-only">AlertaVereda</h1>
          <blockquote className="portada-especial-verse">
            <p>“Sobrellevad los unos las cargas de los otros.”</p>
            <cite>Gálatas 6:2</cite>
          </blockquote>

          <nav className="portada-especial-actions" aria-label="Acciones principales">
            <Link
              to="/reportar"
              className="portada-action portada-action-reportar"
              onClick={activarNavegacion}
            >
              <span className="portada-action-icon" aria-hidden="true">
                <Megaphone size={34} strokeWidth={2} />
              </span>
              <span className="portada-action-copy">
                <strong>Reportar</strong>
                <small>Registrar una nueva novedad.</small>
              </span>
              <ArrowRight
                className="portada-action-arrow"
                size={23}
                strokeWidth={2.2}
                aria-hidden="true"
              />
            </Link>

            <Link
              to="/reportes"
              className="portada-action portada-action-reportes"
              onClick={activarNavegacion}
            >
              <span className="portada-action-icon" aria-hidden="true">
                <ClipboardList size={34} strokeWidth={2} />
              </span>
              <span className="portada-action-copy">
                <strong>Ver reportes</strong>
                <small>Consultar emergencias, vías, servicios y avisos.</small>
              </span>
              <ArrowRight
                className="portada-action-arrow"
                size={23}
                strokeWidth={2.2}
                aria-hidden="true"
              />
            </Link>
          </nav>
        </div>
      </main>

      <BotonEmergencias />
    </div>
  );
}

const TAMAÑO_PAGINA_INICIO = 10;
const LIMITE_RESUMEN_INICIO = 2;

function esEmergenciaElegibleParaInicio(publicacion: MiVeredaPublicacion) {
  if (publicacion.categoria !== "emergencia" || publicacion.cerrado_en !== null) return false;

  const estado = estadoPublicoDe(publicacion);
  return estado === "en_revision" || estado === "verificado_activo" || estado === "en_atencion";
}

async function consultarDosPublicacionesRecientes(
  categoria: MiVeredaCategoria | null,
  elegible: (publicacion: MiVeredaPublicacion) => boolean,
) {
  const seleccionadas: MiVeredaPublicacion[] = [];
  const idsIncluidos = new Set<string>();
  let offset = 0;
  let limitePagina = TAMAÑO_PAGINA_INICIO;

  while (seleccionadas.length < LIMITE_RESUMEN_INICIO) {
    const pagina = await consultarCartelera({
      p_categoria: categoria,
      p_limit: limitePagina,
      p_offset: offset,
      p_excluir_nivel_normal: false,
    });

    for (const publicacion of pagina) {
      const clave = `${publicacion.publicacion_tabla}-${publicacion.publicacion_id}`;
      if (!esPublicacionPublica(publicacion) || !elegible(publicacion) || idsIncluidos.has(clave)) {
        continue;
      }

      idsIncluidos.add(clave);
      seleccionadas.push(publicacion);
      if (seleccionadas.length === LIMITE_RESUMEN_INICIO) break;
    }

    if (seleccionadas.length === LIMITE_RESUMEN_INICIO || pagina.length < limitePagina) {
      break;
    }

    offset += limitePagina;
    limitePagina = 100;
  }

  return seleccionadas;
}

function InicioHabitual() {
  const consultaEmergencias = useQuery({
    queryKey: ["portada-habitual", "emergencias"],
    queryFn: () => consultarDosPublicacionesRecientes("emergencia", esEmergenciaElegibleParaInicio),
  });
  const consultaUltimosReportes = useQuery({
    queryKey: ["portada-habitual", "ultimos-reportes"],
    queryFn: () => consultarDosPublicacionesRecientes(null, () => true),
  });

  const emergencias = consultaEmergencias.data ?? [];
  const ultimosReportes = consultaUltimosReportes.data ?? [];
  const sinNovedades =
    !consultaEmergencias.isLoading &&
    !consultaUltimosReportes.isLoading &&
    !consultaEmergencias.isError &&
    !consultaUltimosReportes.isError &&
    emergencias.length === 0 &&
    ultimosReportes.length === 0;

  return (
    <AppShell wide>
      <div className="inicio-page inicio-page-habitual">
        <section className="inicio-hero" aria-labelledby="inicio-titulo">
          <div>
            <p className="inicio-welcome-kicker">Consulta comunitaria</p>
            <h1 id="inicio-titulo">
              <span>Bienvenido a</span>
              <span>AlertaVereda</span>
            </h1>
            <p className="inicio-hero-lead">Tu comunidad, más informada y segura.</p>
          </div>
          <div className="inicio-hero-note" aria-hidden="true">
            <span>Hoy en la comunidad</span>
            <strong>Consulta las novedades reales de tu vereda.</strong>
          </div>
        </section>

        {consultaEmergencias.isLoading && <Vacio texto="Cargando las emergencias activas…" />}
        {consultaEmergencias.isError && (
          <Vacio texto="No fue posible cargar las emergencias activas. Intenta de nuevo más tarde." />
        )}
        {consultaUltimosReportes.isLoading && <Vacio texto="Cargando los últimos reportes…" />}
        {consultaUltimosReportes.isError && (
          <Vacio texto="No fue posible cargar los últimos reportes. Intenta de nuevo más tarde." />
        )}
        {sinNovedades && (
          <div className="inicio-status">
            <p>No hay novedades recientes activas por ahora.</p>
          </div>
        )}

        {emergencias.length > 0 && (
          <section className="inicio-emergency-section" aria-labelledby="inicio-emergencias-titulo">
            <div className="inicio-section-heading inicio-emergency-heading">
              <div>
                <p className="inicio-section-kicker">Atención comunitaria</p>
                <h2 id="inicio-emergencias-titulo">Emergencias activas</h2>
              </div>
              <Link to="/emergencias" className="inicio-section-link">
                Ver todas
                <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </div>
            <div className="inicio-emergency-list">
              {emergencias.map((publicacion) => (
                <TarjetaInicio
                  key={`${publicacion.publicacion_tabla}-${publicacion.publicacion_id}`}
                  publicacion={publicacion}
                />
              ))}
            </div>
          </section>
        )}

        <section className="inicio-recent-section" aria-labelledby="inicio-recientes-titulo">
          <div className="inicio-section-heading">
            <div>
              <h2 id="inicio-recientes-titulo">Últimos reportes</h2>
              <p>Las dos novedades más recientes de la comunidad.</p>
            </div>
          </div>

          {ultimosReportes.map((publicacion) => (
            <TarjetaInicio
              key={`${publicacion.publicacion_tabla}-${publicacion.publicacion_id}`}
              publicacion={publicacion}
            />
          ))}

          {consultaUltimosReportes.data && ultimosReportes.length === 0 && (
            <Vacio texto="Aún no hay reportes recientes para mostrar." />
          )}

          <Link to="/reportes" className="inicio-see-all-reports">
            Ver todos los reportes
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </section>
      </div>
    </AppShell>
  );
}

function TarjetaInicio({ publicacion }: { publicacion: MiVeredaPublicacion }) {
  return <TarjetaReportePublica publicacion={publicacion} mostrarCategoria compacta />;
}
