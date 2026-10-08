import { Megaphone, Route, Siren, Waves, type LucideIcon } from "lucide-react";
import type { ReporteCategoria, SinEvidenciaMotivo } from "@/lib/reportar/types";

export type ReporteSubcategoria = {
  id: string;
  label: string;
};

export type ReporteCategoriaConfig = {
  value: ReporteCategoria;
  label: string;
  description: string;
  color: string;
  Icon: LucideIcon;
  subcategorias: ReporteSubcategoria[];
};

// Catálogo provisional de PR #14. Los identificadores se reemplazarán si PR #15
// define un catálogo persistido en el backend.
export const CATEGORIAS: readonly ReporteCategoriaConfig[] = [
  {
    value: "emergencia",
    label: "Emergencia",
    description: "Una situación que puede poner en riesgo a personas o viviendas.",
    color: "#c23b2e",
    Icon: Siren,
    subcategorias: [
      { id: "deslizamiento", label: "Deslizamiento o derrumbe" },
      { id: "inundacion", label: "Inundación" },
      { id: "incendio", label: "Incendio" },
      { id: "accidente", label: "Accidente" },
      { id: "otra_emergencia", label: "Otra emergencia" },
    ],
  },
  {
    value: "via",
    label: "Vías",
    description: "Un problema que afecta el paso por una vía o camino.",
    color: "#db7b33",
    Icon: Route,
    subcategorias: [
      { id: "derrumbe_via", label: "Derrumbe en la vía" },
      { id: "puente", label: "Puente o paso dañado" },
      { id: "paso_restringido", label: "Paso restringido" },
      { id: "otro_problema_vial", label: "Otro problema vial" },
    ],
  },
  {
    value: "servicio",
    label: "Servicios",
    description: "Una interrupción o dificultad con un servicio de la comunidad.",
    color: "#3c8a5b",
    Icon: Waves,
    subcategorias: [
      { id: "agua", label: "Agua" },
      { id: "energia", label: "Energía" },
      { id: "senal", label: "Señal o comunicación" },
      { id: "otro_servicio", label: "Otro servicio" },
    ],
  },
  {
    value: "otro",
    label: "Avisos",
    description: "Información útil para las personas de la comunidad.",
    color: "#c99a2e",
    Icon: Megaphone,
    subcategorias: [
      { id: "reunion", label: "Reunión o convocatoria" },
      { id: "aviso_comunitario", label: "Aviso comunitario" },
      { id: "otro_aviso", label: "Otro aviso" },
    ],
  },
];

export const MOTIVOS_SIN_EVIDENCIA: readonly {
  value: SinEvidenciaMotivo;
  label: string;
}[] = [
  { value: "dispositivo_sin_camara", label: "Este dispositivo no tiene cámara disponible" },
  { value: "camara_no_disponible", label: "La cámara presenta una falla o no responde" },
  { value: "acceso_bloqueado", label: "El acceso a la cámara está bloqueado" },
  { value: "otro_problema_tecnico", label: "Otro problema técnico" },
];

export function categoriaConfig(categoria: ReporteCategoria | null) {
  return CATEGORIAS.find((item) => item.value === categoria) ?? null;
}

export function subcategoriasDe(categoria: ReporteCategoria | null) {
  return categoriaConfig(categoria)?.subcategorias ?? [];
}

export function fotoObligatoriaPara(categoria: ReporteCategoria | null) {
  return categoria === "emergencia" || categoria === "via";
}

export function etiquetaMotivoSinEvidencia(motivo: SinEvidenciaMotivo) {
  return MOTIVOS_SIN_EVIDENCIA.find((item) => item.value === motivo)?.label ?? motivo;
}
