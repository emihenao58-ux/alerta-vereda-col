import { createFileRoute } from "@tanstack/react-router";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import {
  ArrowUpDown,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  CircleX,
  Filter,
  History,
  LayoutGrid,
  MapPin,
  RotateCcw,
  Search,
  Sparkles,
  Volume2,
  X,
} from "lucide-react";
import {
  GuiaHablada,
  type GuiaHabladaPaso,
  type GuiaObjetivoEstados,
  type GuiaObjetivos,
} from "@/components/guia-hablada";
import {
  consultarCartelera,
  consultarHistorial,
  consultarVeredas,
  type MiVeredaHistorialPublicacion,
  type MiVeredaPublicacion,
  type MiVeredaVereda,
} from "@/lib/mi-vereda-cartelera";
import {
  ETIQUETAS_CATEGORIA,
  type CategoriaMiVereda,
  type EstadoMiVereda,
} from "@/lib/mi-vereda-demo";
import {
  esResultadoHistorialPublico,
  esResultadoNovedadPublico,
  ordenarRegistrosPorFecha,
  obtenerTimestampFechaMiVereda,
  registroDentroDelPeriodo,
  type OrdenMiVereda,
  type PeriodoMiVereda,
} from "@/lib/mi-vereda-filtros";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/mi-vereda")({
  head: () => ({
    meta: [
      { title: "Mi Vereda · AlertaVereda" },
      {
        name: "description",
        content: "Consulta las novedades y la memoria comunitaria de cualquier vereda de Ebéjico.",
      },
    ],
  }),
  component: MiVereda,
});

type Vista = "activas" | "historial";
type FiltroHistorial = "todos" | "solucionado" | "no_solucionado";
type Periodo = PeriodoMiVereda;
type OrdenNovedades = OrdenMiVereda;
type CategoriaFiltro = "todas" | CategoriaMiVereda;

type FiltrosNovedades = {
  categoria: CategoriaFiltro;
  periodo: Periodo;
  orden: OrdenNovedades;
  busqueda: string;
};

type FiltrosHistorial = {
  categoria: CategoriaFiltro;
  periodo: Periodo;
  estado: FiltroHistorial;
  busqueda: string;
};

type RegistroMiVereda = {
  id: string;
  veredaId: string;
  categoria: CategoriaMiVereda;
  titulo: string;
  descripcion: string;
  estado: EstadoMiVereda;
  fechaCreacion: string;
  cerradoEn: string | null;
  lugar: string | undefined;
  nivel: "urgente" | "atencion" | "normal" | undefined;
};

const GUIA_PASOS: readonly GuiaHabladaPaso[] = [
  {
    id: "bienvenida",
    titulo: "Te acompaño",
    pose: "escuchar",
    explanationText:
      "Hola, te acompaño a conocer Mi Vereda. Aquí puedes consultar lo que está pasando y revisar lo que ocurrió antes.",
    inviteText: "Cuando quieras, empezamos.",
    confirmText: "Muy bien. Vamos al primer paso.",
    skipText: "Oh, bueno, está bien. Puedes recorrer la pantalla a tu manera.",
    completionSignal: "La persona pulsa Escuchar.",
    requiresAction: false,
    nextStepId: "selector-vereda",
  },
  {
    id: "selector-vereda",
    titulo: "Elige una vereda",
    targetKey: "selector-vereda",
    pose: "abajo",
    explanationText:
      "Primero elegimos la vereda que queremos consultar. Tú la escoges de la lista. No necesitamos saber dónde estás ni activar la ubicación de tu celular.",
    inviteText: "Toca la lista y elige una vereda.",
    confirmText: "Listo. Ya estamos consultando esa vereda.",
    skipText: "Bueno, seguimos. La vereda se puede cambiar después.",
    completionSignal: "Cambia el valor del selector de vereda.",
    requiresAction: true,
    nextStepId: "novedades-activas",
  },
  {
    id: "novedades-activas",
    titulo: "Mira lo que pasa ahora",
    targetKey: "panel-consulta",
    inviteTargetKey: "tab-activas",
    pose: "abajo",
    explanationText:
      "Aquí aparecen los avisos que están activos ahora, como novedades de la vía, emergencias o servicios.",
    inviteText: "Mira la pestaña de Novedades activas.",
    confirmText: "Muy bien, ya has visto lo que está pasando ahora.",
    skipText: "Está bien, continuamos. Puedes volver a esta sección cuando quieras.",
    completionSignal: "La pestaña Novedades activas ya está seleccionada.",
    requiresAction: false,
    nextStepId: "historial",
  },
  {
    id: "historial",
    titulo: "Consulta la historia",
    targetKey: "tab-historial",
    pose: "abajo",
    explanationText:
      "En Historial puedes revisar casos anteriores de esta vereda. Allí verás los que fueron solucionados y los que todavía no.",
    inviteText: "Toca la pestaña Historial.",
    confirmText: "Eso es. Ahora estás viendo el historial de la vereda.",
    skipText: "Está bien. El historial seguirá disponible para consultarlo después.",
    completionSignal: "La pestaña Historial queda seleccionada.",
    requiresAction: true,
    nextStepId: "filtros",
  },
  {
    id: "filtros",
    titulo: "Encuentra más rápido",
    targetKey: "boton-filtros",
    pose: "abajo",
    explanationText:
      "Los filtros ayudan a encontrar más rápido lo que buscas. Puedes filtrar por categoría, fecha o estado.",
    inviteText: "Toca el botón de filtros.",
    confirmText: "Perfecto. Ya puedes escoger cómo quieres buscar cualquier reporte.",
    skipText: "Entonces, sigamos. Puedes abrir los filtros más adelante.",
    completionSignal: "El panel de filtros queda abierto.",
    requiresAction: true,
    nextStepId: "solucionado",
  },
  {
    id: "solucionado",
    titulo: "Casos solucionados",
    targetKey: "filtro-solucionado",
    pose: "derecha",
    explanationText: "Este filtro muestra los casos del historial que ya han sido solucionados.",
    inviteText: "En la lista de estado, elige Solucionados.",
    confirmText: "Muy bien. Ahora puedes ver los casos que han sido solucionados.",
    skipText: "Entonces continuemos sin aplicar ese filtro.",
    completionSignal: "El filtro queda en solucionado.",
    requiresAction: true,
    nextStepId: "no-solucionado",
  },
  {
    id: "no-solucionado",
    titulo: "Casos no solucionados",
    targetKey: "filtro-no-solucionado",
    pose: "derecha",
    explanationText:
      "Ahora, este filtro muestra los casos que todavía no aparecen como solucionados.",
    inviteText: "Ahora elige No solucionados.",
    confirmText: "Listo. Ahora puedes ver los casos que siguen pendientes.",
    skipText: "Está bien, puedes revisar ese filtro cuando quieras.",
    completionSignal: "El filtro queda en no_solucionado.",
    requiresAction: true,
    nextStepId: "cierre",
  },
  {
    id: "cierre",
    titulo: "Recorrido terminado",
    pose: "celebrar",
    explanationText:
      "Ya conoces el recorrido. Eliges una vereda, ves sus novedades y revisas su historial.",
    inviteText: "Ya puedes cerrar la guía cuando te sientas listo.",
    confirmText: "Muy bien. Ya sabes cómo consultar en el apartado de Mi Vereda.",
    skipText: "La guía ha terminado aquí. Puedes seguir explorando sobre nuestra aplicación.",
    completionSignal: "La persona pulsa Cerrar guía.",
    requiresAction: false,
  },
];

const CATEGORIA_ICONOS: Record<CategoriaMiVereda, string> = {
  emergencia: "E",
  via: "V",
  servicio: "S",
  aviso: "A",
};

function fechaVisible(valor: string) {
  const fecha = obtenerTimestampFechaMiVereda(valor);
  if (fecha === null) return "Fecha no disponible";

  return new Date(fecha).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function normalizarBusqueda(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .trim();
}

function conTiempoLimite<T>(promesa: Promise<T>, milisegundos: number, mensaje: string) {
  return new Promise<T>((resolve, reject) => {
    const temporizador = setTimeout(() => reject(new Error(mensaje)), milisegundos);
    promesa.then(
      (resultado) => {
        clearTimeout(temporizador);
        resolve(resultado);
      },
      (error: unknown) => {
        clearTimeout(temporizador);
        reject(error);
      },
    );
  });
}

function mapearPublicacion(
  publicacion: MiVeredaPublicacion | MiVeredaHistorialPublicacion,
): RegistroMiVereda | null {
  if (publicacion.resultado === "retirado") return null;

  const esCerrado = Boolean(publicacion.cerrado_en?.trim());
  const estado =
    publicacion.resultado === "solucionado"
      ? "solucionado"
      : publicacion.resultado === "no_solucionado"
        ? "no_solucionado"
        : esCerrado
          ? null
          : "activo";
  if (!estado) return null;
  const nivel = "nivel" in publicacion ? publicacion.nivel : null;

  return {
    id: publicacion.publicacion_id,
    veredaId: publicacion.vereda_id,
    categoria: publicacion.categoria,
    titulo: publicacion.titulo,
    descripcion: publicacion.descripcion ?? "",
    estado,
    fechaCreacion: publicacion.created_at,
    cerradoEn: publicacion.cerrado_en ?? null,
    lugar: publicacion.lugar ?? undefined,
    nivel: nivel === "urgente" || nivel === "atencion" || nivel === "normal" ? nivel : undefined,
  };
}

function etiquetaEstado(estado: EstadoMiVereda) {
  if (estado === "activo") return "Activa";
  if (estado === "solucionado") return "Solucionado";
  return "No solucionado";
}

function MiVereda() {
  const [veredas, setVeredas] = useState<MiVeredaVereda[]>([]);
  const [veredaId, setVeredaId] = useState("");
  const [selectorVeredaAbierto, setSelectorVeredaAbierto] = useState(false);
  const [busquedaVereda, setBusquedaVereda] = useState("");
  const [vista, setVista] = useState<Vista>("activas");
  const [filtrosNovedades, setFiltrosNovedades] = useState<FiltrosNovedades>({
    categoria: "todas",
    periodo: "todo",
    orden: "recientes",
    busqueda: "",
  });
  const [filtrosHistorial, setFiltrosHistorial] = useState<FiltrosHistorial>({
    categoria: "todas",
    periodo: "todo",
    estado: "todos",
    busqueda: "",
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [forzarGuia, setForzarGuia] = useState(0);
  const [inicioGuia, setInicioGuia] = useState<GuiaHabladaPaso["id"]>("bienvenida");
  const [activacionesVista, setActivacionesVista] = useState({ activas: 0, historial: 0 });
  const [cargandoVeredas, setCargandoVeredas] = useState(true);
  const [errorVeredas, setErrorVeredas] = useState<string | null>(null);
  const [reintentoVeredas, setReintentoVeredas] = useState(0);
  const [registros, setRegistros] = useState<RegistroMiVereda[]>([]);
  const [cargandoRegistros, setCargandoRegistros] = useState(false);
  const [errorRegistros, setErrorRegistros] = useState<string | null>(null);
  const [reintentoConsulta, setReintentoConsulta] = useState(0);
  const selectorVeredaRef = useRef<HTMLElement | null>(null);
  const panelConsultaRef = useRef<HTMLElement>(null);
  const tabActivasRef = useRef<HTMLButtonElement>(null);
  const tabHistorialRef = useRef<HTMLButtonElement>(null);
  const botonFiltrosRef = useRef<HTMLButtonElement>(null);
  const botonCambiarVeredaRef = useRef<HTMLButtonElement>(null);
  const busquedaVeredaRef = useRef<HTMLInputElement>(null);
  const filtroCategoriaRef = useRef<HTMLSelectElement>(null);
  const filtroSolucionadoRef = useRef<HTMLSelectElement>(null);
  const filtroNoSolucionadoRef = useRef<HTMLSelectElement>(null);

  const filtrosActuales = vista === "activas" ? filtrosNovedades : filtrosHistorial;
  const consulta = filtrosActuales.busqueda.trim();
  const vereda = veredas.find((item) => item.id === veredaId) ?? null;
  const veredasFiltradas = useMemo(() => {
    const busquedaNormalizada = normalizarBusqueda(busquedaVereda);
    if (!busquedaNormalizada) return veredas;

    return veredas.filter((item) => normalizarBusqueda(item.nombre).includes(busquedaNormalizada));
  }, [busquedaVereda, veredas]);

  useEffect(() => {
    let cancelado = false;
    setCargandoVeredas(true);
    setErrorVeredas(null);

    void conTiempoLimite(
      consultarVeredas(),
      12_000,
      "La consulta del catálogo tardó demasiado. Puedes reintentarlo.",
    )
      .then((datos) => {
        if (cancelado) return;
        setVeredas(datos);
        setVeredaId((actual) =>
          datos.some((item) => item.id === actual) ? actual : (datos[0]?.id ?? ""),
        );
      })
      .catch((error: unknown) => {
        if (!cancelado) {
          setErrorVeredas(
            error instanceof Error ? error.message : "No pudimos cargar el catálogo de veredas.",
          );
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoVeredas(false);
      });

    return () => {
      cancelado = true;
    };
  }, [reintentoVeredas]);

  useEffect(() => {
    if (selectorVeredaAbierto) {
      requestAnimationFrame(() => busquedaVeredaRef.current?.focus());
    }
  }, [selectorVeredaAbierto]);

  useEffect(() => {
    if (!mostrarFiltros) return;

    const frame = requestAnimationFrame(() => filtroCategoriaRef.current?.focus());
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setMostrarFiltros(false);
      requestAnimationFrame(() => botonFiltrosRef.current?.focus());
    };
    document.addEventListener("keydown", cerrarConEscape);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [mostrarFiltros]);

  useEffect(() => {
    if (!veredaId) {
      setRegistros([]);
      setCargandoRegistros(false);
      setErrorRegistros(null);
      return;
    }

    let cancelado = false;
    setCargandoRegistros(true);
    setErrorRegistros(null);

    const cargarRegistros = async () => {
      try {
        const categoriaConsulta =
          filtrosActuales.categoria === "todas" ? null : filtrosActuales.categoria;
        const datos =
          vista === "activas"
            ? await consultarCartelera({
                p_vereda_id: veredaId,
                p_busqueda: consulta || null,
                p_categoria: categoriaConsulta,
                p_limit: 100,
                p_offset: 0,
                p_excluir_nivel_normal: false,
              })
            : await consultarHistorial({
                p_vereda_id: veredaId,
                p_busqueda: consulta || null,
                p_resultado: filtrosHistorial.estado === "todos" ? null : filtrosHistorial.estado,
                p_categoria: categoriaConsulta,
                p_desde: null,
                p_hasta: null,
                p_limit: 100,
                p_offset: 0,
              });

        if (cancelado) return;
        const ahora = Date.now();
        const resultadosPublicos =
          vista === "historial"
            ? datos.filter((publicacion) => esResultadoHistorialPublico(publicacion.resultado))
            : datos.filter((publicacion) => esResultadoNovedadPublico(publicacion.resultado));
        const mapeados = resultadosPublicos
          .map(mapearPublicacion)
          .filter((registro): registro is RegistroMiVereda => registro !== null)
          .filter((registro) =>
            registroDentroDelPeriodo(
              registro,
              filtrosActuales.periodo,
              ahora,
              vista === "historial",
            ),
          );
        const filtradosPorEstado =
          vista === "historial" && filtrosHistorial.estado !== "todos"
            ? mapeados.filter((registro) => registro.estado === filtrosHistorial.estado)
            : mapeados;
        setRegistros(
          vista === "activas"
            ? ordenarRegistrosPorFecha(filtradosPorEstado, filtrosNovedades.orden, "creacion")
            : ordenarRegistrosPorFecha(filtradosPorEstado, "recientes", "cierre"),
        );
      } catch (error: unknown) {
        if (!cancelado) {
          setRegistros([]);
          setErrorRegistros(
            error instanceof Error ? error.message : "No pudimos cargar los registros.",
          );
        }
      } finally {
        if (!cancelado) setCargandoRegistros(false);
      }
    };

    void cargarRegistros();
    return () => {
      cancelado = true;
    };
  }, [
    consulta,
    filtrosActuales,
    filtrosHistorial.estado,
    filtrosNovedades.orden,
    reintentoConsulta,
    veredaId,
    vista,
  ]);

  const objetivos = useMemo<GuiaObjetivos>(
    () => ({
      "selector-vereda": selectorVeredaRef,
      "panel-consulta": panelConsultaRef,
      "tab-activas": tabActivasRef,
      "tab-historial": tabHistorialRef,
      "boton-filtros": botonFiltrosRef,
      "filtro-solucionado": filtroSolucionadoRef,
      "filtro-no-solucionado": filtroNoSolucionadoRef,
    }),
    [],
  );

  const objetivoEstados = useMemo<GuiaObjetivoEstados>(
    () => ({
      "selector-vereda": veredaId,
      "tab-activas": `${vista}:${activacionesVista.activas}`,
      "tab-historial": `${vista}:${activacionesVista.historial}`,
      "boton-filtros": mostrarFiltros,
      "filtro-solucionado": filtrosHistorial.estado,
      "filtro-no-solucionado": filtrosHistorial.estado,
    }),
    [activacionesVista, filtrosHistorial.estado, mostrarFiltros, veredaId, vista],
  );

  const abrirGuia = (inicio: GuiaHabladaPaso["id"]) => {
    setInicioGuia(inicio);
    setForzarGuia((valorActual) => valorActual + 1);
  };

  const cambiarVista = (nuevaVista: Vista) => {
    setVista(nuevaVista);
    setMostrarFiltros(false);
    setActivacionesVista((actuales) => ({
      ...actuales,
      [nuevaVista]: actuales[nuevaVista] + 1,
    }));
  };

  const limpiarFiltros = () => {
    if (vista === "activas") {
      setFiltrosNovedades({
        categoria: "todas",
        periodo: "todo",
        orden: "recientes",
        busqueda: "",
      });
      return;
    }

    setFiltrosHistorial({
      categoria: "todas",
      periodo: "todo",
      estado: "todos",
      busqueda: "",
    });
  };

  const abrirSelectorVereda = () => {
    setBusquedaVereda("");
    setMostrarFiltros(false);
    setSelectorVeredaAbierto(true);
  };

  const seleccionarVereda = (id: string) => {
    setVeredaId(id);
    setSelectorVeredaAbierto(false);
    setBusquedaVereda("");
    requestAnimationFrame(() => botonCambiarVeredaRef.current?.focus());
  };

  const volverDelSelector = () => {
    setSelectorVeredaAbierto(false);
    setBusquedaVereda("");
    requestAnimationFrame(() => botonCambiarVeredaRef.current?.focus());
  };

  const manejarTeclaPestanas = (
    event: ReactKeyboardEvent<HTMLButtonElement>,
    pestanaActual: Vista,
  ) => {
    let siguiente: Vista | null = null;
    if (event.key === "ArrowRight")
      siguiente = pestanaActual === "activas" ? "historial" : "activas";
    if (event.key === "ArrowLeft")
      siguiente = pestanaActual === "activas" ? "historial" : "activas";
    if (event.key === "Home") siguiente = "activas";
    if (event.key === "End") siguiente = "historial";
    if (!siguiente) return;

    event.preventDefault();
    cambiarVista(siguiente);
    requestAnimationFrame(() => {
      (siguiente === "activas" ? tabActivasRef : tabHistorialRef).current?.focus();
    });
  };

  return (
    <AppShell>
      <div className="mi-vereda-guided-stage">
        <div className="mi-vereda-guide-wrap">
          <GuiaHablada
            key={`${inicioGuia}-${forzarGuia}`}
            pasos={GUIA_PASOS}
            objetivos={objetivos}
            objetivoEstados={objetivoEstados}
            inicioPasoId={inicioGuia}
            forzarApertura={forzarGuia}
            onOmitir={() => undefined}
          />
        </div>

        <section className="mi-vereda-hero" aria-labelledby="mi-vereda-titulo">
          <div className="mi-vereda-hero-copy">
            <p className="eyebrow">Consulta comunitaria</p>
            <h1 id="mi-vereda-titulo">Mi Vereda</h1>
            <p>
              Elige una vereda y descubre qué está pasando hoy y qué ha ocurrido antes. Puedes
              consultar cualquier vereda de Ebéjico.
            </p>
          </div>
          <div className="mi-vereda-hero-mark" aria-hidden="true">
            <MapPin size={28} />
            <span>Sin GPS</span>
          </div>
        </section>

        {selectorVeredaAbierto ? (
          <section
            id="mi-vereda-selector-view"
            className="mi-vereda-selector-view"
            aria-labelledby="selector-vereda-titulo"
          >
            <div className="mi-vereda-selector-view-heading">
              <div>
                <p className="eyebrow">Cambiar vereda</p>
                <h2 id="selector-vereda-titulo">Selecciona una vereda</h2>
                <p>Busca en el catálogo y elige la comunidad que quieres consultar.</p>
              </div>
              <button type="button" className="mi-vereda-back-button" onClick={volverDelSelector}>
                <ChevronLeft size={17} aria-hidden="true" />
                <span>Volver</span>
              </button>
            </div>

            <div className="mi-vereda-vereda-search">
              <Search size={18} aria-hidden="true" />
              <label className="sr-only" htmlFor="mi-vereda-selector-search">
                Buscar vereda por nombre
              </label>
              <input
                ref={busquedaVeredaRef}
                id="mi-vereda-selector-search"
                type="search"
                value={busquedaVereda}
                onChange={(event) => setBusquedaVereda(event.target.value)}
                placeholder="Buscar una vereda…"
              />
            </div>

            {cargandoVeredas ? (
              <div className="mi-vereda-selector-feedback" role="status">
                Cargando el catálogo de veredas…
              </div>
            ) : errorVeredas ? (
              <div className="mi-vereda-selector-feedback" role="alert">
                <h3>No pudimos cargar el catálogo</h3>
                <p>{errorVeredas}</p>
                <button type="button" onClick={() => setReintentoVeredas((intento) => intento + 1)}>
                  Reintentar
                </button>
              </div>
            ) : veredas.length === 0 ? (
              <div className="mi-vereda-selector-feedback" role="status">
                <h3>No hay veredas disponibles</h3>
                <p>El catálogo no devolvió veredas para consultar.</p>
                <button type="button" onClick={() => setReintentoVeredas((intento) => intento + 1)}>
                  Volver a consultar
                </button>
              </div>
            ) : veredasFiltradas.length > 0 ? (
              <ul
                ref={(elemento) => {
                  selectorVeredaRef.current = elemento;
                }}
                className="mi-vereda-vereda-grid"
                aria-label="Veredas disponibles"
              >
                {veredasFiltradas.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={
                        item.id === veredaId
                          ? "mi-vereda-vereda-option is-selected"
                          : "mi-vereda-vereda-option"
                      }
                      aria-pressed={item.id === veredaId}
                      onClick={() => seleccionarVereda(item.id)}
                    >
                      <span className="mi-vereda-vereda-option-icon" aria-hidden="true">
                        <MapPin size={20} />
                      </span>
                      <span className="mi-vereda-vereda-option-copy">
                        <span className="mi-vereda-vereda-option-name">{item.nombre}</span>
                        <span className="mi-vereda-vereda-option-state">
                          {item.activa ? "Activa" : "Inactiva"}
                          {item.id === veredaId ? " · Seleccionada" : ""}
                        </span>
                      </span>
                      <ChevronRight size={18} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mi-vereda-selector-feedback" role="status">
                <h3>No encontramos esa vereda</h3>
                <p>Prueba con otro nombre o borra la búsqueda para ver el catálogo completo.</p>
              </div>
            )}

            <p className="mi-vereda-note mi-vereda-selector-note">
              <MapPin size={15} aria-hidden="true" /> La selección es manual. No usamos la ubicación
              de tu celular.
            </p>
          </section>
        ) : (
          <section className="mi-vereda-selector" aria-labelledby="selector-vereda-titulo">
            <div className="mi-vereda-selector-current">
              <div>
                <p className="eyebrow">Vereda seleccionada</p>
                <h2 id="selector-vereda-titulo">
                  {vereda?.nombre ??
                    (cargandoVeredas ? "Cargando veredas…" : "Selecciona una vereda")}
                </h2>
              </div>
              {vereda && !vereda.activa && (
                <span className="mi-vereda-inactive-badge">Vereda inactiva</span>
              )}
            </div>
            <button
              ref={(elemento) => {
                selectorVeredaRef.current = elemento;
                botonCambiarVeredaRef.current = elemento;
              }}
              type="button"
              className="mi-vereda-change-button"
              onClick={abrirSelectorVereda}
            >
              <MapPin size={17} aria-hidden="true" />
              <span>Cambiar vereda</span>
              <ChevronRight size={17} aria-hidden="true" />
            </button>
            <p className="mi-vereda-note">
              <CircleHelp size={15} aria-hidden="true" /> Puedes consultar el catálogo completo de
              veredas de Ebéjico.
            </p>
            {!vereda && !cargandoVeredas && (
              <div className="mi-vereda-selector-feedback" role={errorVeredas ? "alert" : "status"}>
                <h3>
                  {errorVeredas ? "No pudimos cargar las veredas" : "No hay veredas disponibles"}
                </h3>
                <p>
                  {errorVeredas ?? "El catálogo no devolvió veredas. Puedes volver a consultarlo."}
                </p>
                <button type="button" onClick={() => setReintentoVeredas((intento) => intento + 1)}>
                  Reintentar
                </button>
              </div>
            )}
          </section>
        )}

        {!selectorVeredaAbierto && (
          <section
            ref={panelConsultaRef}
            className="mi-vereda-board"
            aria-labelledby="vereda-seleccionada-titulo"
          >
            <div className="mi-vereda-board-heading">
              <div>
                <p className="eyebrow">Estás consultando</p>
                <h2 id="vereda-seleccionada-titulo">{vereda?.nombre ?? "Selecciona una vereda"}</h2>
              </div>
              {vereda && !vereda.activa && (
                <span className="mi-vereda-inactive-badge">Vereda inactiva</span>
              )}
            </div>
            <p className="mi-vereda-board-description">
              {!vereda
                ? cargandoVeredas
                  ? "Cargando las veredas disponibles."
                  : errorVeredas
                    ? "No pudimos cargar las veredas. Puedes reintentar la consulta."
                    : "No hay veredas disponibles para consultar."
                : vereda.activa
                  ? "Consulta la información vigente y los antecedentes de esta comunidad."
                  : "El historial permanece disponible aunque esta vereda no esté activa en la cartelera."}
            </p>

            <div
              className="mi-vereda-tabs"
              role="tablist"
              aria-label="Contenido de la vereda"
              aria-orientation="horizontal"
            >
              <button
                id="tab-activas"
                ref={tabActivasRef}
                type="button"
                role="tab"
                aria-selected={vista === "activas"}
                aria-controls="mi-vereda-results"
                tabIndex={vista === "activas" ? 0 : -1}
                disabled={!vereda}
                className={vista === "activas" ? "mi-vereda-tab is-active" : "mi-vereda-tab"}
                onClick={() => cambiarVista("activas")}
                onKeyDown={(event) => manejarTeclaPestanas(event, "activas")}
              >
                <Sparkles size={17} aria-hidden="true" />
                Novedades activas
              </button>
              <button
                id="tab-historial"
                ref={tabHistorialRef}
                type="button"
                role="tab"
                aria-selected={vista === "historial"}
                aria-controls="mi-vereda-results"
                tabIndex={vista === "historial" ? 0 : -1}
                disabled={!vereda}
                className={vista === "historial" ? "mi-vereda-tab is-active" : "mi-vereda-tab"}
                onClick={() => cambiarVista("historial")}
                onKeyDown={(event) => manejarTeclaPestanas(event, "historial")}
              >
                <History size={17} aria-hidden="true" />
                Historial
              </button>
            </div>

            <div
              id="mi-vereda-results"
              className="mi-vereda-results-panel"
              role="tabpanel"
              aria-labelledby={vista === "activas" ? "tab-activas" : "tab-historial"}
              tabIndex={0}
            >
              <div className="mi-vereda-toolbar">
                <div className="mi-vereda-search-wrap">
                  <Search size={18} aria-hidden="true" />
                  <label className="sr-only" htmlFor="mi-vereda-search">
                    Buscar en la vereda
                  </label>
                  <input
                    id="mi-vereda-search"
                    type="search"
                    value={filtrosActuales.busqueda}
                    disabled={!vereda}
                    onChange={(event) => {
                      if (vista === "activas") {
                        setFiltrosNovedades((actuales) => ({
                          ...actuales,
                          busqueda: event.target.value,
                        }));
                      } else {
                        setFiltrosHistorial((actuales) => ({
                          ...actuales,
                          busqueda: event.target.value,
                        }));
                      }
                    }}
                    placeholder="Buscar una palabra…"
                  />
                </div>
                <div
                  className={
                    mostrarFiltros ? "mi-vereda-filter-anchor is-open" : "mi-vereda-filter-anchor"
                  }
                >
                  <button
                    ref={botonFiltrosRef}
                    type="button"
                    className={
                      mostrarFiltros ? "mi-vereda-filter-button is-open" : "mi-vereda-filter-button"
                    }
                    aria-expanded={mostrarFiltros}
                    aria-controls="mi-vereda-filters"
                    disabled={!vereda}
                    onClick={() => {
                      if (mostrarFiltros) {
                        setMostrarFiltros(false);
                        requestAnimationFrame(() => botonFiltrosRef.current?.focus());
                      } else {
                        setMostrarFiltros(true);
                      }
                    }}
                  >
                    <Filter size={17} aria-hidden="true" />
                    <span>Filtros</span>
                  </button>

                  {mostrarFiltros && (
                    <section
                      id="mi-vereda-filters"
                      className="mi-vereda-filters"
                      aria-labelledby="mi-vereda-filters-title"
                    >
                      <div className="mi-vereda-filter-panel-heading">
                        <div>
                          {vista === "activas" ? (
                            <Sparkles size={18} aria-hidden="true" />
                          ) : (
                            <History size={18} aria-hidden="true" />
                          )}
                          <h3 id="mi-vereda-filters-title">
                            Filtros · {vista === "activas" ? "Novedades activas" : "Historial"}
                          </h3>
                        </div>
                        <button
                          type="button"
                          className="mi-vereda-filter-close"
                          aria-label="Cerrar filtros"
                          onClick={() => {
                            setMostrarFiltros(false);
                            requestAnimationFrame(() => botonFiltrosRef.current?.focus());
                          }}
                        >
                          <X size={16} aria-hidden="true" />
                        </button>
                      </div>

                      <div className="mi-vereda-filter-options">
                        <div className="mi-vereda-filter-row">
                          <LayoutGrid size={18} aria-hidden="true" />
                          <label htmlFor="categoria-filter">Categoría</label>
                          <select
                            ref={filtroCategoriaRef}
                            id="categoria-filter"
                            value={filtrosActuales.categoria}
                            onChange={(event) => {
                              const valor = event.target.value as CategoriaFiltro;
                              if (vista === "activas") {
                                setFiltrosNovedades((actuales) => ({
                                  ...actuales,
                                  categoria: valor,
                                }));
                              } else {
                                setFiltrosHistorial((actuales) => ({
                                  ...actuales,
                                  categoria: valor,
                                }));
                              }
                            }}
                          >
                            <option value="todas">Todas las categorías</option>
                            {Object.entries(ETIQUETAS_CATEGORIA).map(([clave, etiqueta]) => (
                              <option key={clave} value={clave}>
                                {etiqueta}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mi-vereda-filter-row">
                          <CalendarDays size={18} aria-hidden="true" />
                          <label htmlFor="periodo-filter">Período</label>
                          <select
                            id="periodo-filter"
                            value={filtrosActuales.periodo}
                            onChange={(event) => {
                              const valor = event.target.value as Periodo;
                              if (vista === "activas") {
                                setFiltrosNovedades((actuales) => ({
                                  ...actuales,
                                  periodo: valor,
                                }));
                              } else {
                                setFiltrosHistorial((actuales) => ({
                                  ...actuales,
                                  periodo: valor,
                                }));
                              }
                            }}
                          >
                            <option value="todo">Todo</option>
                            <option value="15">Últimos 15 días</option>
                            <option value="30">Últimos 30 días</option>
                            <option value="60">Últimos 60 días</option>
                            <option value="90">Últimos 90 días</option>
                          </select>
                        </div>

                        {vista === "historial" ? (
                          <div className="mi-vereda-filter-row">
                            <CircleCheck size={18} aria-hidden="true" />
                            <label htmlFor="estado-filter">Estado</label>
                            <select
                              ref={(elemento) => {
                                filtroSolucionadoRef.current = elemento;
                                filtroNoSolucionadoRef.current = elemento;
                              }}
                              id="estado-filter"
                              value={filtrosHistorial.estado}
                              onChange={(event) =>
                                setFiltrosHistorial((actuales) => ({
                                  ...actuales,
                                  estado: event.target.value as FiltroHistorial,
                                }))
                              }
                            >
                              <option value="todos">Todos</option>
                              <option value="solucionado">Solucionados</option>
                              <option value="no_solucionado">No solucionados</option>
                            </select>
                          </div>
                        ) : (
                          <div className="mi-vereda-filter-row">
                            <ArrowUpDown size={18} aria-hidden="true" />
                            <label htmlFor="orden-novedades-filter">Ordenar por</label>
                            <select
                              id="orden-novedades-filter"
                              value={filtrosNovedades.orden}
                              onChange={(event) =>
                                setFiltrosNovedades((actuales) => ({
                                  ...actuales,
                                  orden: event.target.value as OrdenNovedades,
                                }))
                              }
                            >
                              <option value="recientes">Más recientes</option>
                              <option value="antiguos">Más antiguos</option>
                            </select>
                          </div>
                        )}
                      </div>

                      <button type="button" className="mi-vereda-clear" onClick={limpiarFiltros}>
                        <RotateCcw size={16} aria-hidden="true" />
                        Limpiar filtros
                      </button>
                    </section>
                  )}
                </div>
              </div>

              <div className="mi-vereda-results-heading">
                <div>
                  <p className="eyebrow">{vista === "activas" ? "Ahora" : "Memoria comunitaria"}</p>
                  <h3>
                    {registros.length} {registros.length === 1 ? "resultado" : "resultados"}
                  </h3>
                  <p className="mi-vereda-results-limit">
                    Hasta 100 resultados por consulta; puede haber otros no cargados.
                  </p>
                </div>
                <button
                  type="button"
                  className="mi-vereda-help-link"
                  onClick={() => abrirGuia(vista === "activas" ? "novedades-activas" : "historial")}
                >
                  <Volume2 size={16} aria-hidden="true" /> Escuchar cómo funciona
                </button>
              </div>

              {!vereda ? (
                <div
                  className="mi-vereda-empty"
                  role={errorVeredas ? "alert" : "status"}
                  aria-live="polite"
                >
                  <h4>
                    {cargandoVeredas
                      ? "Cargando el catálogo de veredas…"
                      : errorVeredas
                        ? "No pudimos cargar las veredas"
                        : "No hay veredas disponibles"}
                  </h4>
                  <p>
                    {errorVeredas ??
                      (cargandoVeredas
                        ? "Estamos consultando el catálogo comunitario."
                        : "Puedes volver a consultar el catálogo desde aquí.")}
                  </p>
                  {!cargandoVeredas && (
                    <button
                      type="button"
                      onClick={() => setReintentoVeredas((intento) => intento + 1)}
                    >
                      Reintentar
                    </button>
                  )}
                </div>
              ) : cargandoRegistros ? (
                <div className="mi-vereda-empty" role="status" aria-live="polite">
                  <h4>Cargando la información de la vereda…</h4>
                  <p>Estamos consultando la cartelera comunitaria.</p>
                </div>
              ) : errorRegistros ? (
                <div className="mi-vereda-empty" role="alert">
                  <h4>No pudimos cargar esta consulta</h4>
                  <p>Revisa la conexión e inténtalo nuevamente. {errorRegistros}</p>
                  <button
                    type="button"
                    onClick={() => setReintentoConsulta((intento) => intento + 1)}
                  >
                    Reintentar consulta
                  </button>
                </div>
              ) : registros.length > 0 ? (
                <div className="mi-vereda-list" aria-live="polite">
                  {registros.map((registro) => (
                    <article
                      className={`mi-vereda-card mi-vereda-card-${registro.categoria}`}
                      key={registro.id}
                    >
                      <div className="mi-vereda-card-topline">
                        <span className="mi-vereda-category">
                          <span aria-hidden="true" className="mi-vereda-category-icon">
                            {CATEGORIA_ICONOS[registro.categoria]}
                          </span>
                          {ETIQUETAS_CATEGORIA[registro.categoria]}
                        </span>
                        <span className={`mi-vereda-status mi-vereda-status-${registro.estado}`}>
                          {registro.estado === "solucionado" && (
                            <CircleCheck size={14} aria-hidden="true" />
                          )}
                          {registro.estado === "no_solucionado" && (
                            <CircleX size={14} aria-hidden="true" />
                          )}
                          {registro.estado === "activo" && (
                            <Sparkles size={14} aria-hidden="true" />
                          )}
                          {etiquetaEstado(registro.estado)}
                        </span>
                      </div>
                      <h4>{registro.titulo}</h4>
                      <p>{registro.descripcion}</p>
                      <div className="mi-vereda-card-meta">
                        {registro.lugar && (
                          <span>
                            <MapPin size={14} aria-hidden="true" /> {registro.lugar}
                          </span>
                        )}
                        <span>
                          <CalendarDays size={14} aria-hidden="true" /> Reportado:{" "}
                          {fechaVisible(registro.fechaCreacion)}
                        </span>
                        {registro.cerradoEn && (
                          <span>
                            <History size={14} aria-hidden="true" /> Cerrado:{" "}
                            {fechaVisible(registro.cerradoEn)}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mi-vereda-empty" role="status">
                  <div className="mi-vereda-empty-icon" aria-hidden="true">
                    <Search size={22} />
                  </div>
                  <h4>No encontramos resultados con esos filtros</h4>
                  <p>
                    Prueba otra palabra, cambia la categoría o revisa todo el historial de{" "}
                    {vereda?.nombre ?? "la vereda"}.
                  </p>
                  <button type="button" onClick={limpiarFiltros}>
                    Ver todo
                  </button>
                </div>
              )}
            </div>
          </section>
        )}

        <aside className="mi-vereda-demo-note" aria-label="Estado de la conexión">
          <strong>Datos reales</strong>
          <span>Esta pantalla usa datos reales de Mi Vereda en el proyecto real.</span>
        </aside>
      </div>
    </AppShell>
  );
}
