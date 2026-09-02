/**
 * 間取り文字列（"3LDK" / "2K" / "4SLDK" / "1R" など）を件数集計用の区分に振り分ける。
 *
 * D-06：件数の集計に使うためテストを書いている（madori.test.ts）。
 * D-03：部屋数が読み取れない表記は、どれかの区分に押し込まず null を返す。
 *       「たぶん3LDKだろう」で数えると件数が静かに狂う。
 */

export const MADORI_BUCKETS = [
  { key: "b1", label: "1LDK以下", min: 0, max: 1 },
  { key: "b2", label: "2K〜2LDK", min: 2, max: 2 },
  { key: "b3", label: "3K〜3LDK", min: 3, max: 3 },
  { key: "b4", label: "4K〜4LDK", min: 4, max: 4 },
  { key: "b5", label: "5K以上", min: 5, max: Infinity },
] as const;

export type MadoriBucketKey = (typeof MADORI_BUCKETS)[number]["key"];

/**
 * 間取り表記から部屋数を読む。読めなければ null。
 * 「ワンルーム」「1R」は1部屋として扱う（不動産表記の慣行）。
 */
export function madoriRooms(madori: string | null | undefined): number | null {
  if (!madori) return null;
  // 全角数字を半角へ。空白は落とす。
  const normalized = madori
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\s/g, "");

  if (/^ワンルーム/.test(normalized)) return 1;

  // 先頭の数字が部屋数（"3LDK" → 3、"4SLDK" → 4）。
  // S は納戸。SLK / SLDK のように L や D と組み合わさる表記がある。
  // 2026-09-02：SLK が抜けており、"6SLK" の1件が集計から落ちていた。
  const m = normalized.match(/^(\d+)\s*(R|K|DK|LDK|SLDK|SLK|SK|SDK|LK)/i);
  if (!m) return null;

  const rooms = parseInt(m[1], 10);
  return Number.isInteger(rooms) && rooms > 0 ? rooms : null;
}

/** 間取り表記を区分キーに変換する。読めなければ null。 */
export function madoriBucket(madori: string | null | undefined): MadoriBucketKey | null {
  const rooms = madoriRooms(madori);
  if (rooms === null) return null;
  const bucket = MADORI_BUCKETS.find((b) => rooms >= b.min && rooms <= b.max);
  return bucket ? bucket.key : null;
}

/**
 * 間取りの一覧を区分ごとに数える。
 * 読めなかった表記は、どの区分にも入らない（合計が総件数と一致しないことがある）。
 */
export function countByMadori(
  madoris: readonly (string | null | undefined)[]
): Record<MadoriBucketKey, number> {
  const counts = Object.fromEntries(MADORI_BUCKETS.map((b) => [b.key, 0])) as Record<
    MadoriBucketKey,
    number
  >;
  for (const m of madoris) {
    const key = madoriBucket(m);
    if (key) counts[key] += 1;
  }
  return counts;
}
