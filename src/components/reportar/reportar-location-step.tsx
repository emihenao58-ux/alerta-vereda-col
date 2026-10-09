import { useState } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obtenerUbicacion } from "@/lib/reportar/location";
import type { ReporteDraft, ReporteUbicacion, ReporteUbicacionEstado } from "@/lib/reportar/types";
import { ReportarStepActions, ReportarStepShell } from "@/components/reportar/reportar-step-shell";

export function ReportarLocationStep({
  categoria,
  ubicacion,
  ubicacionEstado,
  lugar,
  onUbicacion,
  onUbicacionEstado,
  onLugar,
  onBack,
  onNext,
}: {
  categoria: ReporteDraft["categoria"];
  ubicacion: ReporteUbicacion | null;
  ubicacionEstado: ReporteUbicacionEstado;
  lugar: string;
  onUbicacion: (ubicacion: ReporteUbicacion | null) => void;
  onUbicacionEstado: (estado: ReporteUbicacionEstado) => void;
  onLugar: (lugar: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarReferencia, setMostrarReferencia] = useState(
    ubicacionEstado === "no-confirmada" || ubicacionEstado === "no-disponible",
  );
  const esEmergencia = categoria === "emergencia";
  const referenciaVisible =
    mostrarReferencia || ubicacionEstado === "no-confirmada" || ubicacionEstado === "no-disponible";
  const referenciaObligatoria = esEmergencia && ubicacionEstado !== "confirmada";

  const compartir = async () => {
    setCargando(true);
    setError(null);
    try {
      onUbicacion(await obtenerUbicacion());
      onUbicacionEstado("pendiente");
      setMostrarReferencia(false);
    } catch (cause) {
      onUbicacion(null);
      onUbicacionEstado("no-disponible");
      setMostrarReferencia(true);
      setError(
        cause instanceof Error
          ? `${cause.message} Puedes indicar una referencia del lugar.`
          : "No se pudo obtener la ubicación. Puedes indicar una referencia del lugar.",
      );
    } finally {
      setCargando(false);
    }
  };

  const confirmarUbicacion = () => {
    onUbicacionEstado("confirmada");
    setMostrarReferencia(false);
    setError(null);
  };

  const rechazarUbicacion = () => {
    onUbicacion(null);
    onUbicacionEstado("no-confirmada");
    setMostrarReferencia(true);
    setError(null);
  };

  const quitarUbicacion = () => {
    onUbicacion(null);
    onUbicacionEstado("no-disponible");
    setMostrarReferencia(true);
    setError(null);
  };

  const actualizarReferencia = (value: string) => {
    onLugar(value);
    if (ubicacionEstado !== "confirmada" && value.trim()) {
      onUbicacionEstado("no-confirmada");
    }
  };

  const continuar = () => {
    if (referenciaObligatoria && !lugar.trim()) {
      setMostrarReferencia(true);
      setError("Confirma la ubicación GPS o indica dónde ocurrió el incidente.");
      return;
    }
    if (esEmergencia && ubicacionEstado !== "confirmada" && lugar.trim()) {
      onUbicacionEstado("no-confirmada");
    }
    setError(null);
    onNext();
  };

  return (
    <ReportarStepShell
      eyebrow="Paso 3 · Ubicación"
      title="¿Dónde ocurrió el reporte?"
      description={
        esEmergencia
          ? "Confirma si el GPS corresponde al incidente o indica una referencia comprensible del lugar."
          : "Puedes compartir una ubicación puntual y añadir una referencia si la necesitas. No es un rastreo."
      }
    >
      <div className="reportar-location-card">
        <span className="reportar-location-icon" aria-hidden="true">
          <MapPin size={24} />
        </span>
        <div>
          <strong>
            {ubicacionEstado === "confirmada"
              ? "Ubicación confirmada"
              : ubicacion
                ? "Confirma la ubicación"
                : "Ubicación opcional"}
          </strong>
          <p>
            {ubicacion
              ? `Precisión aproximada de ±${Math.round(ubicacion.precision)} m.`
              : ubicacionEstado === "no-disponible"
                ? "El GPS no está disponible; puedes indicar una referencia del lugar."
                : "La ubicación GPS ayuda a ubicar la novedad en una zona que puede no tener dirección formal."}
          </p>
        </div>
      </div>

      {ubicacion && ubicacionEstado === "pendiente" && (
        <div
          className="reportar-location-confirmation"
          role="group"
          aria-labelledby="reportar-location-confirm-title"
        >
          <strong id="reportar-location-confirm-title">
            ¿Esta ubicación corresponde al lugar del incidente?
          </strong>
          <p>La ubicación del dispositivo puede ser distinta del lugar exacto de la novedad.</p>
          <div className="reportar-location-confirmation-actions">
            <Button type="button" onClick={confirmarUbicacion}>
              Sí, corresponde
            </Button>
            <Button type="button" variant="outline" onClick={rechazarUbicacion}>
              No, indicar referencia
            </Button>
          </div>
        </div>
      )}

      {ubicacion && ubicacionEstado === "confirmada" && (
        <p className="reportar-location-status" role="status">
          Ubicación GPS registrada para este reporte.
        </p>
      )}

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
          <button type="button" className="reportar-text-button" onClick={quitarUbicacion}>
            Quitar ubicación
          </button>
        )}
      </div>

      {!referenciaVisible && (
        <button
          type="button"
          className="reportar-text-button reportar-location-reference-trigger"
          onClick={() => {
            setMostrarReferencia(true);
            if (!ubicacion) onUbicacionEstado("no-disponible");
          }}
        >
          {ubicacionEstado === "confirmada"
            ? "Añadir una referencia (opcional)"
            : esEmergencia
              ? "No puedo confirmar el GPS; indicar referencia"
              : "Indicar una referencia (opcional)"}
        </button>
      )}

      {referenciaVisible && (
        <div className="reportar-location-reference">
          <label className="reportar-field" htmlFor="reportar-location-reference-input">
            <span>¿Dónde ocurrió exactamente? {!referenciaObligatoria && <em>(opcional)</em>}</span>
            <input
              id="reportar-location-reference-input"
              className="reportar-input"
              value={lugar}
              onChange={(event) => actualizarReferencia(event.target.value)}
              placeholder={
                esEmergencia ? "Ej.: cerca de la escuela" : "Ej.: en la vía hacia El Brasil"
              }
              required={referenciaObligatoria}
            />
          </label>
          <small>
            {referenciaObligatoria
              ? "Es necesaria si el GPS no está confirmado."
              : "Puedes dejarla vacía si la ubicación GPS es suficiente."}
          </small>
        </div>
      )}

      <ReportarStepActions>
        <Button type="button" variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button type="button" onClick={continuar}>
          Continuar
        </Button>
      </ReportarStepActions>
    </ReportarStepShell>
  );
}
