import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { adminQueryKeys } from "@/lib/admin-query-keys";
import type { AdminReportDetail } from "@/lib/admin-data";
import type { MiVeredaPublicacion } from "@/lib/mi-vereda-cartelera";
import {
  cerrarPublicacionAdmin,
  rechazarReporteAdmin,
  verificarReporteAdmin,
} from "@/lib/admin-report-actions";
import { adminPreviewBridge, type AdminPreviewComment } from "@/lib/admin-preview-bridge";
import { useAuth } from "@/hooks/use-auth";
import {
  LABEL_SEVERIDAD,
  LABEL_TIPO_SERVICIO,
  type ResultadoCierre,
  type Severidad,
  type TipoServicio,
} from "@/lib/alerta";
import type { EstadoPublico } from "@/lib/reportes-publicos";
import "@/components/admin/reporte-detalle-acciones.css";

type EstadoEmergencia = "Activa" | "En observación";
type EstadoServicio = "Normal" | "Intermitente" | "Interrumpido";

async function invalidarVistasAdmin(queryClient: ReturnType<typeof useQueryClient>) {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ["reporte-admin-detalle"] }),
    queryClient.invalidateQueries({ queryKey: ["reporte-rechazado-superadmin"] }),
    queryClient.invalidateQueries({ queryKey: ["reporte-publico-detalle"] }),
    queryClient.invalidateQueries({ queryKey: ["reportes-publicos"] }),
    queryClient.invalidateQueries({ queryKey: ["historial-superadmin"] }),
    queryClient.invalidateQueries({ queryKey: ["publicaciones-cerradas-admin"] }),
    queryClient.invalidateQueries({ queryKey: ["emergencias"] }),
    queryClient.invalidateQueries({ queryKey: ["vias"] }),
    queryClient.invalidateQueries({ queryKey: ["servicios"] }),
    queryClient.invalidateQueries({ queryKey: ["avisos"] }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.reports.all }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.publications.all }),
    queryClient.invalidateQueries({ queryKey: adminQueryKeys.activity.all }),
  ]);
}

export function ReportePendienteAcciones({ reporte }: { reporte: AdminReportDetail }) {
  const { esSuperadmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [motivo, setMotivo] = useState("");
  const [nivel, setNivel] = useState<Severidad>(nivelInicial(reporte.nivel));
  const [estadoEmergencia, setEstadoEmergencia] = useState<EstadoEmergencia>("Activa");
  const [estadoServicio, setEstadoServicio] = useState<EstadoServicio>("Normal");
  const [tipoServicio, setTipoServicio] = useState<TipoServicio>("agua");

  const verificar = useMutation({
    mutationFn: async () => {
      if (adminPreviewBridge.enabled) {
        const simulado = await adminPreviewBridge.verifyReport({
          id: reporte.id,
          options: { nivel, estadoEmergencia, estadoServicio, tipoServicio },
        });
        if (!simulado) throw new Error("El preview no pudo simular la verificación.");
        return "demo" as const;
      }
      await verificarReporteAdmin(reporte, {
        nivel,
        estadoEmergencia,
        estadoServicio,
        tipoServicio,
      });
      return "real" as const;
    },
    onSuccess: async (resultado) => {
      toast.success(
        resultado === "demo"
          ? "DEMO · Reporte verificado solo en memoria; se restablecerá al recargar."
          : "Reporte verificado y publicado.",
      );
      await invalidarVistasAdmin(queryClient);
      await navigate({ to: "/admin/reportes" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const rechazar = useMutation({
    mutationFn: async (motivoRechazo: string) => {
      if (adminPreviewBridge.enabled) {
        const simulado = await adminPreviewBridge.rejectReport({ id: reporte.id }, motivoRechazo);
        if (!simulado) throw new Error("El preview no pudo simular el rechazo.");
        return "demo" as const;
      }
      await rechazarReporteAdmin(reporte, motivoRechazo);
      return "real" as const;
    },
    onSuccess: async (resultado) => {
      toast.success(
        resultado === "demo"
          ? "DEMO · Reporte rechazado solo en memoria; se restablecerá al recargar."
          : "Reporte rechazado.",
      );
      await invalidarVistasAdmin(queryClient);
      await navigate({ to: "/admin/reportes" });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!esSuperadmin || reporte.estado !== "pendiente") return null;

  const ocupado = verificar.isPending || rechazar.isPending;
  const confirmarVerificacion = () => {
    const mensaje = adminPreviewBridge.enabled
      ? "DEMO: esta simulación solo actualizará datos ficticios en memoria y se perderá al recargar. ¿Continuar?"
      : "¿Confirmas verificar y publicar este reporte?";
    if (window.confirm(mensaje)) verificar.mutate();
  };
  const confirmarRechazo = () => {
    const motivoLimpio = motivo.trim();
    if (!motivoLimpio) {
      toast.error("Escribe el motivo del rechazo.");
      return;
    }
    const mensaje = adminPreviewBridge.enabled
      ? "DEMO: el rechazo y su motivo se guardarán solo en memoria y se perderán al recargar. ¿Continuar?"
      : "¿Confirmas rechazar este reporte con el motivo indicado?";
    if (window.confirm(mensaje)) rechazar.mutate(motivoLimpio);
  };

  return (
    <section
      className="report-detail-admin-actions"
      aria-labelledby="report-detail-admin-actions-title"
    >
      <p className="reportes-eyebrow">Revisión administrativa</p>
      <h2 id="report-detail-admin-actions-title">Decisión sobre el reporte</h2>
      {adminPreviewBridge.enabled && (
        <p className="report-detail-admin-demo-note">
          DEMO · Datos ficticios; las acciones son efímeras y no realizan escrituras ni llamadas
          RPC.
        </p>
      )}
      {(reporte.categoria === "emergencia" || reporte.categoria === "via") && (
        <label className="report-detail-admin-field">
          <span>Nivel</span>
          <select value={nivel} onChange={(event) => setNivel(event.target.value as Severidad)}>
            {(Object.keys(LABEL_SEVERIDAD) as Severidad[]).map((opcion) => (
              <option key={opcion} value={opcion}>
                {LABEL_SEVERIDAD[opcion]}
              </option>
            ))}
          </select>
        </label>
      )}
      {reporte.categoria === "emergencia" && (
        <label className="report-detail-admin-field">
          <span>Estado de la emergencia</span>
          <select
            value={estadoEmergencia}
            onChange={(event) => setEstadoEmergencia(event.target.value as EstadoEmergencia)}
          >
            <option value="Activa">Activa</option>
            <option value="En observación">En observación</option>
          </select>
        </label>
      )}
      {reporte.categoria === "servicio" && (
        <div className="report-detail-admin-field-grid">
          <label className="report-detail-admin-field">
            <span>Tipo de servicio</span>
            <select
              value={tipoServicio}
              onChange={(event) => setTipoServicio(event.target.value as TipoServicio)}
            >
              {(Object.keys(LABEL_TIPO_SERVICIO) as TipoServicio[]).map((opcion) => (
                <option key={opcion} value={opcion}>
                  {LABEL_TIPO_SERVICIO[opcion]}
                </option>
              ))}
            </select>
          </label>
          <label className="report-detail-admin-field">
            <span>Estado del servicio</span>
            <select
              value={estadoServicio}
              onChange={(event) => setEstadoServicio(event.target.value as EstadoServicio)}
            >
              <option value="Normal">Normal</option>
              <option value="Intermitente">Intermitente</option>
              <option value="Interrumpido">Interrumpido</option>
            </select>
          </label>
        </div>
      )}
      <div className="report-detail-admin-button-row">
        <button
          type="button"
          className="admin-primary-action"
          onClick={confirmarVerificacion}
          disabled={ocupado}
        >
          {verificar.isPending ? "Verificando…" : "Verificar reporte"}
        </button>
      </div>
      <label className="report-detail-admin-field">
        <span>Motivo del rechazo</span>
        <textarea
          value={motivo}
          onChange={(event) => setMotivo(event.target.value)}
          rows={3}
          maxLength={1000}
          required
          aria-describedby="report-detail-rejection-help"
        />
      </label>
      <p id="report-detail-rejection-help" className="report-detail-admin-help">
        El motivo es obligatorio y solo se mostrará en el historial administrativo cuando el
        registro de auditoría lo conserve.
      </p>
      <div className="report-detail-admin-button-row">
        <button
          type="button"
          className="admin-danger-action"
          onClick={confirmarRechazo}
          disabled={ocupado || !motivo.trim()}
        >
          {rechazar.isPending ? "Rechazando…" : "Rechazar reporte"}
        </button>
      </div>
    </section>
  );
}

export function PublicacionDetalleAcciones({
  publicacion,
  estado,
}: {
  publicacion: MiVeredaPublicacion;
  estado: EstadoPublico;
}) {
  const { esSuperadmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [comentario, setComentario] = useState("");
  const [comentarios, setComentarios] = useState<AdminPreviewComment[]>(() =>
    adminPreviewBridge.getComments({
      table: publicacion.publicacion_tabla,
      id: publicacion.publicacion_id,
    }),
  );
  const [procesandoAtencion, setProcesandoAtencion] = useState(false);
  const [motivoCierre, setMotivoCierre] = useState("");
  const [cierreSeleccionado, setCierreSeleccionado] = useState<Exclude<
    ResultadoCierre,
    "solucionado"
  > | null>(null);

  const cierre = useMutation({
    mutationFn: (resultado: ResultadoCierre) =>
      cerrarPublicacionAdmin({
        tabla: publicacion.publicacion_tabla,
        id: publicacion.publicacion_id,
        resultado,
        ...(resultado !== "solucionado" ? { motivo: motivoCierre.trim() } : {}),
      }),
    onSuccess: async (_resultado, resultado) => {
      toast.success("Publicación actualizada con la operación existente.");
      await invalidarVistasAdmin(queryClient);
      if (resultado === "retirado") {
        await navigate({ to: "/reportes/todos", search: { contexto: "publicaciones" } });
      } else {
        await navigate({ to: "/reportes/todos", search: { contexto: "historial" } });
      }
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (!esSuperadmin) return null;
  const esVerificadaActiva = estado === "verificado_activo" || estado === "en_atencion";
  if (!esVerificadaActiva) return null;

  const target = { table: publicacion.publicacion_tabla, id: publicacion.publicacion_id } as const;
  const simularAtencion = async () => {
    setProcesandoAtencion(true);
    try {
      const realizado = await adminPreviewBridge.markInAttention(target);
      if (!realizado) throw new Error("La simulación En atención no está disponible.");
      toast.success("DEMO · Publicación marcada En atención solo en memoria.");
      await queryClient.invalidateQueries({
        queryKey: ["reporte-publico-detalle", publicacion.publicacion_id],
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["reportes-publicos"] }),
        queryClient.invalidateQueries({ queryKey: [publicacion.publicacion_tabla] }),
      ]);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "No se pudo actualizar la demostración.",
      );
    } finally {
      setProcesandoAtencion(false);
    }
  };

  const agregarComentario = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const texto = comentario.trim();
    if (!texto) return;
    try {
      const agregado = await adminPreviewBridge.addComment(target, texto);
      if (!agregado) throw new Error("Los comentarios solo están disponibles en el preview DEMO.");
      setComentarios(adminPreviewBridge.getComments(target));
      setComentario("");
      toast.success("DEMO · Comentario guardado solo en memoria.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo agregar el comentario.");
    }
  };

  const comenzarCierre = (resultado: ResultadoCierre) => {
    if (adminPreviewBridge.enabled) return;
    if (resultado === "solucionado") {
      if (window.confirm("¿Confirmas marcar esta publicación como solucionada?")) {
        cierre.mutate(resultado);
      }
      return;
    }
    setMotivoCierre("");
    setCierreSeleccionado(resultado);
  };

  const confirmarCierreConMotivo = () => {
    if (!cierreSeleccionado || !motivoCierre.trim()) return;
    const etiqueta = cierreSeleccionado === "retirado" ? "retirar" : "cerrar sin solución";
    if (window.confirm(`¿Confirmas ${etiqueta} esta publicación con el motivo indicado?`)) {
      cierre.mutate(cierreSeleccionado, {
        onSuccess: () => {
          setCierreSeleccionado(null);
          setMotivoCierre("");
        },
      });
    }
  };

  return (
    <section
      className="report-detail-admin-actions"
      aria-labelledby="publication-admin-actions-title"
    >
      <p className="reportes-eyebrow">Seguimiento administrativo</p>
      <h2 id="publication-admin-actions-title">Acciones de la publicación</h2>
      <p className="report-detail-admin-status-copy">
        Estado actual:{" "}
        <strong>{estado === "en_atencion" ? "En atención" : "Verificado y activo"}</strong>
      </p>
      {adminPreviewBridge.enabled ? (
        <>
          <p className="report-detail-admin-demo-note">
            DEMO · Las interacciones siguientes son ficticias, solo en memoria y se pierden al
            recargar.
          </p>
          {estado !== "en_atencion" && (
            <button
              type="button"
              className="admin-primary-action"
              onClick={() => void simularAtencion()}
              disabled={procesandoAtencion}
            >
              {procesandoAtencion ? "Actualizando…" : "Marcar en atención"}
            </button>
          )}
          <form className="report-detail-admin-comment-form" onSubmit={agregarComentario}>
            <label className="report-detail-admin-field" htmlFor="publication-demo-comment">
              <span>Comentario administrativo DEMO</span>
              <textarea
                id="publication-demo-comment"
                value={comentario}
                onChange={(event) => setComentario(event.target.value)}
                rows={3}
                maxLength={1000}
                placeholder="Escribe un comentario ficticio…"
              />
            </label>
            <button type="submit" className="admin-secondary-action" disabled={!comentario.trim()}>
              Agregar comentario DEMO
            </button>
          </form>
          {comentarios.length > 0 && (
            <ul
              className="report-detail-admin-comments"
              aria-label="Comentarios ficticios"
              aria-live="polite"
            >
              {comentarios.map((item) => (
                <li key={item.id}>
                  <strong>{item.author}</strong>
                  <p>{item.text}</p>
                  <time dateTime={item.createdAt}>
                    {new Date(item.createdAt).toLocaleString("es-CO", {
                      timeZone: "America/Bogota",
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </time>
                </li>
              ))}
            </ul>
          )}
          <p className="report-detail-admin-demo-note">
            Las operaciones de cierre y retiro no se ejecutan desde el preview.
          </p>
        </>
      ) : (
        <>
          <p className="report-detail-admin-help">
            «En atención» y los comentarios requieren soporte de backend todavía no aprobado; por
            eso no se habilitan en esta aplicación.
          </p>
          {cierreSeleccionado ? (
            <div className="report-detail-admin-close-form">
              <label className="report-detail-admin-field" htmlFor="publication-close-reason">
                <span>
                  {cierreSeleccionado === "retirado"
                    ? "Motivo del retiro"
                    : "Motivo del cierre sin solución"}
                </span>
                <textarea
                  id="publication-close-reason"
                  value={motivoCierre}
                  onChange={(event) => setMotivoCierre(event.target.value)}
                  rows={3}
                  maxLength={1000}
                  required
                />
              </label>
              <div className="report-detail-admin-button-row">
                <button
                  type="button"
                  className="admin-danger-action"
                  onClick={confirmarCierreConMotivo}
                  disabled={cierre.isPending || !motivoCierre.trim()}
                >
                  Confirmar operación
                </button>
                <button
                  type="button"
                  className="admin-secondary-action"
                  onClick={() => setCierreSeleccionado(null)}
                  disabled={cierre.isPending}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="report-detail-admin-button-row">
              <button
                type="button"
                className="admin-primary-action"
                onClick={() => comenzarCierre("solucionado")}
                disabled={cierre.isPending}
              >
                Marcar solucionado
              </button>
              <button
                type="button"
                className="admin-secondary-action"
                onClick={() => comenzarCierre("no_solucionado")}
                disabled={cierre.isPending}
              >
                Cerrar sin solución
              </button>
              <button
                type="button"
                className="admin-danger-action"
                onClick={() => comenzarCierre("retirado")}
                disabled={cierre.isPending}
              >
                Retirar publicación
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function nivelInicial(value: string | null): Severidad {
  return value === "urgente" || value === "atencion" || value === "normal" ? value : "normal";
}
