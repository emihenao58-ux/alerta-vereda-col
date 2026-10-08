import type { TipoLugar } from "@/lib/reportar/types";

export type { TipoLugar } from "@/lib/reportar/types";

export type TerritorioMock = {
  id: string;
  nombre: string;
  tipo: TipoLugar;
  parentId: string | null;
};

// Catálogo local definitivo para la interfaz de PR #14. Corregimientos,
// veredas y cabecera municipal son tipos independientes para el usuario.
export const TERRITORIOS_MOCK: readonly TerritorioMock[] = [
  { id: "sevilla", nombre: "Sevilla", tipo: "corregimiento", parentId: null },
  { id: "el-brasil", nombre: "El Brasil", tipo: "corregimiento", parentId: null },
  { id: "guayabal", nombre: "Guayabal", tipo: "corregimiento", parentId: null },
  { id: "la-clara", nombre: "La Clara", tipo: "corregimiento", parentId: null },

  { id: "santander", nombre: "Santander", tipo: "vereda", parentId: null },
  { id: "campo-alegre", nombre: "Campo Alegre", tipo: "vereda", parentId: null },
  { id: "la-holanda", nombre: "La Holanda", tipo: "vereda", parentId: null },
  { id: "blanquizal", nombre: "Blanquizal", tipo: "vereda", parentId: null },
  { id: "filo-de-san-jose", nombre: "Filo de San José", tipo: "vereda", parentId: null },
  { id: "la-quiebra", nombre: "La Quiebra", tipo: "vereda", parentId: null },
  { id: "zarzal", nombre: "Zarzal", tipo: "vereda", parentId: null },
  { id: "el-cedro", nombre: "El Cedro", tipo: "vereda", parentId: null },
  { id: "narino", nombre: "Nariño", tipo: "vereda", parentId: null },
  { id: "el-socorro", nombre: "El Socorro", tipo: "vereda", parentId: null },
  { id: "la-esmeralda", nombre: "La Esmeralda", tipo: "vereda", parentId: null },
  {
    id: "llano-de-santa-barbara",
    nombre: "Llano de Santa Bárbara",
    tipo: "vereda",
    parentId: null,
  },
  { id: "comunidad", nombre: "Comunidad", tipo: "vereda", parentId: null },
  { id: "fatima", nombre: "Fátima", tipo: "vereda", parentId: null },
  { id: "la-clara-vereda", nombre: "La Clara", tipo: "vereda", parentId: null },
  { id: "murrapal", nombre: "Murrapal", tipo: "vereda", parentId: null },
  { id: "aguada", nombre: "Aguada", tipo: "vereda", parentId: null },
  { id: "arenales", nombre: "Arenales", tipo: "vereda", parentId: null },
  { id: "sagua", nombre: "Sagua", tipo: "vereda", parentId: null },
  { id: "la-renta", nombre: "La Renta", tipo: "vereda", parentId: null },
  { id: "la-suiza", nombre: "La Suiza", tipo: "vereda", parentId: null },
  { id: "los-pomos", nombre: "Los Pomos", tipo: "vereda", parentId: null },
  { id: "las-brisas", nombre: "Las Brisas", tipo: "vereda", parentId: null },
  { id: "el-retiro", nombre: "El Retiro", tipo: "vereda", parentId: null },
  { id: "guayabal-vereda", nombre: "Guayabal", tipo: "vereda", parentId: null },
  { id: "quirimara-rodeo", nombre: "Quirimara Rodeo", tipo: "vereda", parentId: null },
  { id: "placitas", nombre: "Placitas", tipo: "vereda", parentId: null },
  { id: "jaramillo", nombre: "Jaramillo", tipo: "vereda", parentId: null },
  { id: "carrascal", nombre: "Carrascal", tipo: "vereda", parentId: null },
  { id: "bosque-y-naranjo", nombre: "Bosque y Naranjo", tipo: "vereda", parentId: null },
  { id: "chachafruta", nombre: "Chachafruta", tipo: "vereda", parentId: null },
  { id: "el-palon", nombre: "El Palón", tipo: "vereda", parentId: null },
  { id: "palo-blanco", nombre: "Palo Blanco", tipo: "vereda", parentId: null },
  {
    id: "el-filo-de-los-arboleda",
    nombre: "El Filo de los Arboleda",
    tipo: "vereda",
    parentId: null,
  },

  { id: "cabecera-municipal", nombre: "Cabecera municipal", tipo: "casco_urbano", parentId: null },
  {
    id: "divino-nino",
    nombre: "Divino Niño",
    tipo: "casco_urbano",
    parentId: "cabecera-municipal",
  },
  {
    id: "la-inmaculada",
    nombre: "La Inmaculada",
    tipo: "casco_urbano",
    parentId: "cabecera-municipal",
  },
  {
    id: "maria-auxiliadora",
    nombre: "María Auxiliadora",
    tipo: "casco_urbano",
    parentId: "cabecera-municipal",
  },
  {
    id: "avenida-la-republica",
    nombre: "Avenida La República",
    tipo: "casco_urbano",
    parentId: "cabecera-municipal",
  },
  {
    id: "el-carmelo",
    nombre: "El Carmelo",
    tipo: "casco_urbano",
    parentId: "cabecera-municipal",
  },
  { id: "obrero", nombre: "Obrero", tipo: "casco_urbano", parentId: "cabecera-municipal" },
  {
    id: "la-esperanza",
    nombre: "La Esperanza",
    tipo: "casco_urbano",
    parentId: "cabecera-municipal",
  },
  {
    id: "santa-teresa",
    nombre: "Santa Teresa",
    tipo: "casco_urbano",
    parentId: "cabecera-municipal",
  },
  {
    id: "san-francisco",
    nombre: "San Francisco",
    tipo: "casco_urbano",
    parentId: "cabecera-municipal",
  },
];

export function territorioPorId(id: string | null) {
  return TERRITORIOS_MOCK.find((territorio) => territorio.id === id) ?? null;
}

export function territoriosDeTipo(tipo: TipoLugar) {
  return TERRITORIOS_MOCK.filter((territorio) => territorio.tipo === tipo);
}

export function hijosDe(parentId: string | null) {
  return TERRITORIOS_MOCK.filter((territorio) => territorio.parentId === parentId);
}

export function etiquetaTipoLugar(tipo: TipoLugar | null) {
  if (tipo === "corregimiento") return "Corregimiento";
  if (tipo === "vereda") return "Vereda";
  if (tipo === "casco_urbano") return "Cabecera municipal";
  return "Tipo de lugar";
}

// Alias temporal para consumidores antiguos del primer mock local.
export type ComunidadMock = TerritorioMock;
export const COMUNIDADES_MOCK = TERRITORIOS_MOCK;
