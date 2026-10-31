import type { EstadoPublico } from "@/lib/reportes-publicos";

export type FiltroEstadoPublico = "todos" | EstadoPublico;

const OPCIONES: Array<{ value: FiltroEstadoPublico; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "en_revision", label: "En revisión" },
  { value: "verificado_activo", label: "Activos" },
  { value: "en_atencion", label: "En atención" },
  { value: "verificado_solucionado", label: "Solucionados" },
  { value: "cerrado_sin_solucion", label: "Cerrados sin solución" },
];

export function FiltrosEstadoPublico({
  value,
  counts,
  onChange,
  ariaLabel = "Filtrar emergencias por estado",
  incluirEnRevision = true,
}: {
  value: FiltroEstadoPublico;
  counts: Partial<Record<EstadoPublico, number>>;
  onChange: (value: FiltroEstadoPublico) => void;
  ariaLabel?: string;
  incluirEnRevision?: boolean;
}) {
  const opciones = incluirEnRevision
    ? OPCIONES
    : OPCIONES.filter((opcion) => opcion.value !== "en_revision");

  return (
    <div className="seccion-publica-filters" role="group" aria-label={ariaLabel}>
      {opciones.map((opcion) => {
        const count = opcion.value === "todos" ? undefined : counts[opcion.value];
        const active = value === opcion.value;
        return (
          <button
            key={opcion.value}
            type="button"
            className={`seccion-publica-filter${active ? " is-active" : ""}`}
            aria-pressed={active}
            onClick={() => onChange(opcion.value)}
          >
            <span>{opcion.label}</span>
            {count !== undefined && <small>{count}</small>}
          </button>
        );
      })}
    </div>
  );
}
