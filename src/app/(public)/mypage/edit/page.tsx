import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { signInPath } from "@/lib/authPaths";
import EditForm from "./EditForm";
import Link from "next/link";

export default async function EditProfilePage() {
  // S-07：ログイン状態と、退会・停止されていないことをサーバー側で確認する
  const auth = await requireUser();
  if (!auth.ok) {
    redirect(signInPath("/mypage/edit"));
  }

  const user = await prisma.user.findFirst({
    where: { id: auth.userId, deletedAt: null },
  });

  if (!user) {
    redirect(signInPath("/mypage/edit"));
  }

  return (
    <>
      <section className="memberHero" style={{ minHeight: "200px" }}>
        <div className="memberHero__photo" style={{ backgroundImage: "url('https://usedrenovation.ooi-kensetsu.co.jp/wp-content/uploads/2023/09/renoel7.jpg')" }}></div>
        <div className="memberHero__panel" style={{ width: "100%", borderRadius: 0, paddingLeft: "5%", minHeight: "200px" }}>
          <div className="memberHero__inner">
            <h1 className="memberHero__ttl">登録情報の編集</h1>
          </div>
        </div>
      </section>

      <nav className="container container--wide breadcrumb" aria-label="パンくずリスト">
        <ol>
          <li><Link href="/">HOME</Link></li>
          <li><Link href="/mypage">マイページ</Link></li>
          <li aria-current="page">登録情報の編集</li>
        </ol>
      </nav>

      <section className="sec sec--gray">
        <div className="container" style={{ maxWidth: "800px" }}>
          <EditForm user={user} />
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href="/mypage" style={{ textDecoration: "underline", color: "#666" }}>マイページに戻る</Link>
          </div>
        </div>
      </section>
    </>
  );
}
