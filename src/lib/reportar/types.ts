export type ReporteCategoria = "emergencia" | "via" | "servicio" | "otro";

export type ReporteStep =
  "categoria" | "detalle" | "ubicacion" | "evidencias" | "revision" | "confirmacion";

export type TipoLugar = "corregimiento" | "vereda" | "casco_urbano";

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

export type ReporteSubcategoriaSeleccion = {
  id: string | null;
  parentId: string | null;
};

export type ReporteDraft = {
  categoria: ReporteCategoria | null;
  // Se conserva el ID de la opción final; PR #15 definirá el contrato persistido.
  subcategoria: string | null;
  // Identifica el grupo visual cuando la opción tiene dos niveles.
  subcategoriaPadre: string | null;
  // Compatibilidad temporal con el backend actual. Sólo se llena cuando la
  // selección final es una vereda; PR #15 definirá el contrato definitivo.
  veredaId: string | null;
  tipoLugar: TipoLugar | null;
  territorioId: string | null;
  territorioPadreId: string | null;
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
    subcategoriaPadre: null,
    veredaId: null,
    tipoLugar: null,
    territorioId: null,
    territorioPadreId: null,
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
