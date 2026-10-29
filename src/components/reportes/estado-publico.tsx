import { Clock3, ShieldCheck } from "lucide-react";
import { ETIQUETAS_ESTADO_PUBLICO, type EstadoPublico } from "@/lib/reportes-publicos";

export function EstadoPublicoChip({ estado }: { estado: EstadoPublico }) {
  const revision = estado === "en_revision";
  return (
    <span className={`reporte-estado-chip reporte-estado-chip-${estado}`}>
      {revision ? (
        <Clock3 size={14} strokeWidth={2.2} aria-hidden="true" />
      ) : (
        <ShieldCheck size={14} strokeWidth={2.2} aria-hidden="true" />
      )}
      {ETIQUETAS_ESTADO_PUBLICO[estado]}
    </span>
  );
}
