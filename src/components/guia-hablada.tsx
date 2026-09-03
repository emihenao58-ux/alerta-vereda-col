import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Check,
  Headphones,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  X,
} from "lucide-react";
import { PERSONAJE_POSES, type PersonajePose } from "@/lib/personaje-assets";
import { GUIA_AUDIO_POR_PASO } from "@/lib/guia-audio-assets";

export type GuiaObjetivoKey =
  | "selector-vereda"
  | "panel-consulta"
  | "tab-activas"
  | "tab-historial"
  | "boton-filtros"
  | "filtro-solucionado"
  | "filtro-no-solucionado";

export type GuiaHabladaPasoId =
  | "bienvenida"
  | "selector-vereda"
  | "novedades-activas"
  | "historial"
  | "filtros"
  | "solucionado"
  | "no-solucionado"
  | "cierre";

export type GuiaHabladaPaso = {
  id: GuiaHabladaPasoId;
  titulo: string;
  targetKey?: GuiaObjetivoKey;
  inviteTargetKey?: GuiaObjetivoKey;
  pose: PersonajePose;
  explanationText: string;
  inviteText: string;
  confirmText: string;
  skipText: string;
  completionSignal: string;
  requiresAction: boolean;
  nextStepId?: GuiaHabladaPasoId;
};

export type GuiaObjetivos = Partial<Record<GuiaObjetivoKey, RefObject<HTMLElement | null>>>;

export type GuiaObjetivoEstados = Partial<Record<GuiaObjetivoKey, string | number | boolean>>;

export type RemolinoTheme = {
  kraft: string;
  verde: string;
  dorado: string;
  resplandor: string;
};

type GuiaHabladaProps = {
  pasos: readonly GuiaHabladaPaso[];
  objetivos?: GuiaObjetivos;
  objetivoEstados?: GuiaObjetivoEstados;
  inicioPasoId?: GuiaHabladaPasoId;
  onOmitir?: () => void;
  forzarApertura?: number;
  remolinoTheme?: Partial<RemolinoTheme>;
};

type GuiaFase =
  | "cerrada"
  | "bienvenida"
  | "lista"
  | "explicando"
  | "preparando_viaje"
  | "absorción_iniciando"
  | "remolino_absorbiendo"
  | "tránsito_breve"
  | "chasquido_de_salida"
  | "reapareciendo"
  | "señalando"
  | "esperando_accion"
  | "accion_detectada"
  | "omitiendo"
  | "pausada"
  | "fuera_de_vista"
  | "finalizada";

type Posicion = {
  x: number;
  y: number;
};

type Destino = Posicion & {
  pose: PersonajePose;
};

type ViajeVisual = {
  fase: "absorbiendo" | "transitando" | "reapareciendo";
  entrada: Posicion;
  salida: Destino;
};

const DURACION_ABSORCION_MS = 220;
const DURACION_TRANSITO_MS = 470;
const DURACION_REAPARICION_MS = 210;
const DURACION_CROSSFADE_MS = 180;
const DURACION_SEÑALAMIENTO_MS = 130;
const TIEMPO_SCROLL_LEJANO_MS = 460;
const CLAVE_OMITIDA = "alertavereda.guia-hablada.omitida";

const REMOLINO_THEME_DEFAULT: RemolinoTheme = {
  kraft: "#b79568",
  verde: "#2f624d",
  dorado: "#e4bb62",
  resplandor: "#f4d991",
};

const FASES_VIAJE = new Set<GuiaFase>([
  "preparando_viaje",
  "absorción_iniciando",
  "remolino_absorbiendo",
  "tránsito_breve",
  "chasquido_de_salida",
  "reapareciendo",
]);

const ETIQUETAS_OBJETIVO: Record<GuiaObjetivoKey, string> = {
  "selector-vereda": "el selector de vereda",
  "panel-consulta": "la sección de la vereda consultada",
  "tab-activas": "la pestaña Novedades activas",
  "tab-historial": "la pestaña Historial",
  "boton-filtros": "el botón Filtros",
  "filtro-solucionado": "el filtro Solucionados",
  "filtro-no-solucionado": "el filtro No solucionados",
};

const DIRECCIONES: Record<PersonajePose, { etiqueta: string; icono: typeof ArrowDown | null }> = {
  reposo: { etiqueta: "en reposo", icono: null },
  saludo: { etiqueta: "dando la bienvenida", icono: null },
  izquierda: { etiqueta: "señalando a la izquierda", icono: ArrowLeft },
  derecha: { etiqueta: "señalando a la derecha", icono: ArrowRight },
  arriba: { etiqueta: "señalando arriba", icono: ArrowUp },
  abajo: { etiqueta: "señalando abajo", icono: ArrowDown },
  escuchar: { etiqueta: "escuchando", icono: null },
  celebrar: { etiqueta: "celebrando", icono: Check },
};

function clamp(valor: number, minimo: number, maximo: number) {
  return Math.min(Math.max(valor, minimo), maximo);
}

function distanciaCuadrada(a: Posicion, b: Posicion) {
  return (a.x - b.x) ** 2 + (a.y - b.y) ** 2;
}

export function GuiaHablada({
  pasos,
  objetivos = {},
  objetivoEstados = {},
  inicioPasoId = "bienvenida",
  onOmitir,
  forzarApertura = 0,
  remolinoTheme,
}: GuiaHabladaProps) {
  const tituloId = useId();
  const estadoId = useId();
  const transcriptId = useId();
  const escenaRef = useRef<HTMLDivElement>(null);
  const personajeRef = useRef<HTMLDivElement>(null);
  const temporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervaloRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioSegmentoRef = useRef<keyof (typeof GUIA_AUDIO_POR_PASO)["bienvenida"] | null>(null);
  const audioReproduccionIdRef = useRef(0);
  const poseTemporizadorRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const viajeIdRef = useRef(0);
  const faseAntesDeOcultarRef = useRef<GuiaFase>("lista");
  const objetivoEnEsperaRef = useRef<string | null>(null);
  const estadoInicialObjetivoRef = useRef<unknown>(undefined);
  const volverPendienteRef = useRef(false);

  const pasosPorId = useMemo(() => new Map(pasos.map((paso) => [paso.id, paso])), [pasos]);
  const primerPaso = pasosPorId.get(inicioPasoId) ?? pasos[0];
  const [abierta, setAbierta] = useState(true);
  const [pasoId, setPasoId] = useState<GuiaHabladaPasoId>(primerPaso?.id ?? "bienvenida");
  const [fase, setFase] = useState<GuiaFase>(
    primerPaso?.id === "bienvenida" ? "bienvenida" : "lista",
  );
  const [reproduciendo, setReproduciendo] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [anuncio, setAnuncio] = useState("La guía está lista para comenzar.");
  const [transcripcionAbierta, setTranscripcionAbierta] = useState(false);
  const [poseActual, setPoseActual] = useState<PersonajePose>(primerPaso?.pose ?? "saludo");
  const [objetivoActivoKey, setObjetivoActivoKey] = useState<GuiaObjetivoKey | undefined>(
    primerPaso?.targetKey,
  );
  const [poseAnterior, setPoseAnterior] = useState<PersonajePose | null>(null);
  const [poseEnMovimiento, setPoseEnMovimiento] = useState(false);
  const [posicion, setPosicion] = useState<Posicion>({ x: 92, y: 84 });
  const [viajeVisual, setViajeVisual] = useState<ViajeVisual | null>(null);

  const temaRemolino = useMemo(
    () => ({ ...REMOLINO_THEME_DEFAULT, ...remolinoTheme }),
    [remolinoTheme],
  );
  const pasoActual = pasosPorId.get(pasoId) ?? primerPaso;
  const indicePasoActual = pasos.findIndex((paso) => paso.id === pasoActual?.id);
  const pasoAnterior = indicePasoActual > 0 ? pasos[indicePasoActual - 1] : undefined;
  const iconoDireccion = DIRECCIONES[poseActual]?.icono;
  const esPasoDeCierre = pasoActual?.id === "cierre";
  const faseDeViaje = FASES_VIAJE.has(fase);

  const detenerReproduccion = useCallback((reiniciarAudio = true) => {
    audioReproduccionIdRef.current += 1;
    if (intervaloRef.current) {
      clearInterval(intervaloRef.current);
      intervaloRef.current = null;
    }
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      if (reiniciarAudio) audio.currentTime = 0;
      if (reiniciarAudio) {
        audioSegmentoRef.current = null;
        audio.onended = null;
        audio.onerror = null;
        audio.ontimeupdate = null;
        audio.onloadedmetadata = null;
      }
    }
    setReproduciendo(false);
  }, []);

  const cancelarViaje = useCallback(() => {
    viajeIdRef.current += 1;
    if (temporizadorRef.current) {
      clearTimeout(temporizadorRef.current);
      temporizadorRef.current = null;
    }
    setViajeVisual(null);
    setPoseEnMovimiento(false);
  }, []);

  const limpiarTemporizadores = useCallback(() => {
    detenerReproduccion();
    cancelarViaje();
    if (poseTemporizadorRef.current) {
      clearTimeout(poseTemporizadorRef.current);
      poseTemporizadorRef.current = null;
    }
  }, [cancelarViaje, detenerReproduccion]);

  const cambiarPose = useCallback((nuevaPose: PersonajePose) => {
    setPoseActual((poseAnteriorActual) => {
      if (poseAnteriorActual === nuevaPose) return poseAnteriorActual;
      setPoseAnterior(poseAnteriorActual);
      setPoseEnMovimiento(true);
      if (poseTemporizadorRef.current) clearTimeout(poseTemporizadorRef.current);
      poseTemporizadorRef.current = setTimeout(() => {
        setPoseAnterior(null);
        setPoseEnMovimiento(false);
        poseTemporizadorRef.current = null;
      }, DURACION_CROSSFADE_MS);
      return nuevaPose;
    });
  }, []);

  const irAlPaso = useCallback(
    (siguienteId: GuiaHabladaPasoId | undefined) => {
      cancelarViaje();
      const siguiente = siguienteId ? pasosPorId.get(siguienteId) : undefined;
      if (!siguiente) {
        setFase("finalizada");
        cambiarPose("celebrar");
        setAnuncio("Terminaste la guía. Puedes cerrar esta ayuda cuando quieras.");
        return;
      }
      objetivoEnEsperaRef.current = null;
      estadoInicialObjetivoRef.current = undefined;
      setPasoId(siguiente.id);
      setObjetivoActivoKey(siguiente.targetKey);
      setProgreso(0);
      setTranscripcionAbierta(false);
      setFase("lista");
      cambiarPose(siguiente.id === "cierre" ? "celebrar" : siguiente.pose);
      setAnuncio(
        siguiente.id === "cierre"
          ? "La guía terminó. Revisa que ya conozcas el recorrido."
          : `Siguiente paso: ${siguiente.titulo}. Pulsa Escuchar cuando quieras.`,
      );
    },
    [cancelarViaje, cambiarPose, pasosPorId],
  );

  const cerrarGuia = useCallback(() => {
    limpiarTemporizadores();
    setAbierta(false);
    setFase("cerrada");
    setAnuncio("La guía está cerrada.");
    onOmitir?.();
  }, [limpiarTemporizadores, onOmitir]);

  const calcularDestino = useCallback(
    (objetivoKey: GuiaObjetivoKey): Destino | null => {
      const objetivo = objetivos[objetivoKey]?.current;
      const escena = escenaRef.current;
      if (!objetivo || !escena) return null;

      const rectanguloObjetivo = objetivo.getBoundingClientRect();
      const rectanguloEscena = escena.getBoundingClientRect();
      const rectanguloPersonaje = personajeRef.current?.getBoundingClientRect();
      const anchoPersonaje = rectanguloPersonaje?.width || 82;
      const altoPersonaje = rectanguloPersonaje?.height || 116;
      const margen = Math.max(10, anchoPersonaje * 0.12);
      const anchoEscena = Math.max(rectanguloEscena.width, 1);
      const altoEscena = Math.max(escena.scrollHeight, rectanguloEscena.height, altoPersonaje + 20);
      const centroObjetivo = {
        x: rectanguloObjetivo.left - rectanguloEscena.left + rectanguloObjetivo.width / 2,
        y: rectanguloObjetivo.top - rectanguloEscena.top + rectanguloObjetivo.height / 2,
      };
      const objetivoRelativo = {
        left: rectanguloObjetivo.left - rectanguloEscena.left,
        right: rectanguloObjetivo.right - rectanguloEscena.left,
        top: rectanguloObjetivo.top - rectanguloEscena.top,
        bottom: rectanguloObjetivo.bottom - rectanguloEscena.top,
      };

      const candidatos: Array<Destino & { prioridad: number }> = [
        {
          x: objetivoRelativo.left - margen - anchoPersonaje / 2,
          y: centroObjetivo.y,
          pose: "derecha",
          prioridad: 0,
        },
        {
          x: objetivoRelativo.right + margen + anchoPersonaje / 2,
          y: centroObjetivo.y,
          pose: "izquierda",
          prioridad: 1,
        },
        {
          x: centroObjetivo.x,
          y: objetivoRelativo.top - margen - altoPersonaje / 2,
          pose: "abajo",
          prioridad: 2,
        },
        {
          x: centroObjetivo.x,
          y: objetivoRelativo.bottom + margen + altoPersonaje / 2,
          pose: "arriba",
          prioridad: 3,
        },
      ];

      const validos = candidatos.filter((candidato) => {
        const limiteX = Math.max(anchoPersonaje / 2 + 8, anchoEscena - anchoPersonaje / 2 - 8);
        const limiteY = Math.max(altoPersonaje / 2 + 8, altoEscena - altoPersonaje / 2 - 8);
        const personajeRect = {
          left: candidato.x - anchoPersonaje / 2,
          right: candidato.x + anchoPersonaje / 2,
          top: candidato.y - altoPersonaje / 2,
          bottom: candidato.y + altoPersonaje / 2,
        };
        const invadeObjetivo =
          personajeRect.left < objetivoRelativo.right &&
          personajeRect.right > objetivoRelativo.left &&
          personajeRect.top < objetivoRelativo.bottom &&
          personajeRect.bottom > objetivoRelativo.top;
        const estaEnEscena =
          candidato.x >= anchoPersonaje / 2 + 8 &&
          candidato.x <= limiteX &&
          candidato.y >= altoPersonaje / 2 + 8 &&
          candidato.y <= limiteY;
        return estaEnEscena && !invadeObjetivo;
      });

      const opciones = validos.length > 0 ? validos : candidatos;
      const mejor = [...opciones].sort(
        (a, b) =>
          distanciaCuadrada(a, { x: centroObjetivo.x, y: centroObjetivo.y }) -
            distanciaCuadrada(b, { x: centroObjetivo.x, y: centroObjetivo.y }) ||
          a.prioridad - b.prioridad,
      )[0];
      if (!mejor) return null;

      return {
        x: clamp(
          mejor.x,
          anchoPersonaje / 2 + 8,
          Math.max(anchoPersonaje / 2 + 8, anchoEscena - anchoPersonaje / 2 - 8),
        ),
        y: clamp(
          mejor.y,
          altoPersonaje / 2 + 8,
          Math.max(altoPersonaje / 2 + 8, altoEscena - altoPersonaje / 2 - 8),
        ),
        pose: mejor.pose,
      };
    },
    [objetivos],
  );

  const moverPersonajeAlObjetivo = useCallback(
    (objetivoKey: GuiaObjetivoKey) => {
      const destino = calcularDestino(objetivoKey);
      if (!destino) return;

      const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (movimientoReducido) {
        setPosicion(destino);
        cambiarPose(destino.pose);
        setViajeVisual(null);
        return;
      }

      const viajeId = viajeIdRef.current + 1;
      viajeIdRef.current = viajeId;
      const entrada = posicion;
      setViajeVisual({ fase: "absorbiendo", entrada, salida: destino });

      const programarMovimiento = (duracion: number, accion: () => void) => {
        temporizadorRef.current = setTimeout(() => {
          if (viajeIdRef.current !== viajeId) return;
          temporizadorRef.current = null;
          accion();
        }, duracion);
      };

      programarMovimiento(DURACION_ABSORCION_MS, () => {
        setViajeVisual((actual) => (actual ? { ...actual, fase: "transitando" } : actual));
        programarMovimiento(DURACION_TRANSITO_MS, () => {
          const objetivo = objetivos[objetivoKey]?.current;
          if (
            objetivo &&
            (objetivo.getBoundingClientRect().top < 0 ||
              objetivo.getBoundingClientRect().bottom > window.innerHeight)
          ) {
            objetivo.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
          }
          const destinoFinal = calcularDestino(objetivoKey) ?? destino;
          setPosicion(destinoFinal);
          cambiarPose(destinoFinal.pose);
          setViajeVisual((actual) =>
            actual ? { ...actual, fase: "reapareciendo", salida: destinoFinal } : actual,
          );
          programarMovimiento(DURACION_REAPARICION_MS, () => setViajeVisual(null));
        });
      });
    },
    [calcularDestino, cambiarPose, objetivos, posicion],
  );

  const reproducirSegmento = useCallback(
    (segmento: keyof (typeof GUIA_AUDIO_POR_PASO)["bienvenida"], alTerminar?: () => void) => {
      const url = pasoActual ? GUIA_AUDIO_POR_PASO[pasoActual.id]?.[segmento] : undefined;
      if (!url) {
        alTerminar?.();
        return;
      }
      const audio = audioRef.current ?? new Audio();
      audioRef.current = audio;
      const reproduccionId = ++audioReproduccionIdRef.current;
      audio.pause();
      audio.currentTime = 0;
      audio.src = url;
      audio.preload = "metadata";
      audioSegmentoRef.current = segmento;
      setProgreso(0);
      setReproduciendo(true);
      audio.onloadedmetadata = () => {
        if (audioReproduccionIdRef.current !== reproduccionId) return;
        if (audio.duration && Number.isFinite(audio.duration)) setProgreso(0);
      };
      audio.ontimeupdate = () => {
        if (audioReproduccionIdRef.current !== reproduccionId) return;
        if (audio.duration && Number.isFinite(audio.duration)) {
          setProgreso(clamp((audio.currentTime / audio.duration) * 100, 0, 100));
        }
      };
      audio.onended = () => {
        if (audioReproduccionIdRef.current !== reproduccionId) return;
        setReproduciendo(false);
        setProgreso(100);
        audio.onended = null;
        alTerminar?.();
      };
      audio.onerror = () => {
        if (audioReproduccionIdRef.current !== reproduccionId) return;
        setReproduciendo(false);
        setAnuncio(
          "No se pudo reproducir este audio. Puedes continuar con los controles de texto.",
        );
        alTerminar?.();
      };
      void audio.play().catch(() => {
        if (audioReproduccionIdRef.current !== reproduccionId) return;
        setReproduciendo(false);
        setAnuncio("El audio necesita iniciarse desde el botón Escuchar.");
      });
    },
    [pasoActual],
  );

  const iniciarViaje = useCallback(
    (objetivoForzado?: GuiaObjetivoKey) => {
      const paso = pasoActual;
      if (!paso) return;
      const objetivoKey = objetivoForzado ?? paso.targetKey;
      setObjetivoActivoKey(objetivoKey);
      if (objetivoKey) {
        objetivoEnEsperaRef.current = `${paso.id}:${objetivoKey}`;
        estadoInicialObjetivoRef.current = objetivoEstados[objetivoKey];
      }
      if (!objetivoKey) {
        setFase("esperando_accion");
        setAnuncio(pasoActual?.inviteText ?? "Continúa cuando estés listo.");
        return;
      }

      const objetivo = objetivos[objetivoKey]?.current;
      const destinoInicial = calcularDestino(objetivoKey);
      if (!objetivo || !destinoInicial) {
        setFase("señalando");
        cambiarPose(pasoActual?.pose ?? "escuchar");
        setAnuncio("Te muestro dónde está ese control.");
        temporizadorRef.current = setTimeout(() => {
          reproducirSegmento("invitacion", () => setFase("esperando_accion"));
        }, DURACION_SEÑALAMIENTO_MS);
        return;
      }

      const movimientoReducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const objetivoFueraDeVista =
        objetivo.getBoundingClientRect().top < 0 ||
        objetivo.getBoundingClientRect().bottom > window.innerHeight;
      const viajeId = viajeIdRef.current + 1;
      viajeIdRef.current = viajeId;
      const entrada = posicion;

      if (movimientoReducido) {
        setPosicion(destinoInicial);
        setViajeVisual(null);
        cambiarPose(destinoInicial.pose);
        setFase("señalando");
        setAnuncio(paso.inviteText);
        reproducirSegmento("invitacion", () => setFase("esperando_accion"));
        return;
      }

      setFase("preparando_viaje");
      setViajeVisual({ fase: "absorbiendo", entrada, salida: destinoInicial });
      setAnuncio(`Me preparo para ir hacia ${ETIQUETAS_OBJETIVO[objetivoKey]}.`);

      const programar = (duracion: number, accion: () => void) => {
        temporizadorRef.current = setTimeout(() => {
          if (viajeIdRef.current !== viajeId) return;
          temporizadorRef.current = null;
          accion();
        }, duracion);
      };

      programar(80, () => {
        setFase("absorción_iniciando");
        setAnuncio("Me hago pequeño para seguir el camino.");
        programar(DURACION_ABSORCION_MS, () => {
          setFase("remolino_absorbiendo");
          setAnuncio("Voy rápido hacia el siguiente control.");
          setViajeVisual((actual) => (actual ? { ...actual, fase: "transitando" } : actual));
          programar(DURACION_TRANSITO_MS, () => {
            if (objetivoFueraDeVista) {
              objetivo.scrollIntoView({
                behavior: "smooth",
                block: "center",
                inline: "nearest",
              });
            }
            programar(objetivoFueraDeVista ? TIEMPO_SCROLL_LEJANO_MS : 90, () => {
              const destinoFinal = calcularDestino(objetivoKey) ?? destinoInicial;
              setViajeVisual((actual) =>
                actual ? { ...actual, fase: "reapareciendo", salida: destinoFinal } : actual,
              );
              setPosicion(destinoFinal);
              cambiarPose(destinoFinal.pose);
              setFase("chasquido_de_salida");
              setAnuncio(`Ya llegué cerca de ${ETIQUETAS_OBJETIVO[objetivoKey]}.`);
              programar(70, () => {
                setFase("reapareciendo");
                setAnuncio("Aquí estoy.");
                programar(DURACION_REAPARICION_MS, () => {
                  setFase("señalando");
                  setViajeVisual(null);
                  setAnuncio(`Ya llegué. ${paso.inviteText}`);
                  programar(DURACION_SEÑALAMIENTO_MS, () => {
                    reproducirSegmento("invitacion", () => {
                      if (!paso.requiresAction) {
                        setFase("accion_detectada");
                        cambiarPose("celebrar");
                        setAnuncio(paso.confirmText);
                        reproducirSegmento("confirmacion", () => irAlPaso(paso.nextStepId));
                        return;
                      }
                      setFase("esperando_accion");
                      setAnuncio(paso.inviteText);
                    });
                  });
                });
              });
            });
          });
        });
      });
    },
    [
      calcularDestino,
      cambiarPose,
      irAlPaso,
      objetivoEstados,
      objetivos,
      pasoActual,
      posicion,
      reproducirSegmento,
    ],
  );

  const terminarNarracion = useCallback(() => {
    setReproduciendo(false);
    setProgreso(100);
    if (pasoActual?.id === "bienvenida") {
      irAlPaso(pasoActual.nextStepId);
      return;
    }
    if (pasoActual?.id === "cierre") {
      reproducirSegmento("invitacion", () => {
        setFase("finalizada");
        cambiarPose("celebrar");
        setAnuncio(pasoActual.inviteText);
      });
      return;
    }
    iniciarViaje(pasoActual?.inviteTargetKey);
  }, [cambiarPose, iniciarViaje, irAlPaso, pasoActual, reproducirSegmento]);

  const iniciarNarracion = useCallback(
    (continuar = false, forzarRepeticion = false) => {
      if (!pasoActual) return;
      if (FASES_VIAJE.has(fase) && !forzarRepeticion) return;
      if (fase === "esperando_accion" && !forzarRepeticion) {
        setFase("explicando");
        setAnuncio(
          pasoActual.id === "bienvenida"
            ? "Escuchando la introducción de la guía."
            : `Escuchando: ${pasoActual.titulo}.`,
        );
        reproducirSegmento("explicacion", terminarNarracion);
        return;
      }
      if (fase === "finalizada" && pasoActual.id !== "cierre") {
        setAnuncio("La guía terminó. Puedes cerrar esta ayuda.");
        return;
      }
      if (fase === "finalizada" && pasoActual.id === "cierre") setFase("lista");

      const audio = audioRef.current;
      const segmentoActual = audioSegmentoRef.current;
      const url = segmentoActual ? GUIA_AUDIO_POR_PASO[pasoActual.id]?.[segmentoActual] : undefined;
      if (continuar && audio && url && audio.src === url && audio.currentTime > 0 && audio.paused) {
        setReproduciendo(true);
        void audio.play().catch(() => setAnuncio("Pulsa Escuchar para continuar la explicación."));
        return;
      }
      setFase("explicando");
      setAnuncio(
        pasoActual.id === "bienvenida"
          ? "Escuchando la introducción de la guía."
          : `Escuchando: ${pasoActual.titulo}.`,
      );
      if (pasoActual.targetKey === "panel-consulta") {
        moverPersonajeAlObjetivo(pasoActual.targetKey);
      }
      reproducirSegmento("explicacion", terminarNarracion);
    },
    [fase, moverPersonajeAlObjetivo, pasoActual, reproducirSegmento, terminarNarracion],
  );

  const pausar = useCallback(() => {
    if (reproduciendo) {
      detenerReproduccion(false);
      setFase("pausada");
      setAnuncio("La explicación está pausada. Puedes reanudarla cuando quieras.");
      return;
    }
    if (FASES_VIAJE.has(fase)) {
      cancelarViaje();
      setFase("pausada");
      setAnuncio("El recorrido está pausado. Puedes reanudarlo cuando quieras.");
    }
  }, [cancelarViaje, detenerReproduccion, fase, reproduciendo]);

  const repetir = useCallback(() => {
    limpiarTemporizadores();
    setViajeVisual(null);
    cambiarPose(pasoActual?.pose ?? "escuchar");
    iniciarNarracion(false, true);
  }, [cambiarPose, iniciarNarracion, limpiarTemporizadores, pasoActual]);

  const volverPaso = useCallback(() => {
    if (!pasoAnterior) return;
    limpiarTemporizadores();
    volverPendienteRef.current = true;
    setPasoId(pasoAnterior.id);
    setFase("lista");
    setProgreso(0);
    setTranscripcionAbierta(false);
    setAnuncio(`Volvemos a ${pasoAnterior.titulo}.`);

    if (!pasoAnterior.targetKey) {
      volverPendienteRef.current = false;
      const viajeId = viajeIdRef.current + 1;
      viajeIdRef.current = viajeId;
      const entrada = posicion;
      const salida: Destino = { x: 92, y: 84, pose: pasoAnterior.pose };
      const programarRegreso = (duracion: number, accion: () => void) => {
        temporizadorRef.current = setTimeout(() => {
          if (viajeIdRef.current !== viajeId) return;
          temporizadorRef.current = null;
          accion();
        }, duracion);
      };

      setViajeVisual({ fase: "absorbiendo", entrada, salida });
      setFase("preparando_viaje");
      setAnuncio(`Volvemos hacia ${pasoAnterior.titulo}.`);
      programarRegreso(80, () => {
        setFase("absorción_iniciando");
        setAnuncio("Regreso por el camino.");
        programarRegreso(DURACION_ABSORCION_MS, () => {
          setFase("remolino_absorbiendo");
          setViajeVisual((actual) => (actual ? { ...actual, fase: "transitando" } : actual));
          programarRegreso(DURACION_TRANSITO_MS, () => {
            setViajeVisual((actual) =>
              actual ? { ...actual, fase: "reapareciendo", salida } : actual,
            );
            setPosicion(salida);
            cambiarPose(salida.pose);
            setFase("chasquido_de_salida");
            setAnuncio(`Ya estamos en ${pasoAnterior.titulo}.`);
            programarRegreso(70, () => {
              setFase("reapareciendo");
              programarRegreso(DURACION_REAPARICION_MS, () => {
                setViajeVisual(null);
                setFase("lista");
                setAnuncio(`Volvemos a ${pasoAnterior.titulo}. Pulsa Escuchar cuando quieras.`);
              });
            });
          });
        });
      });
    }
  }, [cambiarPose, limpiarTemporizadores, pasoAnterior, posicion]);

  const omitirPaso = useCallback(() => {
    if (!pasoActual) return;
    limpiarTemporizadores();
    setFase("omitiendo");
    cambiarPose("reposo");
    setAnuncio(pasoActual.skipText);

    // Omitir es una acción rápida y silenciosa: el aviso visual también se
    // anuncia por aria-live, pero no reproduce una narración adicional.
    temporizadorRef.current = setTimeout(() => {
      temporizadorRef.current = null;
      const siguienteId = pasoActual.nextStepId;
      const siguiente = siguienteId ? pasosPorId.get(siguienteId) : undefined;
      irAlPaso(siguienteId);
      if (siguiente?.targetKey) {
        moverPersonajeAlObjetivo(siguiente.targetKey);
      }
    }, 180);
  }, [
    cambiarPose,
    irAlPaso,
    limpiarTemporizadores,
    moverPersonajeAlObjetivo,
    pasoActual,
    pasosPorId,
  ]);

  const accionDetectada = useCallback(() => {
    if (!pasoActual || fase !== "esperando_accion") return;
    limpiarTemporizadores();
    setFase("accion_detectada");
    cambiarPose("celebrar");
    setAnuncio(pasoActual.confirmText);
    reproducirSegmento("confirmacion", () => irAlPaso(pasoActual.nextStepId));
  }, [cambiarPose, fase, irAlPaso, limpiarTemporizadores, pasoActual, reproducirSegmento]);

  useEffect(() => {
    if (!volverPendienteRef.current || !pasoActual) return;
    volverPendienteRef.current = false;
    const temporizador = window.setTimeout(() => {
      iniciarViaje();
    }, 0);
    return () => window.clearTimeout(temporizador);
  }, [iniciarViaje, pasoActual]);

  const reanudar = useCallback(() => {
    if (audioSegmentoRef.current === "omitir" && fase === "pausada") {
      limpiarTemporizadores();
      audioSegmentoRef.current = null;
      setFase("lista");
      setProgreso(0);
      setAnuncio(`Volvemos a explicar: ${pasoActual?.titulo ?? "este paso"}.`);
      iniciarNarracion(false, true);
      return;
    }
    if (fase === "omitiendo") {
      limpiarTemporizadores();
      setFase("lista");
      setProgreso(0);
      setAnuncio(`Volvemos a explicar: ${pasoActual?.titulo ?? "este paso"}.`);
      iniciarNarracion(false, true);
      return;
    }
    if (fase === "esperando_accion") {
      setAnuncio(pasoActual?.inviteText ?? "Continúa con el control señalado.");
      return;
    }
    iniciarNarracion(true);
  }, [fase, iniciarNarracion, limpiarTemporizadores, pasoActual]);

  const reiniciarDesdeInicio = useCallback(() => {
    const inicial = pasosPorId.get(inicioPasoId) ?? pasos[0];
    if (!inicial) return;
    limpiarTemporizadores();
    volverPendienteRef.current = false;
    setAbierta(true);
    setPasoId(inicial.id);
    setFase(inicial.id === "bienvenida" ? "bienvenida" : "lista");
    setProgreso(0);
    setTranscripcionAbierta(false);
    setPosicion({ x: 92, y: 84 });
    setViajeVisual(null);
    cambiarPose(inicial.pose);
    setAnuncio("La guía está lista para comenzar.");
    window.localStorage.removeItem(CLAVE_OMITIDA);
  }, [cambiarPose, inicioPasoId, limpiarTemporizadores, pasos, pasosPorId]);

  useEffect(() => {
    if (forzarApertura <= 0) {
      const omitida = window.localStorage.getItem(CLAVE_OMITIDA) === "true";
      if (omitida) setAbierta(false);
      return;
    }
    reiniciarDesdeInicio();
  }, [forzarApertura, reiniciarDesdeInicio]);

  useEffect(() => {
    const objetivoKey = pasoActual?.inviteTargetKey ?? pasoActual?.targetKey;
    const claveEspera =
      fase === "esperando_accion" && pasoActual?.requiresAction && objetivoKey
        ? `${pasoActual.id}:${objetivoKey}`
        : null;

    if (!claveEspera || !objetivoKey) return;

    // Filtros es un interruptor: solo abrirlo completa el objetivo; cerrarlo no.
    // Si ya está abierto al entrar al paso, se considera cumplido y no se exige
    // otro clic que podría volver a cerrarlo antes de Solucionados.
    if (objetivoKey === "boton-filtros" && objetivoEstados[objetivoKey] === true) {
      accionDetectada();
      return;
    }

    if (objetivoEnEsperaRef.current !== claveEspera) {
      objetivoEnEsperaRef.current = claveEspera;
      estadoInicialObjetivoRef.current = objetivoEstados[objetivoKey];
      return;
    }

    const valorActual = objetivoEstados[objetivoKey];
    const valorInicial = estadoInicialObjetivoRef.current;
    if (valorActual !== undefined && valorActual !== valorInicial) {
      accionDetectada();
    }
  }, [accionDetectada, fase, objetivoEstados, pasoActual]);

  useEffect(() => {
    const puedeMarcarObjetivo =
      abierta &&
      (fase === "explicando" ||
        fase === "señalando" ||
        fase === "esperando_accion" ||
        fase === "accion_detectada");
    const objetivoKey = puedeMarcarObjetivo ? objetivoActivoKey : undefined;
    const objetivo = objetivoKey ? objetivos[objetivoKey]?.current : null;
    const objetivosMarcados = Object.values(objetivos)
      .map((referencia) => referencia?.current)
      .filter((elemento): elemento is HTMLElement => Boolean(elemento));

    objetivosMarcados.forEach((elemento) => {
      elemento.removeAttribute("data-guia-target-active");
      elemento.removeAttribute("data-guia-target-key");
    });

    if (objetivo) {
      objetivo.setAttribute("data-guia-target-active", "true");
      objetivo.setAttribute("data-guia-target-key", objetivoKey ?? "");
    }

    return () => {
      objetivosMarcados.forEach((elemento) => {
        elemento.removeAttribute("data-guia-target-active");
        elemento.removeAttribute("data-guia-target-key");
      });
    };
  }, [abierta, fase, objetivos, objetivoActivoKey]);

  useEffect(() => {
    if (fase !== "señalando" && fase !== "esperando_accion") return;
    const recalcular = () => {
      const objetivoKey = objetivoActivoKey;
      if (!objetivoKey) return;
      const destino = calcularDestino(objetivoKey);
      if (destino) setPosicion(destino);
    };
    window.addEventListener("resize", recalcular);
    window.addEventListener("scroll", recalcular, { passive: true });
    return () => {
      window.removeEventListener("resize", recalcular);
      window.removeEventListener("scroll", recalcular);
    };
  }, [calcularDestino, fase, objetivoActivoKey]);

  useEffect(() => {
    const gestionarVisibilidad = () => {
      if (document.hidden) {
        if (!abierta || fase === "cerrada") return;
        faseAntesDeOcultarRef.current = fase;
        limpiarTemporizadores();
        setFase("fuera_de_vista");
        setAnuncio("La guía se pausó porque la pestaña está oculta.");
        return;
      }
      if (fase !== "fuera_de_vista") return;
      const faseAnterior = faseAntesDeOcultarRef.current;
      setFase(faseAnterior === "esperando_accion" ? "esperando_accion" : "pausada");
      setAnuncio(
        faseAnterior === "esperando_accion"
          ? "La guía volvió. Continúa con el control señalado."
          : "La guía volvió. Pulsa Reanudar explicación para continuar.",
      );
    };
    document.addEventListener("visibilitychange", gestionarVisibilidad);
    return () => document.removeEventListener("visibilitychange", gestionarVisibilidad);
  }, [abierta, fase, limpiarTemporizadores]);

  useEffect(() => {
    return () => limpiarTemporizadores();
  }, [limpiarTemporizadores]);

  if (!abierta) {
    return (
      <button
        type="button"
        className="guia-hablada-launcher"
        onClick={reiniciarDesdeInicio}
        aria-label="Abrir ayuda hablada de Mi Vereda"
      >
        <Headphones size={18} aria-hidden="true" />
        <span>¿Cómo funciona?</span>
      </button>
    );
  }

  if (!pasoActual) return null;

  const instruccionVisible =
    fase === "bienvenida"
      ? "Pulsa Escuchar para comenzar."
      : fase === "lista"
        ? "Cuando quieras, pulsa Escuchar."
        : fase === "explicando"
          ? "Escuchando…"
          : fase === "preparando_viaje"
            ? "Me preparo para ir contigo."
            : fase === "absorción_iniciando"
              ? "Me preparo para seguir el camino."
              : fase === "remolino_absorbiendo"
                ? "Voy rápido hacia el siguiente punto."
                : fase === "tránsito_breve"
                  ? "Te acompaño hasta el siguiente punto."
                  : fase === "chasquido_de_salida"
                    ? "Ya casi llegamos."
                    : fase === "reapareciendo"
                      ? "Aquí estoy."
                      : fase === "señalando"
                        ? "Mira el control que te señalo."
                        : fase === "esperando_accion"
                          ? pasoActual.inviteText
                          : fase === "accion_detectada"
                            ? pasoActual.confirmText
                            : fase === "omitiendo"
                              ? pasoActual.skipText
                              : fase === "pausada"
                                ? "La explicación está en pausa."
                                : fase === "fuera_de_vista"
                                  ? "La guía está pausada mientras no la ves."
                                  : "La guía terminó.";

  const posicionVisual = viajeVisual?.fase === "reapareciendo" ? viajeVisual.salida : posicion;
  const estiloPersonaje = {
    "--guia-x": `${posicionVisual.x}px`,
    "--guia-y": `${posicionVisual.y}px`,
  } as CSSProperties;
  const estiloRemolinoEntrada = {
    "--remolino-x": `${viajeVisual?.entrada.x ?? posicion.x}px`,
    "--remolino-y": `${viajeVisual?.entrada.y ?? posicion.y}px`,
  } as CSSProperties;
  const estiloRemolinoTransito = {
    "--remolino-from-x": `${viajeVisual?.entrada.x ?? posicion.x}px`,
    "--remolino-from-y": `${viajeVisual?.entrada.y ?? posicion.y}px`,
    "--remolino-to-x": `${viajeVisual?.salida.x ?? posicion.x}px`,
    "--remolino-to-y": `${viajeVisual?.salida.y ?? posicion.y}px`,
  } as CSSProperties;
  const estiloRemolinoSalida = {
    "--remolino-x": `${viajeVisual?.salida.x ?? posicion.x}px`,
    "--remolino-y": `${viajeVisual?.salida.y ?? posicion.y}px`,
  } as CSSProperties;
  const estiloTemaRemolino = {
    "--remolino-kraft": temaRemolino.kraft,
    "--remolino-verde": temaRemolino.verde,
    "--remolino-dorado": temaRemolino.dorado,
    "--remolino-resplandor": temaRemolino.resplandor,
  } as CSSProperties;
  const anchoEscenaActual = escenaRef.current?.getBoundingClientRect().width ?? 640;
  const ladoBurbuja = posicionVisual.x < anchoEscenaActual / 2 ? "derecha" : "izquierda";
  const estiloBurbuja = {
    "--burbuja-x": `${posicionVisual.x}px`,
    "--burbuja-y": `${posicionVisual.y}px`,
  } as CSSProperties;
  const mostrarReanudar = fase === "pausada" || fase === "fuera_de_vista";
  const mostrarPausa = reproduciendo || faseDeViaje;
  const etiquetaBotonPrincipal = mostrarReanudar
    ? "Reanudar explicación"
    : mostrarPausa
      ? "Pausar"
      : "Escuchar";
  const EtiquetaDireccion = iconoDireccion;
  const personajeOcultoDuranteViaje = viajeVisual?.fase === "transitando";
  const personajeAbsorbiendose = viajeVisual?.fase === "absorbiendo";
  const personajeReapareciendo = viajeVisual?.fase === "reapareciendo";

  return (
    <section className="guia-hablada" aria-labelledby={tituloId} aria-describedby={estadoId}>
      <div ref={escenaRef} className="guia-hablada-canvas" aria-hidden="true">
        {viajeVisual?.fase === "absorbiendo" && (
          <div
            className="guia-remolino guia-remolino-absorbiendo"
            style={{ ...estiloRemolinoEntrada, ...estiloTemaRemolino }}
          />
        )}
        {viajeVisual?.fase === "transitando" && (
          <div
            className="guia-remolino guia-remolino-transitando"
            style={{ ...estiloRemolinoTransito, ...estiloTemaRemolino }}
          />
        )}
        {viajeVisual?.fase === "reapareciendo" && (
          <div
            className="guia-remolino guia-remolino-salida"
            style={{ ...estiloRemolinoSalida, ...estiloTemaRemolino }}
          />
        )}
        <div
          ref={personajeRef}
          className={`guia-personaje-frame ${poseEnMovimiento ? "is-changing" : ""} ${
            personajeOcultoDuranteViaje ? "is-travelling" : ""
          } ${personajeAbsorbiendose ? "is-absorbing" : ""} ${
            personajeReapareciendo ? "is-reappearing" : ""
          }`}
          style={estiloPersonaje}
        >
          {poseAnterior && (
            <img
              className="guia-personaje-pose guia-personaje-pose-exiting"
              src={PERSONAJE_POSES[poseAnterior]}
              alt=""
            />
          )}
          <img
            className="guia-personaje-pose guia-personaje-pose-active"
            src={PERSONAJE_POSES[poseActual]}
            alt=""
          />
        </div>
        {objetivoActivoKey && fase !== "finalizada" && !faseDeViaje && (
          <div className="guia-hablada-target-cue" style={estiloPersonaje} aria-hidden="true">
            {EtiquetaDireccion ? (
              <EtiquetaDireccion size={17} strokeWidth={2.5} />
            ) : (
              <Volume2 size={17} />
            )}
            <span>{ETIQUETAS_OBJETIVO[objetivoActivoKey]}</span>
          </div>
        )}
      </div>

      <div
        className={`guia-hablada-bubble guia-hablada-bubble-${ladoBurbuja}`}
        style={estiloBurbuja}
        data-side={ladoBurbuja}
      >
        <span className="guia-hablada-bubble-tail" aria-hidden="true" />
        <div className="guia-hablada-heading">
          <div>
            <p className="eyebrow">Guía de Mi Vereda</p>
            <h2 id={tituloId}>{pasoActual.titulo}</h2>
          </div>
          <button
            type="button"
            className="guia-hablada-close"
            onClick={cerrarGuia}
            aria-label="Salir de la guía"
            title="Salir"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <p className="guia-hablada-instruction">{instruccionVisible}</p>
        <p id={estadoId} className="sr-only" aria-live="polite">
          {anuncio}
        </p>

        {transcripcionAbierta && (
          <div
            id={transcriptId}
            className="guia-hablada-transcript"
            role="region"
            aria-label="Texto de la guía"
          >
            <p>{pasoActual.explanationText}</p>
            <p>
              <strong>Cuando termine:</strong> {pasoActual.inviteText}
            </p>
            <p>
              <strong>Al completar:</strong> {pasoActual.confirmText}
            </p>
          </div>
        )}

        <div className="guia-hablada-player" aria-label="Controles de la guía hablada">
          <div className="guia-hablada-progress-row">
            <span aria-hidden="true">{Math.round(progreso)}%</span>
            <div
              className="guia-hablada-progress"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progreso)}
              aria-label="Progreso de la explicación"
            >
              <span style={{ width: `${progreso}%` }} />
            </div>
            <span className="guia-hablada-demo">Audio real</span>
          </div>
          <div className="guia-hablada-controls">
            {mostrarPausa ? (
              <button
                type="button"
                className="guia-hablada-main-action"
                onClick={pausar}
                aria-label="Pausar explicación"
              >
                <Pause size={18} aria-hidden="true" />
                <span>Pausar</span>
              </button>
            ) : (
              <button
                type="button"
                className="guia-hablada-main-action"
                onClick={() => (mostrarReanudar ? reanudar() : iniciarNarracion())}
                aria-label={etiquetaBotonPrincipal}
              >
                {mostrarReanudar ? (
                  <Play size={18} aria-hidden="true" />
                ) : (
                  <Volume2 size={18} aria-hidden="true" />
                )}
                <span>{etiquetaBotonPrincipal}</span>
              </button>
            )}
            <>
              <button
                type="button"
                className="guia-hablada-icon-action"
                onClick={repetir}
                aria-label="Repetir explicación"
                title="Repetir explicación"
              >
                <RotateCcw size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="guia-hablada-text-action"
                onClick={() => setTranscripcionAbierta((abiertaActual) => !abiertaActual)}
                aria-expanded={transcripcionAbierta}
                aria-controls={transcriptId}
              >
                {transcripcionAbierta ? "Ocultar texto" : "Ver texto"}
              </button>
            </>
          </div>
        </div>

        <div className="guia-hablada-footer">
          {pasoAnterior && (
            <button
              type="button"
              className="guia-hablada-back"
              onClick={volverPaso}
              aria-label={`Volver a ${pasoAnterior.titulo}`}
              title={`Volver a ${pasoAnterior.titulo}`}
            >
              <ArrowLeft size={15} aria-hidden="true" />
              <span>Volver</span>
            </button>
          )}
          {esPasoDeCierre ? (
            <button type="button" className="guia-hablada-skip" onClick={cerrarGuia}>
              Salir
            </button>
          ) : (
            <button type="button" className="guia-hablada-skip" onClick={omitirPaso}>
              Omitir paso
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
