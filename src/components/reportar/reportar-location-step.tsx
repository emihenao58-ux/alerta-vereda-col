import { useState } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obtenerUbicacion } from "@/lib/reportar/location";
import type { ReporteUbicacion } from "@/lib/reportar/types";
import { ReportarStepActions, ReportarStepShell } from "@/components/reportar/reportar-step-shell";

export function ReportarLocationStep({
  ubicacion,
  onUbicacion,
  onBack,
  onNext,
}: {
  ubicacion: ReporteUbicacion | null;
  onUbicacion: (ubicacion: ReporteUbicacion | null) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const compartir = async () => {
    setCargando(true);
    setError(null);
    try {
      onUbicacion(await obtenerUbicacion());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo obtener la ubicación.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <ReportarStepShell
      eyebrow="Paso 3 · Ubicación"
      title="¿Quieres compartir dónde ocurrió?"
      description="Es una ubicación puntual, no un rastreo. Puedes continuar sin compartirla."
    >
      <div className="reportar-location-card">
        <span className="reportar-location-icon" aria-hidden="true">
          <MapPin size={24} />
        </span>
        <div>
          <strong>{ubicacion ? "Ubicación lista" : "Ubicación opcional"}</strong>
          <p>
            {ubicacion
              ? `Precisión aproximada de ±${Math.round(ubicacion.precision)} m.`
              : "Ayuda a ubicar la novedad en una zona que puede no tener dirección formal."}
          </p>
        </div>
      </div>

      {error && (
        <p className="reportar-error" role="status">
          {error}
        </p>
      )}

      <div className="reportar-inline-actions">
        <Button
          type="button"
          variant="outline"
          onClick={() => void compartir()}
          disabled={cargando}
        >
          {cargando ? (
            "Buscando…"
          ) : ubicacion ? (
            <>
              <RefreshCw size={16} /> Actualizar ubicación
            </>
          ) : (
            <>
              <MapPin size={16} /> Compartir ubicación
            </>
          )}
        </Button>
        {ubicacion && (
          <button type="button" className="reportar-text-button" onClick={() => onUbicacion(null)}>
            Quitar ubicación
          </button>
        )}
      </div>

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
