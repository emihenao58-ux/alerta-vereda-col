import { createFileRoute, Link, Outlet, useLocation } from "@tanstack/react-router";
import { ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { TarjetasCategoriaReportes } from "@/components/report-category-cards";

export const Route = createFileRoute("/reportes")({
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

  if (pathname !== "/reportes") return <Outlet />;

  return (
    <AppShell wide>
      <div className="reportes-page">
        <section className="reportes-intro" aria-labelledby="reportes-titulo">
          <p className="reportes-eyebrow">Consulta comunitaria</p>
          <h1 id="reportes-titulo">Reportes de la comunidad</h1>
          <p>Consulta las novedades de tu vereda.</p>
        </section>

        <TarjetasCategoriaReportes />

        <Link to="/reportes/todos" className="reportes-all-button">
          <ClipboardList size={30} strokeWidth={2} aria-hidden="true" />
          <span>
            <strong>Ver todos los reportes</strong>
            <small>Consulta el listado público completo</small>
          </span>
        </Link>
      </div>
    </AppShell>
  );
}
