import { Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Download,
  LayoutDashboard,
  Map,
  Mountain,
  PlusCircle,
  Settings,
  UsersRound,
} from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";
import { ThemeToggle } from "@/components/theme-toggle";
import "@/components/admin/admin-sidebar.css";

interface AdminSidebarProps {
  currentPath?: string;
  onNavigate?: () => void;
}

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  const [gestionOpen, setGestionOpen] = useState(true);

  const toggleGestion = useCallback(() => {
    setGestionOpen((prev) => !prev);
  }, []);

  return (
    <aside className="admin-sidebar" aria-label="Navegación del Superadministrador">
      <SidebarLandscape />
      <div className="admin-sidebar-header">
        <BrandLockup />
      </div>

      <nav className="admin-sidebar-nav" aria-label="Menú principal">
        <ul className="admin-sidebar-menu">
          <li>
            <Link
              to="/admin/gestion"
              className="admin-sidebar-item"
              activeOptions={{ exact: true }}
              activeProps={{ className: "admin-sidebar-item admin-sidebar-item-active" }}
              onClick={onNavigate}
            >
              <LayoutDashboard size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Centro de Gestión</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/reportes"
              className="admin-sidebar-item"
              activeProps={{ className: "admin-sidebar-item admin-sidebar-item-active" }}
              onClick={onNavigate}
            >
              <ClipboardList size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Reportes</span>
            </Link>
          </li>
          <li>
            <Link
              to="/reportes"
              search={{ contexto: "publicaciones" }}
              className="admin-sidebar-item"
              activeProps={{ className: "admin-sidebar-item admin-sidebar-item-active" }}
              onClick={onNavigate}
            >
              <Mountain size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Publicaciones</span>
            </Link>
          </li>
          <li>
            <Link
              to="/reportes/todos"
              search={{ contexto: "historial" }}
              className="admin-sidebar-item"
              activeProps={{ className: "admin-sidebar-item admin-sidebar-item-active" }}
              onClick={onNavigate}
            >
              <ClipboardList size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Historial</span>
            </Link>
          </li>
          <li>
            <Link
              to="/mi-vereda"
              className="admin-sidebar-item"
              activeOptions={{ exact: true }}
              activeProps={{ className: "admin-sidebar-item admin-sidebar-item-active" }}
              onClick={onNavigate}
            >
              <Mountain size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Veredas</span>
            </Link>
          </li>
          <li>
            <Link
              to="/mapa"
              className="admin-sidebar-item"
              activeOptions={{ exact: true }}
              activeProps={{ className: "admin-sidebar-item admin-sidebar-item-active" }}
              onClick={onNavigate}
            >
              <Map size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Mapa</span>
            </Link>
          </li>
          <li>
            <Link
              to="/admin/gestion/reportar"
              className="admin-sidebar-item"
              activeOptions={{ exact: true }}
              activeProps={{ className: "admin-sidebar-item admin-sidebar-item-active" }}
              onClick={onNavigate}
            >
              <PlusCircle size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Reportar</span>
            </Link>
          </li>
        </ul>

        <p className="admin-sidebar-section-label">Administración</p>
        <ul className="admin-sidebar-menu admin-sidebar-management-menu">
          <li className="admin-sidebar-group">
            <button
              type="button"
              className="admin-sidebar-group-trigger"
              onClick={toggleGestion}
              aria-expanded={gestionOpen}
              aria-controls="admin-sidebar-gestion-subitems"
            >
              <span className="admin-sidebar-group-label">
                <Settings size={18} strokeWidth={2.2} aria-hidden="true" />
                <span>Gestión Administrativa</span>
              </span>
              {gestionOpen ? (
                <ChevronDown size={16} aria-hidden="true" />
              ) : (
                <ChevronRight size={16} aria-hidden="true" />
              )}
            </button>
            {gestionOpen && (
              <ul
                id="admin-sidebar-gestion-subitems"
                className="admin-sidebar-submenu"
                aria-label="Opciones de Gestión Administrativa"
              >
                <li>
                  <Link
                    to="/admin/jac-superadmin"
                    hash="administradores"
                    className="admin-sidebar-subitem"
                    activeProps={{
                      className: "admin-sidebar-subitem admin-sidebar-subitem-active",
                    }}
                    onClick={onNavigate}
                  >
                    <UsersRound size={15} aria-hidden="true" />
                    <span>Administradores</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/jac-superadmin"
                    hash="solicitudes"
                    className="admin-sidebar-subitem"
                    activeProps={{
                      className: "admin-sidebar-subitem admin-sidebar-subitem-active",
                    }}
                    onClick={onNavigate}
                  >
                    <ClipboardList size={15} aria-hidden="true" />
                    <span>Solicitudes</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to="/admin/configuracion"
                    className="admin-sidebar-subitem"
                    activeProps={{
                      className: "admin-sidebar-subitem admin-sidebar-subitem-active",
                    }}
                    onClick={onNavigate}
                  >
                    <Settings size={15} aria-hidden="true" />
                    <span>Configuración</span>
                  </Link>
                </li>
                <li>
                  <span
                    className="admin-sidebar-subitem admin-sidebar-subitem-disabled"
                    aria-disabled="true"
                    title="Esta área se definirá en la etapa de Exportar datos."
                  >
                    <Download size={15} aria-hidden="true" />
                    <span>Exportar datos</span>
                    <small>Más adelante</small>
                  </span>
                </li>
              </ul>
            )}
          </li>
        </ul>
      </nav>

      <footer className="admin-sidebar-footer">
        <div className="admin-sidebar-footer-message">
          <p className="admin-sidebar-community-tagline">
            Juntos construimos comunidades más seguras y conectadas.
          </p>
        </div>
        <div className="admin-sidebar-theme">
          <span className="admin-sidebar-theme-label">Tema</span>
          <ThemeToggle />
        </div>
      </footer>
    </aside>
  );
}

function SidebarLandscape() {
  return (
    <svg
      className="admin-sidebar-landscape"
      viewBox="0 0 400 140"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="admin-sidebar-landscape-back"
        d="M0 89 C22 86 36 68 57 67 C81 66 94 88 116 85 C140 82 146 46 170 42 C194 38 207 66 229 72 C252 78 264 56 287 54 C310 52 323 74 345 73 C367 72 383 60 400 64 L400 140 L0 140 Z"
      />
      <path
        className="admin-sidebar-landscape-mid"
        d="M0 108 C31 104 49 83 75 84 C101 85 111 104 136 101 C163 98 172 68 196 66 C220 64 235 94 260 96 C284 98 296 82 319 81 C348 80 366 101 400 94 L400 140 L0 140 Z"
      />
      <path
        className="admin-sidebar-landscape-front"
        d="M0 121 C27 113 45 113 64 119 C91 127 111 112 138 110 C164 108 183 127 211 125 C239 123 255 107 282 109 C311 111 323 128 350 125 C372 123 386 109 400 110 L400 140 L0 140 Z"
      />
      <path
        className="admin-sidebar-landscape-contour"
        d="M21 115 C48 106 58 94 78 94 C96 94 107 106 125 105 M177 99 C190 86 199 82 211 84 C226 85 236 99 251 101 M302 107 C323 96 339 95 355 101"
      />
    </svg>
  );
}
