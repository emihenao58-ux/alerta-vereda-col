export type ComunidadMock = {
  id: string;
  nombre: string;
  tipo: "vereda" | "corregimiento" | "casco_urbano";
};

// Datos locales de PR #14. veredaId conserva el nombre interno compatible con
// el backend actual; tipo queda como metadata local hasta la revisión de PR #15.
export const COMUNIDADES_MOCK: readonly ComunidadMock[] = [
  { id: "la-clara", nombre: "La Clara", tipo: "vereda" },
  { id: "el-brasil", nombre: "El Brasil", tipo: "vereda" },
  { id: "sevilla", nombre: "Sevilla", tipo: "corregimiento" },
  { id: "guayabal", nombre: "Guayabal", tipo: "vereda" },
  { id: "el-zarzal", nombre: "El Zarzal", tipo: "vereda" },
  { id: "ebejico-casco-urbano", nombre: "Ebéjico · casco urbano", tipo: "casco_urbano" },
];
