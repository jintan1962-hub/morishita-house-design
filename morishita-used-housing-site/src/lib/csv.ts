/**
 * CSVの読み取り。物件の一括取込で使う。
 *
 * 【なぜ自前で書くか】
 * 以前は `text.split(",")` で切っていたため、値にカンマが1つでも入ると以降の列が全てずれた。
 * 「3LDK（和 8･6　洋 12）」のような表記や、住所の補足にカンマが入ると起きる。
 * 件数の確認では気付けず、間違った値がそのまま入る（S-08 の入力検証以前の問題）。
 * S-05 を避けるため外部パーサは足さず、RFC 4180 の必要な範囲だけを自前で実装する。
 */

/** 引用符に対応した1行の分解。`"a,b",c` → ["a,b", "c"]。 */
export function splitCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (inQuotes) {
      if (ch === '"') {
        // "" は引用符そのもの（RFC 4180）
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      values.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values.map((v) => v.trim());
}

/**
 * CSV本文をヘッダー付きの連想配列に変換する。
 * 改行は CRLF / LF の両方を受ける。引用符の中の改行には対応しない
 * （物件データで必要になったことがないため。必要になったら here を直す）。
 */
export function parseCsv(text: string): Record<string, string>[] {
  // BOM を除く。Excel が付けることがある。
  const body = text.replace(/^﻿/, "");
  const lines = body.split(/\r?\n/).filter((line) => line.trim() !== "");
  if (lines.length === 0) return [];

  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = values[i] ?? "";
    });
    return row;
  });
}

/**
 * 文字コードを判定してテキストにする。
 *
 * Excel の「CSV形式で保存」は既定で Shift-JIS（cp932）のため、UTF-8 として読むと
 * 日本語の物件名・住所が全て文字化けする。実際に運用で踏みやすい。
 * まず UTF-8 として厳密に読み、失敗したら Shift-JIS として読み直す。
 */
export function decodeCsvBuffer(buffer: ArrayBuffer): {
  text: string;
  encoding: "UTF-8" | "Shift_JIS";
} {
  try {
    // fatal: true にすると、UTF-8 として不正なバイト列で例外になる
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return { text, encoding: "UTF-8" };
  } catch {
    const text = new TextDecoder("shift_jis").decode(buffer);
    return { text, encoding: "Shift_JIS" };
  }
}
