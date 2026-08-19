import { test } from "node:test";
import assert from "node:assert/strict";
import { parseJapaneseDate } from "./dates.ts";

const iso = (d: Date | null) => (d === null ? null : d.toISOString().slice(0, 10));

test("和暦表記でない「2026年8月18日」を読める", () => {
  assert.equal(iso(parseJapaneseDate("2026年8月18日")), "2026-08-18");
});

test("スラッシュ・ハイフン・ドット区切りを読める", () => {
  assert.equal(iso(parseJapaneseDate("2026/08/18")), "2026-08-18");
  assert.equal(iso(parseJapaneseDate("2026-8-18")), "2026-08-18");
  assert.equal(iso(parseJapaneseDate("2026.8.18")), "2026-08-18");
});

test("空・全角ハイフン・読めない値は null", () => {
  for (const v of ["", "  ", "－", "-", "相談", "2026年", undefined, null]) {
    assert.equal(parseJapaneseDate(v as string), null, `${String(v)} が null にならない`);
  }
});

test("存在しない日付は null（繰り上がりで別の日にしない）", () => {
  assert.equal(parseJapaneseDate("2026年2月31日"), null);
  assert.equal(parseJapaneseDate("2026-13-01"), null);
});

test("うるう年の2月29日は年によって結果が変わる", () => {
  assert.equal(iso(parseJapaneseDate("2024-02-29")), "2024-02-29");
  assert.equal(parseJapaneseDate("2026-02-29"), null);
});

test("時差で前日にならない（UTCで作る）", () => {
  const d = parseJapaneseDate("2026年1月1日");
  assert.equal(d?.getUTCFullYear(), 2026);
  assert.equal(d?.getUTCMonth(), 0);
  assert.equal(d?.getUTCDate(), 1);
});
