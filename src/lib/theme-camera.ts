// Coordenadas aproximadas medidas directamente en los cuatro WebP existentes.
// Fracciones del ancho y alto nativos: punta y base de la cruz, centro del pueblito.
// La cruz es el ancla exacta; el pueblito sirve como referencia visual secundaria.
export type Point = Readonly<{ x: number; y: number }>;
export type Landmarks = Readonly<{
  width: number;
  height: number;
  crossTip: Point;
  crossBase: Point;
  village: Point;
}>;

export const LANDMARKS = {
  desktop: {
    day: {
      width: 1671,
      height: 941,
      crossTip: { x: 0.81, y: 0.192 },
      crossBase: { x: 0.81, y: 0.28 },
      village: { x: 0.73, y: 0.42 },
    },
    night: {
      width: 1536,
      height: 1024,
      crossTip: { x: 0.865, y: 0.2 },
      crossBase: { x: 0.865, y: 0.271 },
      village: { x: 0.774, y: 0.418 },
    },
  },
  mobile: {
    day: {
      width: 1024,
      height: 1536,
      crossTip: { x: 0.803, y: 0.206 },
      crossBase: { x: 0.803, y: 0.267 },
      village: { x: 0.667, y: 0.355 },
    },
    night: {
      width: 1024,
      height: 1536,
      crossTip: { x: 0.842, y: 0.342 },
      crossBase: { x: 0.842, y: 0.377 },
      village: { x: 0.77, y: 0.44 },
    },
  },
} as const satisfies Record<"desktop" | "mobile", Record<"day" | "night", Landmarks>>;

// 1 = cámara completa calculada de los anclajes; 0.7 = comparación suavizada.
export const CAMERA_AMOUNT = 1;

export type Camera = Readonly<{ scale: number; x: number; y: number }>;
export type CameraPair = Readonly<{ day: Camera; night: Camera }>;

const IDENTITY: Camera = { scale: 1, x: 0, y: 0 };

// Posición en CSS px de un punto nativo tras object-fit: cover y el encuadre móvil previo.
export function landmarkOnScreen(
  point: Point,
  image: Landmarks,
  viewportWidth: number,
  viewportHeight: number,
  mobile: boolean,
): Point {
  const fit = Math.max(viewportWidth / image.width, viewportHeight / image.height);
  const drawnWidth = image.width * fit;
  const drawnHeight = image.height * fit;
  return {
    x:
      (viewportWidth - drawnWidth) / 2 + point.x * drawnWidth - (mobile ? 0.15 * viewportWidth : 0),
    y: point.y * drawnHeight,
  };
}

export function calculateAlignment(
  viewportWidth: number,
  viewportHeight: number,
  mobile: boolean,
): Camera {
  const marks = mobile ? LANDMARKS.mobile : LANDMARKS.desktop;
  const dayTip = landmarkOnScreen(
    marks.day.crossTip,
    marks.day,
    viewportWidth,
    viewportHeight,
    mobile,
  );
  const dayBase = landmarkOnScreen(
    marks.day.crossBase,
    marks.day,
    viewportWidth,
    viewportHeight,
    mobile,
  );
  const nightTip = landmarkOnScreen(
    marks.night.crossTip,
    marks.night,
    viewportWidth,
    viewportHeight,
    mobile,
  );
  const nightBase = landmarkOnScreen(
    marks.night.crossBase,
    marks.night,
    viewportWidth,
    viewportHeight,
    mobile,
  );
  const dayCenter = { x: (dayTip.x + dayBase.x) / 2, y: (dayTip.y + dayBase.y) / 2 };
  const nightCenter = { x: (nightTip.x + nightBase.x) / 2, y: (nightTip.y + nightBase.y) / 2 };
  // Una sola escala uniforme hace coincidir la altura de ambas cruces.
  const scale = (nightBase.y - nightTip.y) / (dayBase.y - dayTip.y);
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  return {
    scale,
    x: nightCenter.x - centerX - scale * (dayCenter.x - centerX),
    y: nightCenter.y - centerY - scale * (dayCenter.y - centerY),
  };
}

export function cameraAtProgress(
  progress: number,
  viewportWidth: number,
  viewportHeight: number,
  mobile: boolean,
  reducedMotion: boolean,
  amount = CAMERA_AMOUNT,
): CameraPair {
  if (reducedMotion) return { day: IDENTITY, night: IDENTITY };
  const alignment = calculateAlignment(viewportWidth, viewportHeight, mobile);
  const strength = Math.min(1, Math.max(0, amount));
  // A parcial conserva la correspondencia algebraica entre A y A⁻¹.
  const scale = 1 + (alignment.scale - 1) * strength;
  const x = alignment.x * strength;
  const y = alignment.y * strength;
  const inverseScale = 1 / scale;
  const inverseX = -x / scale;
  const inverseY = -y / scale;
  const dayScale = 1 + progress * (scale - 1);
  const dayX = progress * x;
  const dayY = progress * y;
  return {
    day: { scale: dayScale, x: dayX, y: dayY },
    night: {
      // Cámara nocturna = cámara diurna ∘ A⁻¹: los tres anclajes
      // mantienen la misma coordenada durante toda la interpolación.
      scale: dayScale * inverseScale,
      x: dayX + dayScale * inverseX,
      y: dayY + dayScale * inverseY,
    },
  };
}

export function transformLandmark(
  point: Point,
  camera: Camera,
  viewportWidth: number,
  viewportHeight: number,
): Point {
  return {
    x: viewportWidth / 2 + camera.scale * (point.x - viewportWidth / 2) + camera.x,
    y: viewportHeight / 2 + camera.scale * (point.y - viewportHeight / 2) + camera.y,
  };
}
