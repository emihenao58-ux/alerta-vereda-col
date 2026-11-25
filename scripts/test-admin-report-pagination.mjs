import assert from "node:assert/strict";
import { test } from "node:test";
import { getReportPageCount, getReportPageRange } from "../src/lib/admin-report-pagination.ts";

test("server ranges use the selected page size and start at zero", () => {
  assert.deepEqual(getReportPageRange(0, 10), { from: 0, to: 9 });
  assert.deepEqual(getReportPageRange(0, 25), { from: 0, to: 24 });
  assert.deepEqual(getReportPageRange(0, 50), { from: 0, to: 49 });
});

test("server ranges advance without overlap or gaps", () => {
  assert.deepEqual(getReportPageRange(1, 25), { from: 25, to: 49 });
  assert.deepEqual(getReportPageRange(2, 25), { from: 50, to: 74 });
  assert.deepEqual(getReportPageRange(1, 50), { from: 50, to: 99 });
});

test("page count is at least one for an empty result and accounts for a partial final page", () => {
  assert.equal(getReportPageCount(0, 25), 1);
  assert.equal(getReportPageCount(25, 25), 1);
  assert.equal(getReportPageCount(26, 25), 2);
  assert.equal(getReportPageCount(51, 25), 3);
});

test("invalid negative inputs are bounded to safe pagination values", () => {
  assert.deepEqual(getReportPageRange(-3, 0), { from: 0, to: 0 });
  assert.equal(getReportPageCount(-8, 0), 1);
});
