import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import {
  consultarPublicacionesCerradas,
  type MiVeredaCategoria,
  type MiVeredaPublicacion,
} from "@/lib/mi-vereda-cartelera";

export type AdminVeredaOption = {
  id: string;
  nombre: string;
  activa: boolean;
};

export type AdminPublicationRecord = {
  id: string;
  publicacion_tabla: "emergencias" | "vias" | "servicios" | "avisos";
  categoria: "emergencia" | "via" | "servicio" | "aviso";
  titulo: string;
  descripcion: string | null;
  estado_operativo: string | null;
  created_at: string;
  vereda_id: string;
  lugar: string | null;
  cerrado_en: string | null;
  resultado: string | null;
  razon_cierre: string | null;
  foto_url: string | null;
  nivel: string | null;
  tipo: string | null;
};

export type AdminHistoryStatus = "solucionado" | "cerrado" | "rechazado";

export type AdminHistoryItem = {
  id: string;
  tipoRegistro: "publicacion" | "reporte";
  estado: AdminHistoryStatus;
  fecha: string;
  publicacion: MiVeredaPublicacion;
  motivoRechazo: string | null;
};

export type AdminRejectedReportDetail = Pick<
  Database["public"]["Tables"]["reportes"]["Row"],
  | "id"
  | "categoria"
  | "titulo"
  | "descripcion"
  | "created_at"
  | "revisado_en"
  | "vereda_id"
  | "lugar"
  | "foto_url"
  | "nivel"
> & {
  vereda_nombre: string | null;
  motivo_rechazo: string | null;
};

export type AdminReportDetail = Pick<
  Database["public"]["Tables"]["reportes"]["Row"],
  | "id"
  | "categoria"
  | "titulo"
  | "descripcion"
  | "estado"
  | "created_at"
  | "revisado_en"
  | "vereda_id"
  | "lugar"
  | "foto_url"
  | "nivel"
  | "publicacion_id"
  | "publicacion_tabla"
> & {
  vereda_nombre: string | null;
  motivo_rechazo: string | null;
};

export async function consultarVeredasAdmin(): Promise<AdminVeredaOption[]> {
  const { data, error } = await supabase
    .from("veredas")
    .select("id, nombre, activa")
    .order("nombre");
  if (error) throw error;
  return data ?? [];
}

/** Lee las cuatro tablas de publicación usando solo columnas existentes y no cerradas. */
export async function consultarPublicacionesActivasAdmin(): Promise<AdminPublicationRecord[]> {
  const [emergencias, vias, servicios, avisos] = await Promise.all([
    supabase
      .from("emergencias")
      .select(
        "id, titulo, descripcion, estado, created_at, vereda_id, lugar, cerrado_en, resultado, razon_cierre, foto_url, nivel",
      )
      .is("cerrado_en", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("vias")
      .select(
        "id, titulo, descripcion, estado, created_at, vereda_id, lugar, cerrado_en, resultado, razon_cierre, foto_url, nivel",
      )
      .is("cerrado_en", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("servicios")
      .select(
        "id, titulo, descripcion, estado, created_at, vereda_id, lugar, cerrado_en, resultado, razon_cierre, foto_url, nivel, tipo",
      )
      .is("cerrado_en", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("avisos")
      .select(
        "id, titulo, descripcion, created_at, vereda_id, lugar, cerrado_en, resultado, razon_cierre",
      )
      .is("cerrado_en", null)
      .order("created_at", { ascending: false }),
  ]);

  for (const result of [emergencias, vias, servicios, avisos]) {
    if (result.error) throw result.error;
  }

  const registros: AdminPublicationRecord[] = [
    ...(emergencias.data ?? []).map((row) => ({
      id: row.id,
      publicacion_tabla: "emergencias" as const,
      categoria: "emergencia" as const,
      titulo: row.titulo,
      descripcion: row.descripcion,
      estado_operativo: row.estado,
      created_at: row.created_at,
      vereda_id: row.vereda_id,
      lugar: row.lugar,
      cerrado_en: row.cerrado_en,
      resultado: row.resultado,
      razon_cierre: row.razon_cierre,
      foto_url: row.foto_url,
      nivel: row.nivel,
      tipo: null,
    })),
    ...(vias.data ?? []).map((row) => ({
      id: row.id,
      publicacion_tabla: "vias" as const,
      categoria: "via" as const,
      titulo: row.titulo,
      descripcion: row.descripcion,
      estado_operativo: row.estado,
      created_at: row.created_at,
      vereda_id: row.vereda_id,
      lugar: row.lugar,
      cerrado_en: row.cerrado_en,
      resultado: row.resultado,
      razon_cierre: row.razon_cierre,
      foto_url: row.foto_url,
      nivel: row.nivel,
      tipo: null,
    })),
    ...(servicios.data ?? []).map((row) => ({
      id: row.id,
      publicacion_tabla: "servicios" as const,
      categoria: "servicio" as const,
      titulo: row.titulo,
      descripcion: row.descripcion,
      estado_operativo: row.estado,
      created_at: row.created_at,
      vereda_id: row.vereda_id,
      lugar: row.lugar,
      cerrado_en: row.cerrado_en,
      resultado: row.resultado,
      razon_cierre: row.razon_cierre,
      foto_url: row.foto_url,
      nivel: row.nivel,
      tipo: row.tipo,
    })),
    ...(avisos.data ?? []).map((row) => ({
      id: row.id,
      publicacion_tabla: "avisos" as const,
      categoria: "aviso" as const,
      titulo: row.titulo,
      descripcion: row.descripcion,
      estado_operativo: null,
      created_at: row.created_at,
      vereda_id: row.vereda_id,
      lugar: row.lugar,
      cerrado_en: row.cerrado_en,
      resultado: row.resultado,
      razon_cierre: row.razon_cierre,
      foto_url: null,
      nivel: null,
      tipo: null,
    })),
  ];

  return registros.sort((left, right) => right.created_at.localeCompare(left.created_at));
}

function categoriaYTablaDeReporte(categoria: string): {
  categoria: MiVeredaCategoria;
  tabla: MiVeredaPublicacion["publicacion_tabla"];
} | null {
  if (categoria === "emergencia") return { categoria, tabla: "emergencias" };
  if (categoria === "via") return { categoria, tabla: "vias" };
  if (categoria === "servicio") return { categoria, tabla: "servicios" };
  if (categoria === "aviso" || categoria === "otro") {
    return { categoria: "aviso", tabla: "avisos" };
  }
  return null;
}

function adaptarReporteRechazadoParaTarjeta(
  reporte: Pick<
    Database["public"]["Tables"]["reportes"]["Row"],
    | "id"
    | "categoria"
    | "titulo"
    | "descripcion"
    | "created_at"
    | "revisado_en"
    | "vereda_id"
    | "lugar"
    | "foto_url"
    | "nivel"
  > & { veredas: { nombre: string } | null },
): MiVeredaPublicacion | null {
  const tipo = categoriaYTablaDeReporte(reporte.categoria);
  if (!tipo) return null;

  // Modelo de presentación únicamente: el detalle conserva registro="reporte" y consulta la fila original.
  return {
    publicacion_tabla: tipo.tabla,
    publicacion_id: reporte.id,
    vereda_id: reporte.vereda_id,
    categoria: tipo.categoria,
    titulo: reporte.titulo,
    descripcion: reporte.descripcion,
    lugar: reporte.lugar,
    estado_operativo: "rechazado",
    resultado: "rechazado",
    cerrado_en: reporte.revisado_en,
    foto_url: reporte.foto_url,
    fecha_evento: reporte.created_at,
    created_at: reporte.created_at,
    nivel: reporte.nivel,
    tipo: null,
    vereda_nombre: reporte.veredas?.nombre ?? null,
  };
}

async function consultarMotivosRechazo(reporteIds: string[]) {
  if (reporteIds.length === 0) return new Map<string, string | null>();

  const { data, error } = await supabase
    .from("auditoria_admin")
    .select("reporte_id, accion, motivo, ocurrido_en")
    .eq("accion", "reporte_rechazado")
    .in("reporte_id", reporteIds)
    .order("ocurrido_en", { ascending: false });
  if (error) throw error;

  const motivos = new Map<string, string | null>();
  for (const evento of data ?? []) {
    if (evento.reporte_id && !motivos.has(evento.reporte_id)) {
      motivos.set(evento.reporte_id, evento.motivo);
    }
  }
  return motivos;
}

export async function consultarHistorialSuperadmin(): Promise<AdminHistoryItem[]> {
  const [cerradas, rechazadosResultado] = await Promise.all([
    consultarPublicacionesCerradas(),
    supabase
      .from("reportes")
      .select(
        "id, categoria, titulo, descripcion, estado, created_at, revisado_en, vereda_id, lugar, foto_url, nivel, veredas(nombre)",
      )
      .eq("estado", "rechazado")
      .order("revisado_en", { ascending: false }),
  ]);
  if (rechazadosResultado.error) throw rechazadosResultado.error;

  const rechazados = rechazadosResultado.data ?? [];
  const motivos = await consultarMotivosRechazo(rechazados.map((reporte) => reporte.id));
  const historialPublicaciones: AdminHistoryItem[] = cerradas
    .filter(
      (publicacion) =>
        publicacion.resultado === "solucionado" || publicacion.resultado === "no_solucionado",
    )
    .map((publicacion) => ({
      id: `${publicacion.publicacion_tabla}-${publicacion.publicacion_id}`,
      tipoRegistro: "publicacion",
      estado: publicacion.resultado === "solucionado" ? "solucionado" : "cerrado",
      fecha: publicacion.cerrado_en,
      publicacion,
      motivoRechazo: null,
    }));
  const historialRechazos: AdminHistoryItem[] = rechazados.flatMap((reporte) => {
    const publicacion = adaptarReporteRechazadoParaTarjeta(reporte);
    if (!publicacion) return [];
    return [
      {
        id: `reporte-${reporte.id}`,
        tipoRegistro: "reporte",
        estado: "rechazado",
        fecha: reporte.revisado_en ?? reporte.created_at,
        publicacion,
        motivoRechazo: motivos.get(reporte.id) ?? null,
      },
    ];
  });

  return [...historialPublicaciones, ...historialRechazos].sort((left, right) =>
    right.fecha.localeCompare(left.fecha),
  );
}

export async function consultarReporteRechazadoSuperadmin(
  reporteId: string,
): Promise<AdminRejectedReportDetail | null> {
  if (!reporteId.trim()) return null;
  const { data, error } = await supabase
    .from("reportes")
    .select(
      "id, categoria, titulo, descripcion, estado, created_at, revisado_en, vereda_id, lugar, foto_url, nivel, veredas(nombre)",
    )
    .eq("id", reporteId)
    .eq("estado", "rechazado")
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const motivos = await consultarMotivosRechazo([reporteId]);
  return {
    id: data.id,
    categoria: data.categoria,
    titulo: data.titulo,
    descripcion: data.descripcion,
    created_at: data.created_at,
    revisado_en: data.revisado_en,
    vereda_id: data.vereda_id,
    lugar: data.lugar,
    foto_url: data.foto_url,
    nivel: data.nivel,
    vereda_nombre: data.veredas?.nombre ?? null,
    motivo_rechazo: motivos.get(reporteId) ?? null,
  };
}

export async function consultarReporteSuperadminPorId(
  reporteId: string,
): Promise<AdminReportDetail | null> {
  if (!reporteId.trim()) return null;
  const { data, error } = await supabase
    .from("reportes")
    .select(
      "id, categoria, titulo, descripcion, estado, created_at, revisado_en, vereda_id, lugar, foto_url, nivel, publicacion_id, publicacion_tabla, veredas(nombre)",
    )
    .eq("id", reporteId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  const motivos = data.estado === "rechazado" ? await consultarMotivosRechazo([reporteId]) : null;
  return {
    id: data.id,
    categoria: data.categoria,
    titulo: data.titulo,
    descripcion: data.descripcion,
    estado: data.estado,
    created_at: data.created_at,
    revisado_en: data.revisado_en,
    vereda_id: data.vereda_id,
    lugar: data.lugar,
    foto_url: data.foto_url,
    nivel: data.nivel,
    publicacion_id: data.publicacion_id,
    publicacion_tabla: data.publicacion_tabla,
    vereda_nombre: data.veredas?.nombre ?? null,
    motivo_rechazo: motivos?.get(reporteId) ?? null,
  };
}
