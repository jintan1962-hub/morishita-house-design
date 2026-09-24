import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { signInPath, AFTER_LOGIN_PATH } from "@/lib/authPaths";
import { ROLE } from "@/config/security";

// 権限を毎回サーバー側で見る。結果をキャッシュさせない。
export const dynamic = "force-dynamic";

/**
 * ログイン直後の中継地点。画面は出さず、権限ごとの入り口へ送るだけ。
 *
 * 「ログイン」ボタンからは行き先が決まらない（押した人が管理者か会員か、
 * 押す時点では分からない）ため、いったんここへ送ってから振り分ける。
 * 行き先が決まっている導線（/admin を直接開いた等）はここを通さず、
 * signInPath() でその画面を戻り先に指定する。
 */
export default async function AfterLoginPage() {
  const auth = await requireUser();

  // ログインが済んでいない／セッションが無効になっている場合は、
  // ログイン画面へ戻す（成功すればまたここへ来て振り分けられる）。
  if (!auth.ok) {
    redirect(signInPath(AFTER_LOGIN_PATH));
  }

  redirect(auth.role === ROLE.ADMIN ? "/admin" : "/mypage");
}
