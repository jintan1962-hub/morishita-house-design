/**
 * ログイン導線のURLを組み立てる。
 *
 * `auth.ts` ではなくこのファイルに置いているのは、`auth.ts` が prisma と
 * NEXTAUTH_SECRET を読む**サーバー専用**のモジュールで、クライアント側の
 * 画面（トップページなど）から読み込めないため。ここは依存を持たない。
 */

/** ログイン直後の中継地点。権限に応じた入り口へ送る（src/app/after-login）。 */
export const AFTER_LOGIN_PATH = "/after-login";

/**
 * 未ログインの利用者をログイン画面へ送るときの行き先。
 *
 * NextAuth は `?callbackUrl=` が無いとログイン後に**サイトのトップへ戻す**
 * （next-auth/core/lib/callback-url.js：`let callbackUrl = url.origin`）。
 * そのため戻り先を渡さずに `/api/auth/signin` へ送ると、ログインできても
 * 元のページには戻らない。行き先の組み立てはここ1箇所に置く（D-09）。
 *
 * 渡してよいのは自サイト内の絶対パス（`/admin` など）だけ。
 * 外部URLは NextAuth 側の redirect コールバックが弾くが、そもそも渡さない。
 */
export function signInPath(callbackUrl: string): string {
  return `/api/auth/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`;
}
