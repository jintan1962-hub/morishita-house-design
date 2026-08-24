import "@/app/globals.css";
import "./admin.css";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { signInPath } from "@/lib/authPaths";
import { getUnreadInquiryCount } from "@/app/actions/dashboard";
import AdminNav from "./AdminNav";

// 管理画面配下は毎回サーバー側で権限を確認する（キャッシュさせない）。
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // S-07：認可はサーバー側で判定する。
  // これはあくまで画面到達の制御であり、各サーバーアクション側でも
  // 個別に requireAdmin() を呼んでいる（画面を通らない直接呼び出しがあるため）。
  const auth = await requireAdmin();
  if (!auth.ok) {
    // ログイン後に管理画面へ戻す。戻り先を渡さないと NextAuth はトップへ戻す（signInPath 参照）。
    redirect(auth.reason === "UNAUTHENTICATED" ? signInPath("/admin") : "/");
  }

  // 未対応の問い合わせ件数。左メニューに出す。取得できなければ 0 として出さない。
  const unread = await getUnreadInquiryCount();

  return (
    // admin-root：管理画面だけ Tailwind の寸法を px で解決させる（admin.css を参照）。
    // これが無いと html の font-size: 62.5% を受けて全ての寸法が 62.5% に縮む。
    <div className="admin-root flex min-h-screen bg-reno-bg text-ink">
      {/* ---------------- サイドバー ---------------- */}
      <aside className="w-64 bg-ink text-white flex flex-col fixed h-full z-20">
        <div className="px-6 py-7">
          <Link href="/admin" className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter leading-none">
              RENO<span className="text-pink">ADMIN</span>
            </span>
            <span className="text-xs text-white/70 font-bold mt-1 tracking-widest">
              管理システム
            </span>
          </Link>
        </div>

        <AdminNav unreadInquiries={unread} />
      </aside>

      {/* ---------------- 本文 ---------------- */}
      <div className="flex-grow ml-64 flex flex-col min-w-0">
        <header className="min-h-16 bg-white border-b border-reno-line flex items-center justify-end gap-4 px-8 py-3 sticky top-0 z-10">
          {/* 以前ここに検索窓とベル通知があったが、どちらも押しても何も起きなかったため撤去した。
              検索は会員一覧・物件一覧のそれぞれに実際に動くものを置いている。 */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 bg-ink text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
              管
            </div>
            <div className="min-w-0 leading-tight">
              <p className="text-xs font-bold text-reno-mute-dark">ログイン中</p>
              <p className="text-sm font-bold text-ink truncate" title={auth.email}>
                {auth.email}
              </p>
            </div>
          </div>
        </header>

        <main className="p-6 xl:p-10 flex-grow min-w-0">{children}</main>
      </div>
    </div>
  );
}
