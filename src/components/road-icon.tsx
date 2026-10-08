import { forwardRef } from "react";
import type { LucideIcon, LucideProps } from "lucide-react";

export const RoadIcon: LucideIcon = forwardRef<SVGSVGElement, LucideProps>(
  ({ size = 48, color = "currentColor", ...props }, ref) => {
    return (
      <svg ref={ref} {...props} width={size} height={size} viewBox="0 0 48 48" fill="none">
        <path d="M16 4h16l11 40H5L16 4Z" fill={color} />
        <path d="M22 9h4v7h-4V9Zm0 12h4v7h-4v-7Zm0 12h4v7h-4v-7Z" fill="var(--icon-cutout)" />
      </svg>
    );
  },
);

RoadIcon.displayName = "RoadIcon";
