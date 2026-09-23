import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TituloModulo } from "@/components/carta";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth/reset-password")({
  head: () => ({
    meta: [{ title: "Restablecer contraseña · AlertaVereda Ebéjico" }],
  }),
  component: ResetPassword,
});

const campo =
  "mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm";

type Estado = "cargando" | "listo" | "guardado" | "invalido";

function ResetPassword() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  useEffect(() => {
    let activo = true;
    const { data } = supabase.auth.onAuthStateChange((evento, session) => {
      if (!activo || !session) return;
      if (evento === "PASSWORD_RECOVERY" || evento === "INITIAL_SESSION") {
        setEstado("listo");
        setMensajeError("");
      }
    });

    void supabase.auth.getSession().then(({ data: sessionData, error }) => {
      if (!activo) return;
      if (error || !sessionData.session) {
        setEstado("invalido");
        setMensajeError("El enlace de recuperación es inválido o ya expiró.");
        return;
      }
      setEstado("listo");
    });

    return () => {
      activo = false;
      data.subscription.unsubscribe();
    };
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setMensajeError("");

    if (password.length < 6) {
      setMensajeError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmacion) {
      setMensajeError("Las contraseñas no coinciden.");
      return;
    }

    setGuardando(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      await supabase.auth.signOut();
      setEstado("guardado");
    } catch (error) {
      setMensajeError(
        error instanceof Error ? error.message : "No pudimos actualizar la contraseña.",
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="min-h-screen pb-24">
      <main className="mx-auto max-w-3xl px-4 py-5">
        <TituloModulo
          titulo="Restablecer contraseña"
          bajada="Establece una nueva contraseña para volver a ingresar a AlertaVereda."
        />
        <section className="carta mt-4 space-y-4">
          {estado === "cargando" && <p>Verificando el enlace de recuperación…</p>}

          {estado === "invalido" && (
            <>
              <p className="text-sm text-[color:var(--tinta-suave)]">{mensajeError}</p>
              <button
                type="button"
                onClick={() => void navigate({ to: "/auth" })}
                className="w-full rounded-md bg-[color:var(--bosque)] px-4 py-3 font-semibold text-[color:var(--card)]"
              >
                Volver al inicio de sesión
              </button>
            </>
          )}

          {estado === "listo" && (
            <form className="space-y-3" onSubmit={guardar}>
              <label className="block text-sm font-medium">
                Nueva contraseña
                <input
                  className={campo}
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <label className="block text-sm font-medium">
                Confirmar nueva contraseña
                <input
                  className={campo}
                  type="password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)}
                />
              </label>
              {mensajeError && (
                <p className="text-sm text-[color:var(--terracota)]">{mensajeError}</p>
              )}
              <button
                type="submit"
                disabled={guardando}
                className="w-full rounded-md bg-[color:var(--bosque)] px-4 py-3 font-semibold text-[color:var(--card)] disabled:opacity-60"
              >
                {guardando ? "Actualizando…" : "Actualizar contraseña"}
              </button>
            </form>
          )}

          {estado === "guardado" && (
            <>
              <p className="text-sm text-[color:var(--tinta-suave)]">
                Contraseña actualizada correctamente. Ahora puedes iniciar sesión con tu nueva
                contraseña.
              </p>
              <button
                type="button"
                onClick={() => window.location.assign("/auth?mode=entrar")}
                className="w-full rounded-md bg-[color:var(--bosque)] px-4 py-3 font-semibold text-[color:var(--card)]"
              >
                Iniciar sesión
              </button>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
