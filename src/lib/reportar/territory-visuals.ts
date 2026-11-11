import { TERRITORIOS_MOCK } from "@/lib/reportar/mock-data";

export type RecursoVisualTerritorial = {
  id: string;
  src: string;
  alt: string;
  label: string;
};

export type RecursosVisualesTerritoriales = {
  ilustracion3d?: RecursoVisualTerritorial;
  fotografiaReferencia?: RecursoVisualTerritorial;
};

type IdTerritorioCatalogo = (typeof TERRITORIOS_MOCK)[number]["id"];

export const RECURSOS_VISUALES_TERRITORIALES: Partial<
  Record<IdTerritorioCatalogo, RecursosVisualesTerritoriales>
> = {
  "los-pomos": {
    ilustracion3d: {
      id: "L1-F3-C1",
      src: "/images/territorios/catalogo/veredas/L1-F3-C1.webp",
      alt: "Ilustración 3D referencial de Los Pomos.",
      label: "Ilustración 3D referencial",
    },
  },
  "la-suiza": {
    ilustracion3d: {
      id: "IMG-LA-SUIZA-ESCUELA-RURAL-01",
      src: "/images/territorios/catalogo/veredas/ilustracion_la_suiza_escuela_rural.png",
      alt: "Ilustración 3D referencial de La Suiza.",
      label: "Ilustración 3D referencial",
    },
  },
  "la-renta": {
    ilustracion3d: {
      id: "L1-F2-C1",
      src: "/images/territorios/catalogo/veredas/L1-F2-C1.webp",
      alt: "Ilustración 3D referencial de La Renta.",
      label: "Ilustración 3D referencial",
    },
  },
  sagua: {
    ilustracion3d: {
      id: "IMG-SAGUA-ESCUELA-RURAL-01",
      src: "/images/territorios/catalogo/veredas/ilustracion_sagua_escuela_rural.png",
      alt: "Ilustración 3D referencial de Sagua.",
      label: "Ilustración 3D referencial",
    },
  },
  "el-retiro": {
    ilustracion3d: {
      id: "L3-F4-C3",
      src: "/images/territorios/catalogo/veredas/L3-F4-C3.webp",
      alt: "Ilustración 3D referencial de El Retiro.",
      label: "Ilustración 3D referencial",
    },
  },
  "altos-del-brasil": {
    ilustracion3d: {
      id: "IMG-ALTOS-DEL-BRASIL-V02",
      src: "/images/territorios/catalogo/veredas/altos-del-brasil-v02.png",
      alt: "Ilustración 3D referencial de Altos del Brasil.",
      label: "Ilustración 3D referencial",
    },
  },
  "las-brisas": {
    ilustracion3d: {
      id: "L4-F4-C2",
      src: "/images/territorios/catalogo/veredas/L4-F4-C2.webp",
      alt: "Ilustración 3D referencial de Las Brisas.",
      label: "Ilustración 3D referencial",
    },
  },
  "guayabal-vereda": {
    ilustracion3d: {
      id: "IMG-GUAYABAL-TRANSICION-BOSQUES-V02",
      src: "/images/territorios/catalogo/veredas/guayabal-transicion-v02.png",
      alt: "Ilustración 3D referencial de Guayabal.",
      label: "Ilustración 3D referencial",
    },
  },
  "la-clara-vereda": {
    ilustracion3d: {
      id: "L4-F4-C1",
      src: "/images/territorios/catalogo/veredas/L4-F4-C1.webp",
      alt: "Ilustración 3D referencial de La Clara.",
      label: "Ilustración 3D referencial",
    },
  },
  murrapal: {
    ilustracion3d: {
      id: "L4-F2-C3",
      src: "/images/territorios/catalogo/veredas/L4-F2-C3.webp",
      alt: "Ilustración 3D referencial de Murrapal.",
      label: "Ilustración 3D referencial",
    },
  },
  santander: {
    ilustracion3d: {
      id: "L4-F3-C1",
      src: "/images/territorios/catalogo/veredas/L4-F3-C1.webp",
      alt: "Ilustración 3D referencial de Santander.",
      label: "Ilustración 3D referencial",
    },
  },
  "los-arenales": {
    ilustracion3d: {
      id: "IMG-LOS-ARENALES-ESCUELA-RURAL-01",
      src: "/images/territorios/catalogo/veredas/ilustracion_los_arenales_escuela_rural.png",
      alt: "Ilustración 3D referencial de Los Arenales.",
      label: "Ilustración 3D referencial",
    },
  },
  "el-zarzal-vereda": {
    ilustracion3d: {
      id: "L2-F2-C1",
      src: "/images/territorios/catalogo/veredas/L2-F2-C1.webp",
      alt: "Ilustración 3D referencial de El Zarzal.",
      label: "Ilustración 3D referencial",
    },
  },
  "el-socorro": {
    ilustracion3d: {
      id: "IMG-EL-SOCORRO-PORCICULTURA-01",
      src: "/images/territorios/catalogo/veredas/ilustracion_el_socorro_porcicultura.png",
      alt: "Ilustración 3D referencial de El Socorro.",
      label: "Ilustración 3D referencial",
    },
  },
  narino: {
    ilustracion3d: {
      id: "IMG-NARINO-ESCUELA-RURAL-01",
      src: "/images/territorios/catalogo/veredas/ilustracion_narino_escuela_rural.png",
      alt: "Ilustración 3D referencial de Nariño.",
      label: "Ilustración 3D referencial",
    },
  },
  comunidad: {
    ilustracion3d: {
      id: "L4-F3-C2",
      src: "/images/territorios/catalogo/veredas/L4-F3-C2.webp",
      alt: "Ilustración 3D referencial de Comunidad.",
      label: "Ilustración 3D referencial",
    },
  },
  "la-aguada": {
    ilustracion3d: {
      id: "L4-F4-C3",
      src: "/images/territorios/catalogo/veredas/L4-F4-C3.webp",
      alt: "Ilustración 3D referencial de La Aguada.",
      label: "Ilustración 3D referencial",
    },
  },
  "el-cedro": {
    ilustracion3d: {
      id: "IMG-EL-CEDRO-FINCA-CAFETERA-01",
      src: "/images/territorios/catalogo/veredas/ilustracion_el_cedro_finca_cafetera.png",
      alt: "Ilustración 3D referencial de El Cedro.",
      label: "Ilustración 3D referencial",
    },
  },
  "el-palon": {
    ilustracion3d: {
      id: "L2-F1-C4",
      src: "/images/territorios/catalogo/veredas/L2-F1-C4.webp",
      alt: "Ilustración 3D referencial de El Palón.",
      label: "Ilustración 3D referencial",
    },
  },
  chachafruta: {
    ilustracion3d: {
      id: "L3-F1-C3",
      src: "/images/territorios/catalogo/veredas/L3-F1-C3.webp",
      alt: "Ilustración 3D referencial de Chachafruta.",
      label: "Ilustración 3D referencial",
    },
  },
  "filo-de-los-arboleda": {
    ilustracion3d: {
      id: "L2-F3-C2",
      src: "/images/territorios/catalogo/veredas/L2-F3-C2.webp",
      alt: "Ilustración 3D referencial de Filo de los Arboleda.",
      label: "Ilustración 3D referencial",
    },
  },
  charrascal: {
    ilustracion3d: {
      id: "L2-F2-C4",
      src: "/images/territorios/catalogo/veredas/L2-F2-C4.webp",
      alt: "Ilustración 3D referencial de Charrascal.",
      label: "Ilustración 3D referencial",
    },
  },
  "quirimara-rodeo": {
    ilustracion3d: {
      id: "L2-F3-C3",
      src: "/images/territorios/catalogo/veredas/L2-F3-C3.webp",
      alt: "Ilustración 3D referencial de Quirimara Rodeo.",
      label: "Ilustración 3D referencial",
    },
  },
  "bosque-naranjo": {
    ilustracion3d: {
      id: "L4-F3-C3",
      src: "/images/territorios/catalogo/veredas/L4-F3-C3.webp",
      alt: "Ilustración 3D referencial de Bosque Naranjo.",
      label: "Ilustración 3D referencial",
    },
  },
  "quirimara-placitas": {
    ilustracion3d: {
      id: "L1-F1-C4",
      src: "/images/territorios/catalogo/veredas/L1-F1-C4.webp",
      alt: "Ilustración 3D referencial de Quirimara Placitas.",
      label: "Ilustración 3D referencial",
    },
  },
  jaramillo: {
    ilustracion3d: {
      id: "L3-F2-C1",
      src: "/images/territorios/catalogo/veredas/L3-F2-C1.webp",
      alt: "Ilustración 3D referencial de Jaramillo.",
      label: "Ilustración 3D referencial",
    },
  },
  "palo-blanco": {
    ilustracion3d: {
      id: "L2-F1-C1",
      src: "/images/territorios/catalogo/veredas/L2-F1-C1.webp",
      alt: "Ilustración 3D referencial de Palo Blanco.",
      label: "Ilustración 3D referencial",
    },
  },
  blanquizal: {
    ilustracion3d: {
      id: "IMG-BLANQUIZAL-PARCELA-CAFETERA-01",
      src: "/images/territorios/catalogo/veredas/ilustracion_blanquizal_parcela_cafetera.png",
      alt: "Ilustración 3D referencial de Blanquizal.",
      label: "Ilustración 3D referencial",
    },
  },
  fatima: {
    ilustracion3d: {
      id: "L2-F1-C2",
      src: "/images/territorios/catalogo/veredas/L2-F1-C2.webp",
      alt: "Ilustración 3D referencial de Fátima.",
      label: "Ilustración 3D referencial",
    },
  },
  "la-holanda": {
    ilustracion3d: {
      id: "L4-F1-C3",
      src: "/images/territorios/catalogo/veredas/L4-F1-C3.webp",
      alt: "Ilustración 3D referencial de La Holanda.",
      label: "Ilustración 3D referencial",
    },
  },
  "la-quiebra": {
    ilustracion3d: {
      id: "L4-F2-C2",
      src: "/images/territorios/catalogo/veredas/L4-F2-C2.webp",
      alt: "Ilustración 3D referencial de La Quiebra.",
      label: "Ilustración 3D referencial",
    },
  },
  "llano-de-santa-barbara": {
    ilustracion3d: {
      id: "L1-F2-C4",
      src: "/images/territorios/catalogo/veredas/L1-F2-C4.webp",
      alt: "Ilustración 3D referencial de Llano de Santa Bárbara.",
      label: "Ilustración 3D referencial",
    },
  },
  "campo-alegre": {
    ilustracion3d: {
      id: "L2-F3-C4",
      src: "/images/territorios/catalogo/veredas/L2-F3-C4.webp",
      alt: "Ilustración 3D referencial de Campo Alegre.",
      label: "Ilustración 3D referencial",
    },
  },
  "filo-de-san-jose": {
    ilustracion3d: {
      id: "L1-F3-C4",
      src: "/images/territorios/catalogo/veredas/L1-F3-C4.webp",
      alt: "Ilustración 3D referencial de Filo de San José.",
      label: "Ilustración 3D referencial",
    },
  },
  sevilla: {
    fotografiaReferencia: {
      id: "REF-SEVILLA-01",
      src: "/images/territorios/catalogo/referencias/fotografia-sevilla.png",
      alt: "Fotografía de referencia territorial de Sevilla.",
      label: "Fotografía de referencia",
    },
  },
  "cabecera-municipal": {
    ilustracion3d: {
      id: "IMG-EBEJICO-CENTRO-CABECERA-V01",
      src: "/images/territorios/catalogo/cabecera/ilustracion-3d-ebejico-centro.png",
      alt: "Ilustración 3D independiente de la cabecera municipal de Ebéjico.",
      label: "Ilustración 3D",
    },
  },
};

function normalizarNombreTerritorial(nombre: string) {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const ALIAS_NOMBRE_VEREDA: Readonly<Record<string, string>> = {
  "alto del brasil": "altos del brasil",
};

export function ilustracionDeVeredaPorNombre(nombre: string | null) {
  if (!nombre) return null;

  const nombreNormalizado = normalizarNombreTerritorial(nombre);
  const nombreCatalogo = ALIAS_NOMBRE_VEREDA[nombreNormalizado] ?? nombreNormalizado;
  const territorio = TERRITORIOS_MOCK.find(
    (item) => item.tipo === "vereda" && normalizarNombreTerritorial(item.nombre) === nombreCatalogo,
  );

  return territorio ? (recursosVisualesDeTerritorio(territorio.id)?.ilustracion3d ?? null) : null;
}

export function recursosVisualesDeTerritorio(id: string | null) {
  if (!id) return null;
  return RECURSOS_VISUALES_TERRITORIALES[id as IdTerritorioCatalogo] ?? null;
}
