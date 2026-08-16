import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AppShell } from "@/components/app-shell";
import { TituloModulo } from "@/components/carta";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar o registrarse · AlertaVereda Ebéjico" },
      {
        name: "description",
        content:
          "Crea tu cuenta de habitante para reportar novedades de tu vereda en AlertaVereda.",
      },
      { property: "og:title", content: "Entrar · AlertaVereda" },
      { property: "og:description", content: "Cuenta de habitante o de administrador de la JAC." },
    ],
  }),
  component: Auth,
});

const campo =
  "mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm";

function Auth() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"entrar" | "registrar">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Bienvenido de vuelta.");
        void navigate({ to: "/" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { nombre },
          },
        });
        if (error) throw error;
        toast.success("Cuenta creada. Revisa tu correo si te pedimos confirmarlo.");
        void navigate({ to: "/" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos completar la acción");
    } finally {
      setCargando(false);
    }
  }

  async function conGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("No pudimos entrar con Google");
      return;
    }
    if (result.redirected) return;
    void navigate({ to: "/" });
  }

  return (
    <AppShell>
      <TituloModulo
        titulo={modo === "entrar" ? "Entrar" : "Crear cuenta"}
        bajada="Consultar la cartelera es libre. La cuenta sirve para reportar y, en el caso de la JAC, para publicar."
      />
      <form className="carta mt-4 space-y-3" onSubmit={enviar}>
        {modo === "registrar" && (
          <label className="block text-sm font-medium">
            Nombre
            <input className={campo} value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </label>
        )}
        <label className="block text-sm font-medium">
          Correo
          <input
            className={campo}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block text-sm font-medium">
          Contraseña
          <input
            className={campo}
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-md bg-[color:var(--bosque)] px-4 py-3 font-semibold text-[color:var(--card)] disabled:opacity-60"
        >
          {modo === "entrar" ? "Entrar" : "Crear cuenta"}
        </button>
        <button
          type="button"
          onClick={() => void conGoogle()}
          className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm font-semibold"
        >
          Continuar con Google
        </button>
        <button
          type="button"
          onClick={() => setModo(modo === "entrar" ? "registrar" : "entrar")}
          className="w-full text-sm underline underline-offset-4"
        >
          {modo === "entrar" ? "No tengo cuenta" : "Ya tengo cuenta"}
        </button>
      </form>
    </AppShell>
  );
}
