import { cameraAtProgress, type Camera } from "@/lib/theme-camera";
import { THEME_STORAGE_KEY, type AppTheme } from "@/lib/theme";

export const THEME_TRANSITION_DURATION = 2200;
export const THEME_TRANSITION_REDUCED_DURATION = 200;

const DAY_DESKTOP = "/images/backgrounds/fondo-dia-escritorio.webp";
const DAY_MOBILE = "/images/backgrounds/fondo-dia-movil.webp";
const NIGHT_DESKTOP = "/images/backgrounds/fondo-noche-escritorio.webp";
const NIGHT_MOBILE = "/images/backgrounds/fondo-noche-movil.webp";

type TransitionElements = {
  day: HTMLElement;
  night: HTMLElement;
  dusk: HTMLElement;
  nightTint: HTMLElement;
};

const listeners = new Set<() => void>();
const state: {
  progress: number;
  target: 0 | 1;
  frame: number | null;
  startedAt: number;
  startProgress: number;
  elements: TransitionElements | null;
  preloaded: Set<string>;
  preloadStarted: boolean;
  initialized: boolean;
  targetTheme: AppTheme;
} = {
  progress: 0,
  target: 0,
  frame: null,
  startedAt: 0,
  startProgress: 0,
  elements: null,
  preloaded: new Set(),
  preloadStarted: false,
  initialized: false,
  targetTheme: "light",
};

function targetToProgress(theme: AppTheme): 0 | 1 {
  return theme === "dark" ? 1 : 0;
}

// React lee un destino estable incluso al montar el selector en mitad de otra página.
export function getThemeTarget(): AppTheme {
  return state.initialized ? state.targetTheme : themeFromRoot();
}

export function subscribeThemeTarget(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyTarget(theme: AppTheme) {
  if (state.targetTheme === theme) return;
  state.targetTheme = theme;
  listeners.forEach((listener) => listener());
}

function themeFromRoot(): AppTheme {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function easeInOut(value: number): number {
  return value * value * (3 - 2 * value);
}

function smoothstep(start: number, end: number, value: number): number {
  const fraction = Math.min(1, Math.max(0, (value - start) / (end - start)));
  return easeInOut(fraction);
}

function setStoredTheme(theme: AppTheme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

function setInterfaceTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset["theme"] = theme;
  root.style.colorScheme = theme;
}

function isReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isMobileViewport(): boolean {
  return window.matchMedia("(max-width: 720px)").matches;
}

function duration(): number {
  return isReducedMotion() ? THEME_TRANSITION_REDUCED_DURATION : THEME_TRANSITION_DURATION;
}

function setCamera(element: HTMLElement, camera: Camera) {
  element.style.setProperty("--landscape-camera-scale", String(camera.scale));
  element.style.setProperty("--landscape-camera-x", `${camera.x}px`);
  element.style.setProperty("--landscape-camera-y", `${camera.y}px`);
}

function setLayerStyles(progress: number) {
  const elements = state.elements;
  if (!elements) return;
  const reducedMotion = isReducedMotion();
  const viewportHeight = document.documentElement.clientHeight;
  const cameras = cameraAtProgress(
    progress,
    window.innerWidth,
    viewportHeight,
    isMobileViewport(),
    reducedMotion,
  );
  setCamera(elements.day, cameras.day);
  setCamera(elements.night, cameras.night);
  elements.day.style.opacity = String(1 - smoothstep(0.3, 0.7, progress));
  elements.night.style.opacity = "1";
  elements.dusk.style.opacity = reducedMotion ? "0" : String(Math.sin(Math.PI * progress) * 0.6);
  const tintRise = smoothstep(0.15, 0.6, progress);
  elements.nightTint.style.opacity = reducedMotion ? "0" : String(tintRise * (1 - progress) * 0.38);
}

function clearSurfaceTransition() {
  document.documentElement.classList.remove("theme-transition");
  document.documentElement.style.removeProperty("--theme-transition-duration");
}

function stopAnimation() {
  if (state.frame !== null) window.cancelAnimationFrame(state.frame);
  state.frame = null;
}

function finishTransition(theme: AppTheme) {
  stopAnimation();
  state.progress = targetToProgress(theme);
  state.target = targetToProgress(theme);
  setLayerStyles(state.progress);
  setInterfaceTheme(theme);
  clearSurfaceTransition();
}

function targetImageUrl(theme: AppTheme): string {
  if (theme === "dark") return isMobileViewport() ? NIGHT_MOBILE : NIGHT_DESKTOP;
  return isMobileViewport() ? DAY_MOBILE : DAY_DESKTOP;
}

function targetImageReady(theme: AppTheme): boolean {
  const url = targetImageUrl(theme);
  if (state.preloaded.has(url)) return true;
  const layer = theme === "dark" ? state.elements?.night : state.elements?.day;
  const image = layer?.querySelector("img");
  return Boolean(image?.complete && image.naturalWidth > 0);
}

function preloadImage(url: string) {
  if (state.preloaded.has(url)) return;
  const image = new Image();
  image.onload = () => state.preloaded.add(url);
  image.onerror = () => undefined;
  image.src = url;
  if (image.complete && image.naturalWidth > 0) state.preloaded.add(url);
}

function preloadOtherTheme() {
  if (state.preloadStarted) return;
  state.preloadStarted = true;
  const otherTheme: AppTheme = getThemeTarget() === "dark" ? "light" : "dark";
  preloadImage(otherTheme === "dark" ? NIGHT_DESKTOP : DAY_DESKTOP);
  preloadImage(otherTheme === "dark" ? NIGHT_MOBILE : DAY_MOBILE);
}

function schedulePreload() {
  if (document.readyState === "complete") {
    window.setTimeout(preloadOtherTheme, 0);
    return;
  }
  window.addEventListener("load", preloadOtherTheme, { once: true });
}

function animate(timestamp: number) {
  const elapsed = Math.min(1, (timestamp - state.startedAt) / duration());
  const eased = easeInOut(elapsed);
  state.progress = state.startProgress + (state.target - state.startProgress) * eased;
  setLayerStyles(state.progress);
  if (elapsed < 1) {
    state.frame = window.requestAnimationFrame(animate);
    return;
  }
  state.frame = null;
  state.progress = state.target;
  setLayerStyles(state.progress);
  clearSurfaceTransition();
}

export function registerThemeTransitionLayers(elements: TransitionElements) {
  state.elements = elements;
  if (!state.initialized) {
    const initialTheme = themeFromRoot();
    state.targetTheme = initialTheme;
    state.target = targetToProgress(initialTheme);
    state.progress = state.target;
    state.initialized = true;
  }
  setLayerStyles(state.progress);
  schedulePreload();
  const onResize = () => setLayerStyles(state.progress);
  window.addEventListener("resize", onResize);
  return () => {
    window.removeEventListener("resize", onResize);
    if (state.elements?.day === elements.day) {
      state.elements = null;
      // No reiniciar progress/target si React remonta el layout durante una animación.
    }
  };
}

export function transitionToTheme(theme: AppTheme) {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  notifyTarget(theme);
  setStoredTheme(theme);
  const target = targetToProgress(theme);

  if (!state.elements || !targetImageReady(theme)) {
    finishTransition(theme);
    return;
  }

  stopAnimation();
  state.target = target;
  state.startProgress = state.progress;
  if (state.startProgress === target) {
    finishTransition(theme);
    return;
  }

  // El valor inicial transiciona desde la pantalla actual y conserva el remanente
  // al invertir; ninguna superficie salta por una clase cambiada sin transición.
  const root = document.documentElement;
  root.style.setProperty("--theme-transition-duration", `${duration()}ms`);
  root.classList.add("theme-transition");
  // No hay transición al primer pintado: esta sincronización solo ocurre tras pulsar.
  void root.offsetWidth;
  setInterfaceTheme(theme);
  state.startedAt = performance.now();
  state.frame = window.requestAnimationFrame(animate);
}
