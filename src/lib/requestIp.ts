/**
 * リクエスト元の識別子を取り出す。レート制限（src/lib/rateLimit.ts）のバケット作りに使う。
 *
 * Vercel の裏で動くため、接続元IPは常にプロキシ経由で `x-forwarded-for` に入る。
 * 先頭のアドレスが最も外側のクライアント。ヘッダは詐称できるが、
 * Vercel が実IPを常に前置きするので「実IP + 詐称ぶん」になり、
 * レート制限の観点では実IPで括られる（詐称で緩くはならない）。
 *
 * S-09：IPは識別のためだけに使い、そのままログや画面へ出さない。
 */

import { headers } from "next/headers";

/** 取れなかったときの固定値。全員が同じ枠に入るので「取れないなら厳しめ」に倒れる。 */
const UNKNOWN = "unknown";

export async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for");
    if (forwarded) {
      const first = forwarded.split(",")[0]?.trim();
      if (first) return first.slice(0, 64);
    }
    const real = h.get("x-real-ip");
    if (real) return real.trim().slice(0, 64);
  } catch (error) {
    console.error("接続元の判定に失敗しました:", error);
  }
  return UNKNOWN;
}
