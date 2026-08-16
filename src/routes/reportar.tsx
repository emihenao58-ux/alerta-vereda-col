import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { TituloModulo } from "@/components/carta";
import { useAuth } from "@/hooks/use-auth";
import { LABEL_TIPO_REPORTE, type Severidad, type TipoReporte } from "@/lib/alerta";

export const Route = createFileRoute("/reportar")({
  head: () => ({
    meta: [
      { title: "Reportar una novedad · AlertaVereda Ebéjico" },
      {
        name: "description",
        content:
          "Envía un reporte de tu vereda. Un administrador de la JAC lo verifica antes de publicarlo.",
      },
      { property: "og:title", content: "Reportar una novedad · AlertaVereda" },
      {
        property: "og:description",
        content: "Todo reporte queda pendiente de revisión hasta que la JAC lo verifique.",
      },
    ],
  }),
  component: Reportar,
});

const campo =
  "mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm";

function Reportar() {
  const { usuario, perfil } = useAuth();
  const navigate = useNavigate();

  const { data: veredas } = useQuery({
    queryKey: ["veredas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("veredas").select("id, nombre").order("nombre");
      if (error) throw error;
      return data;
    },
  });

  const [tipo, setTipo] = useState<TipoReporte>("emergencia");
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [ubicacion, setUbicacion] = useState("");
  const [severidad, setSeveridad] = useState<Severidad>("precaucion");
  const [veredaId, setVeredaId] = useState("");

  const enviar = useMutation({
    mutationFn: async () => {
      if (!usuario) throw new Error("Debes iniciar sesión");
      const vereda = veredaId || perfil?.vereda_id;
      if (!vereda) throw new Error("Selecciona la vereda");
      const { error } = await supabase.from("reportes").insert({
        autor_id: usuario.id,
        vereda_id: vereda,
        tipo,
        titulo,
        descripcion,
        ubicacion: ubicacion || null,
        severidad,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reporte enviado. Queda pendiente de revisión por la JAC.");
      void navigate({ to: "/" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (!usuario) {
    return (
      <AppShell>
        <TituloModulo titulo="Reportar" bajada="Cuéntale a la vereda lo que está pasando." />
        <p className="carta mt-4 text-sm">
          Para enviar un reporte necesitas una cuenta.{" "}
          <Link to="/auth" className="font-semibold underline underline-offset-4">
            Entrar o registrarte
          </Link>
          .
        </p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <TituloModulo
        titulo="Reportar"
        bajada="Tu reporte queda pendiente de revisión hasta que un administrador de la JAC lo verifique y lo publique."
      />
      <form
        className="carta mt-4 space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          enviar.mutate();
        }}
      >
        <label className="block text-sm font-medium">
          ¿Qué quieres reportar?
          <select
            className={campo}
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoReporte)}
          >
            {Object.entries(LABEL_TIPO_REPORTE).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Vereda
          <select className={campo} value={veredaId} onChange={(e) => setVeredaId(e.target.value)}>
            <option value="">Selecciona…</option>
            {veredas?.map((v) => (
              <option key={v.id} value={v.id}>
                {v.nombre}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium">
          Título
          <input
            className={campo}
            required
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ej: Derrumbe en la vía principal"
          />
        </label>

        <label className="block text-sm font-medium">
          ¿Qué pasó?
          <textarea
            className={campo}
            rows={4}
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
          />
        </label>

        <label className="block text-sm font-medium">
          Lugar
          <input
            className={campo}
            value={ubicacion}
            onChange={(e) => setUbicacion(e.target.value)}
            placeholder="Ej: cerca a la escuela"
          />
        </label>

        <label className="block text-sm font-medium">
          Gravedad
          <select
            className={campo}
            value={severidad}
            onChange={(e) => setSeveridad(e.target.value as Severidad)}
          >
            <option value="urgente">Urgente</option>
            <option value="precaucion">Precaución</option>
            <option value="normal">Normal / informativo</option>
          </select>
        </label>

        <button
          type="submit"
          disabled={enviar.isPending}
          className="w-full rounded-md bg-[color:var(--terracota)] px-4 py-3 font-semibold text-[color:var(--card)] disabled:opacity-60"
        >
          {enviar.isPending ? "Enviando…" : "Enviar reporte"}
        </button>
      </form>
    </AppShell>
  );
}
