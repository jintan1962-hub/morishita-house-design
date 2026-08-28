/**
 * S-08 / S-12：公開エンドポイントの濫用（メール増幅・総当たり・アカウント列挙）を抑える
 * レート制限のDBラッパー。しきい値は src/config/security.ts の RATE_LIMITS に集約する（D-19）。
 * 判定ロジックそのものは src/lib/rateLimitPolicy.ts（純関数・テスト済み）にある。
 *
 * 【なぜDBに勘定を置くか】
 * Vercel はサーバーレスで各インスタンスがメモリを共有しない。モジュール変数の
 * カウンタでは実質的に制限にならないため、勘定を1箇所（このDB）に置く。
 *
 * 【フェイルオープン】
 * DBが読めない・書けないときは「通す」。レート制限の不調でサイト全体を止めない。
 * その事実はログに残す（D-07）。
 *
 * 【厳密さ】
 * 同時に大量のリクエストが来ると、数回ぶんは超過を許す（読んで書くまでの隙間）。
 * 目的は「桁を落とす」ことなので許容する。
 */

import prisma from "@/lib/prisma";
import { decideRateLimit, type RateLimitOptions } from "@/lib/rateLimitPolicy";
import { clientIp } from "@/lib/requestIp";

export type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

/** 掃除を走らせる間隔（ミリ秒）。毎回 DELETE を撃たないための間引き。 */
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanupAt = 0;

/**
 * バケット単位でレート制限を判定し、カウンタを1つ進める。
 * @param bucket 制限の単位（例: "inquiry:ip:1.2.3.4"）。呼び出し側が種別と識別子を組み立てる。
 */
export async function checkRateLimit(
  bucket: string,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const now = new Date();

  try {
    const existing = await prisma.rateLimit.findUnique({ where: { bucket } });
    const decision = decideRateLimit(
      existing ? { count: existing.count, windowEndsAt: existing.windowEndsAt } : null,
      opts,
      now
    );

    await prisma.rateLimit.upsert({
      where: { bucket },
      create: {
        bucket,
        count: decision.nextCount,
        windowEndsAt: decision.nextWindowEndsAt,
      },
      update: {
        count: decision.nextCount,
        windowEndsAt: decision.nextWindowEndsAt,
      },
    });

    void pruneExpired(now);

    return decision.allowed
      ? { ok: true }
      : { ok: false, retryAfterSeconds: decision.retryAfterSeconds };
  } catch (error) {
    // フェイルオープン。握り潰さずログには残す（D-07）。
    console.error(`レート制限の判定に失敗しました（${bucket}）:`, error);
    return { ok: true };
  }
}

/**
 * 接続元IP単位のレート制限（カウントを1つ進める）。IPが取れなかったときは「通す」。
 * 取れないIPを全員まとめて1バケットに入れると、正規の利用者ごと締め出す危険があるため。
 * @param prefix 制限の種別（例: "inquiry" / "registration"）
 */
export async function rateLimitByIp(
  prefix: string,
  opts: RateLimitOptions
): Promise<RateLimitResult> {
  const ip = await clientIp();
  if (ip === "unknown") return { ok: true };
  return checkRateLimit(`${prefix}:ip:${ip}`, opts);
}

/**
 * カウントを進めずに、いま制限に掛かっているかだけを見る（読み取りのみ）。
 * ログインのように「失敗のときだけ数えたい」場面で使う。
 */
export async function isRateLimited(
  bucket: string,
  opts: RateLimitOptions
): Promise<boolean> {
  try {
    const existing = await prisma.rateLimit.findUnique({ where: { bucket } });
    if (!existing) return false;
    const decision = decideRateLimit(
      { count: existing.count, windowEndsAt: existing.windowEndsAt },
      opts,
      new Date()
    );
    return !decision.allowed;
  } catch (error) {
    console.error(`レート制限の確認に失敗しました（${bucket}）:`, error);
    return false; // フェイルオープン
  }
}

/** IP単位のバケット名を組み立てる（rateLimitByIp と isRateLimited で綴りを揃える）。 */
export async function ipBucket(prefix: string): Promise<string | null> {
  const ip = await clientIp();
  return ip === "unknown" ? null : `${prefix}:ip:${ip}`;
}

/** 期限切れの行を掃除する。失敗しても本筋に影響しないので黙って諦める（ログのみ）。 */
async function pruneExpired(now: Date): Promise<void> {
  if (now.getTime() - lastCleanupAt < CLEANUP_INTERVAL_MS) return;
  lastCleanupAt = now.getTime();
  try {
    await prisma.rateLimit.deleteMany({ where: { windowEndsAt: { lt: now } } });
  } catch (error) {
    console.error("レート制限の期限切れ行を掃除できませんでした:", error);
  }
}
