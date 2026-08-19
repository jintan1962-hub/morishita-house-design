/**
 * 物件画像のファイル名の解釈。
 *
 * 一括アップロードでは、ファイル名の先頭にある物件管理番号（athome の番号）で
 * どの物件の画像かを決める。並び順は続く連番で決める。
 *
 *   6991580385_1.jpg  → 物件 6991580385 の 1枚目
 *   6991580385_02.JPG → 物件 6991580385 の 2枚目
 *   6991580385.jpg    → 物件 6991580385 の 1枚目（連番省略）
 *
 * D-06：ここを間違えると別の物件に画像が付く。機械で確かめられる形にしておく。
 */

// 相対パス＋拡張子つきなのは、node の標準テストランナーから読めるようにするため
// （src/lib/mailPayload.ts と同じ理由）。
import { ALLOWED_EXTENSIONS } from "../config/images.ts";

export type ParsedImageName =
  | { ok: true; objMngNo: string; order: number; ext: string }
  | { ok: false; reason: string };

/** 拡張子を取り出す（小文字）。 */
export function extensionOf(fileName: string): string {
  const m = fileName.match(/\.([A-Za-z0-9]+)$/);
  return m ? m[1].toLowerCase() : "";
}

export function parseImageFileName(fileName: string): ParsedImageName {
  const name = fileName.trim();
  const ext = extensionOf(name);

  if (ext === "") {
    return { ok: false, reason: "拡張子がありません" };
  }
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return {
      ok: false,
      reason: `対応していない形式です（${ALLOWED_EXTENSIONS.join(" / ")} のみ）`,
    };
  }

  const base = name.slice(0, name.length - ext.length - 1);
  // 物件管理番号（数字のみ）＋ 任意で「_連番」。区切りは _ か - を許す。
  const m = base.match(/^(\d{1,20})(?:[_-](\d{1,4}))?$/);
  if (!m) {
    return {
      ok: false,
      reason: "ファイル名が「物件管理番号_連番.拡張子」の形になっていません",
    };
  }

  return {
    ok: true,
    objMngNo: m[1],
    order: m[2] === undefined ? 1 : Number(m[2]),
    ext,
  };
}

/** Storage 上の保存先。物件ごとにフォルダを分ける。 */
export function storagePathFor(objMngNo: string, order: number, ext: string): string {
  return `${objMngNo}/${String(order).padStart(3, "0")}.${ext}`;
}
