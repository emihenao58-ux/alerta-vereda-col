import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, UsersRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AdminGate, AdminShell } from "@/components/admin/admin-shell";
import { AdminOperation } from "@/components/admin/admin-operation";
import { RoleWelcome } from "@/components/admin/role-welcome";
import { useAuth } from "@/hooks/use-auth";
import { esVistaPanelJac, validarBusquedaPanelJac } from "@/lib/admin-jac-navigation";

export const Route = createFileRoute("/admin/jac")({
  validateSearch: validarBusquedaPanelJac,
  component: PanelJac,
});

function PanelJac() {
  const { vista: vistaBusqueda } = Route.useSearch();
  const vista = esVistaPanelJac(vistaBusqueda) ? vistaBusqueda : "resumen";
  const { perfil, veredaAsignadaId, cargandoAcceso } = useAuth();
  const vereda = useQuery({
    queryKey: ["vereda-asignada", veredaAsignadaId],
    enabled: Boolean(veredaAsignadaId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("veredas")
        .select("id, nombre")
        .eq("id", veredaAsignadaId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const nombreCompleto = perfil?.nombre?.trim() ?? "";
  const etiquetaVereda = vereda.isLoading
    ? "Cargando vereda…"
    : vereda.error
      ? "No se pudo cargar la vereda"
      : (vereda.data?.nombre ?? "Vereda no disponible");

  return (
    <AdminGate access="local">
      <AdminShell
        area="local"
        headerContent={
          <header className="admin-workspace-header admin-jac-workspace-header">
            <span className="admin-jac-header-community-icon" aria-hidden="true">
              <UsersRound size={26} strokeWidth={1.8} />
            </span>
            <div className="admin-workspace-heading admin-jac-header-copy">
              <h1 className="admin-workspace-title">Panel JAC</h1>
              <p className="admin-workspace-subtitle">
                Revisa y actualiza las alertas de la vereda que tienes asignada.
              </p>
            </div>
            <div
              className="admin-jac-header-assignment"
              aria-label={`Administrador de vereda. Vereda asignada: ${etiquetaVereda}`}
            >
              <span className="admin-scope-dot" aria-hidden="true" />
              <span>
                <strong>Administrador de vereda</strong>
                <small>{etiquetaVereda}</small>
              </span>
            </div>
          </header>
        }
      >
        <RoleWelcome
          role="admin_vereda"
          veredaLabel={vereda.data?.nombre ?? null}
          veredaLoading={Boolean(veredaAsignadaId) && vereda.isLoading}
        />
        <section
          className="admin-territory-banner admin-jac-territory-banner"
          aria-label="Identidad del administrador y alcance territorial"
        >
          <div className="admin-jac-territory-item">
            <span className="admin-territory-label">Administrador de vereda</span>
            <strong>
              {nombreCompleto || (cargandoAcceso ? "Cargando nombre…" : "Nombre no disponible")}
            </strong>
          </div>
          <span className="admin-territory-lock">Alcance: Local protegido</span>
        </section>
        {vista !== "resumen" && (
          <nav className="admin-jac-subview-nav" aria-label="Navegación de la sección">
            <Link className="admin-jac-back-link" to="/admin/jac" search={{ vista: "resumen" }}>
              <ArrowLeft size={17} aria-hidden="true" />
              Volver al Panel JAC
            </Link>
          </nav>
        )}
        <AdminOperation scope="local" view={vista} veredaId={veredaAsignadaId} />
      </AdminShell>
    </AdminGate>
  );
}
