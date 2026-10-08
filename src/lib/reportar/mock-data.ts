import type { TipoLugar } from "@/lib/reportar/types";

export type { TipoLugar } from "@/lib/reportar/types";

export type TerritorioMock = {
  id: string;
  nombre: string;
  tipo: TipoLugar;
  parentId: string | null;
};

export const COLORES_CORREGIMIENTO = {
  "el-brasil": "#6B8F71",
  guayabal: "#B98257",
  "la-clara": "#6C8FBF",
  "el-zarzal": "#9A78B5",
  sevilla: "#C28A45",
} as const;

// Catálogo local definitivo de PR #14. Las veredas con parentId null son las
// siete veredas del área de influencia de la cabecera; no son un corregimiento.
// Los identificadores de corregimientos y veredas homónimos son deliberadamente
// distintos porque representan tipos de lugar diferentes en el mock.
export const TERRITORIOS_MOCK: readonly TerritorioMock[] = [
  { id: "el-brasil", nombre: "El Brasil", tipo: "corregimiento", parentId: null },
  { id: "guayabal", nombre: "Guayabal", tipo: "corregimiento", parentId: null },
  { id: "la-clara", nombre: "La Clara", tipo: "corregimiento", parentId: null },
  { id: "el-zarzal", nombre: "El Zarzal", tipo: "corregimiento", parentId: null },
  { id: "sevilla", nombre: "Sevilla", tipo: "corregimiento", parentId: null },

  // Corregimiento El Brasil — 7 veredas
  { id: "los-pomos", nombre: "Los Pomos", tipo: "vereda", parentId: "el-brasil" },
  { id: "la-suiza", nombre: "La Suiza", tipo: "vereda", parentId: "el-brasil" },
  { id: "la-renta", nombre: "La Renta", tipo: "vereda", parentId: "el-brasil" },
  { id: "sagua", nombre: "Sagua", tipo: "vereda", parentId: "el-brasil" },
  { id: "el-retiro", nombre: "El Retiro", tipo: "vereda", parentId: "el-brasil" },
  { id: "altos-del-brasil", nombre: "Altos del Brasil", tipo: "vereda", parentId: "el-brasil" },
  { id: "las-brisas", nombre: "Las Brisas", tipo: "vereda", parentId: "el-brasil" },

  // Corregimiento Guayabal — 1 vereda
  { id: "guayabal-vereda", nombre: "Guayabal", tipo: "vereda", parentId: "guayabal" },

  // Corregimiento La Clara — 3 veredas
  { id: "la-clara-vereda", nombre: "La Clara", tipo: "vereda", parentId: "la-clara" },
  { id: "murrapal", nombre: "Murrapal", tipo: "vereda", parentId: "la-clara" },
  { id: "los-arenales", nombre: "Los Arenales", tipo: "vereda", parentId: "la-clara" },

  // Corregimiento El Zarzal — 7 veredas
  { id: "el-zarzal-vereda", nombre: "El Zarzal", tipo: "vereda", parentId: "el-zarzal" },
  { id: "el-socorro", nombre: "El Socorro", tipo: "vereda", parentId: "el-zarzal" },
  { id: "narino", nombre: "Nariño", tipo: "vereda", parentId: "el-zarzal" },
  { id: "santander", nombre: "Santander", tipo: "vereda", parentId: "el-zarzal" },
  { id: "comunidad", nombre: "Comunidad", tipo: "vereda", parentId: "el-zarzal" },
  { id: "la-aguada", nombre: "La Aguada", tipo: "vereda", parentId: "el-zarzal" },
  { id: "el-cedro", nombre: "El Cedro", tipo: "vereda", parentId: "el-zarzal" },

  // Corregimiento Sevilla — 9 veredas
  { id: "el-palon", nombre: "El Palón", tipo: "vereda", parentId: "sevilla" },
  { id: "chachafruta", nombre: "Chachafruta", tipo: "vereda", parentId: "sevilla" },
  {
    id: "filo-de-los-arboleda",
    nombre: "Filo de los Arboleda",
    tipo: "vereda",
    parentId: "sevilla",
  },
  { id: "charrascal", nombre: "Charrascal", tipo: "vereda", parentId: "sevilla" },
  { id: "quirimara-rodeo", nombre: "Quirimara Rodeo", tipo: "vereda", parentId: "sevilla" },
  { id: "bosque-naranjo", nombre: "Bosque Naranjo", tipo: "vereda", parentId: "sevilla" },
  { id: "quirimara-placitas", nombre: "Quirimara Placitas", tipo: "vereda", parentId: "sevilla" },
  { id: "jaramillo", nombre: "Jaramillo", tipo: "vereda", parentId: "sevilla" },
  { id: "palo-blanco", nombre: "Palo Blanco", tipo: "vereda", parentId: "sevilla" },

  // Área de influencia de la cabecera — 7 veredas, sin corregimiento.
  { id: "blanquizal", nombre: "Blanquizal", tipo: "vereda", parentId: null },
  { id: "fatima", nombre: "Fátima", tipo: "vereda", parentId: null },
  { id: "la-holanda", nombre: "La Holanda", tipo: "vereda", parentId: null },
  { id: "la-quiebra", nombre: "La Quiebra", tipo: "vereda", parentId: null },
  {
    id: "llano-de-santa-barbara",
    nombre: "Llano de Santa Bárbara",
    tipo: "vereda",
    parentId: null,
  },
  { id: "campo-alegre", nombre: "Campo Alegre", tipo: "vereda", parentId: null },
  { id: "filo-de-san-jose", nombre: "Filo de San José", tipo: "vereda", parentId: null },

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

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .trim();
}

function distanciaLevenshtein(a: string, b: string) {
  const anterior = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const actual = [i];
    for (let j = 1; j <= b.length; j += 1) {
      actual[j] = Math.min(
        actual[j - 1]! + 1,
        anterior[j]! + 1,
        anterior[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
    for (let j = 0; j <= b.length; j += 1) anterior[j] = actual[j]!;
  }
  return anterior[b.length]!;
}

function relevanciaVereda(query: string, nombre: string) {
  const texto = normalizar(nombre);
  if (texto === query) return 0;
  if (texto.startsWith(query)) return 10;
  if (texto.includes(query)) return 20;

  const distancia = distanciaLevenshtein(query, texto);
  const maximo = query.length < 5 ? 1 : 2;
  return distancia <= maximo ? 40 + distancia : Number.POSITIVE_INFINITY;
}

export function territorioPorId(id: string | null) {
  return TERRITORIOS_MOCK.find((territorio) => territorio.id === id) ?? null;
}

export function territoriosDeTipo(tipo: TipoLugar) {
  return TERRITORIOS_MOCK.filter((territorio) => territorio.tipo === tipo);
}

export function hijosDe(parentId: string | null) {
  return TERRITORIOS_MOCK.filter((territorio) => territorio.parentId === parentId);
}

export function colorDeTerritorio(territorio: TerritorioMock | null) {
  if (!territorio) return null;
  const corregimientoId = territorio.tipo === "corregimiento" ? territorio.id : territorio.parentId;
  return corregimientoId
    ? (COLORES_CORREGIMIENTO[corregimientoId as keyof typeof COLORES_CORREGIMIENTO] ?? null)
    : null;
}

export function contextoVereda(territorio: TerritorioMock | null) {
  if (!territorio || territorio.tipo !== "vereda") return null;
  const corregimiento = territorioPorId(territorio.parentId);
  return corregimiento
    ? `Corregimiento ${corregimiento.nombre}`
    : "Área de influencia de la cabecera";
}

export function buscarVeredas(query: string) {
  const veredas = territoriosDeTipo("vereda");
  const normalizado = normalizar(query);
  if (!normalizado) {
    return [...veredas].sort((a, b) => a.nombre.localeCompare(b.nombre, "es")).slice(0, 6);
  }

  return veredas
    .map((territorio) => ({
      territorio,
      relevancia: relevanciaVereda(normalizado, normalizar(territorio.nombre)),
    }))
    .filter(({ relevancia }) => Number.isFinite(relevancia))
    .sort(
      (a, b) =>
        a.relevancia - b.relevancia || a.territorio.nombre.localeCompare(b.territorio.nombre, "es"),
    )
    .map(({ territorio }) => territorio)
    .slice(0, 8);
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
