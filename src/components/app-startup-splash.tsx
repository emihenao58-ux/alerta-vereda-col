import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useNavegacionSesion } from "@/components/navegacion-sesion";
import { isThemeTransitionInitialized, subscribeThemeTarget } from "@/lib/theme-transition";
import { getStartupPhraseFromDocument } from "@/lib/startup-phrases";

const STARTUP_SPLASH_MINIMUM_MS = 1500;

function getThemeReadySnapshot() {
  return isThemeTransitionInitialized();
}

function getServerThemeReadySnapshot() {
  return false;
}

export function AppStartupSplash() {
  const { pathname } = useLocation();
  const { cargandoAcceso } = useAuth();
  const { navegacionInicializada } = useNavegacionSesion();
  const temaInicializado = useSyncExternalStore(
    subscribeThemeTarget,
    getThemeReadySnapshot,
    getServerThemeReadySnapshot,
  );
  const [componentesMontados, setComponentesMontados] = useState(false);
  const [duracionMinimaCumplida, setDuracionMinimaCumplida] = useState(false);
  const splashVisibleDesdeRef = useRef<number | null>(null);

  useEffect(() => {
    setComponentesMontados(true);
  }, []);

  const requiereAcceso = pathname === "/admin" || pathname.startsWith("/admin/");
  const accesoListo = !requiereAcceso || !cargandoAcceso;
  const aplicacionLista =
    temaInicializado && navegacionInicializada && componentesMontados && accesoListo;
  const splashVisible = !aplicacionLista || !duracionMinimaCumplida;

  useEffect(() => {
    if (!splashVisible) {
      splashVisibleDesdeRef.current = null;
      return;
    }

    const ahora = performance.now();
    const visibleDesde = splashVisibleDesdeRef.current ?? ahora;
    if (splashVisibleDesdeRef.current === null) {
      splashVisibleDesdeRef.current = visibleDesde;
      setDuracionMinimaCumplida(false);
    }
    const restante = Math.max(0, STARTUP_SPLASH_MINIMUM_MS - (ahora - visibleDesde));

    if (restante === 0) {
      setDuracionMinimaCumplida(true);
      return;
    }

    const temporizador = window.setTimeout(() => {
      setDuracionMinimaCumplida(true);
    }, restante);

    return () => window.clearTimeout(temporizador);
  }, [splashVisible]);

  const frase = getStartupPhraseFromDocument();

  if (!splashVisible) return null;

  return (
    <div
      className="app-startup-splash"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Preparando AlertaVereda"
    >
      <picture>
        <source media="(min-width: 721px)" srcSet="/images/backgrounds/fondo-splash-desktop.webp" />
        <img
          className="app-startup-splash-landscape"
          src="/images/backgrounds/fondo-splash.png"
          alt=""
          aria-hidden="true"
          loading="eager"
          fetchPriority="high"
        />
      </picture>
      <div className="app-startup-splash-glow" aria-hidden="true" />
      <main className="app-startup-splash-content">
        <div className="app-startup-splash-brand" aria-label="AlertaVereda">
          <img
            src="/images/branding/alertavereda-icono.png"
            alt=""
            width="196"
            height="196"
            fetchPriority="high"
          />
          <p>
            <span>Alerta</span>
            <strong>Vereda</strong>
          </p>
        </div>
        <p className="app-startup-splash-tagline" data-startup-phrase-target>
          {frase}
        </p>
      </main>
    </div>
  );
}
