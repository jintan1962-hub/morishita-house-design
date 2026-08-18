import { test } from "node:test";
import assert from "node:assert/strict";
import { calculateMonthlyPayment } from "./loan.ts";

/**
 * D-06：金額の計算にはテストを書く。
 * 実行は `pnpm test`（node の標準テストランナー。新しい依存は足していない → S-05）。
 */

test("金利0%なら元金を返済回数で割った額になる", () => {
  // 1,200万円を10年（120回）→ 月10万円
  assert.equal(calculateMonthlyPayment(12_000_000, 0, 10), 100_000);
});

test("元利均等返済の式どおりに計算される（3000万円・年1.0%・35年）", () => {
  // 手計算での期待値：約 84,685円
  const monthly = calculateMonthlyPayment(30_000_000, 1.0, 35);
  assert.ok(
    Math.abs(monthly - 84_685) < 1,
    `期待値 約84,685円 に対して ${monthly} 円だった`
  );
});

test("既定条件（物件2,980万円＋リノベ1,518万円・年0.75%・35年）", () => {
  const monthly = calculateMonthlyPayment(29_800_000 + 15_180_000, 0.75, 35);
  // 総額4,498万円・0.75%・35年 → 約 121,900円台
  assert.ok(
    monthly > 121_000 && monthly < 123_000,
    `想定範囲（121,000〜123,000円）を外れた: ${monthly}`
  );
});

test("支払総額は必ず元金を上回る（金利がある場合）", () => {
  const principal = 20_000_000;
  const monthly = calculateMonthlyPayment(principal, 1.5, 30);
  assert.ok(monthly * 30 * 12 > principal);
});

test("元金が0以下・年数が0以下なら0を返す（0除算やNaNを画面に出さない）", () => {
  assert.equal(calculateMonthlyPayment(0, 1.0, 35), 0);
  assert.equal(calculateMonthlyPayment(-100, 1.0, 35), 0);
  assert.equal(calculateMonthlyPayment(10_000_000, 1.0, 0), 0);
  assert.equal(calculateMonthlyPayment(NaN, 1.0, 35), 0);
});
