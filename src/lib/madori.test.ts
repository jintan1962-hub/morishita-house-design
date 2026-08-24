import { test } from "node:test";
import assert from "node:assert/strict";
import { madoriRooms, madoriBucket, countByMadori } from "./madori.ts";

/**
 * D-06：件数の集計にはテストを書く。
 * 実行は `pnpm test`（node の標準テストランナー。依存は増やしていない → S-05）。
 */

test("よくある表記から部屋数を読む", () => {
  assert.equal(madoriRooms("3LDK"), 3);
  assert.equal(madoriRooms("2K"), 2);
  assert.equal(madoriRooms("1DK"), 1);
  assert.equal(madoriRooms("4SLDK"), 4);
  assert.equal(madoriRooms("1R"), 1);
  assert.equal(madoriRooms("ワンルーム"), 1);
  assert.equal(madoriRooms("６LDK"), 6, "全角数字も読む");
  assert.equal(madoriRooms("3 LDK"), 3, "途中の空白は無視する");
});

test("読み取れない表記は null にする（推測でどこかへ入れない）", () => {
  assert.equal(madoriRooms(null), null);
  assert.equal(madoriRooms(""), null);
  assert.equal(madoriRooms("－"), null);
  assert.equal(madoriRooms("店舗"), null);
  assert.equal(madoriRooms("LDK"), null, "数字が無い");
  assert.equal(madoriRooms("0LDK"), null, "0部屋は表記の誤りとみなす");
});

test("区分の境目：1以下・2・3・4・5以上", () => {
  assert.equal(madoriBucket("1LDK"), "b1");
  assert.equal(madoriBucket("1R"), "b1");
  assert.equal(madoriBucket("2LDK"), "b2");
  assert.equal(madoriBucket("3K"), "b3");
  assert.equal(madoriBucket("4LDK"), "b4");
  assert.equal(madoriBucket("5DK"), "b5");
  assert.equal(madoriBucket("8LDK"), "b5", "5以上は全て同じ区分");
});

test("一覧を数える。読めない表記は合計に入らない", () => {
  const counts = countByMadori(["3LDK", "3K", "4LDK", "1R", null, "店舗", "5LDK", "2DK"]);
  assert.deepEqual(counts, { b1: 1, b2: 1, b3: 2, b4: 1, b5: 1 });

  // 8件渡したが、数えられたのは6件。差は「読めなかった2件」。
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  assert.equal(total, 6);
});
