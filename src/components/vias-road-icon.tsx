import { forwardRef } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

/** Ícono de carretera para Vías; usa marcas negativas del color del fondo forestal. */
export const ViasRoadIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 48, color = "currentColor", ...props }, ref) => (
    <svg ref={ref} {...props} width={size} height={size} viewBox="0 0 48 48" fill="none">
      <path d="M16 4h16l11 40H5L16 4Z" fill={color} />
      <path
        d="m17.2 5-9.7 38m23.3-38 9.7 38"
        stroke="var(--vias-road-cutout, #2f5d45)"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <path
        d="M24 8v6m0 6v7m0 6v7"
        stroke="var(--vias-road-cutout, #2f5d45)"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  ),
);

ViasRoadIcon.displayName = "ViasRoadIcon";
