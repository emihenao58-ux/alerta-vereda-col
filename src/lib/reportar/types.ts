export type ReporteCategoria = "emergencia" | "via" | "servicio" | "otro";

export type ReporteStep =
  "categoria" | "detalle" | "ubicacion" | "evidencias" | "revision" | "confirmacion";

export type EvidenciaTipo = "foto" | "video";
export type EvidenciaFuente = "camara" | "galeria";

export type ReporteUbicacion = {
  latitud: number;
  longitud: number;
  precision: number;
};

export type SinEvidenciaMotivo =
  "dispositivo_sin_camara" | "camara_no_disponible" | "acceso_bloqueado" | "otro_problema_tecnico";

export type SinEvidencia = {
  motivo: SinEvidenciaMotivo;
  detalle: string;
};

export type ReporteEvidencia = {
  id: string;
  tipo: EvidenciaTipo;
  archivo: File;
  previewUrl: string;
  fuente: EvidenciaFuente;
  capturadaEn: string;
  duracionSegundos?: number;
  recortada?: boolean;
};

export type ReporteDraft = {
  categoria: ReporteCategoria | null;
  subcategoria: string | null;
  veredaId: string | null;
  descripcion: string;
  lugar: string;
  nombre: string;
  ubicacion: ReporteUbicacion | null;
  evidencias: ReporteEvidencia[];
  sinEvidencia: SinEvidencia | null;
};

export type ReportarUiState = {
  step: ReporteStep;
  permisoCamara: "desconocido" | "concedido" | "denegado" | "no-disponible";
  evidenciaEditando: string | null;
  error: string | null;
};

export function createEmptyDraft(): ReporteDraft {
  return {
    categoria: null,
    subcategoria: null,
    veredaId: null,
    descripcion: "",
    lugar: "",
    nombre: "",
    ubicacion: null,
    evidencias: [],
    sinEvidencia: null,
  };
}

export function createInitialUiState(): ReportarUiState {
  return {
    step: "categoria",
    permisoCamara: "desconocido",
    evidenciaEditando: null,
    error: null,
  };
}
