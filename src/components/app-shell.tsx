import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ClipboardList,
  House,
  LayoutDashboard,
  Map as MapIcon,
  Mountain,
  Plus,
  Trees,
  UserRound,
} from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { useNavegacionSesion } from "@/components/navegacion-sesion";
import { dispatchLogoutTransition } from "@/lib/logout-transition";

const MODULOS = [
  { to: "/", label: "Inicio", Icono: House },
  { to: "/reportes", label: "Reportes", Icono: ClipboardList },
  { to: "/mapa", label: "Mapa", Icono: MapIcon },
  { to: "/mi-vereda", label: "Veredas", Icono: Mountain },
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
        <span className="app-emergency-mobile-label">
          <span aria-hidden="true">☎</span> Llamar al
        </span>
        <span className="app-emergency-number">123</span>
        <span className="app-emergency-community">
          Herramienta comunitaria — complementa, no reemplaza a las autoridades
        </span>
      </a>
    </div>
  );
}

export function BotonReportarFlotante() {
  return (
    <Link to="/reportar" className="app-report-fab" aria-label="Crear un reporte">
      <span className="app-report-fab-circle" aria-hidden="true">
        <Plus size={32} strokeWidth={2.5} />
      </span>
      <span className="app-report-fab-label">Reportar</span>
    </Link>
  );
}

export function CuentaControl({
  usuario,
  salir,
  showLabel = false,
}: {
  usuario: boolean;
  salir: () => Promise<{ error: unknown | null }>;
  showLabel?: boolean;
}) {
  const { perfil } = useAuth();
  const navigate = useNavigate();
  const [cerrandoSesion, setCerrandoSesion] = useState(false);

  const cerrarSesion = async () => {
    if (cerrandoSesion) return;

    const rol = perfil?.rol === "admin_vereda" || perfil?.rol === "superadmin" ? perfil.rol : null;
    setCerrandoSesion(true);
    if (rol) dispatchLogoutTransition({ phase: "start", role: rol });

    try {
      const resultado = await salir();
      if (resultado.error) {
        if (rol) {
          dispatchLogoutTransition({
            phase: "error",
            role: rol,
            message: "No pudimos cerrar tu sesión. Revisa tu conexión e inténtalo de nuevo.",
          });
        }
        setCerrandoSesion(false);
        return;
      }
      if (rol) dispatchLogoutTransition({ phase: "success", role: rol });
      await navigate({ to: "/auth", replace: true });
    } catch (error) {
      if (rol) {
        dispatchLogoutTransition({
          phase: "error",
          role: rol,
          message: "No pudimos cerrar tu sesión. Revisa tu conexión e inténtalo de nuevo.",
        });
      }
      setCerrandoSesion(false);
      console.error("No se pudo cerrar la sesión:", error);
    }
  };

  if (usuario) {
    return (
      <button
        type="button"
        className="account-button"
        aria-label="Salir"
        title="Salir"
        disabled={cerrandoSesion}
        onClick={() => void cerrarSesion()}
      >
        <UserRound size={18} strokeWidth={2.3} aria-hidden="true" />
        {showLabel && <span>Salir</span>}
      </button>
    );
  }

  return (
    <Link to="/auth" className="account-button" aria-label="Entrar" title="Entrar">
      <UserRound size={18} strokeWidth={2.3} aria-hidden="true" />
    </Link>
  );
}

export interface AppShellProps {
  children: ReactNode;
  wide?: boolean;
  variant?: "default" | "superadmin";
}

export function AppShell({ children, wide = false, variant = "default" }: AppShellProps) {
  const { usuario, esAdminVereda, esSuperadmin, salir } = useAuth();
  const { activarNavegacion } = useNavegacionSesion();
  const location = useLocation();
  const isSuperadminLayout = variant === "superadmin" && esSuperadmin;
  const mostrarBotonReportar =
    !isSuperadminLayout &&
    (!location.pathname.startsWith("/admin") || esAdminVereda) &&
    location.pathname !== "/reportar";

  useEffect(() => {
    if (!isSuperadminLayout) activarNavegacion();
  }, [activarNavegacion, isSuperadminLayout]);

  return (
    <div
      className={`app-shell-page min-h-screen ${wide ? "app-shell-dense" : ""} ${
        isSuperadminLayout ? "app-shell-superadmin" : ""
      }`}
    >
      <header className="app-shell-header">
        <div className="app-shell-header-inner mx-auto max-w-6xl px-4 py-2">
          <BrandLockup />

          {!isSuperadminLayout && (
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
          )}

          <div className="header-controls">
            <ThemeToggle />
            <span className="header-control-separator" aria-hidden="true" />
            <CuentaControl
              usuario={Boolean(usuario)}
              salir={salir}
              showLabel={isSuperadminLayout}
            />
            {esSuperadmin && !isSuperadminLayout && (
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

      {mostrarBotonReportar && <BotonReportarFlotante />}
      {!isSuperadminLayout && <BotonEmergencias />}
    </div>
  );
}
