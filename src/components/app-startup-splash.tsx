import { useEffect, useState, useSyncExternalStore } from "react";
import { useLocation } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { useNavegacionSesion } from "@/components/navegacion-sesion";
import { isThemeTransitionInitialized, subscribeThemeTarget } from "@/lib/theme-transition";
import { getStartupPhraseFromDocument } from "@/lib/startup-phrases";

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

  useEffect(() => {
    setComponentesMontados(true);
  }, []);

  const requiereAcceso = pathname === "/admin" || pathname.startsWith("/admin/");
  const accesoListo = !requiereAcceso || !cargandoAcceso;
  const listo = temaInicializado && navegacionInicializada && componentesMontados && accesoListo;
  const frase = getStartupPhraseFromDocument();

  if (listo) return null;

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
