import { cameraAtProgress, type Camera } from "@/lib/theme-camera";
import { THEME_STORAGE_KEY, type AppTheme } from "@/lib/theme";

export const THEME_TRANSITION_DURATION = 2200;
export const THEME_TRANSITION_REDUCED_DURATION = 200;
export const THEME_TRANSITION_LITE_DURATION = 600;

const DAY_DESKTOP = "/images/backgrounds/fondo-dia-escritorio.webp";
const DAY_MOBILE = "/images/backgrounds/fondo-dia-movil.webp";
const NIGHT_DESKTOP = "/images/backgrounds/fondo-noche-escritorio.webp";
const NIGHT_MOBILE = "/images/backgrounds/fondo-noche-movil.webp";
const QUALITY_QUERY_PARAM = "tema";
const QUALITY_SESSION_KEY = "alertavereda-theme-transition-downgraded";
const QUALITY_MEASURE_WINDOW = 400;
const QUALITY_MEDIAN_LIMIT = 28;
const QUALITY_FRAME_LIMIT = 70;

type TransitionQuality = "full" | "lite";
type ForcedQuality = TransitionQuality | null;

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
  lastFrameAt: number | null;
  frameIntervals: number[];
  quality: TransitionQuality;
  forcedQuality: ForcedQuality;
  liteFadeOnly: boolean;
  transitionDuration: number;
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
  lastFrameAt: null,
  frameIntervals: [],
  quality: "full",
  forcedQuality: null,
  liteFadeOnly: false,
  transitionDuration: THEME_TRANSITION_DURATION,
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

function isMobileDevice(): boolean {
  return isMobileViewport() || window.matchMedia("(pointer: coarse)").matches;
}

function connectionSaveData(): boolean {
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  return connection?.saveData === true;
}

function readForcedQuality(): ForcedQuality {
  const value = new URLSearchParams(window.location.search).get(QUALITY_QUERY_PARAM);
  // Banderas de prueba: solo afectan esta carga de página y nunca se persisten.
  if (value === "lite") return "lite";
  if (value === "full" && !isReducedMotion()) return "full";
  return null;
}

function readDowngradedDecision(): boolean {
  try {
    return window.sessionStorage.getItem(QUALITY_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

function writeDowngradedDecision() {
  try {
    window.sessionStorage.setItem(QUALITY_SESSION_KEY, "1");
  } catch {
    // Storage may be unavailable in a restricted browser context.
  }
}

function resolveQuality(): { quality: TransitionQuality; forced: ForcedQuality } {
  const forced = readForcedQuality();
  if (isReducedMotion()) return { quality: "lite", forced: forced === "lite" ? "lite" : null };
  if (forced) return { quality: forced, forced };
  if (readDowngradedDecision() || isMobileDevice() || connectionSaveData()) {
    return { quality: "lite", forced: null };
  }
  return { quality: "full", forced: null };
}

function setQualityClasses(quality: TransitionQuality, active: boolean) {
  const root = document.documentElement;
  root.classList.toggle("theme-transition-full", active && quality === "full");
  root.classList.toggle("theme-transition-lite", active && quality === "lite");
  root.classList.toggle("theme-transition-no-blur", active);
  root.dataset["themeTransitionQuality"] = quality;
}

function configuredDuration(): number {
  if (isReducedMotion()) return THEME_TRANSITION_REDUCED_DURATION;
  if (state.quality === "lite") return THEME_TRANSITION_LITE_DURATION;
  return THEME_TRANSITION_DURATION;
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
  const useCamera = !reducedMotion && !(state.quality === "lite" && state.liteFadeOnly);
  const cameras = cameraAtProgress(
    progress,
    window.innerWidth,
    viewportHeight,
    isMobileViewport(),
    !useCamera,
  );
  setCamera(elements.day, cameras.day);
  setCamera(elements.night, cameras.night);
  elements.day.style.opacity = String(1 - smoothstep(0.3, 0.7, progress));
  elements.night.style.opacity = "1";
  elements.dusk.style.opacity =
    reducedMotion || state.quality === "full" ? String(Math.sin(Math.PI * progress) * 0.6) : "0";
  const tintRise = smoothstep(0.15, 0.6, progress);
  elements.nightTint.style.opacity = reducedMotion ? "0" : String(tintRise * (1 - progress) * 0.38);
  if (state.quality === "lite") {
    elements.dusk.style.opacity = reducedMotion ? "0" : String(Math.sin(Math.PI * progress) * 0.35);
  }
}

function clearSurfaceTransition() {
  const root = document.documentElement;
  root.classList.remove(
    "theme-transition-full",
    "theme-transition-lite",
    "theme-transition-no-blur",
  );
  root.style.removeProperty("--theme-transition-duration");
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
  const markReady = () => {
    state.preloaded.add(url);
  };
  image.onload = () => {
    void image
      .decode()
      .catch(() => undefined)
      .finally(markReady);
  };
  image.onerror = () => undefined;
  image.src = url;
  if (image.complete && image.naturalWidth > 0) {
    void image
      .decode()
      .catch(() => undefined)
      .finally(markReady);
  }
}

function preloadOtherTheme() {
  if (state.preloadStarted) return;
  state.preloadStarted = true;
  [DAY_DESKTOP, DAY_MOBILE, NIGHT_DESKTOP, NIGHT_MOBILE].forEach(preloadImage);
}

function schedulePreload() {
  if (document.readyState === "complete") {
    window.setTimeout(preloadOtherTheme, 0);
    return;
  }
  window.addEventListener("load", preloadOtherTheme, { once: true });
}

function median(values: number[]): number {
  const ordered = [...values].sort((a, b) => a - b);
  if (!ordered.length) return 0;
  const middle = Math.floor(ordered.length / 2);
  const current = ordered[middle] ?? 0;
  const previous = ordered[middle - 1] ?? current;
  return ordered.length % 2 ? current : (previous + current) / 2;
}

function maybeDowngradeQuality(timestamp: number) {
  if (timestamp - state.startedAt < QUALITY_MEASURE_WINDOW) return;
  const slow =
    median(state.frameIntervals) > QUALITY_MEDIAN_LIMIT ||
    Math.max(...state.frameIntervals, 0) > QUALITY_FRAME_LIMIT;
  if (state.quality === "lite") {
    if (slow && median(state.frameIntervals) > 1000 / 24) state.liteFadeOnly = true;
    return;
  }
  if (state.forcedQuality === "full" || !slow) return;
  state.quality = "lite";
  writeDowngradedDecision();
  setQualityClasses("lite", true);
  document.documentElement.style.setProperty(
    "--theme-transition-duration",
    `${state.transitionDuration}ms`,
  );
}

function maybeSwitchLiteTheme(progress: number) {
  if (
    state.quality === "lite" &&
    state.target !== targetToProgress(themeFromRoot()) &&
    progress >= 0.5
  ) {
    setInterfaceTheme(state.target === 1 ? "dark" : "light");
  }
}

function animate(timestamp: number) {
  if (state.lastFrameAt !== null) {
    const interval = timestamp - state.lastFrameAt;
    if (timestamp - state.startedAt <= QUALITY_MEASURE_WINDOW) state.frameIntervals.push(interval);
  }
  state.lastFrameAt = timestamp;
  maybeDowngradeQuality(timestamp);
  const elapsed = Math.min(1, (timestamp - state.startedAt) / state.transitionDuration);
  const eased = easeInOut(elapsed);
  state.progress = state.startProgress + (state.target - state.startProgress) * eased;
  maybeSwitchLiteTheme(state.progress);
  setLayerStyles(state.progress);
  if (elapsed < 1) {
    state.frame = window.requestAnimationFrame(animate);
    return;
  }
  state.frame = null;
  state.progress = state.target;
  setLayerStyles(state.progress);
  setInterfaceTheme(state.target === 1 ? "dark" : "light");
  clearSurfaceTransition();
}

export function registerThemeTransitionLayers(elements: TransitionElements) {
  state.elements = elements;
  if (!state.initialized) {
    const initialTheme = themeFromRoot();
    const resolved = resolveQuality();
    state.targetTheme = initialTheme;
    state.target = targetToProgress(initialTheme);
    state.progress = state.target;
    state.quality = resolved.quality;
    state.forcedQuality = resolved.forced;
    state.initialized = true;
    setQualityClasses(state.quality, false);
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
  state.liteFadeOnly = false;
  if (state.startProgress === target) {
    finishTransition(theme);
    return;
  }

  const root = document.documentElement;
  state.transitionDuration = configuredDuration();
  root.style.setProperty("--theme-transition-duration", `${state.transitionDuration}ms`);
  setQualityClasses(state.quality, true);
  void root.offsetWidth;
  if (state.quality === "full") setInterfaceTheme(theme);
  state.startedAt = performance.now();
  state.lastFrameAt = null;
  state.frameIntervals = [];
  state.frame = window.requestAnimationFrame(animate);
}
