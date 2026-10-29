import { ilustracionDe } from "@/lib/reportar/illustrations";
import {
  consultarCartelera,
  type MiVeredaCategoria,
  type MiVeredaPublicacion,
} from "@/lib/mi-vereda-cartelera";

export type EstadoPublico = "en_revision" | "verificado_activo" | "verificado_solucionado";

export type SeveridadPublica = "urgente" | "precaucion";

export type CoordenadasPublicas = {
  latitud: number;
  longitud: number;
};

export const ETIQUETAS_ESTADO_PUBLICO: Record<EstadoPublico, string> = {
  en_revision: "En revisión",
  verificado_activo: "Verificado y activo",
  verificado_solucionado: "Verificado y solucionado",
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

const ESTADOS_RECHAZADOS = new Set(["rechazado", "retirado"]);
const ESTADOS_REVISION = new Set(["pendiente", "en observacion", "en revision"]);
const ESTADOS_ACTIVOS = new Set([
  "activa",
  "activo",
  "habilitada",
  "habilitado",
  "publicado",
  "publicada",
  "precaucion",
  "cerrada",
  "normal",
]);

function normalizar(valor: string | null | undefined) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Convierte estados operativos/resultados internos en una etiqueta pública.
 * Los reportes normales pendientes no son públicos; la excepción provisional
 * se limita a emergencias pendientes de verificación.
 */
export function estadoPublicoDe(publicacion: MiVeredaPublicacion): EstadoPublico | null {
  const resultado = normalizar(publicacion.resultado);
  const estado = normalizar(publicacion.estado_operativo);

  if (ESTADOS_RECHAZADOS.has(resultado) || resultado === "no solucionado") return null;
  if (resultado === "solucionado") return "verificado_solucionado";

  if (ESTADOS_REVISION.has(estado)) {
    return publicacion.categoria === "emergencia" ? "en_revision" : null;
  }

  // La cartelera pública actual ya devuelve publicaciones visibles. Cuando el
  // contrato no trae una etiqueta operativa reconocible, se conserva esa
  // visibilidad como publicación activa sin exponer el valor interno.
  if (!estado || ESTADOS_ACTIVOS.has(estado)) return "verificado_activo";

  return "verificado_activo";
}

export function esEmergenciaEnRevision(publicacion: MiVeredaPublicacion) {
  return publicacion.categoria === "emergencia" && estadoPublicoDe(publicacion) === "en_revision";
}

/** La severidad pública solo existe para Emergencias y Vías. */
export function severidadPublicaDe(
  publicacion: Pick<MiVeredaPublicacion, "categoria" | "nivel">,
): SeveridadPublica | null {
  if (publicacion.categoria !== "emergencia" && publicacion.categoria !== "via") return null;

  const nivel = normalizar(publicacion.nivel);
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
  const tipo = normalizar(publicacion.tipo).replaceAll(" ", "_");
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
