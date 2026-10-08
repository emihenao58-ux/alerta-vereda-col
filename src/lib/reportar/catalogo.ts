import {
  AlertTriangle,
  Car,
  CircleHelp,
  Construction,
  Droplet,
  Flame,
  HeartPulse,
  Megaphone,
  Mountain,
  Radio,
  Route,
  Users,
  Waves,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { ReporteCategoria, SinEvidenciaMotivo } from "@/lib/reportar/types";

export type ReporteSubcategoria = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

export type ReporteCategoriaConfig = {
  value: ReporteCategoria;
  label: string;
  description: string;
  color: string;
  textColor: string;
  Icon: LucideIcon;
  subcategorias: ReporteSubcategoria[];
};

// Catálogo declarativo local de PR #14. Los identificadores y subcategorías se
// reemplazarán si PR #15 define un catálogo persistido en el backend.
export const CATEGORIAS: readonly ReporteCategoriaConfig[] = [
  {
    value: "emergencia",
    label: "Emergencias",
    description: "Una situación que puede poner en riesgo a personas o viviendas.",
    color: "#D83644",
    textColor: "#FFFFFF",
    Icon: AlertTriangle,
    subcategorias: [
      { id: "accidente", label: "Accidente", Icon: Car },
      { id: "incendio", label: "Incendio", Icon: Flame },
      { id: "deslizamiento", label: "Deslizamiento o derrumbe", Icon: Mountain },
      { id: "inundacion", label: "Inundación", Icon: Waves },
      { id: "atencion_medica", label: "Atención médica", Icon: HeartPulse },
      { id: "otra_emergencia", label: "Otra emergencia", Icon: CircleHelp },
    ],
  },
  {
    value: "via",
    label: "Vías",
    description: "Un problema que afecta el paso por una vía o camino.",
    color: "#E58129",
    textColor: "#1B2B24",
    Icon: Route,
    subcategorias: [
      { id: "derrumbe_via", label: "Derrumbe en la vía", Icon: Mountain },
      { id: "puente", label: "Puente o paso dañado", Icon: Construction },
      { id: "paso_restringido", label: "Paso restringido", Icon: Construction },
      { id: "otro_problema_vial", label: "Otro problema vial", Icon: CircleHelp },
    ],
  },
  {
    value: "servicio",
    label: "Servicios",
    description: "Una interrupción o dificultad con un servicio de la comunidad.",
    color: "#208666",
    textColor: "#FFFFFF",
    Icon: Droplet,
    subcategorias: [
      { id: "agua", label: "Agua", Icon: Droplet },
      { id: "energia", label: "Energía", Icon: Zap },
      { id: "senal", label: "Señal o comunicación", Icon: Radio },
      { id: "otro_servicio", label: "Otro servicio", Icon: CircleHelp },
    ],
  },
  {
    value: "otro",
    label: "Avisos",
    description: "Información útil para las personas de la comunidad.",
    color: "#E7A836",
    textColor: "#1B2B24",
    Icon: Megaphone,
    subcategorias: [
      { id: "reunion", label: "Reunión o convocatoria", Icon: Users },
      { id: "aviso_comunitario", label: "Aviso comunitario", Icon: Megaphone },
      { id: "otro_aviso", label: "Otro aviso", Icon: CircleHelp },
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
