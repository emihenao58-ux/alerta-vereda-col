import { memo, useEffect, useRef, useState } from "react";
import { useLocation } from "@tanstack/react-router";
import { BellRing, ListChecks, MapPinned, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth, type Rol } from "@/hooks/use-auth";

const SPLASH_STORAGE_KEY = "alertavereda:login-splash";
const SPLASH_EVENT = "alertavereda:login-start";
export const GOOGLE_LOGIN_PENDING_KEY = "alertavereda:google-login-pending";
const MINIMUM_MS = 3000;
const EXIT_MS = 420;
const TOAST_DELAY_MS = 40;
const SUPERADMIN_TERRITORY_PATH =
  "M100 4L116 6L126 13L136 12L141 23L153 28L157 39L169 44L171 57L182 63L180 74L191 82L188 95L196 104L191 115L196 126L188 138L175 135L166 144L159 156L146 152L136 159L125 152L113 158L103 152L91 157L82 148L71 152L64 140L54 136L56 123L47 114L51 102L44 92L51 80L47 69L56 57L55 45L67 38L70 28L84 22L88 12Z";

type SplashAttempt = {
  startedAt: number;
  roleHint?: Rol;
  announce?: boolean;
};

function readAttempt(): SplashAttempt | null {
  try {
    const raw = sessionStorage.getItem(SPLASH_STORAGE_KEY);
    console.info("[SPLASH DEBUG] readAttempt", { hasValue: Boolean(raw) });
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SplashAttempt>;
    if (typeof parsed.startedAt !== "number") return null;
    const attempt = {
      startedAt: parsed.startedAt,
      ...(parsed.roleHint ? { roleHint: parsed.roleHint } : {}),
      ...(parsed.announce === true ? { announce: true } : {}),
    };
    console.info("[SPLASH DEBUG] readAttempt result", { attempt });
    return attempt;
  } catch {
    console.info("[SPLASH DEBUG] readAttempt failed");
    return null;
  }
}

function hasGoogleLoginPending() {
  try {
    return sessionStorage.getItem(GOOGLE_LOGIN_PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

export function beginLoginSplash(roleHint?: Rol, announce = false) {
  console.info("[SPLASH DEBUG] beginLoginSplash invoked", { roleHint, announce });
  const attempt: SplashAttempt = {
    startedAt: Date.now(),
    ...(roleHint ? { roleHint } : {}),
    ...(announce ? { announce: true } : {}),
  };
  try {
    sessionStorage.setItem(SPLASH_STORAGE_KEY, JSON.stringify(attempt));
    console.info("[SPLASH DEBUG] login-splash written", {
      hasValue: Boolean(sessionStorage.getItem(SPLASH_STORAGE_KEY)),
    });
  } catch {
    console.info("[SPLASH DEBUG] login-splash write failed");
    // El splash debe ser una mejora visual; el login no depende de sessionStorage.
  }
  if (typeof window !== "undefined") {
    console.info("[SPLASH DEBUG] dispatch login-start");
    window.dispatchEvent(new Event(SPLASH_EVENT));
  }
}

export function clearLoginSplash() {
  try {
    sessionStorage.removeItem(SPLASH_STORAGE_KEY);
  } catch {
    // No bloquear el flujo si el navegador impide usar sessionStorage.
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(SPLASH_EVENT));
  }
}

export function AuthSplash() {
  const { pathname } = useLocation();
  const { perfil, cargandoAcceso } = useAuth();
  const [verificandoGoogle, setVerificandoGoogle] = useState(() => {
    if (typeof window === "undefined") return false;
    return hasGoogleLoginPending();
  });
  const [attempt, setAttempt] = useState<SplashAttempt | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const splashRef = useRef<HTMLDivElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const focusCapturedRef = useRef(false);
  const focusOverlayVisible =
    pathname !== "/auth/reset-password" && (Boolean(attempt) || verificandoGoogle);

  useEffect(() => {
    const loadAttempt = (source: "initial" | "event") => {
      console.info("[SPLASH DEBUG] AuthSplash loadAttempt", { source });
      const next = readAttempt();
      setAttempt(next);
      setElapsed(next ? Math.max(0, Date.now() - next.startedAt) : 0);
      setIsExiting(false);
      if (source === "event" || hasGoogleLoginPending()) {
        setVerificandoGoogle(hasGoogleLoginPending());
      }
      console.info("[SPLASH DEBUG] AuthSplash setAttempt", { attempt: next });
    };
    const handleLoginStart = () => {
      console.info("[SPLASH DEBUG] AuthSplash received login-start");
      loadAttempt("event");
    };

    loadAttempt("initial");
    window.addEventListener(SPLASH_EVENT, handleLoginStart);
    return () => window.removeEventListener(SPLASH_EVENT, handleLoginStart);
  }, []);

  useEffect(() => {
    if (!focusOverlayVisible) {
      const previousFocus = restoreFocusRef.current;
      restoreFocusRef.current = null;
      focusCapturedRef.current = false;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
      return;
    }

    if (!focusCapturedRef.current) {
      const activeElement = document.activeElement;
      restoreFocusRef.current =
        activeElement instanceof HTMLElement && activeElement !== document.body
          ? activeElement
          : null;
      focusCapturedRef.current = true;
    }

    const focusSplash = () => splashRef.current?.focus({ preventScroll: true });
    focusSplash();

    const keepFocusInside = (event: FocusEvent) => {
      if (!splashRef.current?.contains(event.target as Node)) focusSplash();
    };
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;
      event.preventDefault();
      focusSplash();
    };

    document.addEventListener("focusin", keepFocusInside);
    document.addEventListener("keydown", trapTab, true);
    return () => {
      document.removeEventListener("focusin", keepFocusInside);
      document.removeEventListener("keydown", trapTab, true);
    };
  }, [focusOverlayVisible, verificandoGoogle]);

  useEffect(() => {
    if (!attempt) return;
    const timer = window.setInterval(() => {
      setElapsed(Math.max(0, Date.now() - attempt.startedAt));
    }, 50);
    return () => window.clearInterval(timer);
  }, [attempt]);

  useEffect(() => {
    if (!attempt || isExiting || elapsed < MINIMUM_MS || cargandoAcceso) return;
    console.info("[SPLASH DEBUG] AuthSplash starting exit", {
      elapsed,
      cargandoAcceso,
    });
    setIsExiting(true);
  }, [attempt, cargandoAcceso, elapsed, isExiting]);

  useEffect(() => {
    if (!attempt || !isExiting) return;
    console.info("[SPLASH DEBUG] AuthSplash exit effect", { attempt });

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const exitDuration = reducedMotion ? 0 : EXIT_MS;
    const exitTimer = window.setTimeout(() => {
      clearLoginSplash();
      setAttempt(null);
      setIsExiting(false);
    }, exitDuration);
    const toastTimer = attempt.announce
      ? window.setTimeout(() => toast.success("Sesión iniciada."), exitDuration + TOAST_DELAY_MS)
      : undefined;

    return () => {
      window.clearTimeout(exitTimer);
      if (toastTimer !== undefined) window.clearTimeout(toastTimer);
    };
  }, [attempt, isExiting]);

  const role = perfil?.rol ?? attempt?.roleHint ?? "pendiente";
  const roleLabel =
    role === "superadmin"
      ? "superadmin"
      : role === "admin_vereda"
        ? "administrador de vereda"
        : "tu acceso administrativo";
  const progress = Math.min(100, Math.round((elapsed / MINIMUM_MS) * 100));

  if (pathname === "/auth/reset-password") return null;

  if (verificandoGoogle) {
    return (
      <div
        className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-[color:var(--card)] text-[color:var(--bosque-oscuro)]"
        ref={splashRef}
        tabIndex={-1}
        role="status"
        aria-live="polite"
        aria-label="Verificando acceso"
      >
        <div className="flex items-center gap-3 rounded-md border border-[color:var(--border)] bg-[color:var(--card)] px-5 py-4 shadow-sm">
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--bosque)] border-t-transparent"
            aria-hidden="true"
          />
          <span className="text-sm font-medium">Verificando acceso...</span>
        </div>
      </div>
    );
  }

  if (!attempt) return null;

  return (
    <div
      className={`auth-splash auth-splash-${role}${isExiting ? " auth-splash-exiting" : ""}`}
      style={{ animation: "none" }}
      ref={splashRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-busy={!isExiting}
      aria-label="Cargando espacio administrativo"
    >
      <svg
        className="auth-splash-contours"
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M-40 82C98 26 118 160 264 103S479 28 599 94s204 53 321-8 241-37 360 29 238 63 363-2" />
        <path d="M-52 123C81 71 122 193 271 139s214-64 332 2 201 54 326-11 239-31 355 32 246 54 370-3" />
        <path d="M-28 694c126-64 201 21 337-32s227-90 357-13 214 83 346 9 228-61 367 8 215 63 343-8" />
        <path d="M-26 740c126-62 198 18 330-34s228-87 361-9 213 81 346 4 225-58 363 12 215 59 346-10" />
      </svg>
      <AuthSplashLandscape />
      <div className="auth-splash-panel">
        <div className="auth-splash-brand">
          <span className="auth-splash-logo">
            <img src="/images/branding/alertavereda-icono.png" alt="" width="56" height="56" />
          </span>
          <span className="auth-splash-brand-name">
            Alerta<span>Vereda</span>
          </span>
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

const SuperadminIllustration = memo(function SuperadminIllustration() {
  return (
    <svg viewBox="0 0 230 160" className="auth-splash-svg" focusable="false">
      <defs>
        <clipPath id="splash-ebejico-territory-clip">
          <path d={SUPERADMIN_TERRITORY_PATH} />
        </clipPath>
      </defs>
      <path className="splash-map-territory" d={SUPERADMIN_TERRITORY_PATH} />
      <g clipPath="url(#splash-ebejico-territory-clip)">
        <path
          className="splash-map-terrain"
          d="M18 119C47 94 61 98 81 75C99 54 115 59 133 39C151 20 174 31 211 8V160H18Z"
        />
        <path
          className="splash-map-terrain-alt"
          d="M18 142C43 121 65 119 83 101C103 81 122 89 139 69C159 46 184 61 212 36V160H18Z"
        />
        <path
          className="splash-map-contour"
          d="M27 69C55 52 77 58 96 42C115 26 130 36 148 27C169 17 187 29 212 20"
        />
        <path
          className="splash-map-contour"
          d="M20 91C45 76 67 81 87 65C108 49 126 58 145 47C164 36 186 46 216 37"
        />
        <path
          className="splash-map-contour splash-map-contour-gold"
          d="M22 119C45 104 63 109 83 93C104 77 122 87 143 72C164 57 187 68 214 56"
        />
        <path
          className="splash-map-contour"
          d="M35 141C57 127 78 132 99 116C119 101 137 112 157 96C177 81 194 91 215 82"
        />
      </g>
      <path className="splash-map-territory-outline" d={SUPERADMIN_TERRITORY_PATH} />
      <g className="splash-map-pin" transform="translate(91 70)">
        <circle className="splash-map-pin-halo" cx="0" cy="0" r="13" />
        <path
          className="splash-map-pin-shape"
          d="M0-11C-6-11-10-7-10-1C-10 7 0 15 0 15S10 7 10-1C10-7 6-11 0-11Z"
        />
        <circle className="splash-map-pin-core" cx="0" cy="-1" r="3" />
        <animateTransform
          className="splash-map-pin-motion"
          attributeName="transform"
          type="translate"
          dur="8s"
          repeatCount="indefinite"
          calcMode="spline"
          keyTimes="0;0.25;0.5;0.75;1"
          keySplines="0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1;0.42 0 0.58 1"
          values="91 70;126 48;169 74;118 111;91 70"
        />
      </g>
    </svg>
  );
});

const AdminVeredaIllustration = memo(function AdminVeredaIllustration() {
  return (
    <svg viewBox="0 0 257 200" className="auth-splash-svg" focusable="false">
      <path
        className="splash-territory-back"
        d="M0 130C18 111 31 104 48 96C62 89 72 75 84 79C99 84 109 103 122 96C139 87 145 59 159 52C174 44 183 71 198 82C217 95 235 98 257 101V200H0Z"
      />
      <path
        className="splash-territory-mid"
        d="M0 147C19 133 35 126 51 123C66 120 78 108 91 112C108 117 117 135 131 127C146 118 155 91 170 87C185 83 196 110 211 117C227 124 243 120 257 114V200H0Z"
      />
      <path
        className="splash-territory-front"
        d="M0 164C20 151 38 146 55 150C73 154 86 168 102 162C118 155 131 133 147 135C164 138 176 157 192 154C211 151 232 140 257 146V200H0Z"
      />
      <path
        className="splash-territory-belt"
        d="M0 183C23 169 43 165 63 170C83 175 95 185 113 178C130 171 141 153 158 157C176 161 188 178 205 174C224 170 241 163 257 168V200H0Z"
      />
      <path
        className="splash-territory-contour"
        d="M18 139C43 125 63 124 82 132C100 140 112 143 128 133C147 121 161 105 183 109C202 112 219 126 241 122"
      />
      <path
        className="splash-territory-contour splash-territory-contour-gold"
        d="M29 158C50 148 69 148 87 155C105 162 119 161 136 151C153 141 169 130 187 135C207 141 223 151 246 147"
      />
      <path
        className="splash-territory-contour"
        d="M9 174C30 164 48 163 66 170C83 177 99 184 116 175C135 165 147 151 165 155C185 160 201 174 222 168C235 165 246 162 253 164"
      />
      <path
        className="splash-territory-forest"
        d="M0 184C11 176 22 175 32 181C42 171 54 172 64 181C76 173 89 177 97 187C110 178 124 181 133 190C145 180 160 181 170 190C183 178 198 178 208 187C220 177 234 177 244 185C249 181 253 181 257 183V200H0Z"
      />
      <path
        className="splash-territory-foreground"
        d="M0 194C15 187 29 188 43 196C57 187 72 189 83 198C99 190 115 191 128 199C143 189 158 191 171 199C186 188 201 190 214 198C228 189 244 190 257 196V200H0Z"
      />
      <g className="splash-territory-network" aria-hidden="true">
        <path className="splash-territory-link" d="M147 72L173 91L194 69M173 91L187 111" />
        <circle className="splash-territory-node" cx="147" cy="72" r="3.5" />
        <circle className="splash-territory-node" cx="173" cy="91" r="3.5" />
        <circle className="splash-territory-node" cx="194" cy="69" r="3.5" />
        <circle className="splash-territory-node" cx="187" cy="111" r="3.5" />
      </g>
      <circle className="splash-territory-accent" cx="205" cy="39" r="10" />
    </svg>
  );
});

const PendingIllustration = memo(function PendingIllustration() {
  return (
    <svg viewBox="0 0 230 160" className="auth-splash-svg" focusable="false">
      <rect className="splash-pending-card" x="55" y="28" width="120" height="102" rx="16" />
      <path className="splash-pending-line" d="M80 59H150M80 80H137M80 101H121" />
      <circle className="splash-pending-check" cx="169" cy="112" r="19" />
      <path className="splash-pending-check-mark" d="M160 112L167 119L180 104" />
      <path className="splash-pending-icon" d="M169 95A17 17 0 1 0 169 129A17 17 0 1 0 169 95Z" />
    </svg>
  );
});

const AuthSplashLandscape = memo(function AuthSplashLandscape() {
  return (
    <svg
      className="auth-splash-landscape"
      viewBox="0 0 1200 430"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path className="auth-splash-landscape-base" d="M0 250H1200V430H0Z" />
      <path
        className="auth-splash-landscape-back"
        d="M0 303C72 250 132 265 207 205C272 153 345 174 422 232C493 285 546 278 614 220C684 160 755 178 823 235C886 289 950 292 1019 225C1087 160 1148 176 1200 212V430H0Z"
      />
      <path
        className="auth-splash-landscape-middle"
        d="M0 355C66 316 127 323 190 275C250 229 323 240 390 294C459 350 521 347 589 294C657 242 725 246 791 300C858 354 916 359 984 310C1050 262 1122 275 1200 313V430H0Z"
      />
      <path
        className="auth-splash-landscape-front"
        d="M0 403C62 374 118 365 174 342C229 319 283 335 335 371C389 408 444 409 501 376C559 342 615 341 673 378C728 414 787 417 846 383C902 351 957 353 1014 382C1071 411 1125 407 1180 378C1189 373 1195 373 1200 375V430H0Z"
      />
      <path
        className="auth-splash-landscape-plants"
        d="M24 430c-7-73 23-120 56-169 19 55 12 115-3 169ZM83 430c19-74 58-111 101-143 3 51-28 103-66 143ZM1111 430c-5-80 23-126 59-176 20 59 8 122-10 176ZM1170 430c17-70 47-111 80-139 6 49-24 103-53 139Z"
      />
      <path
        className="auth-splash-landscape-contour"
        d="M62 265C143 218 214 243 282 274C348 305 400 308 468 270C536 232 601 239 673 283C739 323 806 326 877 280C947 235 1015 242 1091 276"
      />
      <path
        className="auth-splash-landscape-contour"
        d="M130 350C204 313 266 326 334 357C401 387 463 388 531 350C600 311 660 315 731 355C797 393 860 397 929 360C998 322 1062 328 1137 355"
      />
      <path
        className="auth-splash-landscape-contour-gold"
        d="M410 321C464 295 514 297 560 323C612 352 661 351 711 322C759 294 811 295 857 318"
      />
    </svg>
  );
});
