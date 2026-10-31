import { ilustracionDe } from "@/lib/reportar/illustrations";
import {
  consultarCartelera,
  type MiVeredaCategoria,
  type MiVeredaPublicacion,
} from "@/lib/mi-vereda-cartelera";

export type EstadoPublico =
  | "en_revision"
  | "verificado_activo"
  | "en_atencion"
  | "verificado_solucionado"
  | "cerrado_sin_solucion"
  | "no_clasificado";

export type SeveridadPublica = "urgente" | "precaucion";

export type CoordenadasPublicas = {
  latitud: number;
  longitud: number;
};

export const ETIQUETAS_ESTADO_PUBLICO: Record<EstadoPublico, string> = {
  en_revision: "En revisión",
  verificado_activo: "Verificado y activo",
  en_atencion: "En atención",
  verificado_solucionado: "Verificado y solucionado",
  cerrado_sin_solucion: "Cerrado sin solución",
  no_clasificado: "Estado no disponible",
};

export const ETIQUETAS_CATEGORIA_PUBLICA: Record<MiVeredaCategoria, string> = {
  emergencia: "Emergencias",
  via: "Vías",
  servicio: "Servicios",
  aviso: "Avisos",
};

export const ETIQUETAS_SEVERIDAD_PUBLICA: Record<SeveridadPublica, string> = {
  urgente: "Urgente",
  precaucion: "Precaución",
};

const ESTADOS_NO_PUBLICOS = new Set(["rechazado", "retirado"]);
const ESTADOS_REVISION = new Set(["pendiente", "en observacion", "en revision"]);
const ESTADOS_ATENCION = new Set(["en atencion", "en proceso", "en intervencion"]);
const ESTADOS_ACTIVOS_EXPLICITOS = new Set(["activa", "activo", "verificado activo"]);
const ESTADOS_SOLUCIONADOS = new Set(["solucionado", "verificado solucionado"]);

export function normalizarEstadoPublico(valor: string | null | undefined) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replaceAll("_", " ")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function tieneFechaCierreValida(publicacion: MiVeredaPublicacion) {
  const cerradoEn = publicacion.cerrado_en?.trim();
  if (!cerradoEn) return false;

  const partes =
    /^(\d{4})-(\d{2})-(\d{2})(?:T(2[0-3]|[01]\d):([0-5]\d):([0-5]\d)(?:\.\d+)?(?:Z|[+-](?:(?:0\d|1[0-3]):[0-5]\d|14:00)))?$/i.exec(
      cerradoEn,
    );
  if (!partes || !Number.isFinite(Date.parse(cerradoEn))) return false;

  const anio = Number(partes[1]);
  const mes = Number(partes[2]);
  const dia = Number(partes[3]);
  if (anio < 1 || mes < 1 || mes > 12) return false;

  const esBisiesto = anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
  const diasEnMes = mes === 2 ? (esBisiesto ? 29 : 28) : [4, 6, 9, 11].includes(mes) ? 30 : 31;
  return dia >= 1 && dia <= diasEnMes;
}

/**
 * Convierte estados operativos/resultados internos en una etiqueta pública.
 * Los reportes normales pendientes no son públicos; la excepción provisional
 * se limita a emergencias pendientes de verificación.
 */
export function estadoPublicoDe(publicacion: MiVeredaPublicacion): EstadoPublico | null {
  const resultado = normalizarEstadoPublico(publicacion.resultado);
  const estado = normalizarEstadoPublico(publicacion.estado_operativo);

  if (ESTADOS_NO_PUBLICOS.has(resultado) || ESTADOS_NO_PUBLICOS.has(estado)) return null;

  if (resultado === "no solucionado") {
    if (tieneFechaCierreValida(publicacion)) return "cerrado_sin_solucion";
    return "no_clasificado";
  }

  if (ESTADOS_REVISION.has(resultado) || ESTADOS_REVISION.has(estado)) {
    return publicacion.categoria === "emergencia" ? "en_revision" : null;
  }

  if (ESTADOS_SOLUCIONADOS.has(resultado) || ESTADOS_SOLUCIONADOS.has(estado)) {
    return "verificado_solucionado";
  }

  // «En atención» se reconoce solo con un valor explícito; no se infiere de
  // antigüedad, severidad ni de una condición específica de la categoría.
  if (ESTADOS_ATENCION.has(resultado) || ESTADOS_ATENCION.has(estado)) return "en_atencion";

  if (ESTADOS_ACTIVOS_EXPLICITOS.has(resultado) || ESTADOS_ACTIVOS_EXPLICITOS.has(estado)) {
    return "verificado_activo";
  }

  // Un estado desconocido puede permanecer visible si la consulta pública ya
  // lo autorizó, pero no se presenta como verificado.
  return "no_clasificado";
}

export function esEmergenciaEnRevision(publicacion: MiVeredaPublicacion) {
  return publicacion.categoria === "emergencia" && estadoPublicoDe(publicacion) === "en_revision";
}

/** La severidad pública solo existe para Emergencias y Vías. */
export function severidadPublicaDe(
  publicacion: Pick<MiVeredaPublicacion, "categoria" | "nivel">,
): SeveridadPublica | null {
  if (publicacion.categoria !== "emergencia" && publicacion.categoria !== "via") return null;

  const nivel = normalizarEstadoPublico(publicacion.nivel);
  if (nivel === "urgente") return "urgente";
  if (nivel === "atencion" || nivel === "precaucion") return "precaucion";
  return null;
}

export function esPublicacionPublica(publicacion: MiVeredaPublicacion) {
  return estadoPublicoDe(publicacion) !== null;
}

/**
 * Las coordenadas solo salen al visor cuando el contrato público marca su
 * divulgación como segura. La ausencia de esa señal mantiene la ubicación
 * fuera de la marca de agua, sin inventar aproximaciones en el frontend.
 */
export function coordenadasPublicasDe(
  publicacion: Pick<MiVeredaPublicacion, "latitud" | "longitud" | "coordenadas_publicas">,
): CoordenadasPublicas | null {
  if (publicacion.coordenadas_publicas !== true) return null;
  if (typeof publicacion.latitud !== "number" || typeof publicacion.longitud !== "number") {
    return null;
  }
  if (
    !Number.isFinite(publicacion.latitud) ||
    !Number.isFinite(publicacion.longitud) ||
    publicacion.latitud < -90 ||
    publicacion.latitud > 90 ||
    publicacion.longitud < -180 ||
    publicacion.longitud > 180
  ) {
    return null;
  }

  return {
    latitud: publicacion.latitud,
    longitud: publicacion.longitud,
  };
}

export function etiquetaCategoria(categoria: MiVeredaCategoria) {
  return ETIQUETAS_CATEGORIA_PUBLICA[categoria];
}

export function ilustracionPublicaDe(publicacion: MiVeredaPublicacion) {
  const tipo = normalizarEstadoPublico(publicacion.tipo).replaceAll(" ", "_");
  const candidatos = [tipo];

  if (publicacion.categoria === "emergencia") candidatos.push("otra_emergencia");
  if (publicacion.categoria === "via") candidatos.push("otro_problema_vial");
  if (publicacion.categoria === "servicio") candidatos.push("otro_servicio", "otro");
  if (publicacion.categoria === "aviso") candidatos.push("otro_aviso", "aviso_comunitario");

  for (const candidato of candidatos) {
    const ruta = ilustracionDe(candidato);
    if (ruta) return ruta;
  }

  return "/images/reportar/illustrations/avisos/aviso.webp";
}

export function fechaPublica(valor: string | null | undefined) {
  if (!valor) return "Fecha no disponible";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Fecha no disponible";
  return fecha.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function horaPublica(valor: string | null | undefined) {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return null;
  return fecha.toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fechaHoraPublica(valor: string | null | undefined) {
  const fecha = fechaPublica(valor);
  const hora = horaPublica(valor);
  return hora ? `${fecha} · ${hora}` : fecha;
}

export function detalleReporteHref(publicacionId: string) {
  return `/reportes/${encodeURIComponent(publicacionId)}`;
}

export async function consultarReportePublicoPorId(publicacionId: string) {
  const categorias: MiVeredaCategoria[] = ["emergencia", "via", "servicio", "aviso"];
  const respuestas = await Promise.all(
    categorias.map((categoria) =>
      consultarCartelera({
        p_categoria: categoria,
        p_limit: 100,
        p_offset: 0,
        p_excluir_nivel_normal: false,
      }),
    ),
  );

  return (
    respuestas
      .flat()
      .find(
        (publicacion) =>
          publicacion.publicacion_id === publicacionId && esPublicacionPublica(publicacion),
      ) ?? null
  );
}
