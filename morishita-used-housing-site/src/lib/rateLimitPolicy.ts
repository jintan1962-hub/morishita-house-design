/**
 * レート制限の「判定」だけを持つ純関数。副作用なし・依存なし。
 * DBの読み書きは src/lib/rateLimit.ts が担当する。
 *
 * ここを分けているのは、node --test（標準テストランナー）から
 * prisma を経由せずに判定ロジックを固定できるようにするため（D-06。
 * src/lib/propertySearch.ts と同じ理由）。
 */

/** DBに保存されている、あるバケットの現在の状態。無ければ null。 */
export type RateLimitState = { count: number; windowEndsAt: Date } | null;

export type RateLimitOptions = {
  /** 窓の中で許す試行回数 */
  limit: number;
  /** 窓の長さ（秒） */
  windowSeconds: number;
};

export type RateLimitDecision = {
  /** この試行を通してよいか */
  allowed: boolean;
  /** 拒否したとき、あと何秒待てば窓が切り替わるか（通したときは 0） */
  retryAfterSeconds: number;
  /** DBへ書き戻す新しいカウント */
  nextCount: number;
  /** DBへ書き戻す新しい窓の終了時刻 */
  nextWindowEndsAt: Date;
};

/**
 * 現在の状態としきい値から、この試行を通すか決める。
 * 拒否のときはカウントを増やさない（窓の中で無限に増え続けないように）。
 * 拒否のときも窓は延長しない（待てば必ず明ける）。
 */
export function decideRateLimit(
  state: RateLimitState,
  opts: RateLimitOptions,
  now: Date
): RateLimitDecision {
  const windowExpired =
    state === null || now.getTime() >= state.windowEndsAt.getTime();

  if (windowExpired) {
    return {
      allowed: true,
      retryAfterSeconds: 0,
      nextCount: 1,
      nextWindowEndsAt: new Date(now.getTime() + opts.windowSeconds * 1000),
    };
  }

  if (state.count >= opts.limit) {
    const retryAfterSeconds = Math.max(
      1,
      Math.ceil((state.windowEndsAt.getTime() - now.getTime()) / 1000)
    );
    return {
      allowed: false,
      retryAfterSeconds,
      nextCount: state.count,
      nextWindowEndsAt: state.windowEndsAt,
    };
  }

  return {
    allowed: true,
    retryAfterSeconds: 0,
    nextCount: state.count + 1,
    nextWindowEndsAt: state.windowEndsAt,
  };
}
