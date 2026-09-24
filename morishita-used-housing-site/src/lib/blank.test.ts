import { test } from "node:test";
import assert from "node:assert/strict";
import { isBlankMark, blankToNull } from "./blank.ts";

/**
 * D-06：この判定は取込と表示の両方が使う。緩めると意味のある値を消し、
 * 厳しくすると「－ / －」が画面に出る。境界をテストで固定する。
 */

test("athome の値なし表記を「値なし」と判定する", () => {
  for (const v of ["－", "-", "―", "－ / －", "― / ―", "／", "・", "  ", "", null, undefined]) {
    assert.equal(isBlankMark(v), true, `${String(v)} が値なしにならない`);
  }
});

test("意味のある値は残す", () => {
  for (const v of ["所有権", "2階建", "相談", "－ 相談", "0", "A-1", "1/2"]) {
    assert.equal(isBlankMark(v), false, `${v} が値なし扱いされた`);
  }
});

test("blankToNull は前後の空白を落とす", () => {
  assert.equal(blankToNull("  所有権  "), "所有権");
  assert.equal(blankToNull("－ / －"), null);
  assert.equal(blankToNull(undefined), null);
});

test("文字列以外は値ありとして扱う（数値0を消さない）", () => {
  assert.equal(isBlankMark(0), false);
  assert.equal(isBlankMark(false), false);
});
