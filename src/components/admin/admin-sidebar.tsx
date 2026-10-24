import { Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Home,
  Map,
  Mountain,
  PlusCircle,
  Settings,
} from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";

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
      <div className="admin-sidebar-header">
        <BrandLockup />
      </div>

      <nav className="admin-sidebar-nav" aria-label="Menú principal">
        <ul className="admin-sidebar-menu">
          <li>
            <Link
              to="/"
              className="admin-sidebar-item"
              activeOptions={{ exact: true }}
              activeProps={{ className: "admin-sidebar-item admin-sidebar-item-active" }}
              onClick={onNavigate}
            >
              <Home size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Inicio</span>
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

          {/* Sección desplegable: Gestión Administrativa */}
          <li className="admin-sidebar-group">
            <button
              type="button"
              className="admin-sidebar-group-trigger"
              onClick={toggleGestion}
              aria-expanded={gestionOpen}
              aria-controls="admin-sidebar-gestion-subitems"
            >
              <div className="admin-sidebar-group-label">
                <Settings size={18} strokeWidth={2.2} aria-hidden="true" />
                <span>Gestión Administrativa</span>
              </div>
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
                    to="/admin/gestion"
                    className="admin-sidebar-subitem"
                    activeOptions={{ exact: true }}
                    activeProps={{
                      className: "admin-sidebar-subitem admin-sidebar-subitem-active",
                    }}
                    onClick={onNavigate}
                  >
                    <ClipboardList size={15} aria-hidden="true" />
                    <span>Centro de Gestión</span>
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li>
            <Link
              to="/admin/configuracion"
              className="admin-sidebar-item"
              activeOptions={{ exact: true }}
              activeProps={{ className: "admin-sidebar-item admin-sidebar-item-active" }}
              onClick={onNavigate}
            >
              <Settings size={18} strokeWidth={2.2} aria-hidden="true" />
              <span>Configuración</span>
            </Link>
          </li>
        </ul>
      </nav>

      <div className="admin-sidebar-footer">
        <p className="admin-sidebar-community-tagline">
          Juntos cuidamos
          <br />
          nuestra comunidad.
        </p>
      </div>
    </aside>
  );
}
