import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  House,
  LayoutDashboard,
  Map as MapIcon,
  Mountain,
  Pencil,
  Trees,
  UserRound,
} from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";

const MODULOS = [
  { to: "/", label: "Inicio", Icono: House },
  { to: "/mi-vereda", label: "Veredas", Icono: Mountain },
  { to: "/mapa", label: "Mapa", Icono: MapIcon },
  { to: "/reportar", label: "Reportar", Icono: Pencil },
] as const;

export function BotonEmergencias() {
  return (
    <div className="app-emergency-bar">
      <a
        href="tel:123"
        className="app-emergency-link"
        aria-label="Llamar a la línea de emergencias 123"
      >
        <span className="app-emergency-icon" aria-hidden="true">
          ☎
        </span>
        <span className="app-emergency-label">Línea de emergencias</span>
        <span className="app-emergency-number">123</span>
        <span className="app-emergency-community">
          Herramienta comunitaria — complementa, no reemplaza a las autoridades
        </span>
      </a>
    </div>
  );
}

function CuentaControl({ usuario, salir }: { usuario: boolean; salir: () => Promise<unknown> }) {
  if (usuario) {
    return (
      <button
        type="button"
        className="account-button"
        aria-label="Salir"
        title="Salir"
        onClick={() => void salir()}
      >
        <UserRound size={18} strokeWidth={2.3} aria-hidden="true" />
      </button>
    );
  }

  return (
    <Link to="/auth" className="account-button" aria-label="Entrar" title="Entrar">
      <UserRound size={18} strokeWidth={2.3} aria-hidden="true" />
    </Link>
  );
}

export function AppShell({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  const { usuario, esAdminVereda, esSuperadmin, salir } = useAuth();

  return (
    <div className={`app-shell-page min-h-screen ${wide ? "app-shell-dense" : ""}`}>
      <header className="app-shell-header">
        <div className="app-shell-header-inner mx-auto max-w-6xl px-4 py-2">
          <BrandLockup />

          <nav className="app-shell-main-nav" aria-label="Navegación principal">
            <ul className="flex gap-1">
              {MODULOS.map(({ to, label, Icono }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="app-shell-nav-link"
                    activeProps={{ className: "app-shell-nav-link app-shell-nav-link-active" }}
                  >
                    <Icono size={16} strokeWidth={2.2} aria-hidden="true" />
                    <span className="nav-link-label">{label}</span>
                  </Link>
                </li>
              ))}
              {esAdminVereda && (
                <li>
                  <Link
                    to="/admin/jac"
                    className="app-shell-nav-link"
                    activeProps={{ className: "app-shell-nav-link app-shell-nav-link-active" }}
                    title="Panel JAC"
                  >
                    <Trees size={16} strokeWidth={2.2} aria-hidden="true" />
                    <span className="nav-link-label">Panel JAC</span>
                  </Link>
                </li>
              )}
            </ul>
          </nav>

          <div className="header-controls">
            <ThemeToggle />
            <span className="header-control-separator" aria-hidden="true" />
            <CuentaControl usuario={Boolean(usuario)} salir={salir} />
            {esSuperadmin && (
              <Link
                to="/admin/gestion"
                className="superadmin-link"
                aria-label="Centro de Gestión"
                title="Centro de Gestión"
              >
                <LayoutDashboard size={17} aria-hidden="true" />
                <span className="superadmin-label">Centro de Gestión</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className={`mx-auto px-4 py-5 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>{children}</main>

      <p className="mx-auto max-w-3xl px-4 pb-6 text-center text-xs text-[color:var(--tinta-suave)]">
        <span className="app-community-note">
          Herramienta comunitaria — complementa, no reemplaza a las autoridades
        </span>
        <span className="app-community-tagline mt-1 block italic">
          Hecho para servir a nuestra comunidad, con Cristo en el centro. †
        </span>
      </p>

      <BotonEmergencias />
    </div>
  );
}
