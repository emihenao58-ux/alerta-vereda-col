import { Button } from "@/components/ui/button";
import { COMUNIDADES_MOCK } from "@/lib/reportar/mock-data";
import { ReportarStepActions, ReportarStepShell } from "@/components/reportar/reportar-step-shell";

export function ReportarDetailsStep({
  veredaId,
  descripcion,
  lugar,
  nombre,
  error,
  onChange,
  onBack,
  onNext,
}: {
  veredaId: string | null;
  descripcion: string;
  lugar: string;
  nombre: string;
  error: string | null;
  onChange: (
    patch: Partial<{ veredaId: string | null; descripcion: string; lugar: string; nombre: string }>,
  ) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  return (
    <ReportarStepShell
      eyebrow="Paso 2 · Datos básicos"
      title="Ubica y explica la novedad"
      description="Selecciona la comunidad y cuéntanos qué pasó y dónde ocurrió. El nombre es opcional."
    >
      <div className="reportar-form-grid">
        <label className="reportar-field">
          <span>Comunidad</span>
          <select
            className="reportar-input"
            value={veredaId ?? ""}
            onChange={(event) => onChange({ veredaId: event.target.value || null })}
          >
            <option value="">Selecciona tu comunidad…</option>
            {COMUNIDADES_MOCK.map((comunidad) => (
              <option key={comunidad.id} value={comunidad.id}>
                {comunidad.nombre}
              </option>
            ))}
          </select>
          <small className="reportar-help">
            Catálogo local provisional; no se consulta Supabase en PR #14.
          </small>
        </label>

        <label className="reportar-field">
          <span>¿Qué está pasando?</span>
          <textarea
            className="reportar-input reportar-textarea"
            rows={5}
            value={descripcion}
            onChange={(event) => onChange({ descripcion: event.target.value })}
            placeholder="Cuéntanos qué ocurrió…"
          />
        </label>

        <label className="reportar-field">
          <span>¿Dónde ocurrió?</span>
          <input
            className="reportar-input"
            value={lugar}
            onChange={(event) => onChange({ lugar: event.target.value })}
            placeholder="Ej.: cerca de la escuela"
          />
        </label>

        <label className="reportar-field">
          <span>
            Tu nombre <em>(opcional)</em>
          </span>
          <input
            className="reportar-input"
            value={nombre}
            onChange={(event) => onChange({ nombre: event.target.value })}
            placeholder="Ej.: María"
          />
        </label>
      </div>

      {error && (
        <p className="reportar-error" role="alert">
          {error}
        </p>
      )}

      <ReportarStepActions>
        <Button type="button" variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button type="button" onClick={onNext}>
          Continuar
        </Button>
      </ReportarStepActions>
    </ReportarStepShell>
  );
}
