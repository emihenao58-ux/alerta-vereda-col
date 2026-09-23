import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { TituloModulo, Vacio } from "@/components/carta";
import {
  beginLoginSplash,
  clearLoginSplash,
  GOOGLE_LOGIN_PENDING_KEY,
} from "@/components/admin/auth-splash";
import { useAuth } from "@/hooks/use-auth";

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

type Modo = "inicio" | "entrar" | "solicitar" | "recuperar";
const CUENTA_SUSPENDIDA_MESSAGE =
  "Cuenta suspendida. Tu cuenta administrativa se encuentra suspendida. Si crees que esto es un error, contacta al administrador.";
const SIN_CUENTA_ADMINISTRATIVA_MESSAGE =
  "No tienes una cuenta administrativa en AlertaVereda. Si necesitas acceso administrativo, debes solicitar una cuenta.";

function Auth() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { usuario, perfil, cargandoAcceso, esAdminVereda, esSuperadmin } = useAuth();
  const [loginPendiente, setLoginPendiente] = useState<"google" | "password" | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem(GOOGLE_LOGIN_PENDING_KEY) === "1" ? "google" : null;
    } catch {
      return null;
    }
  });
  const [modo, setModo] = useState<Modo>(() => {
    if (typeof window !== "undefined") {
      return new URLSearchParams(window.location.search).get("mode") === "entrar"
        ? "entrar"
        : "inicio";
    }
    return "inicio";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [veredaSolicitadaId, setVeredaSolicitadaId] = useState("");
  const [veredas, setVeredas] = useState<Array<{ id: string; nombre: string }>>([]);
  const [cargando, setCargando] = useState(false);
  const [loginPasswordEnCurso, setLoginPasswordEnCurso] = useState(false);
  const accesoObservado = useRef<string | null>(null);

  useEffect(() => {
    let marcadorGoogle: boolean | "unavailable" = false;
    try {
      marcadorGoogle = sessionStorage.getItem(GOOGLE_LOGIN_PENDING_KEY) === "1";
    } catch {
      marcadorGoogle = "unavailable";
    }
    console.info("[SPLASH DEBUG] auth state", {
      loginPendiente,
      usuario: usuario?.email ?? null,
      usuarioId: usuario?.id ?? null,
      perfil: perfil
        ? { id: perfil.id, rol: perfil.rol, estado_cuenta: perfil.estado_cuenta }
        : null,
      cargandoAcceso,
      marcadorGoogle,
    });
  }, [cargandoAcceso, loginPendiente, perfil, usuario]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((evento, session) => {
      console.info("[SPLASH DEBUG] auth event", {
        evento,
        usuario: session?.user?.email ?? null,
        usuarioId: session?.user?.id ?? null,
      });
      if (evento !== "SIGNED_IN") return;

      try {
        const marcadorGoogle = sessionStorage.getItem(GOOGLE_LOGIN_PENDING_KEY) === "1";
        console.info("[SPLASH DEBUG] SIGNED_IN marker", { marcadorGoogle });
        if (!marcadorGoogle) return;
        sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
      } catch {
        console.info("[SPLASH DEBUG] SIGNED_IN marker unavailable");
        return;
      }

      console.info("[SPLASH DEBUG] setLoginPendiente google from SIGNED_IN");
      setLoginPendiente("google");
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oauthError =
      params.has("error") || params.has("error_code") || params.has("error_description");
    if (!oauthError || loginPendiente !== "google") return;

    setLoginPendiente(null);
    try {
      sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
    } catch {
      // El flujo normal continúa aunque sessionStorage no esté disponible.
    }
    clearLoginSplash();
    toast.error("No pudimos iniciar sesión con Google");
  }, [loginPendiente]);

  useEffect(() => {
    let marcadorGoogle: boolean | "unavailable" = false;
    try {
      marcadorGoogle = sessionStorage.getItem(GOOGLE_LOGIN_PENDING_KEY) === "1";
    } catch {
      marcadorGoogle = "unavailable";
    }
    console.info("[SPLASH DEBUG] OAuth fallback check", {
      loginPendiente,
      usuario: usuario?.email ?? null,
      cargandoAcceso,
      marcadorGoogle,
    });
    if (loginPendiente || cargandoAcceso || !usuario) return;

    try {
      if (sessionStorage.getItem(GOOGLE_LOGIN_PENDING_KEY) !== "1") return;
      sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
      console.info("[SPLASH DEBUG] setLoginPendiente google from fallback");
      setLoginPendiente("google");
    } catch {
      console.info("[SPLASH DEBUG] OAuth fallback marker unavailable");
      // El flujo principal no depende de sessionStorage.
    }
  }, [cargandoAcceso, loginPendiente, usuario]);

  useEffect(() => {
    console.info("[SPLASH DEBUG] login decision effect", {
      loginPendiente,
      usuario: usuario?.email ?? null,
      usuarioId: usuario?.id ?? null,
      perfil: perfil
        ? { id: perfil.id, rol: perfil.rol, estado_cuenta: perfil.estado_cuenta }
        : null,
      cargandoAcceso,
    });
    if (loginPendiente === "google" && !cargandoAcceso && !usuario) {
      setLoginPendiente(null);
      try {
        sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
      } catch {
        // El flujo normal continúa aunque sessionStorage no esté disponible.
      }
      clearLoginSplash();
      return;
    }

    if (!loginPendiente || !usuario) return;

    const metodo = loginPendiente;
    const accesoActual = `${metodo}:${usuario.id}`;
    if (cargandoAcceso) {
      accesoObservado.current = accesoActual;
      return;
    }

    if (!perfil || perfil.id !== usuario.id) {
      if (accesoObservado.current !== accesoActual) {
        accesoObservado.current = accesoActual;
        return;
      }
      setLoginPendiente(null);
      try {
        sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
      } catch {
        // El flujo normal continúa aunque sessionStorage no esté disponible.
      }
      clearLoginSplash();
      void supabase.auth.signOut().then(({ error }) => {
        if (error) console.error("No se pudo cerrar la sesión sin acceso administrativo:", error);
        setLoginPasswordEnCurso(false);
        setCargando(false);
        toast.error(SIN_CUENTA_ADMINISTRATIVA_MESSAGE);
      });
      return;
    }

    setLoginPendiente(null);

    if (perfil.estado_cuenta === "suspendida") {
      console.info("[SPLASH DEBUG] suspended account path; no splash", {
        usuario: usuario.email,
      });
      try {
        sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
      } catch {
        // La sesión se cierra aunque sessionStorage no esté disponible.
      }
      clearLoginSplash();
      void supabase.auth.signOut().then(({ error }) => {
        if (error) console.error("No se pudo cerrar la sesión de una cuenta suspendida:", error);
        setLoginPasswordEnCurso(false);
        setCargando(false);
        toast.error(CUENTA_SUSPENDIDA_MESSAGE);
      });
      return;
    }

    if (!esAdminVereda && !esSuperadmin) {
      try {
        sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
      } catch {
        // El flujo normal continúa aunque sessionStorage no esté disponible.
      }
      clearLoginSplash();
      void supabase.auth.signOut().then(({ error }) => {
        if (error) console.error("No se pudo cerrar la sesión sin acceso administrativo:", error);
        setLoginPasswordEnCurso(false);
        setCargando(false);
        toast.error(SIN_CUENTA_ADMINISTRATIVA_MESSAGE);
      });
      return;
    }

    if (metodo === "google") {
      try {
        sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
      } catch {
        // El flujo normal continúa aunque sessionStorage no esté disponible.
      }
      beginLoginSplash();
      return;
    }

    if (metodo === "password") {
      console.info("[SPLASH DEBUG] calling beginLoginSplash", {
        metodo,
        usuario: usuario.email,
        estado_cuenta: perfil.estado_cuenta,
      });
      setLoginPasswordEnCurso(false);
      setCargando(false);
      beginLoginSplash(undefined, true);
      void navigate({ to: "/" });
    }
  }, [cargandoAcceso, esAdminVereda, esSuperadmin, loginPendiente, navigate, perfil, usuario]);

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
    const esLoginPassword = modo === "entrar";
    if (esLoginPassword) setLoginPasswordEnCurso(true);
    let esperarDecisionDeAcceso = false;
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        esperarDecisionDeAcceso = true;
        setLoginPendiente("password");
        return;
      }

      if (modo === "recuperar") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });
        if (error) throw error;
        toast.success(
          "Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.",
        );
        setModo("entrar");
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
      if (esLoginPassword) {
        setLoginPendiente(null);
        setLoginPasswordEnCurso(false);
        clearLoginSplash();
        const mensaje =
          err instanceof Error && /email not confirmed/i.test(err.message)
            ? "Tu correo electrónico aún no ha sido confirmado. Revisa tu bandeja de entrada para confirmar tu cuenta."
            : err instanceof Error && /invalid login credentials/i.test(err.message)
              ? "Correo o contraseña incorrectos."
              : err instanceof Error
                ? err.message
                : "No pudimos completar el inicio de sesión.";
        toast.error(mensaje);
      } else {
        toast.error(err instanceof Error ? err.message : "No pudimos completar la acción");
      }
    } finally {
      if (!esperarDecisionDeAcceso) {
        setCargando(false);
      }
    }
  }

  async function conGoogle() {
    setCargando(true);
    console.info("[SPLASH DEBUG] conGoogle start");
    try {
      try {
        sessionStorage.setItem(GOOGLE_LOGIN_PENDING_KEY, "1");
        console.info("[SPLASH DEBUG] google marker written", {
          marcadorGoogle: sessionStorage.getItem(GOOGLE_LOGIN_PENDING_KEY) === "1",
        });
      } catch {
        console.info("[SPLASH DEBUG] google marker unavailable before OAuth");
        // El login no depende de sessionStorage.
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth`,
        },
      });
      console.info("[SPLASH DEBUG] signInWithOAuth returned", {
        error: error?.message ?? null,
      });
      if (error) {
        sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
        clearLoginSplash();
        toast.error("No pudimos iniciar sesión con Google");
      }
    } catch (err) {
      sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
      clearLoginSplash();
      toast.error(err instanceof Error ? err.message : "No pudimos iniciar sesión con Google");
    } finally {
      setCargando(false);
    }
  }

  if (pathname === "/auth/reset-password") {
    return <Outlet />;
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
  const recuperar = modo === "recuperar";

  const contenidoAuth = (
    <>
      <TituloModulo
        titulo={
          solicitar
            ? "Solicitar acceso de administrador"
            : recuperar
              ? "Restablecer contraseña"
              : "Iniciar sesión"
        }
        bajada={
          solicitar
            ? "Este proceso es para personas autorizadas a administrar una vereda."
            : recuperar
              ? "Te enviaremos un enlace seguro para establecer una nueva contraseña."
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
        {(modo === "entrar" || solicitar) && (
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
        )}
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
          {cargando
            ? solicitar
              ? "Procesando…"
              : recuperar
                ? "Enviando enlace…"
                : loginPasswordEnCurso
                  ? "Iniciando sesión…"
                  : "Procesando…"
            : solicitar
              ? "Enviar solicitud"
              : recuperar
                ? "Enviar enlace de recuperación"
                : "Iniciar sesión"}
        </button>
        {!solicitar && !recuperar && (
          <button
            type="button"
            onClick={() => void conGoogle()}
            disabled={cargando}
            className="w-full rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 text-sm font-semibold disabled:opacity-60"
          >
            Continuar con Google
          </button>
        )}
        {!solicitar && !recuperar && (
          <button
            type="button"
            onClick={() => {
              setPassword("");
              setModo("recuperar");
            }}
            className="w-full text-sm underline"
          >
            ¿Olvidaste tu contraseña?
          </button>
        )}
        <button
          type="button"
          onClick={() => setModo(recuperar ? "entrar" : "inicio")}
          className="w-full text-sm underline"
        >
          {recuperar ? "Volver a iniciar sesión" : "Volver a las opciones de acceso"}
        </button>
      </form>
      {solicitar && (
        <Vacio texto="No podrás administrar una vereda hasta que el superadmin apruebe tu solicitud." />
      )}
    </>
  );

  if (loginPasswordEnCurso) {
    return (
      <div className="min-h-screen pb-24">
        <main className="mx-auto max-w-3xl px-4 py-5">{contenidoAuth}</main>
      </div>
    );
  }

  return <AppShell>{contenidoAuth}</AppShell>;
}
