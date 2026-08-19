/**
 * CSV取込で使う日付の読み取り。
 *
 * athome の表示は「2026年8月18日」、エクスポートCSVは「2026/08/18」や「2026-08-18」など
 * 出力元によって揺れる。取込のたびに書き分けると読み違いが起きるため、ここ1箇所に寄せる。
 * 読めない値は例外を投げずに null を返す（1件の書式違いで取込全体を止めない）。
 */

/** 日付として妥当な組み合わせか。2026-02-31 のような値を弾く。 */
function toDate(year: number, month: number, day: number): Date | null {
  if (year < 1900 || year > 2200) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;

  // UTC で作る。ローカルタイムだと実行環境の時差で前日になることがある。
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null; // 2月31日などの繰り上がりを弾く
  }
  return date;
}

/**
 * 「2026年8月18日」「2026/8/18」「2026-08-18」「2026.8.18」を Date にする。
 * 空文字・「－」・読めない値は null。
 */
export function parseJapaneseDate(value: string | undefined | null): Date | null {
  const text = (value ?? "").trim();
  if (text === "" || text === "-" || text === "－" || text === "―") return null;

  const jp = text.match(/^(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日?$/);
  if (jp) return toDate(Number(jp[1]), Number(jp[2]), Number(jp[3]));

  const sep = text.match(/^(\d{4})[/\-.](\d{1,2})[/\-.](\d{1,2})$/);
  if (sep) return toDate(Number(sep[1]), Number(sep[2]), Number(sep[3]));

  return null;
}
