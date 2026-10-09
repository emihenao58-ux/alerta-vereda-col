import {
  Activity,
  AlertTriangle,
  Ban,
  Biohazard,
  Bug,
  Cable,
  Car,
  CircleHelp,
  Construction,
  DoorOpen,
  Droplet,
  DropletOff,
  Flame,
  Gauge,
  HeartPulse,
  LockOpen,
  Megaphone,
  Mountain,
  PawPrint,
  PhoneOff,
  Radio,
  ShieldAlert,
  Skull,
  Sparkles,
  Trash2,
  UserSearch,
  Users,
  Waves,
  WifiOff,
  Wrench,
  Zap,
  ZapOff,
  type LucideIcon,
} from "lucide-react";
import { RoadIcon } from "@/components/road-icon";
import { SignalNoCoverageIcon, SignalWeakIcon } from "@/components/reportar/reportar-signal-icons";
import type { ReporteCategoria, SinEvidenciaMotivo } from "@/lib/reportar/types";

export type ReporteSubcategoria = {
  id: string;
  label: string;
  Icon: LucideIcon;
  children?: readonly ReporteSubcategoria[];
  requiresDescription?: boolean;
  notice?: string;
};

export type ReporteCategoriaConfig = {
  value: ReporteCategoria;
  label: string;
  description: string;
  color: string;
  textColor: string;
  Icon: LucideIcon;
  subcategorias: readonly ReporteSubcategoria[];
};

const OPCION_OTRO: Pick<ReporteSubcategoria, "requiresDescription"> = {
  requiresDescription: true,
};

// Catálogo declarativo local de PR #14. Los identificadores existentes se
// conservan para compatibilidad local; PR #15 definirá el catálogo persistido.
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
      { id: "fauna_peligrosa", label: "Fauna peligrosa", Icon: Bug },
      { id: "otra_emergencia", label: "Otra emergencia", Icon: CircleHelp, ...OPCION_OTRO },
    ],
  },
  {
    value: "via",
    label: "Vías",
    description: "Un problema que afecta el paso por una vía o camino.",
    color: "#E58129",
    textColor: "#1B2B24",
    Icon: RoadIcon,
    subcategorias: [
      { id: "derrumbe_via", label: "Derrumbe en la vía", Icon: Mountain },
      { id: "puente", label: "Puente o paso dañado", Icon: Construction },
      { id: "paso_restringido", label: "Paso restringido", Icon: Ban },
      { id: "animales_sueltos_via", label: "Animales sueltos en la vía", Icon: PawPrint },
      { id: "animales_muertos_via", label: "Animales muertos en la vía", Icon: Skull },
      { id: "otro_problema_vial", label: "Otro problema vial", Icon: CircleHelp, ...OPCION_OTRO },
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
      {
        id: "agua",
        label: "Agua",
        Icon: Droplet,
        children: [
          { id: "no_hay_agua", label: "No hay agua", Icon: DropletOff },
          { id: "fuga_tuberia", label: "Fuga o tubería rota", Icon: Wrench },
          { id: "agua_sucia", label: "Agua sucia", Icon: Biohazard },
          { id: "poca_agua", label: "Sale poca agua", Icon: Gauge },
          { id: "alcantarilla_tapada", label: "Alcantarilla tapada", Icon: Trash2 },
          { id: "aguas_residuales", label: "Desbordamiento de aguas residuales", Icon: Waves },
          { id: "otro_problema_agua", label: "Otro problema", Icon: CircleHelp, ...OPCION_OTRO },
        ],
      },
      {
        id: "energia",
        label: "Electricidad",
        Icon: Zap,
        children: [
          { id: "no_hay_luz", label: "No hay luz", Icon: ZapOff },
          { id: "luz_parpadea", label: "La luz parpadea", Icon: Activity },
          {
            id: "cable_caido",
            label: "Cable caído",
            Icon: Cable,
            notice: "No te acerques ni toques cables caídos.",
          },
          {
            id: "poste_cable_danado",
            label: "Poste o cable dañado",
            Icon: Construction,
            notice: "No te acerques ni toques cables o postes dañados.",
          },
          {
            id: "chispas_riesgo_electrico",
            label: "Chispas o riesgo eléctrico",
            Icon: Sparkles,
            notice: "Aléjate y no toques cables ni elementos eléctricos.",
          },
          { id: "otro_problema_energia", label: "Otro problema", Icon: CircleHelp, ...OPCION_OTRO },
        ],
      },
      {
        id: "senal",
        label: "Señal o comunicación",
        Icon: Radio,
        children: [
          { id: "no_hay_senal", label: "No hay señal", Icon: SignalNoCoverageIcon },
          { id: "senal_debil", label: "Señal débil", Icon: SignalWeakIcon },
          { id: "internet_no_funciona", label: "Internet no funciona", Icon: WifiOff },
          {
            id: "no_se_pueden_hacer_llamadas",
            label: "No se pueden hacer llamadas",
            Icon: PhoneOff,
          },
          { id: "otro_problema_senal", label: "Otro problema", Icon: CircleHelp, ...OPCION_OTRO },
        ],
      },
      { id: "otro_servicio", label: "Otro servicio", Icon: CircleHelp, ...OPCION_OTRO },
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
      {
        id: "aviso_comunitario_grupo",
        label: "Aviso comunitario",
        Icon: Megaphone,
        children: [
          { id: "reunion", label: "Reunión o convocatoria", Icon: Users },
          { id: "aviso_comunitario", label: "Aviso comunitario", Icon: Megaphone },
          { id: "otro_aviso", label: "Otro aviso", Icon: CircleHelp, ...OPCION_OTRO },
        ],
      },
      {
        id: "alerta_seguridad",
        label: "Alerta de seguridad",
        Icon: ShieldAlert,
        children: [
          { id: "persona_desaparecida", label: "Persona desaparecida", Icon: UserSearch },
          { id: "robo", label: "Robo", Icon: LockOpen },
          { id: "intento_robo", label: "Intento de robo", Icon: DoorOpen },
          { id: "otro_seguridad", label: "Otro", Icon: CircleHelp, ...OPCION_OTRO },
        ],
      },
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

function buscarEnOpciones(
  opciones: readonly ReporteSubcategoria[],
  id: string,
): ReporteSubcategoria | null {
  for (const opcion of opciones) {
    if (opcion.id === id) return opcion;
    const encontrada = opcion.children ? buscarEnOpciones(opcion.children, id) : null;
    if (encontrada) return encontrada;
  }
  return null;
}

export function subcategoriaPorId(categoria: ReporteCategoria | null, id: string | null) {
  return id ? buscarEnOpciones(subcategoriasDe(categoria), id) : null;
}

export function evidenciaObligatoriaPara(categoria: ReporteCategoria | null) {
  return categoria === "emergencia" || categoria === "via";
}

export function etiquetaMotivoSinEvidencia(motivo: SinEvidenciaMotivo) {
  return MOTIVOS_SIN_EVIDENCIA.find((item) => item.value === motivo)?.label ?? motivo;
}
