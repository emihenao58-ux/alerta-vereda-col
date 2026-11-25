export type TipoNotificacionAdmin = "solicitud" | "emergencia" | "tecnica";
export type EscenarioNotificacionDemo = "habitual" | "tecnico" | "vacio";

type NotificacionAdminBase = {
  id: string;
  tipo: TipoNotificacionAdmin;
  titulo: string;
  descripcion: string;
  haceMinutos: number;
  fechaRelativa: string;
  prioridad: number;
};

export type NotificacionAdmin =
  | (NotificacionAdminBase & { tipo: "solicitud" })
  | (NotificacionAdminBase & { tipo: "emergencia"; reporteId: string })
  | (NotificacionAdminBase & { tipo: "tecnica" });

export interface ProveedorNotificacionesAdmin {
  list(options?: { scenario?: EscenarioNotificacionDemo }): Promise<NotificacionAdmin[]>;
}
