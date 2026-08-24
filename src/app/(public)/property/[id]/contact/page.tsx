import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { signInPath } from "@/lib/authPaths";
import { getPublicPropertyById } from "@/app/actions/properties";
import ContactForm from "./ContactForm";
import PageHead from "@/components/PageHead";

export const dynamic = "force-dynamic";

export default async function PropertyContactPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const propertyId = parseInt(resolvedParams.id);

  if (!Number.isInteger(propertyId) || propertyId <= 0) {
    return (
      <>
        <PageHead en="Not Found" title="物件が見つかりません" crumbs={[{ label: "物件が見つかりません" }]} />
        <section className="band">
          <div className="wrap-narrow">
            <div className="empty-panel">
              <h2>お探しの物件は見つかりませんでした</h2>
              <p>掲載が終了したか、URLが変わった可能性があります。</p>
              <Link className="btn btn-solid" href="/properties">
                物件一覧へ
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  // C-03：物件情報はモック配列ではなくDBから引く。
  // 会員限定物件かどうかの判定と秘匿はサーバー側（getPublicPropertyById）で行う。
  const result = await getPublicPropertyById(propertyId);
  if (!result.success) {
    return (
      <>
        <PageHead en="Not Found" title="物件が見つかりません" crumbs={[{ label: "物件が見つかりません" }]} />
        <section className="band">
          <div className="wrap-narrow">
            <div className="empty-panel">
              <h2>お探しの物件は見つかりませんでした</h2>
              <p>掲載が終了したか、URLが変わった可能性があります。</p>
              <Link className="btn btn-solid" href="/properties">
                物件一覧へ
              </Link>
            </div>
          </div>
        </section>
      </>
    );
  }
  const property = result.data;

  // 会員限定物件は、未ログインのまま問い合わせ画面に入れない
  if (property.locked) {
    // ログイン後はこの物件の問い合わせ画面へ戻す（signInPath 参照）
    redirect(signInPath(`/property/${propertyId}/contact`));
  }

  // ログイン済みなら、フォームの初期値に本人の登録情報を差し込む
  const auth = await requireUser();
  const user = auth.ok
    ? await prisma.user.findFirst({
        where: { id: auth.userId, deletedAt: null },
        select: { name: true, email: true, tel: true },
      })
    : null;

  return (
    <>
      <PageHead
        en="Contact"
        title="物件のお問い合わせ"
        crumbs={[
          { label: "物件一覧", href: "/properties" },
          { label: property.title ?? "物件詳細", href: `/property/${property.id}` },
          { label: "お問い合わせ" },
        ]}
      />

      <section className="sec sec--gray">
        <div className="container">
          <table className="spec-table" style={{ marginBottom: 28 }}>
            <caption className="visually-hidden">お問い合わせ対象の物件</caption>
            <tbody>
              <tr>
                <th>物件</th>
                <td>{property.title}</td>
              </tr>
              <tr>
                <th>価格</th>
                <td>{property.priceMan?.toLocaleString()}万円</td>
              </tr>
              <tr>
                <th>所在地</th>
                <td>{property.address}</td>
              </tr>
            </tbody>
          </table>

          <ContactForm
            property={{ id: property.id, title: property.title ?? "" }}
            user={user}
          />
        </div>
      </section>
    </>
  );
}
