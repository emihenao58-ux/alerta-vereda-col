import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/app-shell";
import { RoleWelcome } from "@/components/admin/role-welcome";
import { Vacio } from "@/components/carta";
import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/admin/")({
  component: AdminEntry,
});

function AdminEntry() {
  const navigate = useNavigate();
  const { usuario, esAdminVereda, esSuperadmin, solicitudPendiente, cargando } = useAuth();

  useEffect(() => {
    if (cargando || !usuario) return;
    if (esSuperadmin) {
      void navigate({ to: "/admin/gestion", replace: true });
    } else if (esAdminVereda) {
      void navigate({ to: "/admin/jac", replace: true });
    }
  }, [cargando, esAdminVereda, esSuperadmin, navigate, usuario]);

  if (cargando) {
    return (
      <AppShell>
        <Vacio texto="Cargando tu acceso administrativo…" />
      </AppShell>
    );
  }

  if (!usuario) {
    return (
      <AppShell>
        <section className="admin-access-card">
          <p className="admin-workspace-eyebrow">Acceso protegido</p>
          <h1 className="admin-workspace-title">Espacios administrativos</h1>
          <p className="admin-workspace-subtitle">
            Inicia sesión para que el sistema identifique automáticamente tu rol y tu alcance
            territorial.
          </p>
          <Link to="/auth" className="admin-primary-action">
            Iniciar sesión
          </Link>
        </section>
      </AppShell>
    );
  }

  if (solicitudPendiente) {
    return (
      <AppShell>
        <RoleWelcome role="pendiente" onContinue={() => void navigate({ to: "/" })} />
        <section className="admin-access-card mt-5">
          <p className="admin-workspace-eyebrow">Sin herramientas administrativas todavía</p>
          <h1 className="admin-workspace-title">Solicitud en revisión</h1>
          <p className="admin-workspace-subtitle">
            Puedes seguir consultando la cartelera y enviando reportes comunitarios desde la página
            principal.
          </p>
          <Link to="/" className="admin-secondary-action">
            Volver a la cartelera
          </Link>
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Vacio texto="Preparando tu espacio administrativo…" />
    </AppShell>
  );
}
