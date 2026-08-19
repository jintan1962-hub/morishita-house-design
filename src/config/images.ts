/**
 * D-19：物件画像の決めごとはこのファイルだけに書く。
 * 上限を変えるときは、ここ1箇所を直せばアップロード画面と保存処理の両方に効く。
 *
 * 秘密情報（Supabase のキー）はここに書かない（D-08 / S-01）。.env から読む。
 */

/** 保管先のバケット名。Supabase の Storage に同名のバケットを作っておく。 */
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "property-images";

/** 1枚あたりの上限（バイト）。5MB。 */
export const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** 1物件あたりの枚数の上限。無料枠（1GB）を使い切らないための歯止め。 */
export const MAX_IMAGES_PER_PROPERTY = 20;

/** 受け付ける拡張子。小文字で比較する。 */
export const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"] as const;

/** 拡張子 → Content-Type。Storage へ渡す。 */
export const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** 人が読める上限の表記（画面の案内文用）。 */
export const MAX_FILE_LABEL = "5MB";
