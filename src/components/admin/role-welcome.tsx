import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Shield, Trees } from "lucide-react";
import { useAuth, type Rol } from "@/hooks/use-auth";

export function RoleWelcome({
  role,
  veredaLabel,
  onContinue,
}: {
  role: Rol;
  veredaLabel?: string | null;
  onContinue?: () => void;
}) {
  const { session } = useAuth();
  const [visible, setVisible] = useState(false);
  const [ready, setReady] = useState(false);
  const sessionKey = useMemo(
    () => `alertavereda:welcome:${role}:${session?.access_token?.slice(-16) ?? "session"}`,
    [role, session?.access_token],
  );

  useEffect(() => {
    try {
      if (sessionStorage.getItem(sessionKey) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
    setReady(true);
  }, [sessionKey]);

  function dismiss() {
    try {
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      // Si el navegador bloquea sessionStorage, el cierre local sigue funcionando.
    }
    setVisible(false);
    onContinue?.();
  }

  if (!ready || !visible) return null;

  const copy =
    role === "superadmin"
      ? {
          eyebrow: "Sesión de gobernanza",
          title: "Bienvenido, superadmin",
          body: "Tienes dos espacios para cuidar el sistema: gobernanza y operación territorial.",
          action: "Entrar al Centro de Gestión",
        }
      : role === "admin_vereda"
        ? {
            eyebrow: "Tu territorio, tu cartelera",
            title: "Bienvenido, administrador",
            body: veredaLabel
              ? `Tu Panel JAC está listo para ${veredaLabel}.`
              : "Tu Panel JAC está listo para la vereda que tienes asignada.",
            action: "Revisar mi Panel JAC",
          }
        : {
            eyebrow: "Solicitud recibida",
            title: "Tu acceso está en revisión",
            body: "El superadmin revisará tus datos y asignará la vereda antes de habilitar herramientas administrativas.",
            action: "Volver a la cartelera",
          };

  return (
    <section
      className={`role-welcome role-welcome-${role}`}
      aria-live="polite"
      aria-label="Bienvenida de la sesión"
    >
      <div className="role-welcome-art" aria-hidden="true">
        {role === "superadmin" ? (
          <svg viewBox="0 0 160 120" className="role-welcome-svg" focusable="false">
            <defs>
              <linearGradient id="welcome-orbit" x1="0" x2="1">
                <stop offset="0" stopColor="currentColor" stopOpacity="0.2" />
                <stop offset="1" stopColor="currentColor" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <path
              className="welcome-orbit welcome-orbit-one"
              d="M22 62C39 18 119 14 140 53C158 86 91 111 45 93C28 86 17 75 22 62Z"
              fill="none"
              stroke="url(#welcome-orbit)"
              strokeWidth="1.5"
            />
            <path
              className="welcome-orbit welcome-orbit-two"
              d="M35 32C78 11 140 42 131 78C122 112 52 106 30 72C20 56 22 39 35 32Z"
              fill="none"
              stroke="currentColor"
              strokeOpacity="0.35"
              strokeWidth="1"
            />
            <circle
              className="welcome-node welcome-node-one"
              cx="28"
              cy="60"
              r="4"
              fill="currentColor"
            />
            <circle
              className="welcome-node welcome-node-two"
              cx="125"
              cy="42"
              r="3"
              fill="currentColor"
            />
            <circle
              className="welcome-node welcome-node-three"
              cx="102"
              cy="92"
              r="3"
              fill="currentColor"
            />
            <path
              d="M76 34L86 49L103 51L91 64L94 82L76 74L59 82L62 64L50 51L67 49Z"
              fill="currentColor"
              fillOpacity="0.12"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M76 48L86 52V60C86 68 81 74 76 77C71 74 66 68 66 60V52L76 48Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
            />
          </svg>
        ) : role === "admin_vereda" ? (
          <svg viewBox="0 0 160 120" className="role-welcome-svg" focusable="false">
            <path d="M10 94H150" stroke="currentColor" strokeOpacity="0.35" />
            <path d="M18 94L44 59L66 80L91 39L143 94Z" fill="currentColor" fillOpacity="0.11" />
            <path
              className="welcome-sun"
              d="M116 27a13 13 0 1 0 0 26a13 13 0 1 0 0-26Z"
              fill="currentColor"
              fillOpacity="0.22"
            />
            <path
              d="M46 94V67H62V94M88 94V59H103V94M122 94V73H135V94"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path
              className="welcome-leaf"
              d="M36 93C34 72 39 60 53 51C55 72 50 84 36 93Z"
              fill="currentColor"
              fillOpacity="0.6"
            />
            <path
              className="welcome-leaf welcome-leaf-two"
              d="M132 93C131 77 137 66 149 61C149 77 143 87 132 93Z"
              fill="currentColor"
              fillOpacity="0.45"
            />
          </svg>
        ) : (
          <svg viewBox="0 0 160 120" className="role-welcome-svg" focusable="false">
            <path d="M19 86H141" stroke="currentColor" strokeOpacity="0.35" />
            <path
              d="M38 86V50H70V86M79 86V38H112V86"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
            <path d="M54 50V39M95 38V27" stroke="currentColor" strokeWidth="2" />
            <circle
              className="welcome-pulse"
              cx="95"
              cy="27"
              r="6"
              fill="currentColor"
              fillOpacity="0.2"
              stroke="currentColor"
            />
            <path
              d="M47 60H61M87 50H103M87 62H103M47 72H61"
              stroke="currentColor"
              strokeOpacity="0.55"
              strokeWidth="2"
            />
          </svg>
        )}
      </div>
      <div className="role-welcome-copy">
        <p className="role-welcome-eyebrow">
          {role === "superadmin" ? (
            <Shield size={15} aria-hidden="true" />
          ) : role === "admin_vereda" ? (
            <Trees size={15} aria-hidden="true" />
          ) : (
            <CheckCircle2 size={15} aria-hidden="true" />
          )}
          {copy.eyebrow}
        </p>
        <h2>{copy.title}</h2>
        <p>{copy.body}</p>
        <button type="button" className="role-welcome-continue" onClick={dismiss}>
          {copy.action}
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
      <button type="button" className="role-welcome-skip" onClick={dismiss}>
        Omitir bienvenida
      </button>
    </section>
  );
}
