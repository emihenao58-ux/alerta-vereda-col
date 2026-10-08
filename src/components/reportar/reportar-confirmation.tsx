import { CheckCircle2, Home, ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import type { MockSubmissionResult } from "@/lib/reportar/mock-submit";
import { ReportarStepShell } from "@/components/reportar/reportar-step-shell";

export function ReportarConfirmation({
  result,
  onReset,
}: {
  result: MockSubmissionResult;
  onReset: () => void;
}) {
  return (
    <ReportarStepShell
      eyebrow="Reporte preparado"
      title="La información está lista"
      description="La experiencia local terminó correctamente y queda preparada para conectar el envío definitivo."
    >
      <div className="reportar-confirmation-card">
        <CheckCircle2 size={42} aria-hidden="true" />
        <strong>Reporte listo para revisión</strong>
        <p>No se creó un registro en Supabase ni se subieron archivos en esta versión.</p>
      </div>
      <div className="reportar-confirmation-note">
        <ShieldCheck size={18} aria-hidden="true" />
        <span>
          La información y las evidencias permanecieron en este dispositivo durante el recorrido.
        </span>
      </div>
      <div className="reportar-step-actions">
        <Button type="button" variant="outline" onClick={onReset}>
          Crear otro reporte
        </Button>
        <Button asChild type="button">
          <Link to="/">
            <Home size={16} /> Volver a Inicio
          </Link>
        </Button>
      </div>
      <p className="reportar-local-id">
        Identificador definitivo: pendiente de la integración posterior.
      </p>
      <span className="sr-only">
        Modo: {result.mode}. Preparado: {result.submittedAt}
      </span>
    </ReportarStepShell>
  );
}
