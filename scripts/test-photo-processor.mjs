import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import {
  MAX_PHOTO_TARGET_BYTES,
  calcularDimensionesOptimizadas,
  crearSecuenciaResoluciones,
  actualizarMetadatosEvidencia,
  procesarFotografiaEvidenciaDetallada,
} from "../src/lib/reportar/photo-processor.ts";
import { recortarFoto } from "../src/lib/reportar/photo-editor.ts";

const originalWindow = globalThis.window;
const originalDocument = globalThis.document;
const originalImage = globalThis.Image;
const originalCreateObjectURL = URL.createObjectURL;
const originalRevokeObjectURL = URL.revokeObjectURL;

function restoreGlobals() {
  if (originalWindow === undefined) delete globalThis.window;
  else globalThis.window = originalWindow;
  if (originalDocument === undefined) delete globalThis.document;
  else globalThis.document = originalDocument;
  if (originalImage === undefined) delete globalThis.Image;
  else globalThis.Image = originalImage;

  if (originalCreateObjectURL === undefined) delete URL.createObjectURL;
  else URL.createObjectURL = originalCreateObjectURL;
  if (originalRevokeObjectURL === undefined) delete URL.revokeObjectURL;
  else URL.revokeObjectURL = originalRevokeObjectURL;
}

afterEach(restoreGlobals);

function makeFile(name, type = "image/jpeg") {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

function installFakeBrowser({
  dimensions = {},
  blobSize = () => 100_000,
  failContexts = 0,
  failDecode = false,
  disableBitmap = false,
  imageLoads = false,
} = {}) {
  const state = {
    canvases: [],
    closedBitmaps: 0,
    createdUrls: [],
    revokedUrls: [],
    contextCalls: 0,
  };

  if (!disableBitmap) {
    globalThis.window = {
      createImageBitmap: async (file) => {
        if (failDecode) throw new Error("Formato no decodificable");
        const [width, height] = dimensions[file.name] ?? [800, 600];
        return {
          width,
          height,
          close: () => {
            state.closedBitmaps += 1;
          },
        };
      },
    };
  } else {
    globalThis.window = {};
  }

  globalThis.document = {
    createElement: (tagName) => {
      assert.equal(tagName, "canvas");
      const canvas = {
        width: 0,
        height: 0,
        getContext: () => {
          state.contextCalls += 1;
          if (failContexts > 0) {
            failContexts -= 1;
            return null;
          }
          return {
            fillStyle: "",
            fillRect: () => undefined,
            drawImage: () => undefined,
          };
        },
        toBlob: (callback, type, quality) => {
          const size = Math.max(0, Math.round(blobSize(canvas.width, canvas.height, quality)));
          callback(new Blob([new Uint8Array(size)], { type }));
        },
      };
      state.canvases.push(canvas);
      return canvas;
    },
  };

  class FakeImage {
    naturalWidth = 0;
    naturalHeight = 0;
    onload = null;
    onerror = null;

    set src(_value) {
      queueMicrotask(() => {
        if (imageLoads) {
          const [width, height] = dimensions.gallery ?? [800, 600];
          this.naturalWidth = width;
          this.naturalHeight = height;
          this.onload?.();
        } else {
          this.onerror?.(new Error("Formato no decodificable"));
        }
      });
    }
  }
  globalThis.Image = FakeImage;

  URL.createObjectURL = () => {
    const url = `blob:test-${state.createdUrls.length + 1}`;
    state.createdUrls.push(url);
    return url;
  };
  URL.revokeObjectURL = (url) => state.revokedUrls.push(url);

  return state;
}

test("mantiene imágenes pequeñas y aprovecha más de 1600 px cuando el resultado es seguro", async () => {
  const state = installFakeBrowser({
    dimensions: { small: [800, 600], large: [4000, 3000] },
    blobSize: () => 100_000,
  });

  const small = await procesarFotografiaEvidenciaDetallada(makeFile("small"));
  assert.deepEqual(small.dimensiones, { width: 800, height: 600 });
  assert.equal(small.intentos.length, 1);
  assert.equal(small.estado, "procesada");

  const large = await procesarFotografiaEvidenciaDetallada(makeFile("large"));
  assert.deepEqual(large.dimensiones, { width: 2400, height: 1800 });
  assert.ok(large.intentos[0].maxLadoLargo > 1600);
  assert.equal(large.estado, "procesada");
  assert.equal(state.closedBitmaps, 2);
  assert.ok(state.canvases.every((canvas) => canvas.width === 0 && canvas.height === 0));
});

test("mantiene proporción vertical y no aumenta imágenes pequeñas", () => {
  assert.deepEqual(calcularDimensionesOptimizadas(3000, 4000, 2400), {
    width: 1800,
    height: 2400,
  });
  assert.deepEqual(calcularDimensionesOptimizadas(600, 800, 2400), {
    width: 600,
    height: 800,
  });
  assert.deepEqual(crearSecuenciaResoluciones(4000, 3000), [2400, 2048, 1600, 1200, 960]);
  assert.deepEqual(crearSecuenciaResoluciones(800, 600), [800]);
});

test("reduce progresivamente la resolución cuando el resultado sigue pesado", async () => {
  const state = installFakeBrowser({
    dimensions: { detailed: [4000, 3000] },
    blobSize: (width) => (width === 2400 ? 800_000 : width === 2048 ? 500_000 : 100_000),
  });

  const result = await procesarFotografiaEvidenciaDetallada(makeFile("detailed"));
  assert.deepEqual(result.dimensiones, { width: 2048, height: 1536 });
  assert.deepEqual(
    result.intentos.map(({ maxLadoLargo, estado }) => [maxLadoLargo, estado]),
    [
      [2400, "pesado"],
      [2048, "aceptado"],
    ],
  );
  assert.ok(result.archivo.size <= MAX_PHOTO_TARGET_BYTES);
  assert.ok(state.canvases.every((canvas) => canvas.width === 0 && canvas.height === 0));
});

test("recupera un fallo del primer canvas con un intento inferior", async () => {
  const state = installFakeBrowser({
    dimensions: { failing: [4000, 3000] },
    failContexts: 1,
    blobSize: () => 100_000,
  });

  const result = await procesarFotografiaEvidenciaDetallada(makeFile("failing"));
  assert.equal(result.estado, "procesada");
  assert.equal(result.intentos[0].estado, "error");
  assert.equal(result.intentos[0].maxLadoLargo, 2400);
  assert.equal(result.intentos[1].maxLadoLargo, 2048);
  assert.equal(state.contextCalls, 2);
});

test("conserva el original después de fallos sucesivos", async () => {
  const state = installFakeBrowser({
    dimensions: { broken: [4000, 3000] },
    failContexts: 20,
  });
  const original = makeFile("broken");

  const result = await procesarFotografiaEvidenciaDetallada(original);
  assert.equal(result.estado, "original");
  assert.equal(result.archivo, original);
  assert.equal(result.puedeVisualizarse, true);
  assert.equal(result.mensajeError, undefined);
  assert.deepEqual(
    result.intentos.map(({ maxLadoLargo, estado }) => [maxLadoLargo, estado]),
    [
      [2400, "error"],
      [2048, "error"],
      [1600, "error"],
      [1200, "error"],
      [960, "error"],
    ],
  );
  assert.equal(state.closedBitmaps, 1);
  assert.ok(state.canvases.every((canvas) => canvas.width === 0 && canvas.height === 0));
});

test("documenta un resultado superior a 600 KB sin destruirlo de forma indiscriminada", async () => {
  installFakeBrowser({
    dimensions: { noisy: [4000, 3000] },
    blobSize: () => 850_000,
  });

  const result = await procesarFotografiaEvidenciaDetallada(makeFile("noisy"));
  assert.equal(result.estado, "pesada");
  assert.equal(result.intentos.at(-1).estado, "pesado");
  assert.deepEqual(result.dimensiones, { width: 960, height: 720 });
  assert.ok(result.archivo.size > MAX_PHOTO_TARGET_BYTES);
});

test("libera ObjectURL en la ruta de fallback Image y conserva el original si no decodifica", async () => {
  const successState = installFakeBrowser({
    disableBitmap: true,
    imageLoads: true,
    dimensions: { gallery: [1200, 900] },
    blobSize: () => 100_000,
  });
  const processed = await procesarFotografiaEvidenciaDetallada(makeFile("gallery"));
  assert.equal(processed.estado, "procesada");
  assert.equal(successState.createdUrls.length, 1);
  assert.deepEqual(successState.revokedUrls, successState.createdUrls);

  restoreGlobals();
  const errorState = installFakeBrowser({ failDecode: true });
  const original = makeFile("unsupported", "image/heic");
  const unsupported = await procesarFotografiaEvidenciaDetallada(original);
  assert.equal(unsupported.estado, "original");
  assert.equal(unsupported.archivo, original);
  assert.equal(unsupported.puedeVisualizarse, false);
  assert.match(unsupported.mensajeError ?? "", /no se pudo mostrar/i);
  assert.equal(errorState.createdUrls.length, 1);
  assert.deepEqual(errorState.revokedUrls, errorState.createdUrls);
});

test("rechaza un archivo que no es imagen sin presentarlo como evidencia visible", async () => {
  const result = await procesarFotografiaEvidenciaDetallada(
    makeFile("documento.pdf", "application/pdf"),
  );

  assert.equal(result.estado, "original");
  assert.equal(result.archivo.name, "documento.pdf");
  assert.equal(result.puedeVisualizarse, false);
  assert.match(result.mensajeError ?? "", /no es una imagen compatible/i);
});

test("procesa el archivo resultante de un recorte ligero y conserva el original", async () => {
  const state = installFakeBrowser({
    dimensions: { "crop-source": [2400, 1800] },
    imageLoads: true,
    blobSize: () => 100_000,
  });
  const original = makeFile("crop-source");
  const recortada = await recortarFoto(original, { x: 0, y: 0, width: 1200, height: 900 });
  const resultado = await procesarFotografiaEvidenciaDetallada(recortada);
  const evidencia = {
    id: "foto-crop-light",
    tipo: "foto",
    archivo: original,
    previewUrl: "blob:previous",
    fuente: "camara",
    procesamiento: "procesada",
    dimensiones: { width: 2400, height: 1800 },
    capturadaEn: "2026-10-17T16:00:00.000Z",
    incorporadaEn: "2026-10-17T16:00:00.000Z",
    archivoOriginal: original,
  };
  const actualizada = actualizarMetadatosEvidencia(evidencia, resultado, true);

  assert.equal(resultado.estado, "procesada");
  assert.equal(actualizada.archivo, resultado.archivo);
  assert.equal(actualizada.procesamiento, "procesada");
  assert.deepEqual(actualizada.dimensiones, resultado.dimensiones);
  assert.equal(actualizada.archivoOriginal, original);
  assert.equal(actualizada.recortada, true);
  assert.ok(state.revokedUrls.length >= 1);
});

test("conserva el estado pesada si el recorte continúa superando 600 KiB", async () => {
  const state = installFakeBrowser({
    imageLoads: true,
    blobSize: () => 850_000,
  });
  const original = makeFile("crop-heavy-source");
  const recortada = await recortarFoto(original, { x: 0, y: 0, width: 1200, height: 900 });
  const resultado = await procesarFotografiaEvidenciaDetallada(recortada);
  const evidencia = {
    id: "foto-crop-heavy",
    tipo: "foto",
    archivo: original,
    previewUrl: "blob:previous-heavy",
    fuente: "galeria",
    procesamiento: "procesada",
    dimensiones: { width: 2400, height: 1800 },
    capturadaEn: null,
    incorporadaEn: "2026-10-17T16:00:00.000Z",
    archivoOriginal: original,
  };
  const actualizada = actualizarMetadatosEvidencia(evidencia, resultado, true);

  assert.equal(resultado.estado, "pesada");
  assert.ok(resultado.archivo.size > MAX_PHOTO_TARGET_BYTES);
  assert.equal(actualizada.procesamiento, "pesada");
  assert.deepEqual(actualizada.dimensiones, resultado.dimensiones);
  assert.equal(actualizada.archivoOriginal, original);
  assert.equal(actualizada.recortada, true);
  assert.ok(state.revokedUrls.length >= 1);
});

test("mantiene el original y un estado seguro si el reprocesamiento falla", async () => {
  const state = installFakeBrowser({
    dimensions: { "crop-error": [2400, 1800] },
    failContexts: 20,
  });
  const original = makeFile("crop-error");
  const resultado = await procesarFotografiaEvidenciaDetallada(original);
  const evidencia = {
    id: "foto-crop-error",
    tipo: "foto",
    archivo: makeFile("previous-error"),
    previewUrl: "blob:previous-error",
    fuente: "camara",
    procesamiento: "procesada",
    dimensiones: { width: 2400, height: 1800 },
    capturadaEn: "2026-10-17T16:00:00.000Z",
    incorporadaEn: "2026-10-17T16:00:00.000Z",
    archivoOriginal: original,
  };
  const actualizada = actualizarMetadatosEvidencia(evidencia, resultado, true);

  assert.equal(resultado.estado, "original");
  assert.equal(resultado.archivo, original);
  assert.equal(actualizada.archivo, original);
  assert.equal(actualizada.procesamiento, "original");
  assert.equal(actualizada.dimensiones, null);
  assert.equal(actualizada.archivoOriginal, original);
  assert.equal(actualizada.recortada, true);
  assert.ok(state.canvases.every((canvas) => canvas.width === 0 && canvas.height === 0));
});
