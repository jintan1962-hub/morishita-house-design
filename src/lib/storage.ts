/**
 * 画像の保管。Supabase Storage の REST API を fetch で直接呼ぶ。
 *
 * 【この構成にした理由】
 * Vercel はサーバーレスでファイルシステムが永続しないため、アップロードした画像を
 * リポジトリや実行環境に置くことはできない。DBと同じ Supabase に寄せることで、
 * 契約先も管理画面も増やさずに済む。@supabase/supabase-js は入れていない（S-05）。
 *
 * S-01：SUPABASE_SERVICE_ROLE_KEY はサーバーからしか読まない。
 * NEXT_PUBLIC_ を付けないこと。付けるとブラウザに配信され、DBを全操作できる鍵が漏れる。
 */

import { STORAGE_BUCKET, CONTENT_TYPES } from "@/config/images";

function config() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/+$/, "");
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return { url, key };
}

/** 設定が揃っているか。画面に「まだ使えません」と出すために使う。 */
export function isStorageConfigured(): boolean {
  const { url, key } = config();
  return url !== "" && key !== "";
}

/** 公開URL。バケットを public にしてある前提。 */
export function publicUrl(path: string): string {
  const { url } = config();
  return `${url}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}

export type StorageResult =
  | { ok: true; url: string }
  | { ok: false; reason: string };

/**
 * 1枚アップロードする。同じパスがあれば上書きする（同じ物件の同じ連番を差し替えられる）。
 * 例外は投げず、理由を返す。呼び出し側が1件ずつ結果を画面に出せるようにするため。
 */
export async function uploadImage(path: string, file: File, ext: string): Promise<StorageResult> {
  const { url, key } = config();
  if (url === "" || key === "") {
    return { ok: false, reason: "SUPABASE_URL または SUPABASE_SERVICE_ROLE_KEY が未設定です" };
  }

  try {
    const res = await fetch(`${url}/storage/v1/object/${STORAGE_BUCKET}/${path}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
        // 同名があれば置き換える
        "x-upsert": "true",
        "Cache-Control": "public, max-age=31536000",
      },
      body: file,
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      let detail = "";
      try {
        const body = (await res.json()) as { message?: string; error?: string };
        detail = body.message || body.error || "";
      } catch {
        // JSON でない応答もある
      }
      return {
        ok: false,
        reason: `保管先が受け付けませんでした（HTTP ${res.status}${detail ? `: ${detail}` : ""}）`,
      };
    }

    return { ok: true, url: publicUrl(path) };
  } catch (error) {
    const reason =
      error instanceof Error && error.name === "TimeoutError"
        ? "保管先が30秒以内に応答しませんでした"
        : `保管先へ接続できませんでした（${error instanceof Error ? error.name : "unknown"}）`;
    return { ok: false, reason };
  }
}

/**
 * 1枚消す。DBの行を消したあとに呼ぶ。
 * 消えなくてもDB側は消えている（孤児ファイルが残るだけ）ので、失敗しても処理は止めない。
 */
export async function deleteImage(path: string): Promise<StorageResult> {
  const { url, key } = config();
  if (url === "" || key === "") {
    return { ok: false, reason: "保管先の設定がありません" };
  }

  try {
    const res = await fetch(`${url}/storage/v1/object/${STORAGE_BUCKET}/${path}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      return { ok: false, reason: `削除できませんでした（HTTP ${res.status}）` };
    }
    return { ok: true, url: "" };
  } catch (error) {
    return {
      ok: false,
      reason: `保管先へ接続できませんでした（${error instanceof Error ? error.name : "unknown"}）`,
    };
  }
}

/** 公開URLから Storage 上のパスを取り出す。削除のときに使う。 */
export function pathFromPublicUrl(fileUrl: string): string | null {
  const marker = `/storage/v1/object/public/${STORAGE_BUCKET}/`;
  const i = fileUrl.indexOf(marker);
  if (i === -1) return null;
  return fileUrl.slice(i + marker.length);
}
