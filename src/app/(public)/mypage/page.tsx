import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import { requireUser } from "@/lib/auth";
import { signInPath } from "@/lib/authPaths";
import PageHead from "@/components/PageHead";

export default async function MyPage() {
  // S-07：ログイン状態と、退会・停止されていないことをサーバー側で確認する。
  // getServerSession() を素で呼ぶと session コールバックが効かず、確認が中途半端になる。
  const auth = await requireUser();
  if (!auth.ok) {
    redirect(signInPath("/mypage"));
  }

  // S-01：画面に出す氏名・メールだけを取る。
  const member = await prisma.user.findFirst({
    where: { id: auth.userId, deletedAt: null },
    select: { name: true, email: true },
  });
  if (!member) {
    redirect(signInPath("/mypage"));
  }

  return (
    <>
      
      {/* 以前ここに RENOEL（他社）のサーバー上にある写真を背景として直リンクしていた。
          モリシタハウスのサイトから他社サーバーへ画像を取りに行く状態だったため外している。 */}
      <PageHead en="My Page" title="マイページ" crumbs={[{ label: "マイページ" }]} />


      <section className="sec">
        <div className="container" style={{ maxWidth: "800px" }}>
          <p style={{ marginBottom: "32px", fontSize: "1.8rem" }}>ようこそ、{member.name || "会員"}さん</p>

          <div className="cardGrid cardGrid--2">
            {/* お気に入り機能は未実装のため枠を出していない。
                「登録されている物件はありません」とだけ出る枠は、
                登録できる導線が無いのに登録済みの有無を語ることになる（D-03）。
                TODO:未確認 お気に入りを実装するなら Favorite テーブルの追加が要る。 */}
            {/* 会員限定物件検索 */}
            <div className="voiceCard" style={{ display: "flex", flexDirection: "column" }}>
              <h2 className="voiceCard__ttl" style={{ borderBottom: "1px solid var(--c-line)", paddingBottom: "12px", marginBottom: "16px" }}>会員限定物件</h2>
              <p className="voiceCard__txt" style={{ flex: 1 }}>
                会員様だけが閲覧できる未公開・限定物件をチェックできます。
              </p>
              <div style={{ marginTop: "auto", textAlign: "center" }}>
                <Link href="/properties" className="btn btn--fill btn--sm btn--block">会員限定物件を見る</Link>
              </div>
            </div>

            {/* 会員情報設定 (モック) */}
            <div className="voiceCard" style={{ display: "flex", flexDirection: "column", gridColumn: "1 / -1" }}>
              <h2 className="voiceCard__ttl" style={{ borderBottom: "1px solid var(--c-line)", paddingBottom: "12px", marginBottom: "16px" }}>会員情報</h2>
              <dl className="mediaCard__data" style={{ borderTop: "none", marginTop: 0 }}>
                <div style={{ padding: "12px 0" }}>
                  <dt>お名前</dt>
                  <dd>{member.name || "（未設定）"}</dd>
                </div>
                <div style={{ padding: "12px 0" }}>
                  <dt>メールアドレス</dt>
                  <dd>{member.email}</dd>
                </div>
              </dl>
              <div style={{ marginTop: "24px", textAlign: "center" }}>
                <Link href="/mypage/edit" className="btn btn--sm">登録情報を編集する</Link>
              </div>
            </div>
          </div>
          <DeleteAccountButton />
        </div>
      </section>
    </>
  );
}
