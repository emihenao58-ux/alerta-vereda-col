import { useState } from "react";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Carta } from "@/components/carta";
import { supabase } from "@/integrations/supabase/client";
import { URL_FOTO, fecha } from "@/lib/alerta";
import type { MiVeredaPublicacionCerrada } from "@/lib/mi-vereda-cartelera";

const CONFIRMACION = "ELIMINAR";

type TablaPublicacion = "emergencias" | "vias" | "servicios" | "avisos";
type ResultadoPurga = "solucionado" | "no_solucionado" | "retirado";

type PurgaRpcClient = {
  rpc: (
    functionName:
      | "eliminar_reporte_definitivo"
      | "preparar_purga_publicacion"
      | "eliminar_publicacion_definitivo",
    args: Record<string, unknown>,
  ) => Promise<{
    data: unknown;
    error: { message: string; code?: string; status?: number | string } | null;
  }>;
};

export type ReportePurgable = {
  id: string;
  titulo: string;
  estado: string;
  descripcion: string | null;
  foto_url: string | null;
  created_at: string;
  veredas: { nombre: string } | null;
};

type PreflightPurga = {
  publicacion_tabla: TablaPublicacion;
  publicacion_id: string;
  reporte_id: string | null;
  fotos: string[];
  resultado: ResultadoPurga;
  cerrado_en: string;
  foto_publicacion: string | null;
  foto_reporte: string | null;
};

const rpcClient = supabase as unknown as PurgaRpcClient;

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "Ocurrió un error inesperado.";
}

function esObjetoAusente(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const value = error as {
    status?: number | string;
    statusCode?: number | string;
    message?: string;
  };
  const status = String(value.status ?? value.statusCode ?? "");
  const message = (value.message ?? "").toLowerCase();
  return status === "404" || message.includes("not found") || message.includes("does not exist");
}

async function quitarFotos(fotos: readonly string[]) {
  if (fotos.length === 0) return;
  const { error } = await supabase.storage.from("reportes-fotos").remove([...fotos]);
  if (error && !esObjetoAusente(error)) throw error;
}

export function PurgaReporte({
  reporte,
  onDone,
}: {
  reporte: ReportePurgable;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [procesando, setProcesando] = useState(false);

  if (reporte.estado !== "pendiente" && reporte.estado !== "rechazado") return null;

  const eliminar = async () => {
    if (confirmacion !== CONFIRMACION || procesando) return;
    setProcesando(true);
    try {
      await quitarFotos(reporte.foto_url ? [reporte.foto_url] : []);

      const { error } = await rpcClient.rpc("eliminar_reporte_definitivo", {
        p_reporte_id: reporte.id,
      });
      if (error) throw error;

      toast.success("Reporte eliminado definitivamente.");
      setOpen(false);
      setConfirmacion("");
      onDone();
    } catch (error) {
      toast.error(`No se eliminó el reporte: ${errorText(error)}`);
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="admin-danger-action"
        disabled={procesando}
        onClick={() => setOpen(true)}
      >
        <Trash2 size={15} aria-hidden="true" />
        Eliminar definitivamente
      </button>
      <AlertDialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !procesando) setConfirmacion("");
          setOpen(nextOpen);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-1 flex items-center gap-2 text-[color:var(--urgente)]">
              <AlertTriangle size={19} aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.12em]">
                Acción irreversible
              </span>
            </div>
            <AlertDialogTitle>¿Eliminar este reporte definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se perderá el reporte y su foto de forma total y
              permanente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md bg-[color:var(--kraft)] p-3 text-sm">
            <strong>{reporte.titulo}</strong>
            <p className="mt-1 text-[color:var(--admin-muted)]">
              {reporte.veredas?.nombre ?? "Vereda"} · {fecha(reporte.created_at)}
            </p>
          </div>
          <label
            className="space-y-1 text-sm font-semibold"
            htmlFor={`confirmacion-reporte-${reporte.id}`}
          >
            Escribe <span className="font-mono">ELIMINAR</span> para continuar
            <input
              id={`confirmacion-reporte-${reporte.id}`}
              autoComplete="off"
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value)}
              className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 font-mono text-sm"
              disabled={procesando}
            />
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              disabled={confirmacion !== CONFIRMACION || procesando}
              onClick={(event) => {
                event.preventDefault();
                void eliminar();
              }}
              className="bg-[color:var(--urgente)] text-[color:var(--card)] hover:bg-[color:var(--urgente)]/90"
            >
              {procesando ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 size={16} aria-hidden="true" />
              )}
              {procesando ? "Eliminando…" : "Eliminar definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function PurgaPublicacion({
  publicacion,
  onDone,
}: {
  publicacion: MiVeredaPublicacionCerrada;
  onDone: () => void;
}) {
  const [preflight, setPreflight] = useState<PreflightPurga | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [preparando, setPreparando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const preparar = async () => {
    if (preparando || procesando) return;
    setPreparando(true);
    try {
      const { data, error } = await rpcClient.rpc("preparar_purga_publicacion", {
        p_publicacion_tabla: publicacion.publicacion_tabla,
        p_publicacion_id: publicacion.publicacion_id,
      });
      if (error) throw error;
      if (!esPreflightPurga(data))
        throw new Error("El preflight devolvió una respuesta incompleta.");
      setPreflight(data);
      setConfirmacion("");
      setDialogOpen(true);
    } catch (error) {
      toast.error(`No pudimos preparar la purga: ${errorText(error)}`);
    } finally {
      setPreparando(false);
    }
  };

  const eliminar = async () => {
    if (!preflight || confirmacion !== CONFIRMACION || procesando) return;
    setProcesando(true);
    try {
      await quitarFotos(preflight.fotos);

      const { error } = await rpcClient.rpc("eliminar_publicacion_definitivo", {
        p_publicacion_tabla: preflight.publicacion_tabla,
        p_publicacion_id: preflight.publicacion_id,
        p_cerrado_en_esperado: preflight.cerrado_en,
        p_resultado_esperado: preflight.resultado,
        p_reporte_id_esperado: preflight.reporte_id,
        p_foto_publicacion_esperada: preflight.foto_publicacion,
        p_foto_reporte_esperada: preflight.foto_reporte,
        p_fotos_esperadas: preflight.fotos,
      });
      if (error) {
        if (error.message.toLowerCase().includes("cambió desde la verificación")) {
          throw new Error(
            "El estado cambió desde el preflight. Repite la preparación desde el paso inicial; no reintentamos Storage a ciegas.",
          );
        }
        throw error;
      }

      toast.success("Publicación eliminada definitivamente.");
      setDialogOpen(false);
      setPreflight(null);
      setConfirmacion("");
      onDone();
    } catch (error) {
      toast.error(`No se eliminó la publicación: ${errorText(error)}`);
      if (errorText(error).toLowerCase().includes("estado cambió")) {
        setDialogOpen(false);
        setPreflight(null);
        setConfirmacion("");
      }
    } finally {
      setProcesando(false);
    }
  };

  return (
    <>
      <button
        type="button"
        className="admin-danger-action"
        disabled={preparando || procesando}
        onClick={() => void preparar()}
      >
        {preparando ? (
          <Loader2 size={15} className="animate-spin" aria-hidden="true" />
        ) : (
          <Trash2 size={15} aria-hidden="true" />
        )}
        {preparando ? "Preparando…" : "Eliminar definitivamente"}
      </button>
      <AlertDialog
        open={dialogOpen}
        onOpenChange={(nextOpen) => {
          if (!nextOpen && !procesando) {
            setDialogOpen(false);
            setPreflight(null);
            setConfirmacion("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="mb-1 flex items-center gap-2 text-[color:var(--urgente)]">
              <AlertTriangle size={19} aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-[0.12em]">
                Acción irreversible
              </span>
            </div>
            <AlertDialogTitle>¿Eliminar esta publicación definitivamente?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es irreversible. Se perderá el reporte de forma total y permanente. Su
              foto se eliminará también, salvo que esté vinculada a otro registro — en ese caso se
              conserva.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="rounded-md bg-[color:var(--kraft)] p-3 text-sm">
            <strong>{publicacion.titulo}</strong>
            <p className="mt-1 text-[color:var(--admin-muted)]">
              Preflight confirmado · {preflight?.fotos.length ?? 0} foto(s) candidata(s) para borrar
            </p>
          </div>
          <label
            className="space-y-1 text-sm font-semibold"
            htmlFor={`confirmacion-publicacion-${publicacion.publicacion_id}`}
          >
            Escribe <span className="font-mono">ELIMINAR</span> para continuar
            <input
              id={`confirmacion-publicacion-${publicacion.publicacion_id}`}
              autoComplete="off"
              value={confirmacion}
              onChange={(event) => setConfirmacion(event.target.value)}
              className="mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 font-mono text-sm"
              disabled={procesando}
            />
          </label>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={procesando}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              type="button"
              disabled={!preflight || confirmacion !== CONFIRMACION || procesando}
              onClick={(event) => {
                event.preventDefault();
                void eliminar();
              }}
              className="bg-[color:var(--urgente)] text-[color:var(--card)] hover:bg-[color:var(--urgente)]/90"
            >
              {procesando ? (
                <Loader2 size={16} className="animate-spin" aria-hidden="true" />
              ) : (
                <Trash2 size={16} aria-hidden="true" />
              )}
              {procesando ? "Eliminando…" : "Eliminar definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function GaleriaEvidencia({ fotos }: { fotos: readonly (string | null | undefined)[] }) {
  const visibles = fotos.map((foto) => (foto ? URL_FOTO(foto) : null)).filter(Boolean) as string[];
  if (visibles.length === 0) return null;

  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2" aria-label="Galería de evidencia">
      {visibles.map((foto, index) => (
        <img
          key={`${foto}-${index}`}
          src={foto}
          alt={`Evidencia ${index + 1}`}
          className="max-h-64 w-full rounded-md border border-[color:var(--border)] object-cover"
        />
      ))}
    </div>
  );
}

function esPreflightPurga(data: unknown): data is PreflightPurga {
  if (!data || typeof data !== "object") return false;
  const value = data as Record<string, unknown>;
  const tablas: readonly string[] = ["emergencias", "vias", "servicios", "avisos"];
  const resultados: readonly string[] = ["solucionado", "no_solucionado", "retirado"];
  return (
    tablas.includes(String(value["publicacion_tabla"])) &&
    typeof value["publicacion_id"] === "string" &&
    (typeof value["reporte_id"] === "string" || value["reporte_id"] === null) &&
    Array.isArray(value["fotos"]) &&
    value["fotos"].every((foto) => typeof foto === "string") &&
    resultados.includes(String(value["resultado"])) &&
    typeof value["cerrado_en"] === "string" &&
    (typeof value["foto_publicacion"] === "string" || value["foto_publicacion"] === null) &&
    (typeof value["foto_reporte"] === "string" || value["foto_reporte"] === null)
  );
}
