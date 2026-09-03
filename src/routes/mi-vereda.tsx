import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState, type ReactNode } from "react";
import {
  CalendarDays,
  ChevronDown,
  CircleCheck,
  CircleHelp,
  CircleX,
  Filter,
  History,
  MapPin,
  Search,
  Sparkles,
  Volume2,
} from "lucide-react";
import {
  GuiaHablada,
  type GuiaHabladaPaso,
  type GuiaObjetivoEstados,
  type GuiaObjetivos,
} from "@/components/guia-hablada";
import {
  ETIQUETAS_CATEGORIA,
  REGISTROS_DEMO,
  VEREDAS_DEMO,
  type CategoriaMiVereda,
  type EstadoMiVereda,
} from "@/lib/mi-vereda-demo";

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
type Periodo = "todo" | "30" | "90";

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

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .trim();
}

function fechaVisible(valor: string) {
  return new Date(valor).toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fechaOrden(registro: (typeof REGISTROS_DEMO)[number]) {
  return new Date(registro.cerradoEn ?? registro.fechaCreacion).getTime();
}

function etiquetaEstado(estado: EstadoMiVereda) {
  if (estado === "activo") return "Activa";
  if (estado === "solucionado") return "Solucionado";
  return "No solucionado";
}

function MiVereda() {
  const [veredaId, setVeredaId] = useState("aguada");
  const [vista, setVista] = useState<Vista>("activas");
  const [categoria, setCategoria] = useState<"todas" | CategoriaMiVereda>("todas");
  const [estadoHistorial, setEstadoHistorial] = useState<FiltroHistorial>("todos");
  const [periodo, setPeriodo] = useState<Periodo>("todo");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [forzarGuia, setForzarGuia] = useState(0);
  const [inicioGuia, setInicioGuia] = useState<GuiaHabladaPaso["id"]>("bienvenida");
  const [activacionesVista, setActivacionesVista] = useState({ activas: 0, historial: 0 });
  const selectorVeredaRef = useRef<HTMLSelectElement>(null);
  const panelConsultaRef = useRef<HTMLElement>(null);
  const tabActivasRef = useRef<HTMLButtonElement>(null);
  const tabHistorialRef = useRef<HTMLButtonElement>(null);
  const botonFiltrosRef = useRef<HTMLButtonElement>(null);
  const filtroSolucionadoRef = useRef<HTMLSelectElement>(null);
  const filtroNoSolucionadoRef = useRef<HTMLSelectElement>(null);

  const vereda = VEREDAS_DEMO.find((item) => item.id === veredaId) ?? VEREDAS_DEMO[0]!;
  const consulta = normalizar(busqueda);

  const registros = useMemo(() => {
    const ahora = new Date("2026-08-25T12:00:00-05:00").getTime();
    const diasPermitidos = periodo === "30" ? 30 : periodo === "90" ? 90 : null;

    return REGISTROS_DEMO.filter((registro) => {
      if (registro.veredaId !== veredaId) return false;
      if (vista === "activas" && registro.estado !== "activo") return false;
      if (vista === "historial" && registro.estado === "activo") return false;
      if (categoria !== "todas" && registro.categoria !== categoria) return false;
      if (
        vista === "historial" &&
        estadoHistorial !== "todos" &&
        registro.estado !== estadoHistorial
      )
        return false;
      if (diasPermitidos !== null && ahora - fechaOrden(registro) > diasPermitidos * 86400000)
        return false;
      if (
        consulta &&
        !normalizar(`${registro.titulo} ${registro.descripcion} ${registro.lugar ?? ""}`).includes(
          consulta,
        )
      )
        return false;
      return true;
    }).sort((a, b) => fechaOrden(b) - fechaOrden(a));
  }, [categoria, consulta, estadoHistorial, periodo, veredaId, vista]);

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
      "filtro-solucionado": estadoHistorial,
      "filtro-no-solucionado": estadoHistorial,
    }),
    [activacionesVista, estadoHistorial, mostrarFiltros, veredaId, vista],
  );

  const abrirGuia = (inicio: GuiaHabladaPaso["id"]) => {
    setInicioGuia(inicio);
    setForzarGuia((valorActual) => valorActual + 1);
  };

  const cambiarVista = (nuevaVista: Vista) => {
    setVista(nuevaVista);
    setActivacionesVista((actuales) => ({
      ...actuales,
      [nuevaVista]: actuales[nuevaVista] + 1,
    }));
    if (nuevaVista === "activas") setEstadoHistorial("todos");
  };

  const limpiarFiltros = () => {
    setCategoria("todas");
    setEstadoHistorial("todos");
    setPeriodo("todo");
    setBusqueda("");
  };

  return (
    <MiVeredaShell>
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

        <section className="mi-vereda-selector" aria-labelledby="selector-vereda-titulo">
          <div className="mi-vereda-section-heading">
            <div>
              <p className="eyebrow">Paso 1</p>
              <h2 id="selector-vereda-titulo">¿Qué vereda quieres consultar?</h2>
            </div>
            <CircleHelp size={22} aria-hidden="true" />
          </div>
          <label className="mi-vereda-label" htmlFor="vereda-select">
            Selecciona una vereda
          </label>
          <div className="mi-vereda-select-wrap">
            <select
              ref={selectorVeredaRef}
              id="vereda-select"
              value={veredaId}
              onChange={(event) => setVeredaId(event.target.value)}
              className="mi-vereda-select"
            >
              {VEREDAS_DEMO.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nombre}
                  {item.activa ? "" : " · inactiva"}
                </option>
              ))}
            </select>
            <ChevronDown size={18} aria-hidden="true" />
          </div>
          <p className="mi-vereda-note">
            <MapPin size={15} aria-hidden="true" /> La selección es manual. No usamos la ubicación
            de tu celular.
          </p>
        </section>

        <section
          ref={panelConsultaRef}
          className="mi-vereda-board"
          aria-labelledby="vereda-seleccionada-titulo"
        >
          <div className="mi-vereda-board-heading">
            <div>
              <p className="eyebrow">Estás consultando</p>
              <h2 id="vereda-seleccionada-titulo">{vereda.nombre}</h2>
            </div>
            {!vereda.activa && <span className="mi-vereda-inactive-badge">Vereda inactiva</span>}
          </div>
          <p className="mi-vereda-board-description">
            {vereda.activa
              ? "Consulta la información vigente y los antecedentes de esta comunidad."
              : "El historial permanece disponible aunque esta vereda no esté activa en la cartelera."}
          </p>

          <div className="mi-vereda-tabs" role="tablist" aria-label="Contenido de la vereda">
            <button
              ref={tabActivasRef}
              type="button"
              role="tab"
              aria-selected={vista === "activas"}
              aria-controls="mi-vereda-results"
              className={vista === "activas" ? "mi-vereda-tab is-active" : "mi-vereda-tab"}
              onClick={() => cambiarVista("activas")}
            >
              <Sparkles size={17} aria-hidden="true" />
              Novedades activas
            </button>
            <button
              ref={tabHistorialRef}
              type="button"
              role="tab"
              aria-selected={vista === "historial"}
              aria-controls="mi-vereda-results"
              className={vista === "historial" ? "mi-vereda-tab is-active" : "mi-vereda-tab"}
              onClick={() => cambiarVista("historial")}
            >
              <History size={17} aria-hidden="true" />
              Historial
            </button>
          </div>

          <div className="mi-vereda-toolbar">
            <div className="mi-vereda-search-wrap">
              <Search size={18} aria-hidden="true" />
              <label className="sr-only" htmlFor="mi-vereda-search">
                Buscar en la vereda
              </label>
              <input
                id="mi-vereda-search"
                type="search"
                value={busqueda}
                onChange={(event) => setBusqueda(event.target.value)}
                placeholder="Buscar una palabra…"
              />
            </div>
            <button
              ref={botonFiltrosRef}
              type="button"
              className={
                mostrarFiltros ? "mi-vereda-filter-button is-open" : "mi-vereda-filter-button"
              }
              aria-expanded={mostrarFiltros}
              aria-controls="mi-vereda-filters"
              onClick={() => setMostrarFiltros((abierto) => !abierto)}
            >
              <Filter size={17} aria-hidden="true" />
              <span>Filtros</span>
            </button>
          </div>

          {mostrarFiltros && (
            <div
              id="mi-vereda-filters"
              className="mi-vereda-filters"
              aria-label="Filtros de consulta"
            >
              <div className="mi-vereda-filter-field">
                <label htmlFor="categoria-filter">Categoría</label>
                <select
                  id="categoria-filter"
                  value={categoria}
                  onChange={(event) =>
                    setCategoria(event.target.value as "todas" | CategoriaMiVereda)
                  }
                >
                  <option value="todas">Todas las categorías</option>
                  {Object.entries(ETIQUETAS_CATEGORIA).map(([clave, etiqueta]) => (
                    <option key={clave} value={clave}>
                      {etiqueta}
                    </option>
                  ))}
                </select>
              </div>
              {vista === "historial" && (
                <div className="mi-vereda-filter-field">
                  <label htmlFor="estado-filter">Estado del historial</label>
                  <select
                    ref={(elemento) => {
                      filtroSolucionadoRef.current = elemento;
                      filtroNoSolucionadoRef.current = elemento;
                    }}
                    id="estado-filter"
                    value={estadoHistorial}
                    onChange={(event) => setEstadoHistorial(event.target.value as FiltroHistorial)}
                  >
                    <option value="todos">Solucionados y no solucionados</option>
                    <option value="solucionado">Solucionados</option>
                    <option value="no_solucionado">No solucionados</option>
                  </select>
                </div>
              )}
              <div className="mi-vereda-filter-field">
                <label htmlFor="periodo-filter">Periodo</label>
                <select
                  id="periodo-filter"
                  value={periodo}
                  onChange={(event) => setPeriodo(event.target.value as Periodo)}
                >
                  <option value="todo">Todo el historial</option>
                  <option value="30">Últimos 30 días</option>
                  <option value="90">Últimos 90 días</option>
                </select>
              </div>
              <button type="button" className="mi-vereda-clear" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            </div>
          )}

          <div id="mi-vereda-results" className="mi-vereda-results-heading">
            <div>
              <p className="eyebrow">{vista === "activas" ? "Ahora" : "Memoria comunitaria"}</p>
              <h3>
                {registros.length} {registros.length === 1 ? "resultado" : "resultados"}
              </h3>
            </div>
            <button
              type="button"
              className="mi-vereda-help-link"
              onClick={() => abrirGuia(vista === "activas" ? "novedades-activas" : "historial")}
            >
              <Volume2 size={16} aria-hidden="true" /> Escuchar cómo funciona
            </button>
          </div>

          {registros.length > 0 ? (
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
                      {registro.estado === "activo" && <Sparkles size={14} aria-hidden="true" />}
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
                      <CalendarDays size={14} aria-hidden="true" /> Creado:{" "}
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
                {vereda.nombre}.
              </p>
              <button type="button" onClick={limpiarFiltros}>
                Ver todo
              </button>
            </div>
          )}
        </section>

        <aside className="mi-vereda-demo-note" aria-label="Estado de demostración">
          <strong>Vista de demostración</strong>
          <span>
            Esta pantalla usa datos simulados mientras se prepara la conexión segura con el
            historial real.
          </span>
        </aside>
      </div>
    </MiVeredaShell>
  );
}

function MiVeredaShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen pb-24">
      <header className="bg-[color:var(--bosque)] text-[color:var(--card)]">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/mi-vereda"
            className="font-[family-name:var(--font-display)] text-xl font-bold"
          >
            AlertaVereda
          </Link>
          <Link to="/" className="text-sm underline underline-offset-4">
            Volver al inicio
          </Link>
        </div>
        <nav
          className="mx-auto max-w-3xl overflow-x-auto px-2 pb-2"
          aria-label="Navegación de demostración"
        >
          <ul className="flex gap-1 text-sm">
            <li>
              <Link
                to="/mi-vereda"
                className="block whitespace-nowrap rounded-md bg-[color:var(--kraft)] px-3 py-1.5 font-semibold text-[color:var(--bosque-oscuro)]"
              >
                Mi Vereda
              </Link>
            </li>
            <li>
              <Link
                to="/emergencias"
                className="block whitespace-nowrap rounded-md px-3 py-1.5 text-[color:var(--card)]/85"
              >
                Emergencias
              </Link>
            </li>
            <li>
              <Link
                to="/vias"
                className="block whitespace-nowrap rounded-md px-3 py-1.5 text-[color:var(--card)]/85"
              >
                Vías
              </Link>
            </li>
            <li>
              <Link
                to="/servicios"
                className="block whitespace-nowrap rounded-md px-3 py-1.5 text-[color:var(--card)]/85"
              >
                Servicios
              </Link>
            </li>
            <li>
              <Link
                to="/avisos"
                className="block whitespace-nowrap rounded-md px-3 py-1.5 text-[color:var(--card)]/85"
              >
                Avisos
              </Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-5">{children}</main>
      <p className="mx-auto max-w-3xl px-4 pb-6 text-center text-xs text-[color:var(--tinta-suave)]">
        Vista de demostración — complementa, no reemplaza, a las autoridades.
      </p>
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[color:var(--bosque-oscuro)] bg-[color:var(--urgente)] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <a
          href="tel:123"
          className="mx-auto flex max-w-md items-center justify-center gap-2 rounded-md px-4 py-3 text-base font-semibold tracking-wide text-[color:var(--card)]"
        >
          <span aria-hidden="true">☎</span>
          Llamar a emergencias · 123
        </a>
      </div>
    </div>
  );
}
