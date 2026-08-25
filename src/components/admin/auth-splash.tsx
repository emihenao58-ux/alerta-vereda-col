import { useEffect, useMemo, useState } from "react";
import { BellRing, ListChecks, MapPinned, ShieldCheck, Trees } from "lucide-react";
import { useAuth, type Rol } from "@/hooks/use-auth";

const SPLASH_STORAGE_KEY = "alertavereda:login-splash";
const SPLASH_EVENT = "alertavereda:login-start";
const MINIMUM_MS = 3000;
const EXIT_MS = 280;

type SplashAttempt = {
  startedAt: number;
  roleHint?: Rol;
};

function readAttempt(): SplashAttempt | null {
  try {
    const raw = sessionStorage.getItem(SPLASH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SplashAttempt>;
    if (typeof parsed.startedAt !== "number") return null;
    return parsed.roleHint
      ? { startedAt: parsed.startedAt, roleHint: parsed.roleHint }
      : { startedAt: parsed.startedAt };
  } catch {
    return null;
  }
}

export function beginLoginSplash(roleHint?: Rol) {
  const attempt: SplashAttempt = roleHint
    ? { startedAt: Date.now(), roleHint }
    : { startedAt: Date.now() };
  try {
    sessionStorage.setItem(SPLASH_STORAGE_KEY, JSON.stringify(attempt));
  } catch {
    // El splash debe ser una mejora visual; el login no depende de sessionStorage.
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SPLASH_EVENT));
  }
}

export function clearLoginSplash() {
  try {
    sessionStorage.removeItem(SPLASH_STORAGE_KEY);
  } catch {
    // No bloquear el flujo si el navegador impide usar sessionStorage.
  }
}

export function AuthSplash() {
  const { perfil, cargandoAcceso } = useAuth();
  const [attempt, setAttempt] = useState<SplashAttempt | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const loadAttempt = () => {
      const next = readAttempt();
      setAttempt(next);
      setElapsed(next ? Math.max(0, Date.now() - next.startedAt) : 0);
    };

    loadAttempt();
    window.addEventListener(SPLASH_EVENT, loadAttempt);
    return () => window.removeEventListener(SPLASH_EVENT, loadAttempt);
  }, []);

  useEffect(() => {
    if (!attempt) return;
    const timer = window.setInterval(() => {
      setElapsed(Math.max(0, Date.now() - attempt.startedAt));
    }, 50);
    return () => window.clearInterval(timer);
  }, [attempt]);

  useEffect(() => {
    if (!attempt || isExiting || elapsed < MINIMUM_MS || cargandoAcceso) return;

    setIsExiting(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const exitTimer = window.setTimeout(
      () => {
        clearLoginSplash();
        setAttempt(null);
        setIsExiting(false);
      },
      reducedMotion ? 0 : EXIT_MS,
    );

    return () => window.clearTimeout(exitTimer);
  }, [attempt, cargandoAcceso, elapsed, isExiting]);

  const role = perfil?.rol ?? attempt?.roleHint ?? "pendiente";
  const roleLabel =
    role === "superadmin"
      ? "superadmin"
      : role === "admin_vereda"
        ? "administrador de vereda"
        : "tu acceso administrativo";
  const progress = Math.min(100, Math.round((elapsed / MINIMUM_MS) * 100));

  if (!attempt) return null;

  return (
    <div
      className={`auth-splash auth-splash-${role}${isExiting ? " auth-splash-exiting" : ""}`}
      role="dialog"
      aria-modal="true"
      aria-busy={!isExiting}
      aria-label="Cargando espacio administrativo"
    >
      <div className="auth-splash-grid" aria-hidden="true" />
      <div className="auth-splash-panel">
        <div className="auth-splash-brand">
          <span className="auth-splash-logo">
            <Trees size={22} aria-hidden="true" />
          </span>
          <span>AlertaVereda</span>
        </div>

        <div className="auth-splash-illustration" aria-hidden="true">
          {role === "superadmin" ? (
            <SuperadminIllustration />
          ) : role === "admin_vereda" ? (
            <AdminVeredaIllustration />
          ) : (
            <PendingIllustration />
          )}
        </div>

        <div className="auth-splash-copy">
          <p className="auth-splash-eyebrow">Acceso protegido</p>
          <h1>Iniciando sesión como {roleLabel}</h1>
          <p>Preparando tu espacio administrativo…</p>
        </div>

        <div className="auth-splash-progress" aria-label={`Preparando acceso, ${progress}%`}>
          <div className="auth-splash-progress-track">
            <span style={{ width: `${progress}%` }} />
          </div>
          <span className="auth-splash-progress-text">{progress}%</span>
        </div>

        <div className="auth-splash-features" aria-label="Funciones del espacio administrativo">
          <span>
            <MapPinned size={16} aria-hidden="true" /> Territorio
          </span>
          <span>
            <ListChecks size={16} aria-hidden="true" /> Reportes
          </span>
          <span>
            <ShieldCheck size={16} aria-hidden="true" /> Seguridad
          </span>
          <span>
            <BellRing size={16} aria-hidden="true" /> Alertas
          </span>
        </div>
      </div>
    </div>
  );
}

function SuperadminIllustration() {
  const nodes = useMemo(
    () => [
      { cx: 52, cy: 72, delay: "0ms" },
      { cx: 116, cy: 42, delay: "320ms" },
      { cx: 178, cy: 76, delay: "640ms" },
      { cx: 130, cy: 118, delay: "960ms" },
    ],
    [],
  );

  return (
    <svg viewBox="0 0 230 160" className="auth-splash-svg" focusable="false">
      <path
        className="splash-map"
        d="M25 38L82 22L120 35L165 20L207 45L191 128L140 142L101 125L62 139L25 112Z"
      />
      <path className="splash-route" d="M52 72L116 42L178 76L130 118L52 72Z" />
      {nodes.map((node) => (
        <circle
          key={`${node.cx}-${node.cy}`}
          className="splash-node"
          cx={node.cx}
          cy={node.cy}
          r="7"
          style={{ animationDelay: node.delay }}
        />
      ))}
      <circle className="splash-node-halo" cx="116" cy="42" r="18" />
    </svg>
  );
}

function AdminVeredaIllustration() {
  return (
    <svg viewBox="0 0 230 160" className="auth-splash-svg" focusable="false">
      <path className="splash-hill splash-hill-back" d="M0 112L54 48L89 90L139 28L230 112V160H0Z" />
      <path
        className="splash-hill splash-hill-front"
        d="M0 126L62 80L108 111L158 62L230 126V160H0Z"
      />
      <path className="splash-road" d="M111 160C116 138 125 118 141 101" />
      <path className="splash-house" d="M38 111V86L58 69L78 86V111Z" />
      <path className="splash-house-roof" d="M32 88L58 64L84 88" />
      <path className="splash-house" d="M159 116V93L176 79L193 93V116Z" />
      <path className="splash-house-roof" d="M154 95L176 74L198 95" />
      <circle className="splash-sun" cx="188" cy="35" r="15" />
    </svg>
  );
}

function PendingIllustration() {
  return (
    <svg viewBox="0 0 230 160" className="auth-splash-svg" focusable="false">
      <rect className="splash-pending-card" x="55" y="28" width="120" height="102" rx="16" />
      <path className="splash-pending-line" d="M80 59H150M80 80H137M80 101H121" />
      <circle className="splash-pending-check" cx="169" cy="112" r="19" />
      <path className="splash-pending-check-mark" d="M160 112L167 119L180 104" />
      <path className="splash-pending-icon" d="M169 95A17 17 0 1 0 169 129A17 17 0 1 0 169 95Z" />
    </svg>
  );
}
