export type CategoriaMiVereda = "emergencia" | "via" | "servicio" | "aviso";
export type EstadoMiVereda = "activo" | "solucionado" | "no_solucionado";

export type VeredaDemo = {
  id: string;
  nombre: string;
  activa: boolean;
};

export type RegistroMiVereda = {
  id: string;
  veredaId: string;
  categoria: CategoriaMiVereda;
  titulo: string;
  descripcion: string;
  estado: EstadoMiVereda;
  fechaCreacion: string;
  cerradoEn?: string;
  lugar?: string;
  nivel?: "urgente" | "atencion" | "normal";
};

export const VEREDAS_DEMO: VeredaDemo[] = [
  { id: "aguada", nombre: "Aguada", activa: true },
  { id: "la-clara", nombre: "La Clara", activa: true },
  { id: "el-salado", nombre: "El Salado", activa: false },
  { id: "guayabal", nombre: "Guayabal", activa: true },
];

export const REGISTROS_DEMO: RegistroMiVereda[] = [
  {
    id: "aguada-emergencia-01",
    veredaId: "aguada",
    categoria: "emergencia",
    titulo: "Deslizamiento en la curva del alto",
    descripcion:
      "Hay paso restringido por material sobre la vía. Se recomienda transitar con mucha precaución.",
    estado: "activo",
    fechaCreacion: "2026-08-24T08:15:00-05:00",
    lugar: "Curva del alto",
    nivel: "urgente",
  },
  {
    id: "aguada-via-01",
    veredaId: "aguada",
    categoria: "via",
    titulo: "Camino principal con paso reducido",
    descripcion: "El camino está habilitado para vehículos livianos mientras se revisa el terreno.",
    estado: "activo",
    fechaCreacion: "2026-08-23T16:40:00-05:00",
    lugar: "Camino principal",
    nivel: "atencion",
  },
  {
    id: "aguada-servicio-01",
    veredaId: "aguada",
    categoria: "servicio",
    titulo: "Corte de agua en varios sectores",
    descripcion:
      "La JAC informó una interrupción temporal del servicio. Se avisará cuando se restablezca.",
    estado: "activo",
    fechaCreacion: "2026-08-22T10:30:00-05:00",
    lugar: "Sectores altos",
    nivel: "atencion",
  },
  {
    id: "aguada-hist-01",
    veredaId: "aguada",
    categoria: "via",
    titulo: "Reparación del puente de la quebrada",
    descripcion: "La comunidad reportó una afectación y el paso fue atendido posteriormente.",
    estado: "solucionado",
    fechaCreacion: "2026-08-08T09:00:00-05:00",
    cerradoEn: "2026-08-14T15:20:00-05:00",
    lugar: "Puente de la quebrada",
    nivel: "normal",
  },
  {
    id: "aguada-hist-02",
    veredaId: "aguada",
    categoria: "emergencia",
    titulo: "Caída de árbol junto al camino",
    descripcion: "Se registró una obstrucción temporal en el camino comunitario.",
    estado: "no_solucionado",
    fechaCreacion: "2026-07-28T07:30:00-05:00",
    cerradoEn: "2026-08-01T11:00:00-05:00",
    lugar: "Camino a la escuela",
    nivel: "atencion",
  },
  {
    id: "aguada-hist-03",
    veredaId: "aguada",
    categoria: "aviso",
    titulo: "Convite comunitario de limpieza",
    descripcion:
      "La comunidad organizó una jornada para limpiar los alrededores del salón comunal.",
    estado: "solucionado",
    fechaCreacion: "2026-07-20T13:00:00-05:00",
    cerradoEn: "2026-07-21T17:00:00-05:00",
    lugar: "Salón comunal",
    nivel: "normal",
  },
  {
    id: "la-clara-emergencia-01",
    veredaId: "la-clara",
    categoria: "emergencia",
    titulo: "Alerta por creciente de la quebrada",
    descripcion: "Se recomienda evitar acercarse al cauce mientras bajan los niveles del agua.",
    estado: "activo",
    fechaCreacion: "2026-08-24T06:45:00-05:00",
    lugar: "Quebrada La Clara",
    nivel: "urgente",
  },
  {
    id: "la-clara-hist-01",
    veredaId: "la-clara",
    categoria: "servicio",
    titulo: "Interrupción del servicio de energía",
    descripcion: "Se informó una interrupción del servicio y el caso fue atendido.",
    estado: "solucionado",
    fechaCreacion: "2026-07-30T12:00:00-05:00",
    cerradoEn: "2026-08-02T09:15:00-05:00",
    lugar: "Toda la vereda",
    nivel: "atencion",
  },
  {
    id: "el-salado-hist-01",
    veredaId: "el-salado",
    categoria: "via",
    titulo: "Mantenimiento del camino veredal",
    descripcion: "El camino fue intervenido por la comunidad y quedó habilitado.",
    estado: "solucionado",
    fechaCreacion: "2026-06-12T08:00:00-05:00",
    cerradoEn: "2026-06-15T16:30:00-05:00",
    lugar: "Camino veredal",
    nivel: "normal",
  },
  {
    id: "guayabal-hist-01",
    veredaId: "guayabal",
    categoria: "aviso",
    titulo: "Reunión de la Junta de Acción Comunal",
    descripcion: "La JAC informó una reunión para conversar sobre necesidades de la vereda.",
    estado: "solucionado",
    fechaCreacion: "2026-08-05T18:00:00-05:00",
    cerradoEn: "2026-08-06T20:00:00-05:00",
    lugar: "Escuela de Guayabal",
    nivel: "normal",
  },
];

export const ETIQUETAS_CATEGORIA: Record<CategoriaMiVereda, string> = {
  emergencia: "Emergencias",
  via: "Vías",
  servicio: "Servicios",
  aviso: "Avisos",
};

export const DESCRIPCIONES_ESTADO: Record<EstadoMiVereda, string> = {
  activo: "Situaciones que todavía están vigentes.",
  solucionado: "Casos que fueron atendidos o resueltos.",
  no_solucionado: "Casos cerrados sin una solución confirmada.",
};
