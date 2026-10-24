import { useNavigate } from "@tanstack/react-router";
import { memo, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  dispatchLogoutTransition,
  LOGOUT_TRANSITION_EVENT,
  type LogoutRole,
  type LogoutTransitionDetail,
} from "@/lib/logout-transition";
import { getThemeTarget, subscribeThemeTarget } from "@/lib/theme-transition";

const MINIMUM_VISIBLE_MS = 2000;

type LogoutState = {
  phase: "closing" | "success" | "error";
  role: LogoutRole;
  startedAt: number;
  message?: string;
};

const ROLE_COPY: Record<LogoutRole, { label: string; message: string }> = {
  admin_vereda: {
    label: "Administrador de vereda",
    message: "Gracias por ayudar a cuidar nuestra comunidad. Nos vemos pronto.",
  },
  superadmin: {
    label: "Superadmin",
    message:
      "Gracias por contribuir al cuidado y la conexión de nuestras veredas. Nos vemos pronto.",
  },
};

function errorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message;
  return "No pudimos cerrar tu sesión. Revisa tu conexión e inténtalo de nuevo.";
}

export function LogoutTransition() {
  const navigate = useNavigate();
  const { salir } = useAuth();
  const theme = useSyncExternalStore(subscribeThemeTarget, getThemeTarget, () => "light");
  const [state, setState] = useState<LogoutState | null>(null);
  const [retrying, setRetrying] = useState(false);
  const transitionRef = useRef<HTMLDivElement>(null);
  const retryRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const focusCapturedRef = useRef(false);
  const transitionVisible = Boolean(state);

  useEffect(() => {
    const handleTransition = (event: Event) => {
      const detail = (event as CustomEvent<LogoutTransitionDetail>).detail;
      if (!detail) return;

      setState((current) => {
        if (detail.phase === "start") {
          return {
            phase: "closing",
            role: detail.role,
            startedAt: Date.now(),
          };
        }

        if (!current) return current;

        return {
          ...current,
          phase: detail.phase === "success" ? "success" : "error",
          ...(detail.message ? { message: detail.message } : {}),
        };
      });
    };

    window.addEventListener(LOGOUT_TRANSITION_EVENT, handleTransition);
    return () => window.removeEventListener(LOGOUT_TRANSITION_EVENT, handleTransition);
  }, []);

  useEffect(() => {
    if (!transitionVisible) {
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

    const focusInside = () => {
      const target = state?.phase === "error" ? retryRef.current : transitionRef.current;
      target?.focus({ preventScroll: true });
    };
    focusInside();

    const keepFocusInside = (event: FocusEvent) => {
      const root = transitionRef.current;
      if (!root || !(event.target instanceof Node) || !root.contains(event.target)) {
        focusInside();
      }
    };
    const trapTab = (event: KeyboardEvent) => {
      if (event.key !== "Tab") return;

      const root = transitionRef.current;
      if (!root) return;

      const focusable = Array.from(
        root.querySelectorAll<HTMLElement>(
          'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => element.offsetParent !== null);
      const activeElement = document.activeElement;

      if (!root.contains(activeElement)) {
        event.preventDefault();
        focusInside();
        return;
      }

      if (focusable.length === 0) {
        event.preventDefault();
        focusInside();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!first || !last) {
        event.preventDefault();
        focusInside();
        return;
      }
      if (
        activeElement === root ||
        (event.shiftKey && activeElement === first) ||
        (!event.shiftKey && activeElement === last)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus({ preventScroll: true });
      }
    };

    document.addEventListener("focusin", keepFocusInside);
    document.addEventListener("keydown", trapTab, true);
    return () => {
      document.removeEventListener("focusin", keepFocusInside);
      document.removeEventListener("keydown", trapTab, true);
    };
  }, [state?.phase, transitionVisible]);

  useEffect(() => {
    if (!state || state.phase !== "success") return;

    const remaining = Math.max(0, MINIMUM_VISIBLE_MS - (Date.now() - state.startedAt));
    const timer = window.setTimeout(() => setState(null), remaining);
    return () => window.clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    document.body.classList.toggle("logout-transition-active", Boolean(state));
    return () => document.body.classList.remove("logout-transition-active");
  }, [state]);

  if (!state) return null;

  const copy = ROLE_COPY[state.role];
  const isError = state.phase === "error";
  const isBusy = state.phase === "closing" || state.phase === "success" || retrying;

  const reintentar = async () => {
    if (retrying) return;
    setRetrying(true);
    dispatchLogoutTransition({ phase: "start", role: state.role });

    try {
      const resultado = await salir();
      if (resultado.error) {
        dispatchLogoutTransition({
          phase: "error",
          role: state.role,
          message: "No pudimos cerrar tu sesión. Revisa tu conexión e inténtalo de nuevo.",
        });
        return;
      }

      dispatchLogoutTransition({ phase: "success", role: state.role });
      await navigate({ to: "/auth", replace: true });
    } catch (error) {
      dispatchLogoutTransition({ phase: "error", role: state.role, message: errorMessage(error) });
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div
      className={`logout-transition logout-transition-${theme}${isError ? " is-error" : ""}`}
      ref={transitionRef}
      tabIndex={-1}
      role="status"
      aria-live="polite"
      aria-busy={isBusy}
      aria-label={isError ? "Error al cerrar sesión" : "Cerrando sesión"}
    >
      <LogoutSkyDecor />
      <main className="logout-transition-content">
        <div className="logout-brand" role="img" aria-label="AlertaVereda">
          <img src="/images/branding/alertavereda-icono.png" alt="" width="512" height="512" />
          <span className="logout-brand-wordmark">AlertaVereda</span>
          <span className="logout-brand-rule" aria-hidden="true">
            <i />
            <b />
            <i />
          </span>
        </div>

        <LogoutVillageIllustration />

        <section className="logout-transition-copy">
          <h1>{isError ? "No pudimos cerrar tu sesión" : "Cerrando sesión…"}</h1>
          <div className="logout-role-line">
            <span aria-hidden="true" />
            <strong>{copy.label}</strong>
            <span aria-hidden="true" />
          </div>
          <p>{isError ? (state.message ?? "Inténtalo nuevamente.") : copy.message}</p>
        </section>

        {isError ? (
          <button
            type="button"
            className="logout-retry"
            ref={retryRef}
            onClick={() => void reintentar()}
            disabled={retrying}
          >
            {retrying ? "Intentando nuevamente…" : "Reintentar cierre de sesión"}
          </button>
        ) : (
          <span className="logout-spinner" aria-label="Procesando cierre de sesión" />
        )}
      </main>
      <LogoutLandscape />
    </div>
  );
}

const LogoutSkyDecor = memo(function LogoutSkyDecor() {
  return (
    <div className="logout-sky-decor" aria-hidden="true">
      <span className="logout-sun" />
      <span className="logout-moon" />
      <span className="logout-cloud logout-cloud-one" />
      <span className="logout-cloud logout-cloud-two" />
      <span className="logout-cloud logout-cloud-three" />
      <span className="logout-star logout-star-one" />
      <span className="logout-star logout-star-two" />
      <span className="logout-star logout-star-three" />
      <span className="logout-star logout-star-four" />
    </div>
  );
});

const LogoutVillageIllustration = memo(function LogoutVillageIllustration() {
  return (
    <svg
      className="logout-village"
      viewBox="0 0 520 235"
      role="img"
      aria-label="Montañas y viviendas rurales"
    >
      <path className="logout-village-mountain-back" d="M28 178 166 59l65 59 72-86 190 146Z" />
      <path className="logout-village-mountain-front" d="m78 180 104-91 61 50 92-98 142 139Z" />
      <path
        className="logout-village-tree-line"
        d="M44 181c12-32 35-42 49-12 11-47 42-49 53-4 17-38 43-37 55 4 21-32 46-27 52 12Z"
      />
      <g className="logout-village-houses">
        <path d="m154 166 26-25 27 25v35h-53Z" />
        <path d="m197 164 31-28 31 28v37h-62Z" />
        <path d="m249 169 28-24 29 24v32h-57Z" />
        <path d="m301 163 27-26 28 26v38h-55Z" />
        <path d="m344 168 25-22 27 22v33h-52Z" />
        <path className="logout-village-roof" d="m149 166 31-30 32 30Z" />
        <path className="logout-village-roof" d="m192 164 36-34 37 34Z" />
        <path className="logout-village-roof" d="m244 169 33-31 35 31Z" />
        <path className="logout-village-roof" d="m296 163 32-32 34 32Z" />
        <path className="logout-village-roof" d="m339 168 30-28 32 28Z" />
        <path
          className="logout-village-window"
          d="M174 177h10v13h-10zM216 174h11v14h-11zM267 178h10v12h-10zM318 174h10v14h-10zM359 179h10v12h-10z"
        />
      </g>
      <path className="logout-village-ground" d="M62 203c96-15 267-13 399 0v20H62Z" />
    </svg>
  );
});

const LogoutLandscape = memo(function LogoutLandscape() {
  return (
    <svg
      className="logout-landscape"
      viewBox="0 0 1200 360"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="logout-landscape-back"
        d="M0 242 168 147l131 70 176-125 154 109 146-84 225 126l100-42 100 16v143H0Z"
      />
      <path
        className="logout-landscape-middle"
        d="m0 270 180-84 165 81 148-68 190 71 141-96 176 95l100-38 100 14v115H0Z"
      />
      <path
        className="logout-landscape-front"
        d="m0 313 145-65 185 55 161-71 183 69 175-69 191 70 160-32v90H0Z"
      />
      <g className="logout-landscape-plants">
        <path d="M28 360c-3-78 24-113 34-142 25 45 18 90 14 142ZM64 360c14-76 49-105 72-126 7 54-28 100-50 126ZM113 360c21-52 59-70 91-83-2 46-43 71-72 83ZM1100 360c-3-70 20-105 42-142 21 53 5 101-12 142ZM1150 360c21-69 48-92 76-113 6 49-27 88-51 113Z" />
      </g>
      <g className="logout-landscape-lights">
        <circle cx="720" cy="291" r="3" />
        <circle cx="744" cy="284" r="3" />
        <circle cx="770" cy="296" r="3" />
        <circle cx="956" cy="300" r="3" />
        <circle cx="978" cy="288" r="3" />
        <circle cx="1001" cy="295" r="3" />
      </g>
    </svg>
  );
});
