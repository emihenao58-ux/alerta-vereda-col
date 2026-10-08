import type { TipoLugar } from "@/lib/reportar/types";

export type { TipoLugar } from "@/lib/reportar/types";

export type TerritorioMock = {
  id: string;
  nombre: string;
  tipo: TipoLugar;
  parentId: string | null;
};

// Catálogo local provisional de PR #14. Los cinco corregimientos fueron
// indicados para la primera selección. Las veredas hijas y sectores son
// ejemplos de interfaz mientras PR #15 define el catálogo territorial real.
export const TERRITORIOS_MOCK: readonly TerritorioMock[] = [
  { id: "sevilla", nombre: "Sevilla", tipo: "corregimiento", parentId: null },
  { id: "sevilla-vereda-demo", nombre: "Vereda de Sevilla", tipo: "vereda", parentId: "sevilla" },
  { id: "el-brasil", nombre: "El Brasil", tipo: "corregimiento", parentId: null },
  {
    id: "el-brasil-vereda-demo",
    nombre: "Vereda de El Brasil",
    tipo: "vereda",
    parentId: "el-brasil",
  },
  { id: "el-zarzal", nombre: "El Zarzal", tipo: "corregimiento", parentId: null },
  {
    id: "el-zarzal-vereda-demo",
    nombre: "Vereda de El Zarzal",
    tipo: "vereda",
    parentId: "el-zarzal",
  },
  { id: "guayabal", nombre: "Guayabal", tipo: "corregimiento", parentId: null },
  {
    id: "guayabal-vereda-demo",
    nombre: "Vereda de Guayabal",
    tipo: "vereda",
    parentId: "guayabal",
  },
  { id: "la-clara", nombre: "La Clara", tipo: "corregimiento", parentId: null },
  {
    id: "la-clara-vereda-demo",
    nombre: "Vereda de La Clara",
    tipo: "vereda",
    parentId: "la-clara",
  },
  {
    id: "ebejico-casco-urbano",
    nombre: "Ebéjico · casco urbano",
    tipo: "casco_urbano",
    parentId: null,
  },
  {
    id: "sector-centro",
    nombre: "Sector Centro",
    tipo: "casco_urbano",
    parentId: "ebejico-casco-urbano",
  },
  {
    id: "sector-la-plaza",
    nombre: "Sector La Plaza",
    tipo: "casco_urbano",
    parentId: "ebejico-casco-urbano",
  },
  {
    id: "sector-el-hospital",
    nombre: "Sector El Hospital",
    tipo: "casco_urbano",
    parentId: "ebejico-casco-urbano",
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
  if (tipo === "casco_urbano") return "Casco urbano";
  return "Tipo de lugar";
}

// Alias temporal para consumidores antiguos del primer mock local. El nuevo
// flujo usa TERRITORIOS_MOCK y nunca presenta este arreglo como selector plano.
export type ComunidadMock = TerritorioMock;
export const COMUNIDADES_MOCK = TERRITORIOS_MOCK;
