import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function CabeceraSeccionPublica({
  variante,
  Icon,
  titulo,
  bajada,
  accion,
}: {
  variante: string;
  Icon: LucideIcon;
  titulo: string;
  bajada: string;
  accion?: ReactNode;
}) {
  return (
    <header className={`seccion-publica-hero seccion-publica-hero-${variante}`}>
      <div className="seccion-publica-hero-heading">
        <span className="seccion-publica-hero-icon" aria-hidden="true">
          <Icon size={36} strokeWidth={2.1} />
        </span>
        <div>
          <p className="reportes-eyebrow">Información pública</p>
          <h1>{titulo}</h1>
          <p className="seccion-publica-hero-description">{bajada}</p>
        </div>
      </div>
      {accion && <div className="seccion-publica-hero-action">{accion}</div>}
    </header>
  );
}
