import { Link } from "@tanstack/react-router";
import type { ComponentType, CSSProperties } from "react";
import type { LucideProps } from "lucide-react";
import { AlertTriangle, Droplet, Megaphone } from "lucide-react";
import { RoadIcon } from "@/components/road-icon";

const CATEGORIAS_REPORTES = [
  {
    to: "/emergencias",
    label: "Emergencias",
    descripcion: "Consulta situaciones urgentes.",
    color: "#D83644",
    textColor: "#FFFFFF",
  },
  {
    to: "/vias",
    label: "Vías",
    descripcion: "Consulta daños y bloqueos.",
    color: "#E58129",
    textColor: "#1B2B24",
  },
  {
    to: "/servicios",
    label: "Servicios",
    descripcion: "Consulta fallas en servicios públicos.",
    color: "#208666",
    textColor: "#FFFFFF",
  },
  {
    to: "/avisos",
    label: "Avisos",
    descripcion: "Consulta información importante.",
    color: "#E7A836",
    textColor: "#1B2B24",
  },
] as const;

type CategoriaReportes = (typeof CATEGORIAS_REPORTES)[number];

const ICONOS_CATEGORIA: Record<CategoriaReportes["to"], ComponentType<LucideProps>> = {
  "/emergencias": AlertTriangle,
  "/vias": RoadIcon,
  "/servicios": Droplet,
  "/avisos": Megaphone,
};

export function TarjetasCategoriaReportes() {
  return (
    <nav
      className="inicio-category-grid reportes-category-grid"
      aria-label="Categorías de reportes"
    >
      {CATEGORIAS_REPORTES.map((categoria) => {
        const Icono = ICONOS_CATEGORIA[categoria.to];

        return (
          <Link
            key={categoria.to}
            to={categoria.to}
            className="inicio-category-card"
            style={{ backgroundColor: categoria.color, color: categoria.textColor }}
          >
            <span className="inicio-category-card-inner">
              <span
                className="inicio-category-icon"
                aria-hidden="true"
                style={{ color: categoria.textColor }}
              >
                <Icono
                  size={48}
                  strokeWidth={1.8}
                  fill="currentColor"
                  stroke="var(--icon-cutout)"
                  style={{ "--icon-cutout": categoria.color } as CSSProperties}
                />
              </span>
              <span>
                <strong>{categoria.label}</strong>
                <small>{categoria.descripcion}</small>
              </span>
              <span className="inicio-category-arrow" aria-hidden="true">
                →
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
