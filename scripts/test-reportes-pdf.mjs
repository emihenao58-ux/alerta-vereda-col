import assert from "node:assert/strict";
import test from "node:test";
import {
  crearDatosReportePdfLocal,
  crearDatosReportePdfPublico,
  coordenadasReportePdf,
  nombreArchivoReportePdf,
  tieneUbicacionReportePdf,
} from "../src/lib/reportes-pdf-datos.ts";

const reportePublicoBase = {
  titulo: "Grietas en la vía principal",
  categoria: "Vías",
  tipo: "Daño vial",
  estado: "En revisión",
  fecha: "15 de abril de 2025, 10:24 a. m.",
  vereda: "El Paraíso",
  referencia: "Tramo cercano al puente",
  descripcion: "Hay grietas en la calzada.",
  emergenciaSinVerificar: false,
  fotoUrl: "https://storage.example.test/public/report.jpg",
  coordenadasPublicas: null,
};

function reporteLocalBase(overrides = {}) {
  return {
    id: "local-001",
    estado: "Pendiente de envío",
    origen: "comunitario",
    registradosEn: "2025-04-15T10:24:00.000Z",
    datos: {
      categoria: "via",
      subcategoria: "grietas",
      territorioId: "el-paraiso",
      tipoLugar: "via_principal",
      nombre: "María González",
      lugar: "Tramo cercano al puente",
      descripcion: "Grietas y hundimiento en la calzada.",
      ubicacionEstado: "confirmada",
      ubicacion: { latitud: 7.12345, longitud: -74.1467, precision: 18 },
      evidencias: [],
      sinEvidencia: null,
    },
    fotografias: [],
    videos: [],
    ...overrides,
  };
}

test("crea un modelo para las cuatro categorías públicas sin inventar autor o identificador", () => {
  for (const categoria of ["Emergencias", "Vías", "Servicios", "Avisos"]) {
    const datos = crearDatosReportePdfPublico({ ...reportePublicoBase, categoria });
    assert.equal(datos.categoria, categoria);
    assert.equal(datos.origenRegistro, "publico");
    assert.equal(Object.hasOwn(datos, "identificador"), false);
    assert.equal(datos.autor, null);
    assert.equal(datos.evidencias.length, 1);
  }
});

test("omite fotografía y coordenadas no divulgables en una emergencia no verificada", () => {
  const datos = crearDatosReportePdfPublico({
    ...reportePublicoBase,
    categoria: "Emergencias",
    estado: "En revisión",
    emergenciaSinVerificar: true,
    coordenadasPublicas: null,
  });
  assert.equal(datos.evidencias.length, 0);
  assert.equal(datos.coordenadas, null);
  assert.equal(datos.autor, null);
  assert.equal(
    datos.notaOrigen,
    "Emergencia no verificada. El estado no confirma recepción ni revisión oficial de la administración. La información aún no está confirmada; actúa con precaución.",
  );
});

test("conserva coordenadas públicas autorizadas y la URL completa de evidencia", () => {
  const fotoUrl = "https://storage.example.test/reportes-fotos/evidencia-completa.jpg";
  const datos = crearDatosReportePdfPublico({
    ...reportePublicoBase,
    fotoUrl,
    coordenadasPublicas: { latitud: 6.34025, longitud: -75.74157 },
    emergenciaSinVerificar: false,
  });
  assert.equal(datos.coordenadas, "6.34025, -75.74157");
  assert.equal(datos.evidencias.length, 1);
  assert.equal(datos.evidencias[0].url, fotoUrl);
});

test("la nota pública no contradice un estado verificado ni inventa autoría", () => {
  const datos = crearDatosReportePdfPublico({
    ...reportePublicoBase,
    estado: "Verificado y activo",
    emergenciaSinVerificar: false,
  });
  assert.match(datos.notaOrigen, /Publicación de consulta pública/);
  assert.match(datos.notaOrigen, /sin añadir datos de autoría/);
  assert.doesNotMatch(datos.notaOrigen, /no se han agregado verificaciones/);
});

test("trata ubicación textual y coordenadas como datos independientes", () => {
  const soloTexto = crearDatosReportePdfPublico({
    ...reportePublicoBase,
    vereda: "El Paraíso",
    referencia: "Puente",
    coordenadasPublicas: null,
  });
  assert.equal(soloTexto.vereda, "El Paraíso");
  assert.equal(soloTexto.referencia, "Puente");
  assert.equal(soloTexto.coordenadas, null);
  assert.equal(tieneUbicacionReportePdf(soloTexto), true);

  const soloCoordenadas = crearDatosReportePdfPublico({
    ...reportePublicoBase,
    vereda: null,
    referencia: null,
    coordenadasPublicas: { latitud: 6.34025, longitud: -75.74157 },
  });
  assert.equal(soloCoordenadas.vereda, null);
  assert.equal(soloCoordenadas.coordenadas, "6.34025, -75.74157");
  assert.equal(tieneUbicacionReportePdf(soloCoordenadas), true);
});

test("oculta la tarjeta de ubicación si no hay texto ni coordenadas divulgables", () => {
  const sinUbicacion = crearDatosReportePdfPublico({
    ...reportePublicoBase,
    vereda: null,
    referencia: null,
    coordenadasPublicas: null,
  });
  assert.equal(sinUbicacion.coordenadas, null);
  assert.equal(tieneUbicacionReportePdf(sinUbicacion), false);
  assert.equal(
    tieneUbicacionReportePdf({ vereda: "  ", referencia: "", coordenadas: null }),
    false,
  );
});

test("solo formatea coordenadas públicas válidas", () => {
  assert.equal(
    coordenadasReportePdf({ latitud: 7.123456, longitud: -74.146789 }),
    "7.12346, -74.14679",
  );
  assert.equal(coordenadasReportePdf(null), null);
  assert.equal(coordenadasReportePdf({ latitud: 91, longitud: 0 }), null);
  assert.equal(coordenadasReportePdf({ latitud: 0, longitud: Number.NaN }), null);
});

test("permite descargar un reporte local sin fotografías ni videos", () => {
  const reporte = reporteLocalBase();
  const datos = crearDatosReportePdfLocal({
    reporte,
    titulo: "Daño vial",
    categoria: "Vías",
    tipo: "Grietas",
    fecha: "15 de abril de 2025, 10:24 a. m.",
    vereda: "El Paraíso",
    referencia: "Puente",
    motivoSinEvidencia: null,
  });
  assert.equal(datos.origenRegistro, "local");
  assert.equal(Object.hasOwn(datos, "identificador"), false);
  assert.equal(reporte.id, "local-001");
  assert.equal(JSON.stringify(datos).includes(reporte.id), false);
  assert.equal(datos.autor, "María González");
  assert.equal(
    datos.notaOrigen,
    "Este reporte está almacenado en este dispositivo. Su estado no confirma la recepción ni la revisión oficial por parte de la administración.",
  );
  assert.deepEqual(datos.evidencias, []);
  assert.deepEqual(datos.evidenciasOmitidas, { fotografias: 0, videos: 0 });
});

test("conserva la mención de una fotografía antigua cuyo archivo local ya no existe", () => {
  const reporte = reporteLocalBase({
    datos: {
      ...reporteLocalBase().datos,
      evidencias: [{ id: "foto-antigua", tipo: "foto", procesamiento: "procesada" }],
    },
  });
  const datos = crearDatosReportePdfLocal({
    reporte,
    titulo: "Reporte local",
    categoria: "Servicios",
    tipo: "Otro servicio",
    fecha: "15 de abril de 2025, 10:24 a. m.",
    vereda: null,
    referencia: null,
    motivoSinEvidencia: null,
  });
  assert.equal(datos.evidencias.length, 1);
  assert.equal(datos.evidencias[0].tipo, "foto");
  assert.equal(datos.evidencias[0].archivo, undefined);
  assert.equal(datos.evidencias[0].etiqueta, "Evidencia fotográfica 1");
});

test("usa Habitante solo cuando el origen local es comunitario y no hay nombre", () => {
  const entrada = {
    titulo: "Reporte local",
    categoria: "Avisos",
    tipo: null,
    fecha: "15 de abril de 2025, 10:24 a. m.",
    vereda: "El Paraíso",
    referencia: null,
    motivoSinEvidencia: null,
  };
  const comunitario = crearDatosReportePdfLocal({
    ...entrada,
    reporte: reporteLocalBase({
      datos: { ...reporteLocalBase().datos, nombre: "" },
    }),
  });
  const jac = crearDatosReportePdfLocal({
    ...entrada,
    reporte: reporteLocalBase({
      origen: "jac",
      datos: { ...reporteLocalBase().datos, nombre: "" },
    }),
  });
  assert.equal(comunitario.autor, "Habitante");
  assert.equal(jac.autor, null);
});

test("incluye tres fotografías y el video local como evidencia separada, sin transformar el video", () => {
  const fotos = [1, 2, 3].map((n) => ({
    evidenciaId: `foto-${n}`,
    archivo: new Blob([`imagen-${n}`], { type: "image/jpeg" }),
    tipoMime: "image/jpeg",
  }));
  const videoBlob = new Blob(["video-original-local"], { type: "video/webm" });
  const reporte = reporteLocalBase({
    fotografias: fotos,
    videos: [
      {
        evidenciaId: "video-1",
        archivo: videoBlob,
        tipoMime: "video/webm",
        duracionSegundos: 9,
      },
    ],
    datos: {
      ...reporteLocalBase().datos,
      evidencias: [{ id: "video-1", tipo: "video" }],
    },
  });
  const datos = crearDatosReportePdfLocal({
    reporte,
    titulo: "Daño vial",
    categoria: "Vías",
    tipo: "Grietas",
    fecha: "15 de abril de 2025, 10:24 a. m.",
    vereda: "El Paraíso",
    referencia: "Puente",
    motivoSinEvidencia: null,
  });
  assert.deepEqual(
    datos.evidencias.map((evidencia) => evidencia.tipo),
    ["foto", "foto", "foto", "video"],
  );
  assert.deepEqual(
    datos.evidencias.slice(0, 3).map((evidencia) => evidencia.etiqueta),
    ["Evidencia fotográfica 1", "Evidencia fotográfica 2", "Evidencia fotográfica 3"],
  );
  assert.equal(datos.evidencias[3].archivo, videoBlob);
  assert.equal(datos.evidencias[3].duracionSegundos, 9);
});

test("aplica el máximo de tres fotografías y un video e informa las evidencias excedentes", () => {
  const fotografias = [1, 2, 3, 4].map((n) => ({
    evidenciaId: `foto-${n}`,
    archivo: new Blob([`imagen-${n}`], { type: "image/jpeg" }),
    tipoMime: "image/jpeg",
  }));
  const videos = [1, 2].map((n) => ({
    evidenciaId: `video-${n}`,
    archivo: new Blob([`video-${n}`], { type: "video/webm" }),
    tipoMime: "video/webm",
    duracionSegundos: 9,
  }));
  const reporte = reporteLocalBase({
    fotografias,
    videos,
    datos: {
      ...reporteLocalBase().datos,
      evidencias: [
        ...fotografias.map((foto) => ({ id: foto.evidenciaId, tipo: "foto" })),
        ...videos.map((video) => ({ id: video.evidenciaId, tipo: "video" })),
      ],
    },
  });
  const datos = crearDatosReportePdfLocal({
    reporte,
    titulo: "Reporte local",
    categoria: "Servicios",
    tipo: "Otro servicio",
    fecha: "15 de abril de 2025, 10:24 a. m.",
    vereda: null,
    referencia: null,
    motivoSinEvidencia: null,
  });
  assert.deepEqual(
    datos.evidencias.map((evidencia) => evidencia.tipo),
    ["foto", "foto", "foto", "video"],
  );
  assert.deepEqual(datos.evidenciasOmitidas, { fotografias: 1, videos: 1 });
});

test("muestra evidencia de video sin archivo guardado como adjunto sin vista previa", () => {
  const reporte = reporteLocalBase({
    datos: {
      ...reporteLocalBase().datos,
      evidencias: [{ id: "video-antiguo", tipo: "video" }],
    },
  });
  const datos = crearDatosReportePdfLocal({
    reporte,
    titulo: "Reporte local",
    categoria: "Avisos",
    tipo: null,
    fecha: "Fecha no disponible",
    vereda: null,
    referencia: null,
    motivoSinEvidencia: null,
  });
  assert.equal(datos.evidencias.length, 1);
  assert.equal(datos.evidencias[0].tipo, "video");
  assert.equal(datos.evidencias[0].archivo, undefined);
});

test("solo incluye ubicación y precisión local cuando la ubicación está confirmada", () => {
  const entrada = {
    titulo: "Reporte local",
    categoria: "Avisos",
    tipo: null,
    fecha: "Fecha no disponible",
    vereda: null,
    referencia: null,
    motivoSinEvidencia: null,
  };
  const noConfirmado = crearDatosReportePdfLocal({
    ...entrada,
    reporte: reporteLocalBase({
      datos: {
        ...reporteLocalBase().datos,
        ubicacionEstado: "aproximada",
      },
    }),
  });
  const confirmado = crearDatosReportePdfLocal({
    ...entrada,
    reporte: reporteLocalBase(),
  });
  assert.equal(noConfirmado.coordenadas, null);
  assert.equal(noConfirmado.precision, null);
  assert.equal(confirmado.coordenadas, "7.12345, -74.14670");
  assert.equal(confirmado.precision, "18 m");
});

test("genera un nombre de archivo legible y seguro para títulos en español", () => {
  assert.equal(
    nombreArchivoReportePdf("Vía con grietas / Ebéjico", new Date(2025, 3, 15)),
    "alertavereda-reporte-via-con-grietas-ebejico-20250415.pdf",
  );
  assert.match(
    nombreArchivoReportePdf("###", new Date(2025, 3, 15)),
    /^alertavereda-reporte-comunitario-20250415\.pdf$/,
  );
});
