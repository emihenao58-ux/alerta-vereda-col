import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, MapPin, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ErrorUbicacion, obtenerUbicacion } from "@/lib/reportar/location";
import type { ReporteDraft, ReporteUbicacion, ReporteUbicacionEstado } from "@/lib/reportar/types";
import { ReportarStepActions, ReportarStepShell } from "@/components/reportar/reportar-step-shell";
import type { PermisoUbicacion, PreferenciaUbicacion } from "@/hooks/use-m4-preferences";

function mensajeErrorUbicacion(cause: unknown) {
  if (cause instanceof ErrorUbicacion) {
    if (cause.codigo === "denegado") {
      return "El navegador bloqueó el permiso de ubicación. Para habilitarlo, revisa los permisos de este sitio junto a la dirección del navegador y permite la ubicación. Puedes continuar sin compartirla.";
    }
    if (cause.codigo === "tiempo-agotado") {
      return "La ubicación tardó demasiado. Puedes intentarlo de nuevo, indicar una referencia o continuar sin GPS.";
    }
    return "Este navegador o dispositivo no permite obtener el GPS. Puedes indicar una referencia o continuar sin ubicación.";
  }

  return cause instanceof Error
    ? `${cause.message} Puedes indicar una referencia o continuar sin ubicación.`
    : "No se pudo obtener la ubicación. Puedes indicar una referencia o continuar sin GPS.";
}

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
  preferenciaUbicacion,
  permisoUbicacion,
  onObtenerUbicacion,
  autoObtenerUbicacion = false,
  ubicacionDisponible,
  ubicacionRequerida,
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
  // Si no se especifican, se conserva el comportamiento anterior del flujo administrativo.
  preferenciaUbicacion?: PreferenciaUbicacion;
  permisoUbicacion?: PermisoUbicacion;
  onObtenerUbicacion?: () => Promise<ReporteUbicacion>;
  autoObtenerUbicacion?: boolean;
  // Si se suministra, la adquisición automática pertenece al proveedor M4.
  ubicacionDisponible?: ReporteUbicacion | null;
  ubicacionRequerida?: boolean;
}) {
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mostrarReferencia, setMostrarReferencia] = useState(
    ubicacionEstado === "no-confirmada" || ubicacionEstado === "no-disponible",
  );
  const intentoAutomaticoRef = useRef(false);
  const permisoInicialRef = useRef(permisoUbicacion);
  const esEmergencia = categoria === "emergencia";
  const referenciaVisible =
    mostrarReferencia || ubicacionEstado === "no-confirmada" || ubicacionEstado === "no-disponible";
  const referenciaObligatoria = ubicacionRequerida ?? esEmergencia;
  const gpsDesactivado = preferenciaUbicacion === "nunca";

  const obtenerPuntoActual = useCallback(
    () => (onObtenerUbicacion ? onObtenerUbicacion() : obtenerUbicacion()),
    [onObtenerUbicacion],
  );

  useEffect(() => {
    if (
      !autoObtenerUbicacion ||
      !ubicacionDisponible ||
      ubicacion ||
      ubicacionEstado !== "pendiente" ||
      preferenciaUbicacion === "nunca" ||
      intentoAutomaticoRef.current
    )
      return;
    intentoAutomaticoRef.current = true;
    onUbicacion(ubicacionDisponible);
    onUbicacionEstado("pendiente");
    setMostrarReferencia(false);
    setError(null);
  }, [
    autoObtenerUbicacion,
    ubicacionDisponible,
    ubicacion,
    ubicacionEstado,
    preferenciaUbicacion,
    onUbicacion,
    onUbicacionEstado,
  ]);

  useEffect(() => {
    if (
      !autoObtenerUbicacion ||
      ubicacionDisponible !== undefined ||
      preferenciaUbicacion !== "mientras-uso" ||
      intentoAutomaticoRef.current
    ) {
      return;
    }

    let cancelado = false;
    const timeout = window.setTimeout(() => {
      if (cancelado || intentoAutomaticoRef.current) return;
      intentoAutomaticoRef.current = true;

      if (
        permisoInicialRef.current === "denegado" ||
        permisoInicialRef.current === "no-disponible"
      ) {
        onUbicacion(null);
        onUbicacionEstado("no-disponible");
        setMostrarReferencia(true);
        setError(
          permisoInicialRef.current === "denegado"
            ? "El navegador bloqueó el permiso de ubicación. Revisa los permisos de este sitio junto a la dirección del navegador para habilitarlo, o continúa sin compartirla."
            : "Este navegador no permite obtener el GPS. Puedes indicar una referencia o continuar sin ubicación.",
        );
        return;
      }

      onUbicacion(null);
      onUbicacionEstado("pendiente");
      setMostrarReferencia(false);
      setError(null);
      setCargando(true);

      void obtenerPuntoActual()
        .then((punto) => {
          if (cancelado) return;
          onUbicacion(punto);
          onUbicacionEstado("pendiente");
          setMostrarReferencia(false);
        })
        .catch((cause: unknown) => {
          if (cancelado) return;
          onUbicacion(null);
          onUbicacionEstado("no-disponible");
          setMostrarReferencia(true);
          setError(mensajeErrorUbicacion(cause));
        })
        .finally(() => {
          if (!cancelado) setCargando(false);
        });
    }, 0);

    return () => {
      cancelado = true;
      window.clearTimeout(timeout);
    };
  }, [
    autoObtenerUbicacion,
    obtenerPuntoActual,
    onUbicacion,
    onUbicacionEstado,
    preferenciaUbicacion,
    ubicacionDisponible,
  ]);

  const compartir = async () => {
    intentoAutomaticoRef.current = true;
    setCargando(true);
    setError(null);
    try {
      onUbicacion(await obtenerPuntoActual());
      onUbicacionEstado("pendiente");
      setMostrarReferencia(false);
    } catch (cause) {
      onUbicacion(null);
      onUbicacionEstado("no-disponible");
      setMostrarReferencia(true);
      setError(mensajeErrorUbicacion(cause));
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
    if (referenciaObligatoria && ubicacionEstado !== "confirmada" && !lugar.trim()) {
      setMostrarReferencia(true);
      setError("Confirma la ubicación GPS o indica una referencia del lugar.");
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
        gpsDesactivado
          ? "La ubicación es opcional. El GPS está desactivado; puedes indicar una referencia si lo deseas."
          : esEmergencia && !referenciaObligatoria
            ? "La ubicación es opcional. Confirma el GPS si corresponde al incidente o continúa sin ubicación."
            : esEmergencia
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
                ? "El GPS no está disponible; puedes indicar una referencia o continuar sin ubicación."
                : gpsDesactivado
                  ? "No se solicitará GPS mientras esté seleccionada la opción «Nunca»."
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

      {gpsDesactivado && (
        <p className="reportar-location-preference-note" role="status">
          La opción «Nunca» evita solicitudes automáticas. Puedes compartir una ubicación puntual
          desde este paso solo si lo decides.
        </p>
      )}

      {permisoUbicacion === "denegado" && (
        <p className="reportar-location-preference-note" role="status">
          Para habilitar la ubicación, revisa los permisos de este sitio en el navegador. También
          puedes continuar sin compartirla.
        </p>
      )}

      {permisoUbicacion === "no-disponible" && (
        <p className="reportar-location-preference-note" role="status">
          Este navegador o dispositivo no ofrece ubicación. Puedes continuar sin GPS o indicar una
          referencia.
        </p>
      )}

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
            : gpsDesactivado
              ? "Indicar una referencia (opcional)"
              : esEmergencia
                ? referenciaObligatoria
                  ? "No puedo confirmar el GPS; indicar referencia"
                  : "No corresponde"
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
              : "Puedes dejarla vacía y continuar sin ubicación."}
          </small>
        </div>
      )}

      <ReportarStepActions>
        <Button type="button" variant="outline" onClick={onBack}>
          <ArrowLeft size={16} aria-hidden="true" />
          Atrás
        </Button>
        <Button type="button" onClick={continuar}>
          <ArrowRight size={16} aria-hidden="true" />
          Continuar
        </Button>
      </ReportarStepActions>
    </ReportarStepShell>
  );
}
