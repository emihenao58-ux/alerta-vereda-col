import assert from "node:assert/strict";
import { test } from "node:test";
import {
  esResultadoHistorialPublico,
  esResultadoNovedadPublico,
  obtenerTimestampFechaMiVereda,
  ordenarRegistrosPorFecha,
  registroDentroDelPeriodo,
} from "../src/lib/mi-vereda-filtros.ts";

const AHORA = Date.parse("2026-11-01T17:00:00.000Z");
const dia = (dias) => new Date(AHORA - dias * 24 * 60 * 60 * 1000).toISOString();

const registro = (fechaCreacion, cerradoEn = null) => ({
  id: "reporte",
  fechaCreacion,
  cerradoEn,
});

test("Historial admite solo los resultados públicos finales acordados", () => {
  assert.equal(esResultadoHistorialPublico("solucionado"), true);
  assert.equal(esResultadoHistorialPublico("no_solucionado"), true);
  assert.equal(esResultadoHistorialPublico("retirado"), false);
  assert.equal(esResultadoHistorialPublico("activo"), false);
  assert.equal(esResultadoHistorialPublico(null), false);
});

test("Novedades solo admite resultado nulo; rechaza estados finales y desconocidos", () => {
  assert.equal(esResultadoNovedadPublico(null), true);
  assert.equal(esResultadoNovedadPublico("solucionado"), false);
  assert.equal(esResultadoNovedadPublico("no_solucionado"), false);
  assert.equal(esResultadoNovedadPublico("retirado"), false);
  assert.equal(esResultadoNovedadPublico("desconocido"), false);
  assert.equal(esResultadoNovedadPublico(undefined), false);
});

test("el parser acepta fecha ISO real y rechaza días de calendario imposibles", () => {
  const valida = "2026-02-28T10:30:00.000Z";
  assert.equal(obtenerTimestampFechaMiVereda(valida), Date.parse(valida));
  assert.equal(obtenerTimestampFechaMiVereda("2026-02-30"), null);
  assert.equal(obtenerTimestampFechaMiVereda("2026-02-30T10:30:00.000Z"), null);
  assert.equal(obtenerTimestampFechaMiVereda("inválida"), null);
  assert.equal(obtenerTimestampFechaMiVereda(null), null);
});

test("Todo incluye fechas pasadas o actuales y excluye las fechas futuras", () => {
  assert.equal(registroDentroDelPeriodo(registro(dia(3)), "todo", AHORA, false), true);
  assert.equal(
    registroDentroDelPeriodo(registro(new Date(AHORA).toISOString()), "todo", AHORA, false),
    true,
  );
  assert.equal(
    registroDentroDelPeriodo(registro(new Date(AHORA + 1).toISOString()), "todo", AHORA, false),
    false,
  );
});

test("Todo excluye timestamps inválidos sin perder Historial con cierre válido", () => {
  assert.equal(registroDentroDelPeriodo(registro("2026-02-30"), "todo", AHORA, false), false);
  assert.equal(registroDentroDelPeriodo(registro("inválida", dia(4)), "todo", AHORA, true), true);
});

test("los períodos finitos incluyen ambos límites, excluyen futuros y no aceptan fechas inválidas", () => {
  const limite30 = new Date(AHORA - 30 * 24 * 60 * 60 * 1000).toISOString();
  assert.equal(registroDentroDelPeriodo(registro(limite30), "30", AHORA, false), true);
  assert.equal(
    registroDentroDelPeriodo(registro(new Date(AHORA).toISOString()), "30", AHORA, false),
    true,
  );
  assert.equal(
    registroDentroDelPeriodo(registro(new Date(AHORA + 1).toISOString()), "30", AHORA, false),
    false,
  );
  assert.equal(registroDentroDelPeriodo(registro("2026-02-30"), "90", AHORA, false), false);
});

test("Historial coincide si creación o cierre cae en el período", () => {
  assert.equal(registroDentroDelPeriodo(registro(dia(120), dia(15)), "30", AHORA, true), true);
  assert.equal(registroDentroDelPeriodo(registro(dia(15), dia(120)), "30", AHORA, true), true);
  assert.equal(registroDentroDelPeriodo(registro(dia(120), dia(90)), "30", AHORA, true), false);
});

test("una fecha futura en el cierre no descarta Historial si la creación cumple el período", () => {
  assert.equal(
    registroDentroDelPeriodo(
      registro(dia(5), new Date(AHORA + 24 * 60 * 60 * 1000).toISOString()),
      "15",
      AHORA,
      true,
    ),
    true,
  );
});

test("una creación futura no descarta Historial si el cierre cumple el período", () => {
  assert.equal(
    registroDentroDelPeriodo(
      registro(new Date(AHORA + 24 * 60 * 60 * 1000).toISOString(), dia(5)),
      "15",
      AHORA,
      true,
    ),
    true,
  );
});

test("Historial excluye el registro si todas sus fechas relevantes son futuras", () => {
  assert.equal(
    registroDentroDelPeriodo(
      registro(
        new Date(AHORA + 24 * 60 * 60 * 1000).toISOString(),
        new Date(AHORA + 2 * 24 * 60 * 60 * 1000).toISOString(),
      ),
      "todo",
      AHORA,
      true,
    ),
    false,
  );
});

test("una fecha pasada fuera del período no califica cuando la otra fecha es futura", () => {
  assert.equal(
    registroDentroDelPeriodo(
      registro(dia(120), new Date(AHORA + 24 * 60 * 60 * 1000).toISOString()),
      "30",
      AHORA,
      true,
    ),
    false,
  );
});

test("Novedades evalúa creación y no usa un cierre que no forma parte de su criterio", () => {
  assert.equal(
    registroDentroDelPeriodo(
      registro(dia(5), new Date(AHORA + 24 * 60 * 60 * 1000).toISOString()),
      "15",
      AHORA,
      false,
    ),
    true,
  );
  assert.equal(registroDentroDelPeriodo(registro(dia(30), dia(5)), "15", AHORA, false), false);
});

test("Novedades ordena explícitamente por creación en ambos sentidos sin mutar el arreglo", () => {
  const datos = [
    { id: "medio", fechaCreacion: dia(10), cerradoEn: null },
    { id: "reciente", fechaCreacion: dia(1), cerradoEn: null },
    { id: "antiguo", fechaCreacion: dia(20), cerradoEn: null },
  ];

  assert.deepEqual(
    ordenarRegistrosPorFecha(datos, "recientes").map(({ id }) => id),
    ["reciente", "medio", "antiguo"],
  );
  assert.deepEqual(
    ordenarRegistrosPorFecha(datos, "antiguos").map(({ id }) => id),
    ["antiguo", "medio", "reciente"],
  );
  assert.deepEqual(
    datos.map(({ id }) => id),
    ["medio", "reciente", "antiguo"],
  );
});

test("Historial ordena por cierre y usa creación como fallback normal", () => {
  const datos = [
    { id: "creacion", fechaCreacion: dia(1), cerradoEn: null },
    { id: "cierre-antiguo", fechaCreacion: dia(60), cerradoEn: dia(30) },
    { id: "cierre-reciente", fechaCreacion: dia(120), cerradoEn: dia(2) },
  ];

  assert.deepEqual(
    ordenarRegistrosPorFecha(datos, "recientes", "cierre").map(({ id }) => id),
    ["creacion", "cierre-reciente", "cierre-antiguo"],
  );
});

test("Historial usa creación si el cierre está vacío o tiene una fecha imposible", () => {
  const datos = [
    { id: "cierre-imposible", fechaCreacion: dia(1), cerradoEn: "2026-02-30" },
    { id: "cierre-vacio", fechaCreacion: dia(10), cerradoEn: " " },
    { id: "cierre-valido", fechaCreacion: dia(120), cerradoEn: dia(2) },
    { id: "sin-fecha", fechaCreacion: "inválida", cerradoEn: " " },
  ];

  assert.deepEqual(
    ordenarRegistrosPorFecha(datos, "recientes", "cierre").map(({ id }) => id),
    ["cierre-imposible", "cierre-valido", "cierre-vacio", "sin-fecha"],
  );
});

test("las fechas inválidas quedan al final al ordenar por creación", () => {
  const datos = [
    { id: "sin-fecha", fechaCreacion: "2026-02-30", cerradoEn: null },
    { id: "con-fecha", fechaCreacion: dia(1), cerradoEn: null },
  ];

  assert.deepEqual(
    ordenarRegistrosPorFecha(datos, "recientes").map(({ id }) => id),
    ["con-fecha", "sin-fecha"],
  );
});
