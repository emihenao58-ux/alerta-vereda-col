import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LayoutDashboard, Trees, UserRound } from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";

const MODULOS = [
  { to: "/", label: "Inicio" },
  { to: "/mi-vereda", label: "Veredas" },
  { to: "/mapa", label: "Mapa" },
  { to: "/reportar", label: "Reportar" },
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
        <span>Línea de emergencias</span>
        <span className="app-emergency-number">123</span>
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
    <div className={`min-h-screen pb-24 ${wide ? "app-shell-dense" : ""}`}>
      <header className="app-shell-header">
        <div
          className={`mx-auto flex items-center justify-between gap-3 px-4 py-3 ${wide ? "max-w-6xl" : "max-w-3xl"}`}
        >
          <BrandLockup />
          <div className="header-controls">
            <ThemeToggle />
            <span className="header-control-separator" aria-hidden="true" />
            <CuentaControl usuario={Boolean(usuario)} salir={salir} />
            {esSuperadmin && (
              <Link
                to="/admin/gestion"
                className="superadmin-link flex items-center gap-1 whitespace-nowrap text-sm underline underline-offset-4"
                title="Centro de Gestión"
              >
                <LayoutDashboard size={15} aria-hidden="true" />
                Centro de Gestión
              </Link>
            )}
          </div>
        </div>
        <nav
          className={`mx-auto overflow-x-auto px-2 pb-2 ${wide ? "max-w-6xl" : "max-w-3xl"}`}
          aria-label="Navegación principal"
        >
          <ul className="flex gap-1 text-sm">
            {MODULOS.map((m) => (
              <li key={m.to}>
                <Link
                  to={m.to}
                  className="app-shell-nav-link"
                  activeProps={{ className: "app-shell-nav-link app-shell-nav-link-active" }}
                >
                  {m.label}
                </Link>
              </li>
            ))}
            {esAdminVereda && (
              <li>
                <Link
                  to="/admin/jac"
                  className="app-shell-nav-link flex items-center gap-1"
                  activeProps={{
                    className:
                      "app-shell-nav-link app-shell-nav-link-active flex items-center gap-1",
                  }}
                >
                  <Trees size={15} aria-hidden="true" />
                  Panel JAC
                </Link>
              </li>
            )}
          </ul>
        </nav>
      </header>

      <main className={`mx-auto px-4 py-5 ${wide ? "max-w-6xl" : "max-w-3xl"}`}>{children}</main>

      <p className="mx-auto max-w-3xl px-4 pb-6 text-center text-xs text-[color:var(--tinta-suave)]">
        Herramienta comunitaria — complementa, no reemplaza a las autoridades.
        <span className="mt-1 block italic">
          Hecho para servir a nuestra comunidad, con Cristo en el centro. †
        </span>
      </p>

      <BotonEmergencias />
    </div>
  );
}
