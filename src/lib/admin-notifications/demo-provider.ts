import type {
  EscenarioNotificacionDemo,
  NotificacionAdmin,
  ProveedorNotificacionesAdmin,
} from "@/lib/admin-notifications/types";

const NOTIFICACIONES_DEMO: readonly NotificacionAdmin[] = [
  {
    id: "DEMO-SOLICITUD-01",
    tipo: "solicitud",
    titulo: "Nueva solicitud de administrador",
    descripcion: "DEMO · Zona Centro · Solicitud ficticia para probar la navegación.",
    haceMinutos: 24,
    fechaRelativa: "Hace 24 minutos",
    prioridad: 2,
  },
  {
    id: "DEMO-REPORTE-001",
    tipo: "emergencia",
    titulo: "Emergencia pendiente de revisión",
    descripcion: "DEMO · Zona Norte · Evento ficticio; no es una emergencia real.",
    haceMinutos: 8,
    fechaRelativa: "Hace 8 minutos",
    prioridad: 3,
    reporteId: "DEMO-REPORTE-001",
  },
];

const NOTIFICACION_TECNICA_DEMO: NotificacionAdmin = {
  id: "DEMO-INCIDENCIA-TECNICA-01",
  tipo: "tecnica",
  titulo: "DEMO · Ejemplo de alerta técnica",
  descripcion:
    "Almacenamiento · ejemplo ficticio; no proviene de monitoreo ni representa una falla real.",
  haceMinutos: 3,
  fechaRelativa: "Hace 3 minutos · ejemplo DEMO",
  prioridad: 4,
};

function notificacionesDelEscenario(escenario: EscenarioNotificacionDemo): NotificacionAdmin[] {
  if (escenario === "vacio") return [];
  const registros = [...NOTIFICACIONES_DEMO];
  if (escenario === "tecnico") registros.push(NOTIFICACION_TECNICA_DEMO);
  return registros.sort((a, b) => b.prioridad - a.prioridad || a.haceMinutos - b.haceMinutos);
}

export const proveedorNotificacionesDemo: ProveedorNotificacionesAdmin = {
  async list({ scenario = "habitual" } = {}) {
    return notificacionesDelEscenario(scenario);
  },
};
