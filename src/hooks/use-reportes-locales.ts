import { useCallback, useEffect, useRef, useState } from "react";
import {
  HISTORIAL_LOCAL_EVENTO,
  leerReportesLocales,
  type ReporteLocal,
} from "@/lib/reportar/local-history";

export function useReportesLocales() {
  const [reportes, setReportes] = useState<ReporteLocal[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const operacion = useRef(0);

  const recargar = useCallback(async () => {
    const actual = ++operacion.current;
    setCargando(true);
    try {
      const datos = await leerReportesLocales();
      if (actual !== operacion.current) return;
      setReportes(datos);
      setError(null);
    } catch (cause) {
      if (actual !== operacion.current) return;
      setError(cause instanceof Error ? cause.message : "No se pudo leer el historial local.");
    } finally {
      if (actual === operacion.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    const actualizar = () => {
      void recargar();
    };
    const alVolver = () => {
      if (document.visibilityState === "visible") actualizar();
    };
    actualizar();
    window.addEventListener(HISTORIAL_LOCAL_EVENTO, actualizar);
    window.addEventListener("focus", alVolver);
    document.addEventListener("visibilitychange", alVolver);
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== "undefined") {
        channel = new BroadcastChannel(HISTORIAL_LOCAL_EVENTO);
        channel.onmessage = actualizar;
      }
    } catch {
      // Se mantiene la lectura al montar, por evento local y al recuperar el foco.
    }
    return () => {
      operacion.current += 1;
      window.removeEventListener(HISTORIAL_LOCAL_EVENTO, actualizar);
      window.removeEventListener("focus", alVolver);
      document.removeEventListener("visibilitychange", alVolver);
      channel?.close();
    };
  }, [recargar]);

  return { reportes, cargando, error, recargar };
}
