import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { TituloModulo } from "@/components/carta";

export const Route = createFileRoute("/reportar")({
  head: () => ({
    meta: [
      { title: "Reportar una novedad · AlertaVereda Ebéjico" },
      {
        name: "description",
        content: "Envía un reporte de tu vereda. Un administrador lo verifica antes de publicarlo.",
      },
      {
        property: "og:title",
        content: "Reportar una novedad · AlertaVereda",
      },
      {
        property: "og:description",
        content:
          "Todo reporte queda pendiente de revisión hasta que un administrador lo verifique.",
      },
    ],
  }),
  component: Reportar,
});

const campo =
  "mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm";

type Categoria = "emergencia" | "via" | "servicio" | "otro";
type EstadoUbicacion = "inactiva" | "obteniendo" | "lista" | "error";

type UbicacionReporte = {
  latitud: number;
  longitud: number;
  precision: number;
};

const estilosCategoria: Record<Categoria, { color: string; nombre: string }> = {
  emergencia: { color: "#C23B2E", nombre: "Emergencia" },
  via: { color: "#DB7B33", nombre: "Vías" },
  servicio: { color: "#3C8A5B", nombre: "Servicios" },
  otro: { color: "#C99A2E", nombre: "Avisos" },
};

function formatoFechaEvidencia(fecha: Date) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(fecha);
}

function dibujarMarcaDeEvidencia({
  contexto,
  ancho,
  alto,
  vereda,
  fecha,
  ubicacion,
  color,
}: {
  contexto: CanvasRenderingContext2D;
  ancho: number;
  alto: number;
  vereda: string;
  fecha: Date;
  ubicacion: UbicacionReporte | null;
  color: string;
}) {
  const margen = Math.max(20, Math.round(ancho * 0.035));
  const lineas = [
    `AlertaVereda · ${vereda}`,
    formatoFechaEvidencia(fecha),
    ...(ubicacion
      ? [`Zona aprox.: ${ubicacion.latitud.toFixed(3)}, ${ubicacion.longitud.toFixed(3)}`]
      : []),
  ];

  let tamanoFuente = Math.max(17, Math.round(ancho * 0.026));
  const anchoDisponible = ancho - margen * 2;

  contexto.textBaseline = "middle";
  contexto.font = `600 ${tamanoFuente}px system-ui, sans-serif`;

  while (
    lineas.some((linea) => contexto.measureText(linea).width > anchoDisponible) &&
    tamanoFuente > 14
  ) {
    tamanoFuente -= 1;
    contexto.font = `600 ${tamanoFuente}px system-ui, sans-serif`;
  }

  const altoLinea = Math.round(tamanoFuente * 1.45);
  const altoFranja = altoLinea * lineas.length + margen * 1.45;
  const inicioY = alto - altoFranja;

  contexto.fillStyle = "rgba(28, 46, 34, 0.86)";
  contexto.fillRect(0, inicioY, ancho, altoFranja);
  contexto.fillStyle = color;
  contexto.fillRect(0, inicioY, Math.max(8, Math.round(ancho * 0.014)), altoFranja);

  contexto.fillStyle = "#FFFFFF";
  lineas.forEach((linea, indice) => {
    contexto.fillText(linea, margen, inicioY + margen * 0.72 + altoLinea * (indice + 0.5));
  });
}

function Reportar() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { data: veredas } = useQuery({
    queryKey: ["veredas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("veredas").select("id, nombre").order("nombre");

      if (error) throw error;
      return data;
    },
  });

  const [categoria, setCategoria] = useState<Categoria>("emergencia");
  const [descripcion, setDescripcion] = useState("");
  const [lugar, setLugar] = useState("");
  const [nombre, setNombre] = useState("");
  const [veredaId, setVeredaId] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [camaraError, setCamaraError] = useState("");
  const [ubicacion, setUbicacion] = useState<UbicacionReporte | null>(null);
  const [estadoUbicacion, setEstadoUbicacion] = useState<EstadoUbicacion>("inactiva");
  const [mensajeUbicacion, setMensajeUbicacion] = useState("");
  const [capturadaEn, setCapturadaEn] = useState<string | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [enviando, setEnviando] = useState(false);

  const fotoObligatoria = categoria === "emergencia" || categoria === "via";
  const estiloCategoria = estilosCategoria[categoria];
  const veredaSeleccionada = veredas?.find((vereda) => vereda.id === veredaId);

  useEffect(() => {
    if (!foto) {
      setFotoPreview(null);
      return;
    }

    const url = URL.createObjectURL(foto);
    setFotoPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [foto]);

  useEffect(() => {
    if (!camaraActiva || !videoRef.current || !streamRef.current) {
      return;
    }

    videoRef.current.srcObject = streamRef.current;
    void videoRef.current.play().catch(() => undefined);
  }, [camaraActiva]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  function detenerCamara() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCamaraActiva(false);
  }

  async function iniciarCamara() {
    setCamaraError("");

    if (!navigator.mediaDevices?.getUserMedia) {
      setCamaraError("No se pudo acceder a la cámara. Puedes elegir una foto de la galería.");
      return;
    }

    detenerCamara();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      setCamaraActiva(true);
    } catch {
      setCamaraError("No se pudo acceder a la cámara. Puedes elegir una foto de la galería.");
    }
  }

  async function capturarFoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas || !video.videoWidth || !video.videoHeight) {
      setCamaraError("La cámara aún se está preparando. Inténtalo de nuevo.");
      return;
    }

    const fechaDeCaptura = new Date();
    const contexto = canvas.getContext("2d");

    if (!contexto) {
      setCamaraError("No se pudo preparar la fotografía. Inténtalo de nuevo.");
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
    dibujarMarcaDeEvidencia({
      contexto,
      ancho: canvas.width,
      alto: canvas.height,
      vereda: veredaSeleccionada?.nombre ?? "Vereda sin seleccionar",
      fecha: fechaDeCaptura,
      ubicacion,
      color: estiloCategoria.color,
    });

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (imagen) => {
            if (imagen) {
              resolve(imagen);
              return;
            }

            reject(new Error("No se pudo crear la fotografía."));
          },
          "image/jpeg",
          0.9,
        );
      });

      setFoto(
        new File([blob], `evidencia-alertavereda-${fechaDeCaptura.getTime()}.jpg`, {
          type: "image/jpeg",
          lastModified: fechaDeCaptura.getTime(),
        }),
      );
      setCapturadaEn(fechaDeCaptura.toISOString());
      setCamaraError("");
      detenerCamara();
    } catch {
      setCamaraError("No se pudo guardar la fotografía. Inténtalo de nuevo.");
    }
  }

  function elegirFotoDeGaleria(e: React.ChangeEvent<HTMLInputElement>) {
    const archivo = e.target.files?.[0] ?? null;
    setFoto(archivo);
    setCapturadaEn(null);
    setCamaraError("");
  }

  function quitarFoto() {
    setFoto(null);
    setCapturadaEn(null);
  }

  function solicitarUbicacion() {
    setMensajeUbicacion("");

    if (!navigator.geolocation) {
      setEstadoUbicacion("error");
      setMensajeUbicacion(
        "Este dispositivo no permite obtener la ubicación. Puedes continuar sin ella.",
      );
      return;
    }

    setEstadoUbicacion("obteniendo");

    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setUbicacion({
          latitud: posicion.coords.latitude,
          longitud: posicion.coords.longitude,
          precision: posicion.coords.accuracy,
        });
        setEstadoUbicacion("lista");
        setMensajeUbicacion("");
      },
      () => {
        setUbicacion(null);
        setEstadoUbicacion("error");
        setMensajeUbicacion("No se pudo obtener la ubicación. Puedes continuar sin ella.");
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      },
    );
  }

  async function enviar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    // Honeypot: si está lleno, no enviamos el reporte.
    if (honeypot.trim() !== "") {
      return;
    }

    if (!veredaId) {
      toast.error("Selecciona la vereda.");
      return;
    }

    if (!descripcion.trim()) {
      toast.error("Cuéntanos qué está pasando.");
      return;
    }

    if (!lugar.trim()) {
      toast.error("Indica dónde ocurrió.");
      return;
    }

    if (fotoObligatoria && !foto) {
      toast.error("Para emergencias y problemas de vía debes adjuntar una foto.");
      return;
    }

    setEnviando(true);

    try {
      let fotoUrl: string | null = null;

      if (foto) {
        const extension = foto.name.split(".").pop()?.toLowerCase() || "jpg";
        const nombreArchivo = `${crypto.randomUUID()}.${extension}`;
        const ruta = `${veredaId}/${nombreArchivo}`;

        const { error: uploadError } = await supabase.storage
          .from("reportes-fotos")
          .upload(ruta, foto, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          throw uploadError;
        }

        fotoUrl = ruta;
      }

      const { error } = await supabase.from("reportes").insert({
        vereda_id: veredaId,
        titulo: descripcion.trim().slice(0, 80),
        categoria,
        descripcion: descripcion.trim(),
        lugar: lugar.trim(),
        nombre_reportante: nombre.trim() || null,
        foto_url: fotoUrl,
        estado: "pendiente",
        latitud: ubicacion?.latitud ?? null,
        longitud: ubicacion?.longitud ?? null,
        precision_metros: ubicacion?.precision ?? null,
        capturado_en: capturadaEn,
      });

      if (error) {
        throw error;
      }

      toast.success("Reporte enviado. Queda pendiente de revisión.");
      void navigate({ to: "/" });
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : "No se pudo enviar el reporte.";

      toast.error(mensaje);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AppShell>
      <TituloModulo
        titulo="Reportar"
        bajada="Cuéntale a la vereda lo que está pasando. Tu reporte será revisado antes de publicarse."
      />

      <form className="carta mt-4 space-y-4" onSubmit={enviar}>
        <label className="block text-sm font-medium">
          Tipo de reporte
          <select
            className={campo}
            value={categoria}
            onChange={(e) => setCategoria(e.target.value as Categoria)}
          >
            <option value="emergencia">Emergencia</option>
            <option value="via">Vía</option>
            <option value="servicio">Servicio</option>
            <option value="otro">Aviso</option>
          </select>
        </label>

        <label className="block text-sm font-medium">
          Sector / Vereda
          <select
            className={campo}
            required
            value={veredaId}
            onChange={(e) => setVeredaId(e.target.value)}
          >
            <option value="">Selecciona…</option>

            {veredas?.map((vereda) => (
              <option key={vereda.id} value={vereda.id}>
                {vereda.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          ¿Qué está pasando?
          <textarea
            className={campo}
            rows={5}
            required
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Cuéntanos qué ocurrió..."
          />
        </label>

        <label className="block text-sm font-medium">
          ¿Dónde ocurrió?
          <input
            className={campo}
            required
            value={lugar}
            onChange={(e) => setLugar(e.target.value)}
            placeholder="Ej: cerca de la escuela"
          />
        </label>

        <label className="block text-sm font-medium">
          Tu nombre
          <span className="font-normal text-sm"> (opcional)</span>
          <input
            className={campo}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: María"
          />
        </label>

        <section
          className="rounded-md border-2 bg-[color:var(--card)] p-3"
          style={{ borderColor: estiloCategoria.color }}
          aria-labelledby="ubicacion-reporte"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 id="ubicacion-reporte" className="text-sm font-semibold">
                Ubicación del reporte
              </h2>
              <p className="mt-1 text-xs leading-5 text-[color:var(--muted-foreground)]">
                La usaremos una sola vez para ubicar este reporte en una zona que puede no tener
                dirección formal. No rastreamos tu ubicación en segundo plano y puedes continuar sin
                compartirla.
              </p>
            </div>
            <span
              className="shrink-0 rounded-full px-2 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: estiloCategoria.color }}
            >
              {estiloCategoria.nombre}
            </span>
          </div>

          {estadoUbicacion === "lista" && ubicacion ? (
            <div
              className="mt-3 rounded-md bg-[color:var(--kraft-oscuro)] px-3 py-2 text-xs text-[color:var(--tinta)]"
              role="status"
            >
              Ubicación registrada con precisión aproximada de ±{Math.round(ubicacion.precision)} m.
              <button
                type="button"
                onClick={solicitarUbicacion}
                className="ml-2 font-semibold underline underline-offset-2"
              >
                Actualizar
              </button>
            </div>
          ) : (
            <>
              <p className="mt-3 text-xs leading-5 text-[color:var(--muted-foreground)]">
                Al continuar, el navegador te pedirá permiso. Puedes elegir permitirlo mientras usas
                AlertaVereda o continuar sin ubicación.
              </p>
              <button
                type="button"
                onClick={solicitarUbicacion}
                disabled={estadoUbicacion === "obteniendo"}
                className="mt-3 rounded-md px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: estiloCategoria.color }}
              >
                {estadoUbicacion === "obteniendo" ? "Buscando ubicación…" : "Compartir ubicación"}
              </button>
            </>
          )}

          {mensajeUbicacion && (
            <p className="mt-2 text-xs text-[color:var(--terracota)]" role="status">
              {mensajeUbicacion}
            </p>
          )}
        </section>

        <section aria-labelledby="foto-reporte">
          <div className="flex items-baseline justify-between gap-3">
            <h2 id="foto-reporte" className="text-sm font-medium">
              Foto
              {fotoObligatoria ? (
                <span className="font-normal text-sm"> (obligatoria para esta categoría)</span>
              ) : (
                <span className="font-normal text-sm"> (opcional)</span>
              )}
            </h2>
            {foto && (
              <button
                type="button"
                onClick={quitarFoto}
                className="text-xs font-semibold text-[color:var(--terracota)] underline underline-offset-2"
              >
                Quitar foto
              </button>
            )}
          </div>

          {!camaraActiva && !foto && (
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={iniciarCamara}
                className="rounded-md border-2 px-4 py-3 text-sm font-semibold text-white transition active:scale-[0.98]"
                style={{
                  borderColor: estiloCategoria.color,
                  backgroundColor: estiloCategoria.color,
                }}
              >
                Tomar foto
              </button>

              <label
                className="cursor-pointer rounded-md border-2 bg-[color:var(--card)] px-4 py-3 text-center text-sm font-semibold transition active:scale-[0.98]"
                style={{ borderColor: estiloCategoria.color }}
              >
                Elegir de galería
                <input
                  className="sr-only"
                  type="file"
                  accept="image/*"
                  onChange={elegirFotoDeGaleria}
                />
              </label>
            </div>
          )}

          {camaraActiva && (
            <div
              className="mt-3 overflow-hidden rounded-md border-4 bg-black"
              style={{ borderColor: estiloCategoria.color }}
            >
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="aspect-[4/3] w-full object-cover"
                aria-label="Vista previa de la cámara"
              />
              <div className="flex gap-2 bg-[color:var(--card)] p-3">
                <button
                  type="button"
                  onClick={capturarFoto}
                  className="flex-1 rounded-md px-4 py-2 text-sm font-semibold text-white active:scale-[0.98]"
                  style={{ backgroundColor: estiloCategoria.color }}
                >
                  Capturar
                </button>
                <button
                  type="button"
                  onClick={detenerCamara}
                  className="rounded-md border border-[color:var(--border)] px-4 py-2 text-sm font-semibold active:scale-[0.98]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {camaraError && (
            <p className="mt-2 text-xs text-[color:var(--terracota)]" role="status">
              {camaraError}
            </p>
          )}

          {foto && fotoPreview && (
            <div
              className="mt-3 overflow-hidden rounded-md border-2 bg-[color:var(--kraft-oscuro)] p-2"
              style={{ borderColor: estiloCategoria.color }}
            >
              <img
                src={fotoPreview}
                alt="Vista previa de la foto adjunta al reporte"
                className="max-h-64 w-full rounded object-cover"
              />
              <div className="mt-2 flex items-center justify-between gap-3 text-xs text-[color:var(--muted-foreground)]">
                <span className="min-w-0 truncate">{foto.name}</span>
                {capturadaEn && (
                  <span className="shrink-0">
                    Capturada: {formatoFechaEvidencia(new Date(capturadaEn))}
                  </span>
                )}
              </div>
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />
        </section>

        {/* Honeypot anti-bot: los usuarios normales nunca deben verlo */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            No llenar este campo
            <input
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </label>
        </div>

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded-md bg-[color:var(--terracota)] px-4 py-3 font-semibold text-[color:var(--card)] disabled:opacity-60"
        >
          {enviando ? "Enviando…" : "Enviar reporte"}
        </button>
      </form>
    </AppShell>
  );
}
