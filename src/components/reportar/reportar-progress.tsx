import type { ReporteStep } from "@/lib/reportar/types";

const ITEMS: readonly { step: ReporteStep; label: string }[] = [
  { step: "categoria", label: "Tipo" },
  { step: "detalle", label: "Datos" },
  { step: "ubicacion", label: "Ubicación" },
  { step: "evidencias", label: "Evidencia" },
  { step: "revision", label: "Revisión" },
];

export function ReportarProgress({ step }: { step: ReporteStep }) {
  const currentIndex =
    step === "confirmacion"
      ? ITEMS.length - 1
      : Math.max(
          0,
          ITEMS.findIndex((item) => item.step === step),
        );
  const percentage = ((currentIndex + 1) / ITEMS.length) * 100;

  return (
    <div className="reportar-progress" aria-label={`Paso ${currentIndex + 1} de ${ITEMS.length}`}>
      <div className="reportar-progress-topline">
        <span>Tu reporte</span>
        <span>
          {currentIndex + 1}/{ITEMS.length}
        </span>
      </div>
      <div className="reportar-progress-track" aria-hidden="true">
        <span style={{ width: `${percentage}%` }} />
      </div>
      <ol className="reportar-progress-labels">
        {ITEMS.map((item, index) => (
          <li key={item.step} className={index <= currentIndex ? "is-active" : undefined}>
            <span aria-hidden="true">{index + 1}</span>
            <small>{item.label}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}
