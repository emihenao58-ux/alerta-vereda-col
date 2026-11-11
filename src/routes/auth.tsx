import { createFileRoute, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  CheckCircle2,
  ClipboardList,
  Coins,
  Eye,
  EyeOff,
  Handshake,
  Heart,
  House,
  Leaf,
  LockKeyhole,
  Mail,
  MapPin,
  MoreHorizontal,
  Phone,
  RefreshCw,
  Scale,
  Search,
  ShieldCheck,
  Sprout,
  UserPlus,
  UserRound,
  UsersRound,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ClipboardEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { AdminAccessOptionsPanel } from "@/components/admin/admin-access-options-panel";
import {
  ADMIN_PHONE_DIAL_CODES,
  simulatedAdminPhoneVerification,
  type AdminPhoneChallenge,
} from "@/lib/admin-phone-verification";
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

type Modo = "inicio" | "entrar" | "solicitar" | "recuperar";
const CARGOS_VEREDA = [
  "Presidente de la JAC",
  "Vicepresidente de la JAC",
  "Secretario de la JAC",
  "Tesorero de la JAC",
  "Fiscal de la JAC",
  "Conciliador de la JAC",
  "Coordinador de una comisión de trabajo",
  "Integrante de la JAC (sin cargo específico)",
  "Líder comunitario",
  "Habitante de la vereda",
  "Otro",
] as const;

const CARGO_ICONOS: Record<(typeof CARGOS_VEREDA)[number], LucideIcon> = {
  "Presidente de la JAC": UserRound,
  "Vicepresidente de la JAC": UsersRound,
  "Secretario de la JAC": ClipboardList,
  "Tesorero de la JAC": Coins,
  "Fiscal de la JAC": Handshake,
  "Conciliador de la JAC": Scale,
  "Coordinador de una comisión de trabajo": ShieldCheck,
  "Integrante de la JAC (sin cargo específico)": Sprout,
  "Líder comunitario": Heart,
  "Habitante de la vereda": House,
  Otro: MoreHorizontal,
};

const ALIAS_BUSQUEDA_VEREDAS: Readonly<Record<string, readonly string[]>> = {
  "altos del brasil": ["alto del brasil"],
};

function normalizarBusquedaVereda(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es-CO")
    .trim();
}

function coincideBusquedaVereda(nombre: string, busqueda: string) {
  const consulta = normalizarBusquedaVereda(busqueda);
  if (!consulta) return true;

  const nombreNormalizado = normalizarBusquedaVereda(nombre);
  const aliases = ALIAS_BUSQUEDA_VEREDAS[nombreNormalizado] ?? [];
  return [nombreNormalizado, ...aliases].some((texto) =>
    normalizarBusquedaVereda(texto).includes(consulta),
  );
}

const CODIGO_TELEFONICO_VACIO = ["", "", "", "", "", ""];

function formatearTiempo(segundos: number) {
  const minutos = Math.floor(segundos / 60);
  const resto = segundos % 60;
  return `${String(minutos).padStart(2, "0")}:${String(resto).padStart(2, "0")}`;
}

const CUENTA_SUSPENDIDA_MESSAGE =
  "Cuenta suspendida. Tu cuenta administrativa se encuentra suspendida. Si crees que esto es un error, contacta al administrador.";
const SIN_CUENTA_ADMINISTRATIVA_MESSAGE =
  "No tienes una cuenta administrativa en AlertaVereda. Si necesitas acceso administrativo, debes solicitar una cuenta.";

function AdminAuthHeading({
  title,
  description,
  onBack,
  showMark = false,
}: {
  title: string;
  description: string;
  onBack: () => void;
  showMark?: boolean;
}) {
  return (
    <header className="admin-auth-heading">
      <button
        type="button"
        className="admin-auth-back"
        aria-label="Volver al panel de acceso administrativo"
        title="Volver a las opciones de acceso"
        onClick={onBack}
      >
        <ArrowLeft size={22} strokeWidth={2.2} aria-hidden="true" />
        <span>Volver a opciones</span>
      </button>
      <div className="admin-auth-heading-content">
        {showMark && (
          <span className="admin-auth-heading-mark" aria-hidden="true">
            <UserPlus size={29} strokeWidth={2} />
          </span>
        )}
        <div>
          <p className="admin-auth-eyebrow">Acceso administrativo</p>
          <h1>{title}</h1>
          <p className="admin-auth-description">{description}</p>
        </div>
      </div>
    </header>
  );
}

function GoogleMark() {
  return (
    <svg className="admin-auth-google-mark" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11c-.5 2.5-1.9 4.6-4.1 6v5h6.6c3.9-3.6 6.1-8.8 6.1-14.7z"
      />
      <path
        fill="#34A853"
        d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5c-1.8 1.2-4.1 2-6.9 2-5.3 0-9.8-3.6-11.4-8.4H5.8v5.2C9.2 39.6 16 44 24 44z"
      />
      <path
        fill="#FBBC05"
        d="M12.6 27.8c-.4-1.2-.7-2.5-.7-3.8s.3-2.6.7-3.8V15H5.8C4.6 17.7 4 20.7 4 24s.6 6.3 1.8 9l6.8-5.2z"
      />
      <path
        fill="#EA4335"
        d="M24 11.4c3 0 5.7 1 7.8 3l5.8-5.8C34.1 5.2 29.5 3 24 3 16 3 9.2 7.4 5.8 15l6.8 5.2c1.6-4.8 6.1-8.8 11.4-8.8z"
      />
    </svg>
  );
}

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const modoEnUrl = (location.search as Record<string, unknown>)["mode"];
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
    return modoEnUrl === "entrar" || modoEnUrl === "solicitar" || modoEnUrl === "recuperar"
      ? modoEnUrl
      : "inicio";
  });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [indicativoTelefono, setIndicativoTelefono] = useState("+57");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [cargo, setCargo] = useState("");
  const [otroCargo, setOtroCargo] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmarPassword, setMostrarConfirmarPassword] = useState(false);
  const [errorTelefono, setErrorTelefono] = useState("");
  const [errorCodigoTelefono, setErrorCodigoTelefono] = useState("");
  const [codigoTelefono, setCodigoTelefono] = useState<string[]>(CODIGO_TELEFONICO_VACIO);
  const [codigoPruebaTelefono, setCodigoPruebaTelefono] = useState<string | null>(null);
  const [retoTelefono, setRetoTelefono] = useState<AdminPhoneChallenge | null>(null);
  const [horaVerificacionTelefono, setHoraVerificacionTelefono] = useState(() => Date.now());
  const [telefonoVerificado, setTelefonoVerificado] = useState<string | null>(null);
  const [errorConfirmarPassword, setErrorConfirmarPassword] = useState("");
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [veredaSolicitadaId, setVeredaSolicitadaId] = useState("");
  const [veredas, setVeredas] = useState<Array<{ id: string; nombre: string }>>([]);
  const [busquedaVereda, setBusquedaVereda] = useState("");
  const [veredasCargadas, setVeredasCargadas] = useState(false);
  const [errorCargaVeredas, setErrorCargaVeredas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [loginPasswordEnCurso, setLoginPasswordEnCurso] = useState(false);
  const veredasFiltradas = veredas.filter((vereda) =>
    coincideBusquedaVereda(vereda.nombre, busquedaVereda),
  );
  const veredaSeleccionada = veredas.find((vereda) => vereda.id === veredaSolicitadaId);
  const accesoObservado = useRef<string | null>(null);
  const telefonoRef = useRef<HTMLInputElement>(null);
  const iniciarVerificacionTelefonoRef = useRef<HTMLButtonElement>(null);
  const codigoTelefonoRefs = useRef<Array<HTMLInputElement | null>>([]);
  const retoTelefonoRef = useRef<AdminPhoneChallenge | null>(null);
  const confirmarPasswordRef = useRef<HTMLInputElement>(null);
  const telefonoCompleto = `${indicativoTelefono}${telefono.replace(/\D/g, "")}`;
  const telefonoEstaVerificado = Boolean(telefono) && telefonoVerificado === telefonoCompleto;
  const tiempoCodigoRestante = retoTelefono
    ? Math.max(0, Math.ceil((retoTelefono.expiresAt - horaVerificacionTelefono) / 1000))
    : 0;
  const tiempoReenvioRestante = retoTelefono
    ? Math.max(0, Math.ceil((retoTelefono.resendAvailableAt - horaVerificacionTelefono) / 1000))
    : 0;

  function limpiarVerificacionTelefono() {
    const retoActivo = retoTelefonoRef.current;
    if (retoActivo) simulatedAdminPhoneVerification.clear(retoActivo.id);
    retoTelefonoRef.current = null;
    setRetoTelefono(null);
    setCodigoPruebaTelefono(null);
    setCodigoTelefono([...CODIGO_TELEFONICO_VACIO]);
    setErrorCodigoTelefono("");
    setTelefonoVerificado(null);
  }

  function validarLongitudTelefono() {
    const cantidadDigitos = telefonoCompleto.replace(/\D/g, "").length;
    if (cantidadDigitos >= 7 && cantidadDigitos <= 15) return true;
    setErrorTelefono("Ingresa un teléfono con indicativo de entre 7 y 15 dígitos en total.");
    telefonoRef.current?.focus();
    return false;
  }

  function solicitarCodigoTelefono() {
    if (!import.meta.env.DEV) return;
    if (!validarLongitudTelefono()) return;

    const retoAnterior = retoTelefonoRef.current;
    if (retoAnterior && Date.now() < retoAnterior.resendAvailableAt) return;
    if (retoAnterior) simulatedAdminPhoneVerification.clear(retoAnterior.id);

    const solicitud = simulatedAdminPhoneVerification.request(telefonoCompleto);
    setCodigoPruebaTelefono(import.meta.env.DEV ? solicitud.developmentCode : null);
    retoTelefonoRef.current = solicitud.challenge;
    setRetoTelefono(solicitud.challenge);
    setHoraVerificacionTelefono(Date.now());
    setCodigoTelefono([...CODIGO_TELEFONICO_VACIO]);
    setErrorTelefono("");
    setErrorCodigoTelefono("");

    if (import.meta.env.DEV) {
      console.info(
        "[AlertaVereda · SIMULACIÓN DEV] Verificación iniciada; se omiten datos sensibles.",
      );
    }

    window.setTimeout(() => codigoTelefonoRefs.current[0]?.focus(), 0);
  }

  function confirmarCodigoTelefono() {
    if (!retoTelefono) return;
    if (codigoTelefono.some((digito) => !digito)) {
      setErrorCodigoTelefono("Ingresa los seis dígitos del código de prueba.");
      return;
    }
    if (tiempoCodigoRestante <= 0) {
      setErrorCodigoTelefono("El código de prueba venció. Solicita uno nuevo para continuar.");
      return;
    }

    const resultado = simulatedAdminPhoneVerification.verify(
      retoTelefono,
      telefonoCompleto,
      codigoTelefono.join(""),
    );
    if (!resultado.verified) {
      setErrorCodigoTelefono(
        resultado.reason === "expired"
          ? "El código de prueba venció. Solicita uno nuevo para continuar."
          : resultado.reason === "number-changed"
            ? "El teléfono cambió. Solicita un nuevo código."
            : "El código no coincide. Revisa los seis dígitos e inténtalo de nuevo.",
      );
      return;
    }

    simulatedAdminPhoneVerification.clear(retoTelefono.id);
    retoTelefonoRef.current = null;
    setCodigoPruebaTelefono(null);
    setTelefonoVerificado(telefonoCompleto);
    setRetoTelefono(null);
    setCodigoTelefono([...CODIGO_TELEFONICO_VACIO]);
    setErrorTelefono("");
    setErrorCodigoTelefono("");
  }

  function manejarCambioDigitoCodigo(indice: number, value: string) {
    const digitos = value.replace(/\D/g, "");
    if (digitos.length > 1) {
      const pegados = digitos.slice(0, 6).split("");
      setCodigoTelefono([...pegados, ...CODIGO_TELEFONICO_VACIO.slice(pegados.length)]);
      setErrorCodigoTelefono("");
      codigoTelefonoRefs.current[Math.min(pegados.length, 5)]?.focus();
      return;
    }

    const digito = digitos.slice(-1);
    setCodigoTelefono((actual) => {
      const siguiente = [...actual];
      siguiente[indice] = digito;
      return siguiente;
    });
    setErrorCodigoTelefono("");
    if (digito && indice < 5) codigoTelefonoRefs.current[indice + 1]?.focus();
  }

  function pegarCodigoTelefono(event: ClipboardEvent<HTMLInputElement>) {
    const pegados = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pegados.length !== 6) return;
    event.preventDefault();
    setCodigoTelefono(pegados.split(""));
    setErrorCodigoTelefono("");
    codigoTelefonoRefs.current[5]?.focus();
  }

  function manejarTeclasCodigo(indice: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowLeft" && indice > 0) {
      event.preventDefault();
      codigoTelefonoRefs.current[indice - 1]?.focus();
    } else if (event.key === "ArrowRight" && indice < 5) {
      event.preventDefault();
      codigoTelefonoRefs.current[indice + 1]?.focus();
    } else if (event.key === "Backspace" && !codigoTelefono[indice] && indice > 0) {
      event.preventDefault();
      codigoTelefonoRefs.current[indice - 1]?.focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
      confirmarCodigoTelefono();
    }
  }

  function cambiarNumeroTelefono() {
    limpiarVerificacionTelefono();
    setErrorTelefono("");
    window.setTimeout(() => telefonoRef.current?.focus(), 0);
  }

  useEffect(() => {
    const siguienteModo: Modo =
      modoEnUrl === "entrar" || modoEnUrl === "solicitar" || modoEnUrl === "recuperar"
        ? modoEnUrl
        : "inicio";
    setModo(siguienteModo);
    setSolicitudEnviada(false);
  }, [modoEnUrl]);

  useEffect(() => {
    if (modo === "solicitar") return;
    const retoActivo = retoTelefonoRef.current;
    if (retoActivo) simulatedAdminPhoneVerification.clear(retoActivo.id);
    retoTelefonoRef.current = null;
    setRetoTelefono(null);
    setCodigoPruebaTelefono(null);
    setCodigoTelefono([...CODIGO_TELEFONICO_VACIO]);
    setErrorCodigoTelefono("");
    setTelefonoVerificado(null);
  }, [modo]);

  useEffect(() => {
    if (!retoTelefono) return;
    const timer = window.setInterval(() => setHoraVerificacionTelefono(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [retoTelefono]);

  useEffect(() => {
    if (!retoTelefono || tiempoCodigoRestante > 0) return;
    simulatedAdminPhoneVerification.clear(retoTelefono.id);
    setCodigoPruebaTelefono(null);
  }, [retoTelefono, tiempoCodigoRestante]);

  useEffect(
    () => () => {
      const retoActivo = retoTelefonoRef.current;
      if (retoActivo) simulatedAdminPhoneVerification.clear(retoActivo.id);
      retoTelefonoRef.current = null;
    },
    [],
  );

  function cambiarModo(destino: Modo) {
    setModo(destino);
    setErrorTelefono("");
    setErrorConfirmarPassword("");
    if (destino === "inicio") {
      setSolicitudEnviada(false);
      setPassword("");
      setConfirmarPassword("");
      setTelefono("");
      setIndicativoTelefono("+57");
      setCargo("");
      setOtroCargo("");
    } else {
      setSolicitudEnviada(false);
    }
    void navigate({
      to: "/auth",
      search: (prev) => ({ ...prev, mode: destino }),
      replace: true,
    });
  }

  function enviarConValidacionFrontend(e: React.FormEvent<HTMLFormElement>) {
    if (modo === "solicitar") {
      if (!validarLongitudTelefono()) {
        e.preventDefault();
        return;
      }

      if (import.meta.env.DEV && !telefonoEstaVerificado) {
        e.preventDefault();
        setErrorTelefono("Verifica este número en el flujo de prueba antes de solicitar acceso.");
        if (retoTelefono) codigoTelefonoRefs.current[0]?.focus();
        else iniciarVerificacionTelefonoRef.current?.focus();
        return;
      }

      if (password !== confirmarPassword) {
        e.preventDefault();
        setErrorConfirmarPassword("Las contraseñas no coinciden.");
        confirmarPasswordRef.current?.focus();
        return;
      }
    }

    setErrorTelefono("");
    setErrorConfirmarPassword("");
    void enviar(e);
  }

  useEffect(() => {
    let marcadorGoogle: boolean | "unavailable" = false;
    try {
      marcadorGoogle = sessionStorage.getItem(GOOGLE_LOGIN_PENDING_KEY) === "1";
    } catch {
      marcadorGoogle = "unavailable";
    }
    console.info("[SPLASH DEBUG] auth state", {
      hasPendingLogin: Boolean(loginPendiente),
      hasSession: Boolean(usuario),
      hasProfile: Boolean(perfil),
      isLoadingAccess: cargandoAcceso,
      googleMarkerAvailable: typeof marcadorGoogle === "boolean",
    });
  }, [cargandoAcceso, loginPendiente, perfil, usuario]);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((evento, session) => {
      console.info("[SPLASH DEBUG] auth event", { hasSession: Boolean(session) });
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
      hasPendingLogin: Boolean(loginPendiente),
      hasSession: Boolean(usuario),
      isLoadingAccess: cargandoAcceso,
      googleMarkerAvailable: typeof marcadorGoogle === "boolean",
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
      isGoogleLoginPending: loginPendiente === "google",
      hasSession: Boolean(usuario),
      hasProfile: Boolean(perfil),
      isLoadingAccess: cargandoAcceso,
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
        if (error) console.error("[AUTH] No se pudo cerrar la sesión tras denegar acceso.");
        setLoginPasswordEnCurso(false);
        setCargando(false);
        toast.error(SIN_CUENTA_ADMINISTRATIVA_MESSAGE);
      });
      return;
    }

    setLoginPendiente(null);

    if (perfil.estado_cuenta === "suspendida") {
      console.info("[SPLASH DEBUG] suspended account path; no identifying data", {
        isSuspended: true,
      });
      try {
        sessionStorage.removeItem(GOOGLE_LOGIN_PENDING_KEY);
      } catch {
        // La sesión se cierra aunque sessionStorage no esté disponible.
      }
      clearLoginSplash();
      void supabase.auth.signOut().then(({ error }) => {
        if (error) console.error("No se pudo cerrar la sesión de una cuenta suspendida.");
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
        if (error) console.error("[AUTH] No se pudo cerrar la sesión tras denegar acceso.");
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
      console.info("[SPLASH DEBUG] password login splash started", {
        isPasswordLogin: metodo === "password",
        isAccountActive: perfil.estado_cuenta === "activa",
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
        console.error("No se pudo registrar el cambio confirmado de correo.");
      } else {
        localStorage.removeItem("alertavereda_email_anterior");
        toast.success("Correo del superadmin actualizado y auditado.");
      }
      if (error) console.error("[AUTH] No se pudo confirmar la sesión tras cambio de correo.");
    })();
  }, []);

  useEffect(() => {
    if (modo !== "solicitar") return;

    let activo = true;
    setVeredasCargadas(false);
    setErrorCargaVeredas(false);

    void (async () => {
      try {
        const { data, error } = await supabase
          .from("veredas")
          .select("id, nombre")
          .eq("activa", true)
          .order("nombre");
        if (error) throw error;
        if (activo) setVeredas(data ?? []);
      } catch {
        if (activo) {
          setErrorCargaVeredas(true);
          toast.error("No pudimos cargar las veredas disponibles.");
        }
      } finally {
        if (activo) setVeredasCargadas(true);
      }
    })();

    return () => {
      activo = false;
    };
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
        cambiarModo("entrar");
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
      setPassword("");
      setTelefono("");
      setIndicativoTelefono("+57");
      limpiarVerificacionTelefono();
      setConfirmarPassword("");
      setCargo("");
      setOtroCargo("");
      setSolicitudEnviada(true);
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
        hasError: Boolean(error),
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
        <section className="admin-access-page" aria-labelledby="m4-section-heading-title">
          <AdminAccessOptionsPanel
            onBack={() => void navigate({ to: "/" })}
            onSelectMode={cambiarModo}
          />
        </section>
      </AppShell>
    );
  }

  const solicitar = modo === "solicitar";
  const recuperar = modo === "recuperar";

  if (solicitar && solicitudEnviada) {
    return (
      <AppShell>
        <section className="admin-auth-page">
          <div className="admin-auth-success">
            <span className="admin-auth-success-mark" aria-hidden="true">
              <CheckCircle2 size={78} strokeWidth={1.8} />
            </span>
            <h1>¡Solicitud enviada!</h1>
            <p className="admin-auth-success-copy">
              Tu solicitud de acceso como administrador ha sido enviada correctamente. Será revisada
              por el equipo de AlertaVereda y te notificaremos cuando sea aprobada.
            </p>
            <div className="admin-auth-success-note">
              <Mail size={25} strokeWidth={2} aria-hidden="true" />
              <p>Te enviaremos un correo cuando tengamos una respuesta sobre tu solicitud.</p>
            </div>
            <button
              type="button"
              className="admin-auth-submit"
              onClick={() => void navigate({ to: "/" })}
            >
              <House size={19} aria-hidden="true" />
              Volver al inicio
            </button>
          </div>
        </section>
      </AppShell>
    );
  }

  const contenidoAuth = (
    <section className={`admin-auth-page${solicitar ? " is-request" : ""}`}>
      <AdminAuthHeading
        title={solicitar ? "Registrarse" : recuperar ? "Restablecer contraseña" : "Iniciar sesión"}
        description={
          solicitar
            ? "Crea tu cuenta para solicitar acceso como administrador de una vereda."
            : recuperar
              ? "Te enviaremos un enlace seguro para establecer una nueva contraseña."
              : "Accede a tu cuenta de administrador para gestionar tu vereda."
        }
        onBack={() => cambiarModo(recuperar ? "entrar" : "inicio")}
        showMark={solicitar}
      />
      {solicitar ? (
        <form className="admin-auth-form-card is-request" onSubmit={enviarConValidacionFrontend}>
          <section className="admin-auth-form-section">
            <div className="admin-auth-step-heading">
              <span>1</span>
              <h2>Datos personales</h2>
            </div>
            <div className="admin-auth-fields-grid">
              <label className="admin-auth-field" htmlFor="admin-auth-name">
                <span className="admin-auth-label">
                  Nombre completo <b>*</b>
                </span>
                <span className="admin-auth-control">
                  <UserRound size={20} aria-hidden="true" />
                  <input
                    id="admin-auth-name"
                    type="text"
                    autoComplete="name"
                    placeholder="Ej. María Gómez"
                    required
                    value={nombre}
                    onChange={(event) => setNombre(event.currentTarget.value)}
                  />
                </span>
              </label>

              <label className="admin-auth-field" htmlFor="admin-auth-email">
                <span className="admin-auth-label">
                  Correo electrónico <b>*</b>
                </span>
                <span className="admin-auth-control">
                  <Mail size={20} aria-hidden="true" />
                  <input
                    id="admin-auth-email"
                    type="email"
                    autoComplete="email"
                    placeholder="ejemplo@correo.com"
                    required
                    value={email}
                    onChange={(event) => setEmail(event.currentTarget.value)}
                  />
                </span>
              </label>

              <div className="admin-auth-field admin-auth-phone-field">
                <label className="admin-auth-label" htmlFor="admin-auth-phone">
                  Teléfono de contacto <b>*</b>
                </label>
                <div className="admin-auth-phone-entry">
                  <span className="admin-auth-control admin-auth-dial-control">
                    <select
                      id="admin-auth-phone-country"
                      aria-label="Indicativo internacional"
                      value={indicativoTelefono}
                      disabled={telefonoEstaVerificado}
                      onChange={(event) => {
                        setIndicativoTelefono(event.currentTarget.value);
                        setErrorTelefono("");
                        limpiarVerificacionTelefono();
                      }}
                    >
                      {ADMIN_PHONE_DIAL_CODES.map((item) => (
                        <option key={`${item.country}-${item.code}`} value={item.code}>
                          {item.code} · {item.country}
                        </option>
                      ))}
                    </select>
                  </span>
                  <span className="admin-auth-control admin-auth-phone-number-control">
                    <Phone size={20} aria-hidden="true" />
                    <input
                      ref={telefonoRef}
                      id="admin-auth-phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder="300 123 4567"
                      required
                      disabled={telefonoEstaVerificado}
                      aria-invalid={Boolean(errorTelefono)}
                      aria-describedby={errorTelefono ? "admin-auth-phone-error" : undefined}
                      value={telefono}
                      onChange={(event) => {
                        setTelefono(event.currentTarget.value);
                        setErrorTelefono("");
                        limpiarVerificacionTelefono();
                      }}
                    />
                  </span>
                  {telefonoEstaVerificado && (
                    <span className="admin-auth-phone-verified-badge" role="status">
                      <CheckCircle2 size={18} aria-hidden="true" />
                      Verificado
                    </span>
                  )}
                </div>
                {errorTelefono && (
                  <span id="admin-auth-phone-error" className="admin-auth-field-error" role="alert">
                    {errorTelefono}
                  </span>
                )}

                {import.meta.env.DEV && (
                  <>
                    <p className="admin-auth-phone-simulation-note">
                      Simulación solo para desarrollo y pruebas: no envía SMS, no guarda datos y no
                      representa una verificación real.
                    </p>

                    {retoTelefono && codigoPruebaTelefono && (
                      <p className="admin-auth-phone-simulation-note" role="status">
                        Código de prueba (no es una verificación real): {codigoPruebaTelefono}
                      </p>
                    )}

                    {telefonoEstaVerificado ? (
                      <div
                        className="admin-auth-phone-confirmation"
                        role="status"
                        aria-live="polite"
                      >
                        <CheckCircle2 size={25} aria-hidden="true" />
                        <div>
                          <strong>Número verificado correctamente</strong>
                          <p>
                            La prueba local confirma el código de esta sesión; no acredita el
                            control real del teléfono.
                          </p>
                        </div>
                        <button
                          type="button"
                          className="admin-auth-phone-change"
                          onClick={cambiarNumeroTelefono}
                        >
                          <RefreshCw size={16} aria-hidden="true" />
                          Cambiar número
                        </button>
                      </div>
                    ) : retoTelefono ? (
                      <div
                        className="admin-auth-phone-verification"
                        aria-labelledby="admin-auth-phone-code-title"
                      >
                        <div className="admin-auth-phone-verification-heading">
                          <div>
                            <h3 id="admin-auth-phone-code-title">Verifica tu número</h3>
                            <p>Ingresa los seis dígitos del código temporal de prueba.</p>
                          </div>
                          <span>
                            {indicativoTelefono} {telefono}
                          </span>
                        </div>

                        <div
                          className="admin-auth-phone-code-inputs"
                          role="group"
                          aria-label="Código de verificación de seis dígitos"
                        >
                          {CODIGO_TELEFONICO_VACIO.map((_, index) => (
                            <input
                              key={index}
                              ref={(element) => {
                                codigoTelefonoRefs.current[index] = element;
                              }}
                              type="text"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              maxLength={1}
                              autoComplete={index === 0 ? "one-time-code" : "off"}
                              aria-label={`Dígito ${index + 1} del código`}
                              value={codigoTelefono[index] ?? ""}
                              aria-invalid={Boolean(errorCodigoTelefono)}
                              aria-describedby={
                                errorCodigoTelefono ? "admin-auth-phone-code-error" : undefined
                              }
                              onChange={(event) =>
                                manejarCambioDigitoCodigo(index, event.currentTarget.value)
                              }
                              onPaste={pegarCodigoTelefono}
                              onKeyDown={(event) => manejarTeclasCodigo(index, event)}
                            />
                          ))}
                        </div>

                        {errorCodigoTelefono && (
                          <p
                            id="admin-auth-phone-code-error"
                            className="admin-auth-field-error"
                            role="alert"
                          >
                            {errorCodigoTelefono}
                          </p>
                        )}
                        <p className="admin-auth-phone-code-timer" aria-live="polite">
                          {tiempoCodigoRestante > 0
                            ? `El código vence en ${formatearTiempo(tiempoCodigoRestante)}.`
                            : "El código de prueba venció. Solicita uno nuevo para continuar."}
                        </p>

                        <div className="admin-auth-phone-code-actions">
                          <button
                            type="button"
                            className="admin-auth-phone-confirm-code"
                            onClick={confirmarCodigoTelefono}
                            disabled={
                              codigoTelefono.some((digito) => !digito) || tiempoCodigoRestante === 0
                            }
                          >
                            Confirmar código
                          </button>
                          <button
                            type="button"
                            className="admin-auth-phone-resend"
                            onClick={solicitarCodigoTelefono}
                            disabled={tiempoReenvioRestante > 0}
                          >
                            <RefreshCw size={16} aria-hidden="true" />
                            {tiempoReenvioRestante > 0
                              ? `Reenviar en ${formatearTiempo(tiempoReenvioRestante)}`
                              : "Reenviar código"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        ref={iniciarVerificacionTelefonoRef}
                        type="button"
                        className="admin-auth-phone-start"
                        onClick={solicitarCodigoTelefono}
                      >
                        <Phone size={17} aria-hidden="true" />
                        Verificar número
                      </button>
                    )}
                  </>
                )}
              </div>

              <div className="admin-auth-field">
                <label className="admin-auth-label" htmlFor="admin-auth-password">
                  Contraseña <b>*</b>
                </label>
                <span className="admin-auth-control">
                  <LockKeyhole size={20} aria-hidden="true" />
                  <input
                    id="admin-auth-password"
                    type={mostrarPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                    value={password}
                    onChange={(event) => {
                      setPassword(event.currentTarget.value);
                      setErrorConfirmarPassword(
                        confirmarPassword && confirmarPassword !== event.currentTarget.value
                          ? "Las contraseñas no coinciden."
                          : "",
                      );
                    }}
                  />
                  <button
                    type="button"
                    className="admin-auth-password-toggle"
                    aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setMostrarPassword((visible) => !visible)}
                  >
                    {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </span>
              </div>

              <div className="admin-auth-field">
                <label className="admin-auth-label" htmlFor="admin-auth-password-confirm">
                  Confirmar contraseña <b>*</b>
                </label>
                <span className="admin-auth-control">
                  <LockKeyhole size={20} aria-hidden="true" />
                  <input
                    ref={confirmarPasswordRef}
                    id="admin-auth-password-confirm"
                    type={mostrarConfirmarPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repite tu contraseña"
                    minLength={6}
                    required
                    aria-invalid={Boolean(errorConfirmarPassword)}
                    aria-describedby={
                      errorConfirmarPassword ? "admin-auth-password-confirm-error" : undefined
                    }
                    value={confirmarPassword}
                    onChange={(event) => {
                      setConfirmarPassword(event.currentTarget.value);
                      setErrorConfirmarPassword(
                        event.currentTarget.value && event.currentTarget.value !== password
                          ? "Las contraseñas no coinciden."
                          : "",
                      );
                    }}
                  />
                  <button
                    type="button"
                    className="admin-auth-password-toggle"
                    aria-label={
                      mostrarConfirmarPassword
                        ? "Ocultar confirmación de contraseña"
                        : "Mostrar confirmación de contraseña"
                    }
                    onClick={() => setMostrarConfirmarPassword((visible) => !visible)}
                  >
                    {mostrarConfirmarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </span>
                {errorConfirmarPassword && (
                  <span
                    id="admin-auth-password-confirm-error"
                    className="admin-auth-field-error"
                    role="alert"
                  >
                    {errorConfirmarPassword}
                  </span>
                )}
              </div>
            </div>
          </section>

          <section className="admin-auth-form-section">
            <div className="admin-auth-step-heading">
              <span>2</span>
              <h2>
                Cargo o función dentro de la vereda <b>*</b>
              </h2>
            </div>
            <div className="admin-auth-fields-grid">
              <div className="admin-auth-field col-span-full">
                <span id="admin-auth-cargo-label" className="admin-auth-label">
                  Selecciona tu cargo o función
                </span>
                <div
                  role="radiogroup"
                  aria-labelledby="admin-auth-cargo-label"
                  className="grid grid-cols-2 gap-2.5 lg:grid-cols-3"
                >
                  {CARGOS_VEREDA.map((opcion, index) => {
                    const valor = opcion === "Otro" ? "otro" : opcion;
                    const seleccionada = cargo === valor;
                    const IconoCargo = CARGO_ICONOS[opcion];
                    const inputId = index === 0 ? "admin-auth-cargo" : `admin-auth-cargo-${index}`;

                    return (
                      <label key={opcion} className="block min-w-0 cursor-pointer">
                        <input
                          id={inputId}
                          type="radio"
                          name="admin-auth-cargo"
                          value={valor}
                          checked={seleccionada}
                          required
                          className="peer sr-only"
                          onChange={() => {
                            setCargo(valor);
                            if (valor !== "otro") setOtroCargo("");
                          }}
                        />
                        <span
                          className={`flex h-full min-h-[64px] w-full items-center gap-2.5 rounded-xl border px-2.5 py-2.5 text-left text-[color:var(--tinta)] transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-[color:var(--bosque)] ${
                            seleccionada
                              ? "border-[color:var(--bosque)] font-semibold ring-1 ring-[color:var(--bosque)]"
                              : "border-[color:var(--border)] bg-[color:var(--card)] hover:border-[color:var(--bosque)] hover:bg-[color:var(--muted)]"
                          }`}
                          style={
                            seleccionada
                              ? {
                                  backgroundColor:
                                    "color-mix(in srgb, var(--bosque) 12%, var(--card))",
                                }
                              : undefined
                          }
                        >
                          <span className="flex size-9 shrink-0 items-center justify-center text-[color:var(--bosque)]">
                            <IconoCargo size={22} strokeWidth={2.1} aria-hidden="true" />
                          </span>
                          <span className="min-w-0 flex-1 break-words text-xs leading-tight sm:text-sm">
                            {opcion}
                          </span>
                          {seleccionada && (
                            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[color:var(--bosque)] text-[color:var(--primary-foreground)]">
                              <Check size={13} strokeWidth={3} aria-hidden="true" />
                            </span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
              {cargo === "otro" && (
                <label className="admin-auth-field col-span-full" htmlFor="admin-auth-cargo-otro">
                  <span className="admin-auth-label">
                    Especifica tu cargo o función <b>*</b>
                  </span>
                  <span className="admin-auth-control">
                    <BriefcaseBusiness size={20} aria-hidden="true" />
                    <input
                      id="admin-auth-cargo-otro"
                      type="text"
                      required
                      placeholder="Escribe tu cargo o función"
                      value={otroCargo}
                      onChange={(event) => setOtroCargo(event.currentTarget.value)}
                    />
                  </span>
                </label>
              )}
            </div>
          </section>

          <section className="admin-auth-form-section">
            <div className="admin-auth-step-heading">
              <span>3</span>
              <h2>
                Vereda que deseas administrar <b>*</b>
              </h2>
            </div>
            <div className="admin-auth-field">
              <h3
                id="admin-auth-vereda-heading"
                className="admin-auth-label"
                style={{ fontSize: "calc(var(--av-text-scale) * 1rem)" }}
              >
                ¿Qué vereda deseas seleccionar?
              </h3>
              <p className="text-sm text-[color:var(--tinta-suave)]">
                Selecciona la comunidad que deseas consultar.
              </p>
              <label className="sr-only" htmlFor="admin-auth-vereda-search">
                Buscar una vereda
              </label>
              <span className="admin-auth-control">
                <Search size={20} aria-hidden="true" />
                <input
                  id="admin-auth-vereda-search"
                  type="text"
                  role="searchbox"
                  inputMode="search"
                  placeholder="Buscar una vereda..."
                  autoComplete="off"
                  value={busquedaVereda}
                  onChange={(event) => setBusquedaVereda(event.currentTarget.value)}
                  aria-label="Buscar una vereda"
                  aria-controls="admin-auth-vereda-results"
                />
                {busquedaVereda && (
                  <button
                    type="button"
                    className="shrink-0 rounded-md p-1.5 text-[color:var(--tinta-suave)] transition hover:bg-[color:var(--fondo-suave)]"
                    aria-label="Limpiar búsqueda"
                    title="Limpiar búsqueda"
                    onClick={() => setBusquedaVereda("")}
                  >
                    <X size={17} aria-hidden="true" />
                  </button>
                )}
              </span>
              {veredaSeleccionada && (
                <p className="text-sm text-[color:var(--tinta-suave)]" aria-live="polite">
                  Seleccionada:{" "}
                  <strong className="text-[color:var(--tinta)]">{veredaSeleccionada.nombre}</strong>
                </p>
              )}
              {!veredasCargadas ? (
                <p className="text-sm text-[color:var(--tinta-suave)]" role="status">
                  Cargando veredas…
                </p>
              ) : errorCargaVeredas ? (
                <p className="text-sm text-[color:var(--urgente)]" role="alert">
                  No pudimos cargar las veredas. Intenta nuevamente más tarde.
                </p>
              ) : veredas.length === 0 ? (
                <p className="text-sm text-[color:var(--tinta-suave)]" role="status">
                  No hay veredas activas disponibles en este momento.
                </p>
              ) : veredasFiltradas.length === 0 ? (
                <p className="rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2 text-sm text-[color:var(--tinta-suave)]">
                  No encontramos veredas con ese nombre. Prueba con otra búsqueda.
                </p>
              ) : (
                <div
                  id="admin-auth-vereda-results"
                  className="max-h-72 space-y-1.5 overflow-y-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-1.5"
                  role="group"
                  aria-label="Veredas para administrar"
                >
                  {veredasFiltradas.map((vereda) => {
                    const seleccionada = veredaSolicitadaId === vereda.id;
                    return (
                      <button
                        key={vereda.id}
                        type="button"
                        aria-pressed={seleccionada}
                        aria-label={vereda.nombre}
                        onClick={() => setVeredaSolicitadaId(vereda.id)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm text-[color:var(--tinta)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--bosque)] ${
                          seleccionada
                            ? "border-[color:var(--bosque)] bg-[color:var(--muted)] font-semibold ring-1 ring-[color:var(--bosque)]"
                            : "border-[color:var(--border)] bg-[color:var(--card)] hover:border-[color:var(--bosque)] hover:bg-[color:var(--muted)]"
                        }`}
                      >
                        <MapPin
                          size={18}
                          className="shrink-0 text-[color:var(--bosque)]"
                          aria-hidden="true"
                        />
                        <span className="min-w-0 flex-1">{vereda.nombre}</span>
                        {seleccionada && (
                          <CheckCircle2
                            size={18}
                            className="shrink-0 text-[color:var(--bosque)]"
                            aria-hidden="true"
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          <p className="admin-auth-pending-fields-note">
            El teléfono, el cargo y su especificación en «Otro» se validan solo en esta interfaz; no
            se envían ni se guardan de forma persistente. La verificación real queda pendiente de la
            futura integración de backend.
          </p>

          <button type="submit" className="admin-auth-submit" disabled={cargando}>
            <UserPlus size={19} aria-hidden="true" />
            {cargando ? "Procesando…" : "Solicitar acceso"}
          </button>
        </form>
      ) : (
        <form className="admin-auth-form-card" onSubmit={enviarConValidacionFrontend}>
          <div className="admin-auth-fields-grid">
            <label className="admin-auth-field" htmlFor="admin-auth-email">
              <span className="admin-auth-label">Correo electrónico</span>
              <span className="admin-auth-control">
                <Mail size={20} aria-hidden="true" />
                <input
                  id="admin-auth-email"
                  type="email"
                  autoComplete="email"
                  placeholder="ejemplo@correo.com"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.currentTarget.value)}
                />
              </span>
            </label>

            {!recuperar && (
              <div className="admin-auth-field">
                <label className="admin-auth-label" htmlFor="admin-auth-password">
                  Contraseña
                </label>
                <span className="admin-auth-control">
                  <LockKeyhole size={20} aria-hidden="true" />
                  <input
                    id="admin-auth-password"
                    type={mostrarPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Ingresa tu contraseña"
                    minLength={6}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.currentTarget.value)}
                  />
                  <button
                    type="button"
                    className="admin-auth-password-toggle"
                    aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setMostrarPassword((visible) => !visible)}
                  >
                    {mostrarPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </span>
              </div>
            )}
          </div>

          <button type="submit" className="admin-auth-submit" disabled={cargando}>
            <ArrowRight size={19} aria-hidden="true" />
            {cargando
              ? recuperar
                ? "Enviando enlace…"
                : loginPasswordEnCurso
                  ? "Iniciando sesión…"
                  : "Procesando…"
              : recuperar
                ? "Enviar enlace de recuperación"
                : "Iniciar sesión"}
          </button>

          {!recuperar && (
            <>
              <div className="admin-auth-divider" aria-hidden="true">
                <span />
                <b>o</b>
                <span />
              </div>
              <button
                type="button"
                className="admin-auth-google-button"
                onClick={() => void conGoogle()}
                disabled={cargando}
              >
                <GoogleMark />
                Iniciar sesión con Google
              </button>
              <button
                type="button"
                className="admin-auth-forgot"
                onClick={() => {
                  setPassword("");
                  cambiarModo("recuperar");
                }}
              >
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}
        </form>
      )}

      {!solicitar && !recuperar && (
        <aside className="admin-auth-community-note">
          <span className="admin-auth-community-icon" aria-hidden="true">
            <UserPlus size={29} />
          </span>
          <div>
            <h2>¿No eres administrador?</h2>
            <p>Puedes usar AlertaVereda sin iniciar sesión.</p>
          </div>
          <p className="admin-auth-community-tagline">¡Tu vereda también te necesita!</p>
        </aside>
      )}

      {recuperar && (
        <button
          type="button"
          className="admin-auth-text-link"
          onClick={() => cambiarModo("entrar")}
        >
          Volver a iniciar sesión
        </button>
      )}

      <p className="admin-auth-tagline">
        <span />
        <Leaf size={20} aria-hidden="true" />
        Juntos por nuestras veredas
        <span />
      </p>
    </section>
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
