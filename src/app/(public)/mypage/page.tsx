import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import Link from "next/link";
import DeleteAccountButton from "@/components/DeleteAccountButton";
import { signInPath } from "@/lib/authPaths";

export default async function MyPage() {
  const session = await getServerSession();

  // ログインしていない場合はトップ（またはログイン画面）へリダイレクト
  if (!session) {
    redirect(signInPath("/mypage"));
  }

  const imgBase = "https://okazaki-bot.github.io/chuko-fudousan-design/";

  return (
    <>
      
      <section className="memberHero" style={{ minHeight: "200px" }}>
        <div className="memberHero__photo" style={{ backgroundImage: "url('https://usedrenovation.ooi-kensetsu.co.jp/wp-content/uploads/2023/09/renoel7.jpg')" }}></div>
        <div className="memberHero__panel" style={{ width: "100%", borderRadius: 0, paddingLeft: "5%", minHeight: "200px" }}>
          <div className="memberHero__inner">
            <h1 className="memberHero__ttl">マイページ</h1>
          </div>
        </div>
      </section>


      <section className="sec">
        <div className="container" style={{ maxWidth: "800px" }}>
          <p style={{ marginBottom: "32px", fontSize: "1.8rem" }}>ようこそ、{session.user?.name || "会員"}さん</p>

          <div className="cardGrid cardGrid--2">
            {/* お気に入り物件 (モック) */}
            <div className="voiceCard" style={{ display: "flex", flexDirection: "column" }}>
              <h2 className="voiceCard__ttl" style={{ borderBottom: "1px solid var(--c-line)", paddingBottom: "12px", marginBottom: "16px" }}>お気に入り物件</h2>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 0" }}>
                <p style={{ color: "var(--c-mute-dark)", fontSize: "1.4rem" }}>現在登録されている物件はありません。</p>
              </div>
              <div style={{ marginTop: "auto", textAlign: "center" }}>
                <Link href="/properties" className="btn btn--sm btn--block">物件を探す</Link>
              </div>
            </div>

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
                  <dd>{session.user?.name}</dd>
                </div>
                <div style={{ padding: "12px 0" }}>
                  <dt>メールアドレス</dt>
                  <dd>{session.user?.email}</dd>
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
