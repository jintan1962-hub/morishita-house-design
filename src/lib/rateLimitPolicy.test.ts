import { test } from "node:test";
import assert from "node:assert/strict";
import { decideRateLimit } from "./rateLimitPolicy.ts";

/**
 * D-06：件数の判定なのでテストを書く。
 * 「窓の中で limit 回まで通し、超えたら retryAfter つきで拒否、窓が切れたら数え直す」を固定する。
 */

const OPTS = { limit: 3, windowSeconds: 60 };
const NOW = new Date("2026-08-28T00:00:00.000Z");

test("状態が無ければ通し、窓を張る（1回目）", () => {
  const d = decideRateLimit(null, OPTS, NOW);
  assert.equal(d.allowed, true);
  assert.equal(d.nextCount, 1);
  assert.equal(d.nextWindowEndsAt.toISOString(), "2026-08-28T00:01:00.000Z");
});

test("窓の中で limit 未満なら通し、カウントを1つ進める", () => {
  const state = { count: 2, windowEndsAt: new Date("2026-08-28T00:00:30.000Z") };
  const d = decideRateLimit(state, OPTS, NOW);
  assert.equal(d.allowed, true);
  assert.equal(d.nextCount, 3);
  // 窓は延長しない
  assert.equal(d.nextWindowEndsAt.toISOString(), state.windowEndsAt.toISOString());
});

test("窓の中で limit に達していたら拒否し、カウントは増やさない", () => {
  const state = { count: 3, windowEndsAt: new Date("2026-08-28T00:00:45.000Z") };
  const d = decideRateLimit(state, OPTS, NOW);
  assert.equal(d.allowed, false);
  assert.equal(d.nextCount, 3);
  assert.equal(d.retryAfterSeconds, 45);
});

test("拒否が続いても窓は延びない（待てば必ず明ける）", () => {
  const state = { count: 9, windowEndsAt: new Date("2026-08-28T00:00:10.000Z") };
  const d = decideRateLimit(state, OPTS, NOW);
  assert.equal(d.allowed, false);
  assert.equal(d.nextWindowEndsAt.toISOString(), state.windowEndsAt.toISOString());
  assert.equal(d.retryAfterSeconds, 10);
});

test("窓が切れていれば、カウントが上限超えでも数え直して通す", () => {
  const state = { count: 99, windowEndsAt: new Date("2026-08-27T23:59:59.000Z") };
  const d = decideRateLimit(state, OPTS, NOW);
  assert.equal(d.allowed, true);
  assert.equal(d.nextCount, 1);
  assert.equal(d.nextWindowEndsAt.toISOString(), "2026-08-28T00:01:00.000Z");
});

test("窓の終了ちょうどの時刻は「切れた」側に倒す", () => {
  const state = { count: 3, windowEndsAt: new Date(NOW) };
  const d = decideRateLimit(state, OPTS, NOW);
  assert.equal(d.allowed, true);
  assert.equal(d.nextCount, 1);
});

test("retryAfter は最低でも1秒（0秒とは言わない）", () => {
  const state = { count: 3, windowEndsAt: new Date("2026-08-28T00:00:00.500Z") };
  const d = decideRateLimit(state, OPTS, NOW);
  assert.equal(d.allowed, false);
  assert.equal(d.retryAfterSeconds, 1);
});
