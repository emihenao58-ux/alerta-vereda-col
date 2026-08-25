import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { AppShell } from "@/components/app-shell";
import { TituloModulo, Vacio } from "@/components/carta";
import { beginLoginSplash, clearLoginSplash } from "@/components/admin/auth-splash";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acceso administrativo · AlertaVereda Ebéjico" },
      {
        name: "description",
        content: "Inicia sesión o solicita acceso para administrar una vereda en AlertaVereda.",
      },
      { property: "og:title", content: "Acceso administrativo · AlertaVereda" },
      {
        property: "og:description",
        content: "El acceso administrativo se aprueba y asigna por vereda.",
      },
    ],
  }),
  component: Auth,
});

const campo =
  "mt-1 w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm";

type Modo = "inicio" | "entrar" | "solicitar";

function Auth() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>("inicio");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [veredaSolicitadaId, setVeredaSolicitadaId] = useState("");
  const [veredas, setVeredas] = useState<Array<{ id: string; nombre: string }>>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("email_change") !== "1") return;

    void (async () => {
      const correoAnterior = localStorage.getItem("alertavereda_email_anterior");
      const { data, error } = await supabase.auth.getUser();
      const correoNuevo = data.user?.email;
      if (
        !correoAnterior ||
        !correoNuevo ||
        correoAnterior.toLowerCase() === correoNuevo.toLowerCase()
      )
        return;

      const { error: auditError } = await supabase.rpc("registrar_cambio_correo_superadmin", {
        p_correo_anterior: correoAnterior,
        p_correo_nuevo: correoNuevo,
      });
      if (auditError) {
        console.error("No se pudo auditar el cambio confirmado de correo:", auditError);
      } else {
        localStorage.removeItem("alertavereda_email_anterior");
        toast.success("Correo del superadmin actualizado y auditado.");
      }
      if (error) console.error("No se pudo confirmar el usuario actual:", error);
    })();
  }, []);

  useEffect(() => {
    if (modo !== "solicitar") return;

    void supabase
      .from("veredas")
      .select("id, nombre")
      .eq("activa", true)
      .order("nombre")
      .then(({ data, error }) => {
        if (error) {
          toast.error("No pudimos cargar las veredas disponibles.");
          return;
        }
        setVeredas(data ?? []);
      });
  }, [modo]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        beginLoginSplash(undefined, true);
        void navigate({ to: "/" });
        return;
      }

      if (modo !== "solicitar") return;
      if (!nombre.trim()) throw new Error("Escribe tu nombre completo.");
      if (!veredaSolicitadaId) throw new Error("Selecciona la vereda que deseas administrar.");

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            nombre: nombre.trim(),
            vereda_solicitada_id: veredaSolicitadaId,
            solicitud_admin: true,
          },
        },
      });
      if (error) throw error;
      toast.success("Solicitud creada. Revisa tu correo si debemos confirmar la cuenta.");
      setModo("entrar");
    } catch (err) {
      if (modo === "entrar") clearLoginSplash();
      toast.error(err instanceof Error ? err.message : "No pudimos completar la acción");
    } finally {
      setCargando(false);
    }
  }

  async function conGoogle() {
    setCargando(true);
    beginLoginSplash();
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        clearLoginSplash();
        toast.error("No pudimos iniciar sesión con Google");
        return;
      }
      if (result.redirected) return;
      void navigate({ to: "/" });
    } catch (err) {
      clearLoginSplash();
      toast.error(err instanceof Error ? err.message : "No pudimos iniciar sesión con Google");
    } finally {
      setCargando(false);
    }
  }

  if (modo === "inicio") {
    return (
      <AppShell>
        <TituloModulo
          titulo="Acceso"
          bajada="La cartelera y los reportes comunitarios siguen disponibles desde la página principal."
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <section className="carta space-y-3">
            <h2 className="text-lg font-semibold">Iniciar sesión</h2>
            <p className="text-sm text-[color:var(--tinta-suave)]">
              Entra con tu correo y contraseña. Si eres administrador, el sistema cargará
              automáticamente la vereda que te fue asignada.
            </p>
            <button
              type="button"
              onClick={() => setModo("entrar")}
              className="w-full rounded-md bg-[color:var(--bosque)] px-4 py-3 font-semibold text-[color:var(--card)]"
            >
              Iniciar sesión
            </button>
          </section>
          <section className="carta space-y-3">
            <h2 className="text-lg font-semibold">Solicitar acceso de administrador</h2>
            <p className="text-sm text-[color:var(--tinta-suave)]">
              Solicita administrar una vereda. El superadmin revisará tu solicitud antes de
              otorgarte permisos.
            </p>
            <button
              type="button"
              onClick={() => setModo("solicitar")}
              className="w-full rounded-md border border-[color:var(--border)] px-4 py-3 font-semibold"
            >
              Solicitar acceso
            </button>
          </section>
        </div>
      </AppShell>
    );
  }

  const solicitar = modo === "solicitar";

  return (
    <AppShell>
      <TituloModulo
        titulo={solicitar ? "Solicitar acceso de administrador" : "Iniciar sesión"}
        bajada={
          solicitar
            ? "Este proceso es para personas autorizadas a administrar una vereda."
            : "Usa tu correo y contraseña; no necesitas seleccionar una vereda."
        }
      />
      {solicitar && (
        <section className="carta mt-4 space-y-2 border-l-4 border-[color:var(--terracota)]">
          <p className="font-semibold">
            Este apartado es exclusivamente para personas autorizadas a administrar una vereda.
          </p>
          <p className="text-sm text-[color:var(--tinta-suave)]">
            Los habitantes pueden enviar reportes desde la página principal. Tu solicitud será
            revisada por el superadmin.
          </p>
          <button
            type="button"
            onClick={() => void navigate({ to: "/" })}
            className="text-sm underline"
          >
            Volver a la página principal
          </button>
        </section>
      )}
      <form className="carta mt-4 space-y-3" onSubmit={enviar}>
        {solicitar && (
          <label className="block text-sm font-medium">
            Nombre completo
            <input
              className={campo}
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </label>
        )}
        <label className="block text-sm font-medium">
          Correo electrónico
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
        {solicitar && (
          <label className="block text-sm font-medium">
            Vereda que solicitas administrar
            <select
              className={campo}
              required
              value={veredaSolicitadaId}
              onChange={(e) => setVeredaSolicitadaId(e.target.value)}
            >
              <option value="">Selecciona una vereda</option>
              {veredas.map((vereda) => (
                <option key={vereda.id} value={vereda.id}>
                  {vereda.nombre}
                </option>
              ))}
            </select>
          </label>
        )}
        <button
          type="submit"
          disabled={cargando}
          className="w-full rounded-md bg-[color:var(--bosque)] px-4 py-3 font-semibold text-[color:var(--card)] disabled:opacity-60"
        >
          {cargando ? "Procesando…" : solicitar ? "Enviar solicitud" : "Iniciar sesión"}
        </button>
        {!solicitar && (
          <button
            type="button"
            onClick={() => void conGoogle()}
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm font-semibold"
          >
            Continuar con Google
          </button>
        )}
        <button
          type="button"
          onClick={() => setModo("inicio")}
          className="w-full text-sm underline"
        >
          Volver a las opciones de acceso
        </button>
      </form>
      {solicitar && (
        <Vacio texto="No podrás administrar una vereda hasta que el superadmin apruebe tu solicitud." />
      )}
    </AppShell>
  );
}
