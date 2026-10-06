import { THEME_STORAGE_KEY, type AppTheme } from "@/lib/theme";

export const THEME_TRANSITION_DURATION = 2200;
export const THEME_TRANSITION_REDUCED_DURATION = 200;

const DAY_DESKTOP = "/images/backgrounds/fondo-dia-escritorio.webp";
const DAY_MOBILE = "/images/backgrounds/fondo-dia-movil.webp";
const NIGHT_DESKTOP = "/images/backgrounds/fondo-noche-escritorio.webp";
const NIGHT_MOBILE = "/images/backgrounds/fondo-noche-movil.webp";

const state: {
  progress: number;
  target: 0 | 1;
  frame: number | null;
  startedAt: number;
  startProgress: number;
  elements: TransitionElements | null;
  preloaded: Set<string>;
  preloadStarted: boolean;
} = {
  progress: 0,
  target: 0,
  frame: null,
  startedAt: 0,
  startProgress: 0,
  elements: null,
  preloaded: new Set(),
  preloadStarted: false,
};

type TransitionElements = {
  day: HTMLElement;
  night: HTMLElement;
  dusk: HTMLElement;
};

function themeToProgress(theme: AppTheme): 0 | 1 {
  return theme === "dark" ? 1 : 0;
}

function progressToTheme(progress: number): AppTheme {
  return progress >= 0.5 ? "dark" : "light";
}

function easeInOut(value: number): number {
  return value * value * (3 - 2 * value);
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
  const isDark = theme === "dark";
  root.classList.toggle("dark", isDark);
  root.dataset["theme"] = theme;
  root.style.colorScheme = theme;
  root.classList.remove("theme-transition");
  void root.offsetWidth;
  root.classList.add("theme-transition");
  window.setTimeout(() => root.classList.remove("theme-transition"), 320);
}

function setLayerStyles(progress: number) {
  const elements = state.elements;
  if (!elements) return;

  elements.day.style.opacity = String(1 - progress);
  elements.night.style.opacity = "1";
  elements.dusk.style.opacity = String(Math.sin(Math.PI * progress) * 0.46);
}

function finishTransition(theme: AppTheme) {
  if (state.frame !== null) {
    window.cancelAnimationFrame(state.frame);
    state.frame = null;
  }
  state.progress = themeToProgress(theme);
  state.target = themeToProgress(theme);
  setLayerStyles(state.progress);
  setInterfaceTheme(theme);
}

function isReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function isMobileViewport(): boolean {
  return window.matchMedia("(max-width: 720px)").matches;
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
  const currentTheme: AppTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  const otherTheme: AppTheme = currentTheme === "dark" ? "light" : "dark";
  preloadImage(otherTheme === "dark" ? NIGHT_DESKTOP : DAY_DESKTOP);
  preloadImage(otherTheme === "dark" ? NIGHT_MOBILE : DAY_MOBILE);
}

function schedulePreload() {
  const callback = () => preloadOtherTheme();
  if (document.readyState === "complete") {
    window.setTimeout(callback, 0);
    return;
  }
  window.addEventListener("load", callback, { once: true });
}

function animate(timestamp: number) {
  const distance = state.target - state.startProgress;
  const duration = isReducedMotion()
    ? THEME_TRANSITION_REDUCED_DURATION
    : THEME_TRANSITION_DURATION;
  const elapsed = Math.min(1, (timestamp - state.startedAt) / duration);
  const eased = easeInOut(elapsed);
  const progress = state.startProgress + distance * eased;
  const previousTheme = progressToTheme(state.progress);

  state.progress = progress;
  setLayerStyles(progress);

  const nextTheme = progressToTheme(progress);
  if (nextTheme !== previousTheme) setInterfaceTheme(nextTheme);

  if (elapsed < 1) {
    state.frame = window.requestAnimationFrame(animate);
    return;
  }

  state.frame = null;
  state.progress = state.target;
  setLayerStyles(state.progress);
  setInterfaceTheme(progressToTheme(state.progress));
}

export function registerThemeTransitionLayers(elements: TransitionElements) {
  state.elements = elements;
  const initialTheme: AppTheme = document.documentElement.classList.contains("dark")
    ? "dark"
    : "light";
  state.progress = themeToProgress(initialTheme);
  state.target = themeToProgress(initialTheme);
  setLayerStyles(state.progress);
  schedulePreload();

  return () => {
    if (state.elements?.day === elements.day) {
      if (state.frame !== null) window.cancelAnimationFrame(state.frame);
      state.frame = null;
      state.elements = null;
    }
  };
}

export function transitionToTheme(theme: AppTheme) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  const target = themeToProgress(theme);
  setStoredTheme(theme);

  if (!state.elements || !targetImageReady(theme)) {
    finishTransition(theme);
    return;
  }

  if (state.frame !== null) window.cancelAnimationFrame(state.frame);
  state.target = target;
  state.startProgress = state.progress;

  if (state.startProgress === target) {
    finishTransition(theme);
    return;
  }

  state.startedAt = performance.now();
  state.frame = window.requestAnimationFrame(animate);
}
