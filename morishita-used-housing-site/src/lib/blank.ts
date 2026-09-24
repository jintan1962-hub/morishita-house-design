/**
 * 「値なし」の判定。
 *
 * athome の物件概要は、値が無い項目を「－」や「－ / －」（敷金・保証金の欄）と表示する。
 * これをそのまま保存・表示すると、売買物件に「敷金・保証金 － / －」と出て読みにくい。
 *
 * D-19：同じ判定を取込側と表示側の両方に書くと片方だけ直す事故が起きる。ここ1箇所に置く。
 */

/** ダッシュ・区切り記号・空白だけで出来ているか。 */
export function isBlankMark(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value !== "string") return false;
  const t = value.trim();
  if (t === "") return true;
  return /^[-－―‐/／・\s]+$/.test(t);
}

/** 値なしなら null、そうでなければ前後の空白を落とした文字列。 */
export function blankToNull(value: string | undefined | null): string | null {
  return isBlankMark(value) ? null : (value as string).trim();
}
