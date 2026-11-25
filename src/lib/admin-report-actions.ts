import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { ResultadoCierre, Severidad, TipoServicio } from "@/lib/alerta";

type ReporteParaVerificar = Pick<
  Database["public"]["Tables"]["reportes"]["Row"],
  "id" | "categoria" | "nivel"
>;
type ReporteParaRechazar = Pick<Database["public"]["Tables"]["reportes"]["Row"], "id">;
type EstadoEmergencia = "Activa" | "En observación";
type EstadoServicio = "Normal" | "Intermitente" | "Interrumpido";

export type OpcionesVerificacionReporte = {
  nivel: Severidad;
  estadoEmergencia: EstadoEmergencia;
  estadoServicio: EstadoServicio;
  tipoServicio: TipoServicio;
};

export type CierrePublicacionAdmin = {
  tabla: "emergencias" | "vias" | "servicios" | "avisos";
  id: string;
  resultado: ResultadoCierre;
  motivo?: string;
};

/** Conserva el contrato existente de aprobar_reporte; no introduce RPC nuevas. */
export async function verificarReporteAdmin(
  reporte: ReporteParaVerificar,
  opciones: OpcionesVerificacionReporte,
) {
  const { error } = await supabase.rpc("aprobar_reporte", {
    p_reporte_id: reporte.id,
    p_modo: "crear",
    ...(reporte.categoria === "via"
      ? {
          p_estado_inicial:
            opciones.nivel === "urgente"
              ? "Cerrada"
              : opciones.nivel === "atencion"
                ? "Precaución"
                : "Habilitada",
        }
      : {}),
    ...(reporte.categoria === "servicio"
      ? {
          p_estado_inicial: opciones.estadoServicio,
          p_tipo_servicio: opciones.tipoServicio,
        }
      : {}),
    ...(reporte.categoria === "emergencia"
      ? { p_emergencia_estado: opciones.estadoEmergencia }
      : {}),
  });
  if (error) throw error;
}

/** Conserva el contrato existente de rechazar_reporte, con motivo obligatorio. */
export async function rechazarReporteAdmin(reporte: ReporteParaRechazar, motivo: string) {
  const { error } = await supabase.rpc("rechazar_reporte", {
    p_reporte_id: reporte.id,
    p_motivo: motivo,
  });
  if (error) throw error;
}

/** Conserva las operaciones ya existentes de cierre y retiro de publicaciones. */
export async function cerrarPublicacionAdmin({
  tabla,
  id,
  resultado,
  motivo,
}: CierrePublicacionAdmin) {
  if (resultado === "retirado") {
    const { error } = await supabase.rpc("retirar_publicacion", {
      p_tabla: tabla,
      p_id: id,
      ...(motivo ? { p_motivo: motivo } : {}),
      p_finalizacion_natural: false,
    });
    if (error) throw error;
    return;
  }

  const { error } = await supabase.rpc("cerrar_publicacion", {
    p_tabla: tabla,
    p_id: id,
    p_resultado: resultado,
    ...(motivo ? { p_motivo: motivo } : {}),
  });
  if (error) throw error;
}
