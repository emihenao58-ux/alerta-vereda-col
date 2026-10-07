import { useEffect, useRef } from "react";
import { registerThemeTransitionLayers } from "@/lib/theme-transition";

const ASSETS = {
  dayDesktop: "/images/backgrounds/fondo-dia-escritorio.webp",
  dayMobile: "/images/backgrounds/fondo-dia-movil.webp",
  nightDesktop: "/images/backgrounds/fondo-noche-escritorio.webp",
  nightMobile: "/images/backgrounds/fondo-noche-movil.webp",
} as const;

export function ThemeTransitionLayers() {
  const dayRef = useRef<HTMLDivElement>(null);
  const nightRef = useRef<HTMLDivElement>(null);
  const duskRef = useRef<HTMLDivElement>(null);
  const nightTintRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dayRef.current || !nightRef.current || !duskRef.current || !nightTintRef.current) return;

    return registerThemeTransitionLayers({
      day: dayRef.current,
      night: nightRef.current,
      dusk: duskRef.current,
      nightTint: nightTintRef.current,
    });
  }, []);

  return (
    <>
      <div className="landscape-layer landscape-layer-night" ref={nightRef} aria-hidden="true">
        <picture>
          <source media="(max-width: 720px)" srcSet={ASSETS.nightMobile} />
          <img src={ASSETS.nightDesktop} alt="" draggable={false} />
        </picture>
      </div>
      <div className="landscape-layer landscape-layer-day" ref={dayRef} aria-hidden="true">
        <picture>
          <source media="(max-width: 720px)" srcSet={ASSETS.dayMobile} />
          <img src={ASSETS.dayDesktop} alt="" draggable={false} />
        </picture>
      </div>
      <div className="landscape-dusk" ref={duskRef} aria-hidden="true" />
      <div className="landscape-night-tint" ref={nightTintRef} aria-hidden="true" />
    </>
  );
}
