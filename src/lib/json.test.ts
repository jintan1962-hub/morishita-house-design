import { test } from "node:test";
import assert from "node:assert/strict";
import { toJsonSafe } from "./json.ts";

/**
 * D-06：BigInt が混ざると JSON 化で落ちる。しかも「既存0件のうちは通る」ため、
 * 手で試すと見逃す。機械で確かめる。
 *
 * ※ tsconfig の target が ES2017 のため BigInt リテラル（1n）は使えない。BigInt() で作る。
 */

test("BigInt を含む配列がそのまま JSON 化できる（以前はここで落ちた）", () => {
  const rows = [{ objMngNo: BigInt("6991580385"), priceMan: 400 }];
  assert.deepEqual(toJsonSafe(rows), [{ objMngNo: "6991580385", priceMan: 400 }]);
});

test("空配列でも壊れない（1回目の取込に相当）", () => {
  assert.deepEqual(toJsonSafe([]), []);
});

test("入れ子の BigInt も文字列になる", () => {
  assert.deepEqual(toJsonSafe({ a: { b: [BigInt(1), BigInt(2)] } }), { a: { b: ["1", "2"] } });
});

test("BigInt 以外の値は変わらない", () => {
  const v = { s: "あ", n: 1.5, b: true, nul: null };
  assert.deepEqual(toJsonSafe(v), v);
});

test("Date は ISO 文字列になる", () => {
  assert.equal(toJsonSafe(new Date(Date.UTC(2026, 7, 19))), "2026-08-19T00:00:00.000Z");
});

test("素の JSON.stringify は BigInt で落ちる（この関数が要る理由）", () => {
  assert.throws(() => JSON.stringify({ n: BigInt(1) }), TypeError);
});
