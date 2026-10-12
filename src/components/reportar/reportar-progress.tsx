import { useRef } from "react";
import type { ReporteStep } from "@/lib/reportar/types";

const STEPS: readonly { step: ReporteStep; label: string }[] = [
  { step: "categoria", label: "Tipo" },
  { step: "detalle", label: "Datos" },
  { step: "ubicacion", label: "Ubicación" },
  { step: "evidencias", label: "Evidencia" },
  { step: "revision", label: "Revisión" },
];

export function ReportarProgress({ step }: { step: ReporteStep }) {
  const currentIndex =
    step === "confirmacion"
      ? STEPS.length - 1
      : Math.max(
          0,
          STEPS.findIndex((item) => item.step === step),
        );
  const maxDiscoveredIndex = useRef(currentIndex);

  maxDiscoveredIndex.current = Math.max(maxDiscoveredIndex.current, currentIndex);

  const currentLabel = STEPS[currentIndex]?.label ?? STEPS[0]?.label ?? "Tipo";
  const visibleSteps = STEPS.slice(0, maxDiscoveredIndex.current + 1);
  const percentage = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className="reportar-progress" aria-label="Progreso del reporte">
      <div className="reportar-progress-topline">
        <span>TU REPORTE</span>
      </div>
      <div
        className="reportar-progress-track"
        role="progressbar"
        aria-label="Progreso del reporte"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
        aria-valuetext={currentLabel}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
      <ol className="reportar-progress-labels" aria-label="Etapas descubiertas del reporte">
        {visibleSteps.map((item, index) => {
          const state =
            index < currentIndex
              ? "is-complete"
              : index === currentIndex
                ? "is-current"
                : "is-discovered";

          return (
            <li
              key={item.step}
              className={state}
              aria-current={index === currentIndex ? "step" : undefined}
            >
              <span aria-hidden="true">{index + 1}</span>
              <small>{item.label}</small>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
