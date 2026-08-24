import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { ArrowLeft, LayoutDashboard, ShieldCheck, Trees } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Vacio } from "@/components/carta";
import { useAuth } from "@/hooks/use-auth";

export type AdminArea = "local" | "governance" | "gestion";
export type AdminAccess = "local" | "superadmin";

const areaCopy: Record<AdminArea, { eyebrow: string; title: string; subtitle: string }> = {
  local: {
    eyebrow: "Operación comunitaria",
    title: "Panel JAC",
    subtitle: "Revisa y actualiza las alertas de la vereda que tienes asignada.",
  },
  governance: {
    eyebrow: "Gobernanza y confianza",
    title: "Panel JAC · Superadmin",
    subtitle: "Aprueba solicitudes, administra asignaciones y conserva la trazabilidad.",
  },
  gestion: {
    eyebrow: "Centro de Gestión",
    title: "Supervisión territorial",
    subtitle: "Opera reportes de todas las veredas desde una vista global y explícita.",
  },
};

export function AdminShell({ area, children }: { area: AdminArea; children: ReactNode }) {
  const { esAdminVereda, esSuperadmin } = useAuth();
  const copy = areaCopy[area];

  return (
    <AppShell wide>
      <div className={`admin-workspace admin-workspace-${area}`}>
        <header className="admin-workspace-header">
          <div className="admin-workspace-heading">
            <div className="admin-workspace-eyebrow">
              {area === "local" ? (
                <Trees size={15} aria-hidden="true" />
              ) : (
                <ShieldCheck size={15} aria-hidden="true" />
              )}
              <span>{copy.eyebrow}</span>
            </div>
            <h1 className="admin-workspace-title">{copy.title}</h1>
            <p className="admin-workspace-subtitle">{copy.subtitle}</p>
          </div>
          <div className="admin-workspace-scope" aria-label="Alcance de la cuenta">
            <span className="admin-scope-dot" aria-hidden="true" />
            {esSuperadmin
              ? "Superadmin"
              : esAdminVereda
                ? "Administrador de vereda"
                : "Acceso administrativo"}
          </div>
        </header>

        <nav className="admin-area-nav" aria-label="Espacios administrativos">
          {esAdminVereda && (
            <Link
              to="/admin/jac"
              className="admin-area-link"
              activeProps={{ className: "admin-area-link admin-area-link-active" }}
            >
              <Trees size={16} aria-hidden="true" />
              <span>Mi Panel JAC</span>
            </Link>
          )}
          {esSuperadmin && (
            <>
              <Link
                to="/admin/jac-superadmin"
                className="admin-area-link"
                activeProps={{ className: "admin-area-link admin-area-link-active" }}
              >
                <ShieldCheck size={16} aria-hidden="true" />
                <span>Panel JAC superadmin</span>
              </Link>
              <Link
                to="/admin/gestion"
                className="admin-area-link"
                activeProps={{ className: "admin-area-link admin-area-link-active" }}
              >
                <LayoutDashboard size={16} aria-hidden="true" />
                <span>Centro de Gestión</span>
              </Link>
            </>
          )}
        </nav>

        <div className="admin-workspace-content">{children}</div>
      </div>
    </AppShell>
  );
}

export function AdminGate({ access, children }: { access: AdminAccess; children: ReactNode }) {
  const { usuario, esAdminVereda, esSuperadmin, solicitudPendiente, cargando } = useAuth();

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
          <h1 className="admin-workspace-title">Inicia sesión para continuar</h1>
          <p className="admin-workspace-subtitle">
            Este espacio está reservado para administradores autorizados.
          </p>
          <Link to="/auth" className="admin-primary-action">
            Iniciar sesión
          </Link>
        </section>
      </AppShell>
    );
  }

  const autorizado = access === "superadmin" ? esSuperadmin : esAdminVereda;
  if (!autorizado) {
    return (
      <AppShell>
        <section className="admin-access-card">
          <p className="admin-workspace-eyebrow">Acceso no disponible</p>
          <h1 className="admin-workspace-title">
            {solicitudPendiente
              ? "Solicitud en revisión"
              : "Este espacio no corresponde a tu cuenta"}
          </h1>
          <p className="admin-workspace-subtitle">
            {solicitudPendiente
              ? "El superadmin debe aprobar tu solicitud y asignarte una vereda antes de habilitar herramientas administrativas."
              : "La navegación visible no cambia tus permisos. Las políticas del sistema siguen siendo la autoridad de acceso."}
          </p>
          <Link to="/" className="admin-secondary-action">
            <ArrowLeft size={16} aria-hidden="true" />
            Volver a la cartelera
          </Link>
        </section>
      </AppShell>
    );
  }

  return <>{children}</>;
}
