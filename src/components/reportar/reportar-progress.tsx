import type { ReporteStep } from "@/lib/reportar/types";

const STEPS: readonly ReporteStep[] = [
  "categoria",
  "detalle",
  "ubicacion",
  "evidencias",
  "revision",
];

export function ReportarProgress({ step }: { step: ReporteStep }) {
  const currentIndex =
    step === "confirmacion"
      ? STEPS.length - 1
      : Math.max(
          0,
          STEPS.findIndex((item) => item === step),
        );
  const percentage = ((currentIndex + 1) / STEPS.length) * 100;

  return (
    <div className="reportar-progress" aria-label="Progreso del reporte">
      <div
        className="reportar-progress-track"
        role="progressbar"
        aria-label="Progreso del reporte"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percentage}
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
