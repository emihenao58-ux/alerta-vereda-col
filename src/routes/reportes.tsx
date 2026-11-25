import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { TarjetasCategoriaReportes } from "@/components/report-category-cards";
import { ReportesSurface } from "@/components/reportes/reportes-surface";
import { validarBusquedaReportesAdmin } from "@/lib/reportes-contexto-admin";

export const Route = createFileRoute("/reportes")({
  validateSearch: validarBusquedaReportesAdmin,
  head: () => ({
    meta: [
      { title: "Reportes de la comunidad · AlertaVereda" },
      {
        name: "description",
        content: "Consulta emergencias, vías, servicios y avisos comunitarios de AlertaVereda.",
      },
    ],
  }),
  component: Reportes,
});

function Reportes() {
  const { pathname } = useLocation();
  const { contexto } = Route.useSearch();

  if (pathname !== "/reportes") return <Outlet />;

  const esVistaPublicaciones = contexto === "publicaciones";
  const contextoTarjetas = esVistaPublicaciones ? "publicaciones" : undefined;

  return (
    <ReportesSurface contexto={contexto} wide>
      <div className="reportes-page">
        <section className="reportes-intro" aria-labelledby="reportes-titulo">
          <p className="reportes-eyebrow">
            {esVistaPublicaciones ? "Publicaciones comunitarias" : "Consulta comunitaria"}
          </p>
          <h1 id="reportes-titulo">
            {esVistaPublicaciones ? "Publicaciones de la comunidad" : "Reportes de la comunidad"}
          </h1>
          <p>
            {esVistaPublicaciones
              ? "Explora las publicaciones visibles de las veredas de Ebéjico por categoría."
              : "Consulta las novedades de tu vereda."}
          </p>
        </section>

        <TarjetasCategoriaReportes contexto={contextoTarjetas} />

        <Link
          to="/reportes/todos"
          search={{ contexto: contextoTarjetas }}
          className="reportes-all-button"
        >
          <ClipboardList size={30} strokeWidth={2} aria-hidden="true" />
          <span>
            <strong>
              {esVistaPublicaciones ? "Ver todas las publicaciones" : "Ver todos los reportes"}
            </strong>
            <small>
              {esVistaPublicaciones
                ? "Consulta el listado de publicaciones con visibilidad comunitaria"
                : "Consulta el listado público completo"}
            </small>
          </span>
        </Link>
      </div>
    </ReportesSurface>
  );
}
