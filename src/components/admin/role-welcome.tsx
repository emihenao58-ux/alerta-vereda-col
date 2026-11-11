import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Leaf, Shield, Trees } from "lucide-react";
import { useAuth, type Rol } from "@/hooks/use-auth";
import {
  ilustracionDeVeredaPorNombre,
  recursosVisualesDeTerritorio,
} from "@/lib/reportar/territory-visuals";

function imagenDeBienvenidaJACPorTerritorio(nombre: string | null) {
  if (!nombre) return null;

  const nombreNormalizado = nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

  // Ambos nombres existentes representan la cabecera, no una vereda adicional.
  if (nombreNormalizado === "ebejico centro" || nombreNormalizado === "cabecera municipal") {
    return recursosVisualesDeTerritorio("cabecera-municipal")?.ilustracion3d ?? null;
  }
  if (nombreNormalizado === "sevilla") {
    return recursosVisualesDeTerritorio("sevilla")?.fotografiaReferencia ?? null;
  }

  return ilustracionDeVeredaPorNombre(nombre);
}

export function RoleWelcome({
  role,
  veredaLabel,
  veredaLoading = false,
  onContinue,
}: {
  role: Rol;
  veredaLabel?: string | null;
  veredaLoading?: boolean;
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
    if (role === "admin_vereda") return;

    try {
      if (sessionStorage.getItem(sessionKey) !== "1") setVisible(true);
    } catch {
      setVisible(true);
    }
    setReady(true);
  }, [role, sessionKey]);

  function dismiss() {
    if (role === "admin_vereda") return;

    try {
      sessionStorage.setItem(sessionKey, "1");
    } catch {
      // Si el navegador bloquea sessionStorage, el cierre local sigue funcionando.
    }
    setVisible(false);
    onContinue?.();
  }

  if (role !== "admin_vereda" && (!ready || !visible)) return null;

  const imagenTerritorial =
    role === "admin_vereda" ? imagenDeBienvenidaJACPorTerritorio(veredaLabel ?? null) : null;

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
            title: veredaLabel || "Tu vereda asignada",
            body: "Trabajando juntos por una vereda más segura.",
            action: null,
          }
        : {
            eyebrow: "Solicitud recibida",
            title: "Tu acceso está en revisión",
            body: "El superadmin revisará tus datos y asignará la vereda antes de habilitar herramientas administrativas.",
            action: "Volver a la cartelera",
          };

  return (
    <section
      className={`role-welcome role-welcome-${role}${role === "admin_vereda" ? " role-welcome-jac" : ""}`}
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
          veredaLoading ? (
            <span
              className="role-welcome-jac-landscape role-welcome-jac-landscape-loading"
              aria-hidden="true"
            />
          ) : (
            <img
              className="role-welcome-jac-landscape"
              src={imagenTerritorial?.src ?? "/images/reportar/territory/vereda.webp"}
              alt=""
              aria-hidden="true"
            />
          )
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
        {copy.action !== null && (
          <button type="button" className="role-welcome-continue" onClick={dismiss}>
            {copy.action}
            <ArrowRight size={16} aria-hidden="true" />
          </button>
        )}
      </div>
      {role === "admin_vereda" && (
        <aside className="role-welcome-jac-message" aria-label="Mensaje comunitario">
          <span className="role-welcome-jac-leaf" aria-hidden="true">
            <Leaf size={25} strokeWidth={1.7} />
          </span>
          <div>
            <strong>La comunidad es nuestra fuerza</strong>
            <p>“Porque donde hay unidad, hay progreso.”</p>
          </div>
        </aside>
      )}
      {role !== "admin_vereda" && (
        <button type="button" className="role-welcome-skip" onClick={dismiss}>
          Omitir bienvenida
        </button>
      )}
    </section>
  );
}
