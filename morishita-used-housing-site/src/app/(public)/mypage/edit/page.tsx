import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { signInPath } from "@/lib/authPaths";
import EditForm from "./EditForm";
import Link from "next/link";
import PageHead from "@/components/PageHead";

export default async function EditProfilePage() {
  // S-07：ログイン状態と、退会・停止されていないことをサーバー側で確認する
  const auth = await requireUser();
  if (!auth.ok) {
    redirect(signInPath("/mypage/edit"));
  }

  // S-01：select を省くと password（bcryptハッシュ）・failedLoginCount・lockedUntil・
  // deletedBy まで client component（EditForm）へ渡され、RSCペイロードでブラウザに配信される。
  // 画面に要るのは氏名・電話・メールだけ。
  const user = await prisma.user.findFirst({
    where: { id: auth.userId, deletedAt: null },
    select: { name: true, tel: true, email: true },
  });

  if (!user) {
    redirect(signInPath("/mypage/edit"));
  }

  return (
    <>
      <PageHead
        en="Edit Profile"
        title="登録情報の編集"
        crumbs={[{ label: "マイページ", href: "/mypage" }, { label: "登録情報の編集" }]}
      />

      <section className="sec sec--gray">
        <div className="container">
          <EditForm user={user} />
          <div style={{ textAlign: "center", marginTop: "24px" }}>
            <Link href="/mypage" className="more">マイページに戻る</Link>
          </div>
        </div>
      </section>
    </>
  );
}
