import test from "node:test";
import assert from "node:assert/strict";
import {
  elementarySchoolFromAddress,
  normalizeTown,
  RESOLVED_TOWNS,
  AMBIGUOUS_TOWNS,
} from "./himejiSchoolLookup.ts";

test("丁目の表記をそろえる（規則は漢数字、athome は算用数字）", () => {
  assert.equal(normalizeTown("北平野三丁目"), "北平野3丁目");
  assert.equal(normalizeTown("北平野3丁目"), "北平野3丁目");
  assert.equal(normalizeTown("辻井九丁目"), "辻井9丁目");
  assert.equal(normalizeTown("西夢前台１丁目"), "西夢前台1丁目", "全角数字も半角にする");
  // 十以上の丁目も読む
  assert.equal(normalizeTown("○○十丁目"), "○○10丁目");
  assert.equal(normalizeTown("○○十二丁目"), "○○12丁目");
  // 丁目以外の漢数字は触らない
  assert.equal(normalizeTown("三左衛門堀東の町"), "三左衛門堀東の町");
});

test("実データの住所から小学校区を引ける", () => {
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市北平野3丁目"), "広峰小学校");
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市田寺東2丁目"), "安室東小学校");
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市辻井6丁目"), "安室東小学校");
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市書写"), "曽左小学校");
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市飾磨区今在家七丁目"), "津田小学校");
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市白浜町灘浜"), "白浜小学校");
});

test("番地が続いていても町名で引ける", () => {
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市北平野3丁目1-2"), "広峰小学校");
  assert.equal(elementarySchoolFromAddress("姫路市書写1234-5"), "曽左小学校");
});

test("長い町名を優先する（短い同名に吸われない）", () => {
  // 「飾磨区中島」と「飾磨区中島三丁目」はどちらも飾磨小学校だが、
  // 「田寺」と「田寺東一丁目」は学校が違う。長い方で引けていること。
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市田寺東1丁目"), "安室東小学校");
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市田寺2丁目"), "安室小学校");
});

test("町名だけでは決まらないものは null を返す（推測しない）", () => {
  // 規則が「勝原区宮田(勝原小学校校区を除く。)」「勝原区宮田の一部」と分けている町
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市勝原区宮田"), null);
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市広畑区才"), null);
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市保城"), null);
  assert.ok(AMBIGUOUS_TOWNS.has("勝原区宮田"));
  assert.deepEqual(AMBIGUOUS_TOWNS.get("広畑区才"), [
    "八幡小学校",
    "広畑小学校",
    "広畑第二小学校",
  ]);
});

test("姫路市以外の住所は引かない", () => {
  assert.equal(elementarySchoolFromAddress("兵庫県加古川市書写"), null);
  assert.equal(elementarySchoolFromAddress("兵庫県たつの市青山1丁目"), null);
});

test("空の住所は null", () => {
  assert.equal(elementarySchoolFromAddress(null), null);
  assert.equal(elementarySchoolFromAddress(""), null);
  assert.equal(elementarySchoolFromAddress("   "), null);
});

test("異体字をそろえる（規則は山富、athome は山冨）", () => {
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市夢前町山冨"), "置塩小学校");
  assert.equal(elementarySchoolFromAddress("兵庫県姫路市夢前町山富"), "置塩小学校");
});

test("対応表が空になっていない（原文の読み込み漏れを見張る）", () => {
  assert.ok(RESOLVED_TOWNS.size > 800, `確定できる町名が少なすぎる: ${RESOLVED_TOWNS.size}`);
  assert.ok(AMBIGUOUS_TOWNS.size > 0);
});
