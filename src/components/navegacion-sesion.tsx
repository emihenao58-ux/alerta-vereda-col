import { useLocation } from "@tanstack/react-router";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

type NavegacionSesionValue = {
  navegacionActiva: boolean;
  activarNavegacion: () => void;
  navegacionInicializada: boolean;
};

const NavegacionSesionContext = createContext<NavegacionSesionValue | null>(null);
const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function debeIniciarConNavegacion() {
  if (typeof window === "undefined") return false;
  return window.location.pathname !== "/";
}

export function NavegacionSesionProvider({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navegacionInicial = debeIniciarConNavegacion();
  const [navegacionActiva, setNavegacionActiva] = useState(navegacionInicial);
  const [navegacionInicializada, setNavegacionInicializada] = useState(false);
  const navegacionActivaRef = useRef(navegacionInicial);
  const activarNavegacion = useCallback(() => {
    if (pathname.startsWith("/auth")) return;
    navegacionActivaRef.current = true;
    setNavegacionActiva(true);
  }, [pathname]);

  useIsomorphicLayoutEffect(() => {
    setNavegacionInicializada(true);
    if (pathname.startsWith("/auth")) {
      navegacionActivaRef.current = false;
      setNavegacionActiva(false);
      return;
    }

    // La portada especial solo corresponde a la primera entrada directa en "/".
    // Una navegación interna posterior debe conservar el Inicio habitual.
    if (pathname !== "/") {
      navegacionActivaRef.current = true;
      setNavegacionActiva(true);
    }
  }, [pathname]);

  const navegacionVisible = pathname.startsWith("/auth")
    ? false
    : pathname !== "/" || navegacionActiva || navegacionActivaRef.current;

  const value = useMemo(
    () => ({ navegacionActiva: navegacionVisible, activarNavegacion, navegacionInicializada }),
    [activarNavegacion, navegacionInicializada, navegacionVisible],
  );

  return (
    <NavegacionSesionContext.Provider value={value}>{children}</NavegacionSesionContext.Provider>
  );
}

export function useNavegacionSesion() {
  const context = useContext(NavegacionSesionContext);
  if (!context) {
    throw new Error("useNavegacionSesion debe usarse dentro de NavegacionSesionProvider.");
  }
  return context;
}
