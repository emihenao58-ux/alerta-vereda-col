import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ErrorUbicacion, obtenerUbicacion } from "@/lib/reportar/location";
import type { ReporteUbicacion } from "@/lib/reportar/types";

export type CategoriaNotificacion = "emergencias" | "vias" | "servicios" | "avisos";
export type AlcanceNotificaciones = "todas" | "una-vereda" | "ninguna";
export type PreferenciaUbicacion = "nunca" | "mientras-uso" | "siempre";
export type PermisoUbicacion = "desconocido" | "concedido" | "denegado" | "no-disponible";

type PreferenciasM4 = {
  escalaTexto: number;
  setEscalaTexto: (porcentaje: number) => void;
  categoriasNotificacion: Record<CategoriaNotificacion, boolean>;
  alternarCategoriaNotificacion: (categoria: CategoriaNotificacion) => void;
  alcanceNotificaciones: AlcanceNotificaciones;
  setAlcanceNotificaciones: (alcance: AlcanceNotificaciones) => void;
  veredaNotificacionesId: string;
  setVeredaNotificacionesId: (id: string) => void;
  preferenciaUbicacion: PreferenciaUbicacion;
  permisoUbicacion: PermisoUbicacion;
  mensajeUbicacion: string | null;
  mensajePersistenciaUbicacion: string | null;
  ubicacionActual: ReporteUbicacion | null;
  ubicacionActualizadaEn: number | null;
  cambiarPreferenciaUbicacion: (preferencia: PreferenciaUbicacion) => Promise<void>;
  solicitarUbicacionPuntual: () => Promise<ReporteUbicacion>;
  solicitarUbicacionParaReporte: () => Promise<ReporteUbicacion>;
  obtenerUbicacionParaEvidencia: () => Promise<ReporteUbicacion | null>;
};

type UbicacionEnCache = {
  ubicacion: ReporteUbicacion;
  timestamp: number;
};

const PreferenciasM4Context = createContext<PreferenciasM4 | null>(null);
const CLAVE_PREFERENCIA_UBICACION = "alertavereda:preferencia-ubicacion";
const INTERVALO_UBICACION_MS = 5 * 60 * 1000;

const CATEGORIAS_INICIALES: Record<CategoriaNotificacion, boolean> = {
  emergencias: true,
  vias: true,
  servicios: true,
  avisos: true,
};

function esPreferenciaUbicacion(value: string | null): value is PreferenciaUbicacion {
  return value === "nunca" || value === "mientras-uso" || value === "siempre";
}

export function PreferenciasM4Provider({ children }: { children: ReactNode }) {
  const [escalaTexto, setEscalaTextoEstado] = useState(100);
  const [categoriasNotificacion, setCategoriasNotificacion] = useState(CATEGORIAS_INICIALES);
  const [alcanceNotificaciones, setAlcanceNotificaciones] =
    useState<AlcanceNotificaciones>("todas");
  const [veredaNotificacionesId, setVeredaNotificacionesId] = useState("");
  const [preferenciaUbicacion, setPreferenciaUbicacion] = useState<PreferenciaUbicacion>("nunca");
  const [preferenciaLista, setPreferenciaLista] = useState(false);
  const [permisoUbicacion, setPermisoUbicacion] = useState<PermisoUbicacion>("desconocido");
  const [mensajeUbicacion, setMensajeUbicacion] = useState<string | null>(null);
  const [mensajePersistenciaUbicacion, setMensajePersistenciaUbicacion] = useState<string | null>(
    null,
  );
  const [ubicacionActual, setUbicacionActual] = useState<ReporteUbicacion | null>(null);
  const [ubicacionActualizadaEn, setUbicacionActualizadaEn] = useState<number | null>(null);

  const preferenciaUbicacionRef = useRef<PreferenciaUbicacion>("nunca");
  const permisoUbicacionRef = useRef<PermisoUbicacion>("desconocido");
  const ubicacionCacheRef = useRef<UbicacionEnCache | null>(null);
  const mountedRef = useRef(false);
  const generacionSolicitudRef = useRef(0);
  const automaticasDenegadasRef = useRef(false);
  const solicitudAutomaticaActivaRef = useRef(false);
  const automaticasIniciadasRef = useRef(false);
  const ultimaSolicitudAutomaticaRef = useRef(0);
  const preferenciaRestauradaPendienteRef = useRef(false);
  const paginaActivaRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      generacionSolicitudRef.current += 1;
    };
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty("--av-text-scale", String(escalaTexto / 100));
  }, [escalaTexto]);

  useEffect(() => {
    let preferenciaRestaurada: PreferenciaUbicacion = "nunca";
    try {
      const guardada = window.localStorage.getItem(CLAVE_PREFERENCIA_UBICACION);
      if (esPreferenciaUbicacion(guardada)) {
        preferenciaRestaurada = guardada;
        setMensajePersistenciaUbicacion(
          "Se recuperó la preferencia de ubicación guardada en este dispositivo.",
        );
      }
    } catch {
      setMensajePersistenciaUbicacion(
        "No se pudo leer la preferencia guardada. La selección actual se conservará solo durante esta sesión.",
      );
    }

    preferenciaUbicacionRef.current = preferenciaRestaurada;
    automaticasIniciadasRef.current = false;
    ultimaSolicitudAutomaticaRef.current = 0;
    preferenciaRestauradaPendienteRef.current = preferenciaRestaurada !== "nunca";
    setPreferenciaUbicacion(preferenciaRestaurada);
    setPreferenciaLista(true);
  }, []);

  const setEscalaTexto = useCallback((porcentaje: number) => {
    const limitado = Math.max(90, Math.min(140, Math.round(porcentaje)));
    setEscalaTextoEstado(limitado);
  }, []);

  const alternarCategoriaNotificacion = useCallback((categoria: CategoriaNotificacion) => {
    setCategoriasNotificacion((actual) => ({
      ...actual,
      [categoria]: !actual[categoria],
    }));
  }, []);

  const guardarUbicacionEnCache = useCallback((ubicacion: ReporteUbicacion) => {
    const timestamp = Date.now();
    ubicacionCacheRef.current = { ubicacion, timestamp };
    setUbicacionActual(ubicacion);
    setUbicacionActualizadaEn(timestamp);
  }, []);

  const registrarErrorPermiso = useCallback((cause: unknown) => {
    if (!(cause instanceof ErrorUbicacion)) return;
    if (cause.codigo === "denegado") {
      permisoUbicacionRef.current = "denegado";
      automaticasDenegadasRef.current = true;
      setPermisoUbicacion("denegado");
    } else if (cause.codigo === "no-disponible") {
      permisoUbicacionRef.current = "no-disponible";
      setPermisoUbicacion("no-disponible");
    }
  }, []);

  const solicitarUbicacionPuntual = useCallback(async () => {
    if (preferenciaUbicacionRef.current === "nunca") {
      throw new Error(
        "La preferencia «Nunca» evita las consultas automáticas. Para compartir ubicación, solicítala expresamente desde Reportar.",
      );
    }

    const generacion = generacionSolicitudRef.current;
    try {
      // La cadencia se mide al iniciar la solicitud, independientemente de su latencia.
      ultimaSolicitudAutomaticaRef.current = Date.now();
      const ubicacion = await obtenerUbicacion();
      if (!mountedRef.current || generacion !== generacionSolicitudRef.current) {
        throw new Error("La solicitud de ubicación quedó obsoleta y no se utilizó.");
      }

      guardarUbicacionEnCache(ubicacion);
      permisoUbicacionRef.current = "concedido";
      setPermisoUbicacion("concedido");
      automaticasDenegadasRef.current = false;
      setMensajeUbicacion("El navegador permitió la ubicación y se actualizó la caché en memoria.");
      return ubicacion;
    } catch (cause) {
      if (!mountedRef.current || generacion !== generacionSolicitudRef.current) {
        throw new Error("La solicitud de ubicación quedó obsoleta y no se utilizó.");
      }
      registrarErrorPermiso(cause);
      const error =
        cause instanceof Error
          ? cause
          : new Error("No se pudo obtener la ubicación en este momento.");
      setMensajeUbicacion(error.message);
      throw error;
    }
  }, [guardarUbicacionEnCache, registrarErrorPermiso]);

  const solicitarUbicacionParaReporte = useCallback(async () => {
    // Esta función representa una acción puntual voluntaria; puede usarse incluso con «Nunca».
    const generacion = generacionSolicitudRef.current;
    try {
      // La acción voluntaria sigue permitida; pospone otra lectura automática innecesaria.
      ultimaSolicitudAutomaticaRef.current = Date.now();
      const ubicacion = await obtenerUbicacion();
      if (!mountedRef.current || generacion !== generacionSolicitudRef.current) {
        throw new Error("La preferencia cambió durante la solicitud; no se utilizó la ubicación.");
      }

      guardarUbicacionEnCache(ubicacion);
      permisoUbicacionRef.current = "concedido";
      setPermisoUbicacion("concedido");
      automaticasDenegadasRef.current = false;
      setMensajeUbicacion(
        preferenciaUbicacionRef.current === "nunca"
          ? "El navegador permitió la ubicación que pediste para este reporte. «Nunca» sigue desactivando las consultas automáticas."
          : "El navegador permitió la ubicación que pediste para este reporte.",
      );
      return ubicacion;
    } catch (cause) {
      if (!mountedRef.current || generacion !== generacionSolicitudRef.current) {
        throw new Error("La preferencia cambió durante la solicitud; no se utilizó la ubicación.");
      }
      registrarErrorPermiso(cause);
      const error =
        cause instanceof Error
          ? cause
          : new Error("No se pudo obtener la ubicación en este momento.");
      setMensajeUbicacion(error.message);
      throw error;
    }
  }, [guardarUbicacionEnCache, registrarErrorPermiso]);

  const cambiarPreferenciaUbicacion = useCallback(async (preferencia: PreferenciaUbicacion) => {
    if (preferenciaUbicacionRef.current === preferencia) return;

    preferenciaUbicacionRef.current = preferencia;
    generacionSolicitudRef.current += 1;
    const lecturaInicialEnPrimerPlano = preferencia === "mientras-uso" && paginaActivaRef.current;
    automaticasIniciadasRef.current = lecturaInicialEnPrimerPlano;
    // Cambiar la opción no reinicia la separación mínima de cinco minutos.
    preferenciaRestauradaPendienteRef.current = lecturaInicialEnPrimerPlano;
    ubicacionCacheRef.current = null;
    setUbicacionActual(null);
    setUbicacionActualizadaEn(null);
    setPreferenciaUbicacion(preferencia);
    permisoUbicacionRef.current = "desconocido";
    setPermisoUbicacion("desconocido");
    setMensajeUbicacion(
      preferencia === "nunca"
        ? "La ubicación automática está desactivada. Puedes pedir una ubicación puntual voluntariamente desde Reportar."
        : preferencia === "mientras-uso"
          ? "Preferencia «Mientras uso la aplicación» seleccionada. Se intentará una lectura ahora si la página está en primer plano y ya pasó el intervalo mínimo de 5 minutos."
          : "Preferencia «Siempre» seleccionada. No se solicita GPS al elegirla; el navegador intentará actualizarlo según el intervalo mínimo mientras la página siga ejecutándose.",
    );

    try {
      window.localStorage.setItem(CLAVE_PREFERENCIA_UBICACION, preferencia);
      setMensajePersistenciaUbicacion(
        "La preferencia de ubicación se guardó en este dispositivo. Las coordenadas no se guardan como parte de esta preferencia; las demás preferencias siguen en memoria.",
      );
    } catch {
      setMensajePersistenciaUbicacion(
        "No se pudo guardar la preferencia de ubicación. Se aplicará solo durante esta sesión; la aplicación puede seguir usándose.",
      );
    }
  }, []);

  useEffect(() => {
    if (!preferenciaLista || preferenciaUbicacion === "nunca") return;
    if (typeof navigator === "undefined" || !navigator.permissions) return;

    let activa = true;
    let estado: PermissionStatus | null = null;
    let estadoAnterior: PermissionState | null = null;
    const reflejarPermiso = () => {
      if (!activa || !estado) return;
      if (estado.state === "denied") {
        permisoUbicacionRef.current = "denegado";
        automaticasDenegadasRef.current = true;
        setPermisoUbicacion("denegado");
        return;
      }

      if (estado.state === "granted") {
        permisoUbicacionRef.current = "concedido";
        setPermisoUbicacion("concedido");
      }
    };
    const alCambiarPermiso = () => {
      if (!activa || !estado) return;
      const estadoNuevo = estado.state;
      const cambioReal = estadoAnterior !== null && estadoAnterior !== estadoNuevo;
      estadoAnterior = estadoNuevo;
      if (cambioReal && estadoNuevo !== "denied" && automaticasDenegadasRef.current) {
        automaticasDenegadasRef.current = false;
        setMensajeUbicacion(
          "El permiso del navegador cambió. Una futura apertura, vuelta al primer plano o actualización programada podrá intentarlo de nuevo.",
        );
      }
      reflejarPermiso();
      if (cambioReal && estadoNuevo === "prompt" && permisoUbicacionRef.current === "denegado") {
        permisoUbicacionRef.current = "desconocido";
        setPermisoUbicacion("desconocido");
      }
    };

    void navigator.permissions
      .query({ name: "geolocation" as PermissionName })
      .then((resultado) => {
        if (!activa) return;
        estado = resultado;
        estadoAnterior = resultado.state;
        reflejarPermiso();
        estado.addEventListener("change", alCambiarPermiso);
      })
      .catch(() => {
        // La Permissions API es opcional; geolocation comunicará cualquier fallo al usarse.
      });

    return () => {
      activa = false;
      estado?.removeEventListener("change", alCambiarPermiso);
    };
  }, [preferenciaLista, preferenciaUbicacion]);

  useEffect(() => {
    if (!preferenciaLista || preferenciaUbicacion === "nunca") {
      paginaActivaRef.current =
        typeof document !== "undefined" && document.visibilityState !== "hidden";
      return;
    }

    let intervaloVisible: number | null = null;
    let intervaloSiempre: number | null = null;
    paginaActivaRef.current = document.visibilityState !== "hidden";

    const detenerIntervaloVisible = () => {
      if (intervaloVisible !== null) {
        window.clearInterval(intervaloVisible);
        intervaloVisible = null;
      }
    };

    const ejecutarLecturaAutomatica = () => {
      if (
        automaticasDenegadasRef.current ||
        solicitudAutomaticaActivaRef.current ||
        preferenciaUbicacionRef.current === "nunca"
      ) {
        return;
      }
      const ahora = Date.now();
      if (ahora - ultimaSolicitudAutomaticaRef.current < INTERVALO_UBICACION_MS) return;

      ultimaSolicitudAutomaticaRef.current = ahora;
      automaticasIniciadasRef.current = true;
      solicitudAutomaticaActivaRef.current = true;
      void solicitarUbicacionPuntual()
        .catch((cause: unknown) => {
          if (cause instanceof ErrorUbicacion && cause.codigo === "denegado") {
            automaticasDenegadasRef.current = true;
          }
        })
        .finally(() => {
          solicitudAutomaticaActivaRef.current = false;
        });

      if (preferenciaUbicacionRef.current === "mientras-uso" && paginaActivaRef.current) {
        iniciarIntervaloVisible();
      }
    };

    function iniciarIntervaloVisible() {
      if (intervaloVisible !== null || !paginaActivaRef.current) return;
      intervaloVisible = window.setInterval(() => {
        if (paginaActivaRef.current) ejecutarLecturaAutomatica();
      }, INTERVALO_UBICACION_MS);
    }

    const alVolverAlPrimerPlano = () => {
      if (document.visibilityState === "hidden") return;
      const retorno = !paginaActivaRef.current;
      paginaActivaRef.current = true;
      if (retorno || preferenciaRestauradaPendienteRef.current) {
        preferenciaRestauradaPendienteRef.current = false;
        automaticasIniciadasRef.current = true;
        ejecutarLecturaAutomatica();
      }
      if (preferenciaUbicacionRef.current === "mientras-uso" && automaticasIniciadasRef.current) {
        iniciarIntervaloVisible();
      }
    };

    const alPasarAsegundoPlano = () => {
      paginaActivaRef.current = false;
      if (preferenciaUbicacionRef.current === "mientras-uso") detenerIntervaloVisible();
    };

    const alCambiarVisibilidad = () => {
      if (document.visibilityState === "hidden") alPasarAsegundoPlano();
      else alVolverAlPrimerPlano();
    };
    document.addEventListener("visibilitychange", alCambiarVisibilidad);
    const alHacerBlur = () => alPasarAsegundoPlano();
    window.addEventListener("blur", alHacerBlur);
    window.addEventListener("focus", alVolverAlPrimerPlano);

    if (preferenciaRestauradaPendienteRef.current && paginaActivaRef.current) {
      preferenciaRestauradaPendienteRef.current = false;
      ejecutarLecturaAutomatica();
    }
    if (preferenciaUbicacion === "siempre") {
      // Primer intento por temporizador: nunca inmediatamente al seleccionar «Siempre».
      intervaloSiempre = window.setInterval(ejecutarLecturaAutomatica, INTERVALO_UBICACION_MS);
    } else if (automaticasIniciadasRef.current && paginaActivaRef.current) {
      iniciarIntervaloVisible();
    }

    return () => {
      document.removeEventListener("visibilitychange", alCambiarVisibilidad);
      window.removeEventListener("blur", alHacerBlur);
      window.removeEventListener("focus", alVolverAlPrimerPlano);
      detenerIntervaloVisible();
      if (intervaloSiempre !== null) window.clearInterval(intervaloSiempre);
    };
  }, [preferenciaLista, preferenciaUbicacion, solicitarUbicacionPuntual]);

  const obtenerUbicacionParaEvidencia = useCallback(async () => {
    if (
      (preferenciaUbicacionRef.current !== "mientras-uso" &&
        preferenciaUbicacionRef.current !== "siempre") ||
      permisoUbicacionRef.current !== "concedido"
    ) {
      return null;
    }

    const cache = ubicacionCacheRef.current;
    if (cache && Date.now() - cache.timestamp < INTERVALO_UBICACION_MS) {
      return cache.ubicacion;
    }
    try {
      return await solicitarUbicacionPuntual();
    } catch {
      return null;
    }
  }, [solicitarUbicacionPuntual]);

  const value = useMemo(
    () => ({
      escalaTexto,
      setEscalaTexto,
      categoriasNotificacion,
      alternarCategoriaNotificacion,
      alcanceNotificaciones,
      setAlcanceNotificaciones,
      veredaNotificacionesId,
      setVeredaNotificacionesId,
      preferenciaUbicacion,
      permisoUbicacion,
      mensajeUbicacion,
      mensajePersistenciaUbicacion,
      ubicacionActual,
      ubicacionActualizadaEn,
      cambiarPreferenciaUbicacion,
      solicitarUbicacionPuntual,
      solicitarUbicacionParaReporte,
      obtenerUbicacionParaEvidencia,
    }),
    [
      alcanceNotificaciones,
      alternarCategoriaNotificacion,
      categoriasNotificacion,
      cambiarPreferenciaUbicacion,
      escalaTexto,
      mensajeUbicacion,
      mensajePersistenciaUbicacion,
      obtenerUbicacionParaEvidencia,
      permisoUbicacion,
      preferenciaUbicacion,
      setEscalaTexto,
      solicitarUbicacionParaReporte,
      solicitarUbicacionPuntual,
      ubicacionActual,
      ubicacionActualizadaEn,
      veredaNotificacionesId,
    ],
  );

  return <PreferenciasM4Context.Provider value={value}>{children}</PreferenciasM4Context.Provider>;
}

// El archivo exporta el hook junto al proveedor de contexto para compartir el estado en memoria.
// eslint-disable-next-line react-refresh/only-export-components
export function usePreferenciasM4() {
  const preferencias = useContext(PreferenciasM4Context);
  if (!preferencias) {
    throw new Error("usePreferenciasM4 debe usarse dentro de PreferenciasM4Provider.");
  }
  return preferencias;
}
