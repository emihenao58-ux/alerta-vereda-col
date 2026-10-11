import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { recortarFoto, type RecorteFoto } from "@/lib/reportar/photo-editor";
import type { ReporteEvidencia } from "@/lib/reportar/types";

type Punto = { x: number; y: number };
type ControlRecorte = "mover" | "n" | "s" | "e" | "o" | "ne" | "no" | "se" | "so";
type Interaccion = {
  control: ControlRecorte;
  inicio: Punto;
  recorte: RecorteFoto;
};

function limitar(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function distancia(a: Punto, b: Punto) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function controlEnPunto(point: Punto, recorte: RecorteFoto, radio: number): ControlRecorte | null {
  const left = recorte.x;
  const right = recorte.x + recorte.width;
  const top = recorte.y;
  const bottom = recorte.y + recorte.height;
  const corners: readonly [ControlRecorte, Punto][] = [
    ["no", { x: left, y: top }],
    ["ne", { x: right, y: top }],
    ["so", { x: left, y: bottom }],
    ["se", { x: right, y: bottom }],
  ];
  const corner = corners.find(([, position]) => distancia(point, position) <= radio);
  if (corner) return corner[0];

  const insideX = point.x >= left + radio && point.x <= right - radio;
  const insideY = point.y >= top + radio && point.y <= bottom - radio;
  if (insideX && Math.abs(point.y - top) <= radio) return "n";
  if (insideX && Math.abs(point.y - bottom) <= radio) return "s";
  if (insideY && Math.abs(point.x - left) <= radio) return "o";
  if (insideY && Math.abs(point.x - right) <= radio) return "e";
  if (point.x >= left && point.x <= right && point.y >= top && point.y <= bottom) return "mover";
  return null;
}

export function ReportarPhotoCropper({
  evidencia,
  onClose,
  onSave,
}: {
  evidencia: ReporteEvidencia | null;
  onClose: () => void;
  onSave: (archivo: File) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const interaccionRef = useRef<Interaccion | null>(null);
  const [imagen, setImagen] = useState<HTMLImageElement | null>(null);
  const [recorte, setRecorte] = useState<RecorteFoto | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!evidencia) {
      setImagen(null);
      setRecorte(null);
      setError(null);
      return;
    }

    let activo = true;
    const image = new Image();
    image.onload = () => {
      if (!activo) return;
      setImagen(image);
      setRecorte({ x: 0, y: 0, width: image.naturalWidth, height: image.naturalHeight });
      setError(null);
    };
    image.onerror = () => {
      if (activo) setError("No se pudo abrir la fotografía.");
    };
    image.src = evidencia.previewUrl;

    return () => {
      activo = false;
      image.onload = null;
      image.onerror = null;
    };
  }, [evidencia]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imagen || !recorte) return;
    const contexto = canvas.getContext("2d");
    if (!contexto) return;

    canvas.width = imagen.naturalWidth;
    canvas.height = imagen.naturalHeight;
    contexto.clearRect(0, 0, canvas.width, canvas.height);
    contexto.drawImage(imagen, 0, 0);

    contexto.fillStyle = "rgba(0, 0, 0, 0.56)";
    contexto.fillRect(0, 0, canvas.width, recorte.y);
    contexto.fillRect(0, recorte.y, recorte.x, recorte.height);
    contexto.fillRect(
      recorte.x + recorte.width,
      recorte.y,
      canvas.width - recorte.x - recorte.width,
      recorte.height,
    );
    contexto.fillRect(
      0,
      recorte.y + recorte.height,
      canvas.width,
      canvas.height - recorte.y - recorte.height,
    );

    contexto.strokeStyle = "#ffffff";
    contexto.lineWidth = Math.max(4, Math.round(Math.min(canvas.width, canvas.height) * 0.004));
    contexto.strokeRect(recorte.x, recorte.y, recorte.width, recorte.height);

    const handleSize = Math.max(28, Math.round(Math.min(canvas.width, canvas.height) * 0.025));
    const half = handleSize / 2;
    contexto.fillStyle = "#ffffff";
    const handles: readonly [number, number][] = [
      [recorte.x, recorte.y],
      [recorte.x + recorte.width, recorte.y],
      [recorte.x, recorte.y + recorte.height],
      [recorte.x + recorte.width, recorte.y + recorte.height],
    ];
    for (const [x, y] of handles) {
      contexto.fillRect(x - half, y - half, handleSize, handleSize);
    }
  }, [imagen, recorte]);

  const puntoDesdeEvento = (event: React.PointerEvent<HTMLCanvasElement>): Punto | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const bounds = canvas.getBoundingClientRect();
    return {
      x: limitar((event.clientX - bounds.left) * (canvas.width / bounds.width), 0, canvas.width),
      y: limitar((event.clientY - bounds.top) * (canvas.height / bounds.height), 0, canvas.height),
    };
  };

  const iniciarInteraccion = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!recorte || !canvasRef.current) return;
    const point = puntoDesdeEvento(event);
    if (!point) return;
    const radio = Math.max(36, Math.min(canvasRef.current.width, canvasRef.current.height) * 0.035);
    const control = controlEnPunto(point, recorte, radio);
    if (!control) return;
    interaccionRef.current = { control, inicio: point, recorte };
    canvasRef.current.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const actualizarInteraccion = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const interaccion = interaccionRef.current;
    if (!interaccion || !recorte || !canvasRef.current) return;
    const point = puntoDesdeEvento(event);
    if (!point) return;
    const dx = point.x - interaccion.inicio.x;
    const dy = point.y - interaccion.inicio.y;
    const original = interaccion.recorte;
    const minSize = Math.max(
      48,
      Math.min(canvasRef.current.width, canvasRef.current.height) * 0.08,
    );
    let left = original.x;
    let top = original.y;
    let right = original.x + original.width;
    let bottom = original.y + original.height;

    if (interaccion.control === "mover") {
      const x = limitar(original.x + dx, 0, canvasRef.current.width - original.width);
      const y = limitar(original.y + dy, 0, canvasRef.current.height - original.height);
      setRecorte({ ...original, x, y });
      return;
    }

    if (interaccion.control.includes("o")) left = limitar(original.x + dx, 0, right - minSize);
    if (interaccion.control.includes("e"))
      right = limitar(original.x + original.width + dx, left + minSize, canvasRef.current.width);
    if (interaccion.control.includes("n")) top = limitar(original.y + dy, 0, bottom - minSize);
    if (interaccion.control.includes("s"))
      bottom = limitar(original.y + original.height + dy, top + minSize, canvasRef.current.height);

    setRecorte({ x: left, y: top, width: right - left, height: bottom - top });
  };

  const terminarInteraccion = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interaccionRef.current) return;
    if (canvasRef.current?.hasPointerCapture(event.pointerId)) {
      canvasRef.current.releasePointerCapture(event.pointerId);
    }
    interaccionRef.current = null;
  };

  const guardar = async () => {
    if (!evidencia || !recorte) return;
    setGuardando(true);
    setError(null);
    try {
      onSave(await recortarFoto(evidencia.archivo, recorte));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudo recortar la fotografía.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Dialog open={Boolean(evidencia)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="reportar-crop-dialog">
        <DialogHeader>
          <DialogTitle>Editar fotografía</DialogTitle>
          <DialogDescription>
            Arrastra las esquinas o los bordes para elegir libremente qué conservar. También puedes
            mover el marco completo.
          </DialogDescription>
        </DialogHeader>
        {imagen && recorte ? (
          <div className="reportar-free-crop-stage">
            <canvas
              ref={canvasRef}
              className="reportar-free-crop-canvas"
              onPointerDown={iniciarInteraccion}
              onPointerMove={actualizarInteraccion}
              onPointerUp={terminarInteraccion}
              onPointerCancel={terminarInteraccion}
              aria-label="Área de recorte libre"
            />
          </div>
        ) : (
          <p className="reportar-media-status">Preparando la fotografía…</p>
        )}
        {error && (
          <p className="reportar-error" role="alert">
            {error}
          </p>
        )}
        <div className="reportar-step-actions">
          <Button type="button" variant="outline" onClick={onClose} disabled={guardando}>
            Cancelar
          </Button>
          <Button type="button" onClick={() => void guardar()} disabled={guardando || !recorte}>
            {guardando ? "Guardando…" : "Guardar recorte"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
