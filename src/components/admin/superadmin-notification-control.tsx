import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import {
  BellRing,
  Check,
  CheckCheck,
  MoreHorizontal,
  ServerCog,
  TriangleAlert,
  Trash2,
  UserRoundPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  cargarProveedorNotificacionesAdmin,
  notificacionesDemoHabilitadas,
} from "@/lib/admin-notifications/provider";
import type { EscenarioNotificacionDemo, NotificacionAdmin } from "@/lib/admin-notifications/types";
import "@/components/admin/superadmin-notification-control.css";

const ETIQUETA_ESCENARIO: Record<EscenarioNotificacionDemo, string> = {
  habitual: "Habitual",
  tecnico: "Ejemplo técnico",
  vacio: "Sin notificaciones",
};

// Estado efímero compartido entre remontajes de rutas durante la sesión DEMO.
let notificacionesLeidasEnMemoria = new Set<string>();
let notificacionesRetiradasEnMemoria = new Set<string>();

function iconoDeNotificacion(tipo: NotificacionAdmin["tipo"]): LucideIcon {
  if (tipo === "solicitud") return UserRoundPlus;
  if (tipo === "emergencia") return TriangleAlert;
  return ServerCog;
}

type EnlaceDeNotificacionProps = {
  notificacion: NotificacionAdmin;
  leida: boolean;
  onAbrir: () => void;
};

function EnlaceDeNotificacion({ notificacion, leida, onAbrir }: EnlaceDeNotificacionProps) {
  const etiquetaAccesible = [
    `Abrir notificación: ${notificacion.titulo}`,
    notificacion.descripcion,
    notificacion.fechaRelativa,
    `Estado: ${leida ? "Leída" : "Sin leer"}`,
  ].join(". ");

  if (notificacion.tipo === "solicitud") {
    return (
      <Link
        to="/admin/jac-superadmin"
        hash="solicitudes"
        className="superadmin-notification-card-link"
        aria-label={etiquetaAccesible}
        onClick={onAbrir}
      />
    );
  }

  if (notificacion.tipo === "emergencia") {
    return (
      <Link
        to="/reportes/$id"
        params={{ id: notificacion.reporteId }}
        search={{
          origen: "todos",
          tabla: undefined,
          contexto: "reportes",
          registro: "reporte",
        }}
        className="superadmin-notification-card-link"
        aria-label={etiquetaAccesible}
        onClick={onAbrir}
      />
    );
  }

  return (
    <Link
      to="/admin/gestion"
      hash="estado-del-sistema"
      className="superadmin-notification-card-link"
      aria-label={etiquetaAccesible}
      onClick={onAbrir}
    />
  );
}

export function SuperadminNotificationControl() {
  const [abiertas, setAbiertas] = useState(false);
  const [posicionPanel, setPosicionPanel] = useState<CSSProperties | null>(null);
  const [escenario, setEscenario] = useState<EscenarioNotificacionDemo>("habitual");
  const [notificaciones, setNotificaciones] = useState<NotificacionAdmin[]>([]);
  const [leidas, setLeidas] = useState<Set<string>>(() => new Set(notificacionesLeidasEnMemoria));
  const [retiradas, setRetiradas] = useState<Set<string>>(
    () => new Set(notificacionesRetiradasEnMemoria),
  );
  const [menuAccionesAbierto, setMenuAccionesAbierto] = useState(false);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);
  const notificationPanelRef = useRef<HTMLElement>(null);
  const notificationActionsRef = useRef<HTMLDivElement>(null);
  const esDemo = notificacionesDemoHabilitadas;

  useEffect(() => {
    let vigente = true;
    setNotificaciones([]);
    if (!esDemo)
      return () => {
        vigente = false;
      };

    void cargarProveedorNotificacionesAdmin()
      .then(async (proveedor) => (proveedor ? proveedor.list({ scenario: escenario }) : []))
      .then((registros) => {
        if (vigente) setNotificaciones(registros);
      })
      .catch(() => {
        if (vigente) setNotificaciones([]);
      });

    return () => {
      vigente = false;
    };
  }, [esDemo, escenario]);

  useEffect(() => {
    if (!abiertas) return;
    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuAccionesAbierto(false);
      setPosicionPanel(null);
      setAbiertas(false);
    };
    window.addEventListener("keydown", cerrarConEscape);
    return () => window.removeEventListener("keydown", cerrarConEscape);
  }, [abiertas, menuAccionesAbierto]);

  useEffect(() => {
    if (!abiertas) return;
    const cerrarAlPulsarFuera = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return;
      if (
        notificationPanelRef.current?.contains(event.target) ||
        notificationButtonRef.current?.contains(event.target)
      ) {
        return;
      }
      setMenuAccionesAbierto(false);
      setPosicionPanel(null);
      setAbiertas(false);
    };
    document.addEventListener("pointerdown", cerrarAlPulsarFuera);
    return () => document.removeEventListener("pointerdown", cerrarAlPulsarFuera);
  }, [abiertas]);

  useEffect(() => {
    if (!menuAccionesAbierto) return;
    const cerrarAlPulsarFuera = (event: PointerEvent) => {
      if (event.target instanceof Node && !notificationActionsRef.current?.contains(event.target)) {
        setMenuAccionesAbierto(false);
      }
    };
    document.addEventListener("pointerdown", cerrarAlPulsarFuera);
    return () => document.removeEventListener("pointerdown", cerrarAlPulsarFuera);
  }, [menuAccionesAbierto]);

  useEffect(() => {
    if (!abiertas) return;

    const actualizarPosicion = () => {
      const boton = notificationButtonRef.current;
      const panel = notificationPanelRef.current;
      if (!boton || !panel) return;

      const botonRect = boton.getBoundingClientRect();
      const viewportWidth = document.documentElement.clientWidth || window.innerWidth;
      const esMovil = window.matchMedia("(max-width: 720px)").matches;
      const panelWidth = Math.min(
        panel.getBoundingClientRect().width,
        viewportWidth - (esMovil ? 20 : 24),
      );
      const left = esMovil
        ? Math.max(10, (viewportWidth - panelWidth) / 2)
        : Math.max(12, Math.min(botonRect.right - panelWidth, viewportWidth - panelWidth - 12));
      const top = botonRect.bottom + 8;
      const maxHeight = Math.max(220, window.innerHeight - top - 12);

      setPosicionPanel((actual) => {
        if (
          actual?.top === top &&
          actual.left === left &&
          actual.width === panelWidth &&
          actual.maxHeight === maxHeight
        ) {
          return actual;
        }
        return { top, left, width: panelWidth, maxHeight };
      });
    };

    actualizarPosicion();
    window.addEventListener("resize", actualizarPosicion);
    window.addEventListener("scroll", actualizarPosicion, true);
    return () => {
      window.removeEventListener("resize", actualizarPosicion);
      window.removeEventListener("scroll", actualizarPosicion, true);
    };
  }, [abiertas]);

  const notificacionesVisibles = notificaciones.filter(
    (notificacion) => !retiradas.has(notificacion.id),
  );
  const noLeidas = notificacionesVisibles.filter((notificacion) => !leidas.has(notificacion.id));
  const leidasVisibles = notificacionesVisibles.filter((notificacion) =>
    leidas.has(notificacion.id),
  );

  const cambiarEscenario = (nuevoEscenario: EscenarioNotificacionDemo) => {
    notificacionesLeidasEnMemoria = new Set();
    setLeidas(new Set());
    setEscenario(nuevoEscenario);
  };

  const marcarComoLeida = (id: string) => {
    const nuevas = new Set(notificacionesLeidasEnMemoria).add(id);
    notificacionesLeidasEnMemoria = nuevas;
    setLeidas(new Set(nuevas));
  };

  const abrirNotificacion = (id: string) => {
    marcarComoLeida(id);
    setMenuAccionesAbierto(false);
    setPosicionPanel(null);
    setAbiertas(false);
  };

  const retirarNotificacion = (id: string) => {
    const nuevas = new Set(notificacionesRetiradasEnMemoria).add(id);
    notificacionesRetiradasEnMemoria = nuevas;
    setRetiradas(new Set(nuevas));
  };

  const marcarTodasComoLeidas = () => {
    const nuevas = new Set(notificacionesLeidasEnMemoria);
    notificacionesVisibles.forEach((notificacion) => nuevas.add(notificacion.id));
    notificacionesLeidasEnMemoria = nuevas;
    setLeidas(new Set(nuevas));
  };

  const retirarTodasLasLeidas = () => {
    const nuevas = new Set(notificacionesRetiradasEnMemoria);
    leidasVisibles.forEach((notificacion) => nuevas.add(notificacion.id));
    notificacionesRetiradasEnMemoria = nuevas;
    setRetiradas(new Set(nuevas));
    setMenuAccionesAbierto(false);
  };

  return (
    <div className="superadmin-notification-control">
      <button
        type="button"
        ref={notificationButtonRef}
        className="superadmin-notification-button"
        aria-label={
          abiertas ? "Cerrar notificaciones" : `Abrir notificaciones: ${noLeidas.length} sin leer`
        }
        title="Notificaciones administrativas"
        aria-expanded={abiertas}
        aria-controls="superadmin-notification-panel"
        aria-haspopup="true"
        onClick={() => {
          setPosicionPanel(null);
          setMenuAccionesAbierto(false);
          setAbiertas((actuales) => !actuales);
        }}
      >
        <BellRing size={19} aria-hidden="true" />
        <span
          className="superadmin-notification-count"
          data-empty={noLeidas.length === 0}
          aria-hidden="true"
        >
          {noLeidas.length > 9 ? "9+" : noLeidas.length}
        </span>
      </button>
      {abiertas && (
        <section
          ref={notificationPanelRef}
          id="superadmin-notification-panel"
          className="superadmin-notification-panel"
          style={posicionPanel ?? { visibility: "hidden" }}
          aria-labelledby="superadmin-notification-title"
          role="region"
        >
          <div className="superadmin-notification-heading">
            <div>
              <p className="superadmin-notification-kicker">
                {esDemo ? "DEMO · Datos ficticios" : "Panel administrativo"}
              </p>
              <h2 id="superadmin-notification-title">Notificaciones</h2>
            </div>
            <div className="superadmin-notification-heading-actions">
              {noLeidas.length > 0 && (
                <button
                  type="button"
                  className="superadmin-notification-mark-all"
                  onClick={marcarTodasComoLeidas}
                >
                  <CheckCheck size={15} aria-hidden="true" />
                  Marcar todas como leídas
                </button>
              )}
              {esDemo && (
                <div className="superadmin-notification-actions-menu" ref={notificationActionsRef}>
                  <button
                    type="button"
                    className="superadmin-notification-more"
                    aria-label="Más opciones de notificaciones"
                    title="Más opciones"
                    aria-expanded={menuAccionesAbierto}
                    aria-controls="superadmin-notification-actions-menu"
                    aria-haspopup="menu"
                    onClick={() => setMenuAccionesAbierto((abierto) => !abierto)}
                  >
                    <MoreHorizontal size={19} aria-hidden="true" />
                  </button>
                  {menuAccionesAbierto && (
                    <div
                      id="superadmin-notification-actions-menu"
                      className="superadmin-notification-actions-popover"
                      role="menu"
                    >
                      <button
                        type="button"
                        role="menuitem"
                        className="superadmin-notification-remove-read"
                        disabled={leidasVisibles.length === 0}
                        onClick={retirarTodasLasLeidas}
                      >
                        <Trash2 size={15} aria-hidden="true" />
                        Quitar notificaciones leídas
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {esDemo && (
            <>
              <p className="superadmin-notification-demo-note">
                Simulación local en memoria. No se conecta a servicios ni modifica datos reales.
              </p>
              <fieldset className="superadmin-notification-scenarios">
                <legend>Escenarios de demostración</legend>
                <div>
                  {(Object.keys(ETIQUETA_ESCENARIO) as EscenarioNotificacionDemo[]).map(
                    (opcion) => (
                      <button
                        key={opcion}
                        type="button"
                        aria-pressed={escenario === opcion}
                        className="superadmin-notification-scenario"
                        onClick={() => cambiarEscenario(opcion)}
                      >
                        {ETIQUETA_ESCENARIO[opcion]}
                      </button>
                    ),
                  )}
                </div>
              </fieldset>
              {escenario === "tecnico" && (
                <p className="superadmin-notification-technical-note" role="note">
                  Escenario ficticio: la alerta técnica no procede de monitoreo y no representa una
                  incidencia real.
                </p>
              )}
            </>
          )}

          <div className="superadmin-notification-summary" aria-live="polite">
            {noLeidas.length === 0
              ? "0 notificaciones sin leer"
              : `${noLeidas.length} ${noLeidas.length === 1 ? "notificación sin leer" : "notificaciones sin leer"}`}
          </div>

          {notificacionesVisibles.length > 0 ? (
            <ul className="superadmin-notification-list" aria-live="polite">
              {notificacionesVisibles.map((notificacion) => {
                const Icon = iconoDeNotificacion(notificacion.tipo);
                const leida = leidas.has(notificacion.id);
                return (
                  <li
                    key={notificacion.id}
                    className={`superadmin-notification-item is-${notificacion.tipo} ${leida ? "is-read" : "is-unread"}`}
                  >
                    <EnlaceDeNotificacion
                      notificacion={notificacion}
                      leida={leida}
                      onAbrir={() => abrirNotificacion(notificacion.id)}
                    />
                    <span className="superadmin-notification-item-icon" aria-hidden="true">
                      <Icon size={19} strokeWidth={2.1} />
                    </span>
                    <div className="superadmin-notification-item-copy" aria-hidden="true">
                      <div className="superadmin-notification-item-title-row">
                        <h3>{notificacion.titulo}</h3>
                        <span className="superadmin-notification-status">
                          {leida ? "Leída" : "Sin leer"}
                        </span>
                      </div>
                      <p>{notificacion.descripcion}</p>
                      <div className="superadmin-notification-item-footer">
                        <span className="superadmin-notification-time">
                          {notificacion.fechaRelativa}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="superadmin-notification-dismiss"
                      aria-label={`Quitar «${notificacion.titulo}» de la bandeja`}
                      title="Quitar de la bandeja"
                      onClick={() => retirarNotificacion(notificacion.id)}
                    >
                      <X size={15} aria-hidden="true" />
                    </button>
                    {!leida && (
                      <button
                        type="button"
                        className="superadmin-notification-mark-read"
                        onClick={() => marcarComoLeida(notificacion.id)}
                        aria-label={`Marcar «${notificacion.titulo}» como leída`}
                      >
                        <Check size={15} aria-hidden="true" />
                        Marcar como leída
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="superadmin-notification-empty" role="status">
              <BellRing size={22} aria-hidden="true" />
              <h3>No hay notificaciones</h3>
              <p>
                {esDemo
                  ? notificaciones.length > 0
                    ? "Se quitaron de esta bandeja DEMO; los registros relacionados no se modificaron."
                    : "Este escenario DEMO no contiene avisos."
                  : "Las notificaciones administrativas aún no están habilitadas en esta vista."}
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
