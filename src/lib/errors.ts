/**
 * D-07：エラーを握り潰さない／利用者に内部情報を見せない。
 *
 * 画面へ返してよいのは「処理できませんでした」＋問い合わせ用IDまで。
 * スタックトレース・SQL・内部パス・変数の中身は返さない（以前は String(error) を
 * そのまま alert() で表示していた）。
 * 詳細はサーバーのログにだけ残す。S-09 のとおり、ログにも個人情報は入れない。
 */

/** 問い合わせ用ID。日時＋連番相当のランダム文字で、ログと画面を突き合わせる。 */
function newErrorId(): string {
  const now = new Date();
  const stamp =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, "0") +
    String(now.getDate()).padStart(2, "0") +
    String(now.getHours()).padStart(2, "0") +
    String(now.getMinutes()).padStart(2, "0");
  const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `${stamp}-${suffix}`;
}

/**
 * 例外をログに残し、画面に出してよい文言だけを返す。
 * @param context どの処理で起きたか（固定文字列。個人情報や入力値を入れないこと）
 * @param error   捕捉した例外
 * @param userMessage 画面に出す文言
 */
export function reportError(
  context: string,
  error: unknown,
  userMessage = "処理できませんでした。時間をおいて再度お試しください。"
): { success: false; error: string; errorId: string } {
  const errorId = newErrorId();
  // ログにだけ詳細を残す。ここが唯一の出力先。
  console.error(`[${errorId}] ${context}:`, error);
  return {
    success: false,
    error: `${userMessage}（お問い合わせID: ${errorId}）`,
    errorId,
  };
}
