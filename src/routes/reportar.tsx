import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
        content:
          "Envía un reporte de tu vereda. Un administrador lo verifica antes de publicarlo.",
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

function Reportar() {
  const navigate = useNavigate();

  const { data: veredas } = useQuery({
    queryKey: ["veredas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("veredas")
        .select("id, nombre")
        .order("nombre");

      if (error) throw error;
      return data;
    },
  });

  const [categoria, setCategoria] =
    useState<Categoria>("emergencia");
  const [descripcion, setDescripcion] = useState("");
  const [lugar, setLugar] = useState("");
  const [nombre, setNombre] = useState("");
  const [veredaId, setVeredaId] = useState("");
  const [foto, setFoto] = useState<File | null>(null);
  const [honeypot, setHoneypot] = useState("");
  const [enviando, setEnviando] = useState(false);

  const fotoObligatoria =
    categoria === "emergencia" || categoria === "via";

  async function enviar(e: React.FormEvent<HTMLFormElement>) {
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
      toast.error(
        "Para emergencias y problemas de vía debes adjuntar una foto."
      );
      return;
    }

    setEnviando(true);

    try {
      let fotoUrl: string | null = null;

      if (foto) {
        const extension =
          foto.name.split(".").pop()?.toLowerCase() || "jpg";

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
      });

      if (error) {
        throw error;
      }

      toast.success(
        "Reporte enviado. Queda pendiente de revisión."
      );

      void navigate({ to: "/" });
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : "No se pudo enviar el reporte.";

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

      <form
        className="carta mt-4 space-y-3"
        onSubmit={enviar}
      >
        <label className="block text-sm font-medium">
          ¿Qué está pasando?
          <select
            className={campo}
            value={categoria}
            onChange={(e) =>
              setCategoria(e.target.value as Categoria)
            }
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
          <span className="font-normal text-sm">
            {" "}
            (opcional)
          </span>

          <input
            className={campo}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: María"
          />
        </label>

        <label className="block text-sm font-medium">
          Foto
          {fotoObligatoria ? (
            <span className="font-normal text-sm">
              {" "}
              (obligatoria para esta categoría)
            </span>
          ) : (
            <span className="font-normal text-sm">
              {" "}
              (opcional)
            </span>
          )}

          <input
            className={`${campo} file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1`}
            type="file"
            accept="image/*"
            required={fotoObligatoria}
            onChange={(e) =>
              setFoto(e.target.files?.[0] ?? null)
            }
          />
        </label>

        {/* Honeypot anti-bot: los usuarios normales nunca deben verlo */}
        <div
          aria-hidden="true"
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
        >
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