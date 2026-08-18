import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { getPublicPropertyById } from "@/app/actions/properties";
import ContactForm from "./ContactForm";

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
      <div className="p-20 text-center font-bold text-gray-500">
        物件が見つかりませんでした
      </div>
    );
  }

  // C-03：物件情報はモック配列ではなくDBから引く。
  // 会員限定物件かどうかの判定と秘匿はサーバー側（getPublicPropertyById）で行う。
  const result = await getPublicPropertyById(propertyId);
  if (!result.success) {
    return (
      <div className="p-20 text-center font-bold text-gray-500">
        物件が見つかりませんでした
      </div>
    );
  }
  const property = result.data;

  // 会員限定物件は、未ログインのまま問い合わせ画面に入れない
  if (property.locked) {
    redirect("/api/auth/signin");
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
      <section className="memberHero" style={{ minHeight: "200px" }}>
        <div className="memberHero__photo" style={{ backgroundImage: "url('https://usedrenovation.ooi-kensetsu.co.jp/wp-content/uploads/2023/09/renoel7.jpg')" }}></div>
        <div className="memberHero__panel" style={{ width: "100%", borderRadius: 0, paddingLeft: "5%", minHeight: "200px" }}>
          <div className="memberHero__inner">
            <h1 className="memberHero__ttl">物件のお問い合わせ</h1>
          </div>
        </div>
      </section>

      <nav className="container container--wide breadcrumb" aria-label="パンくずリスト">
        <ol>
          <li><Link href="/">HOME</Link></li>
          <li><Link href="/properties">物件一覧</Link></li>
          <li><Link href={`/property/${property.id}`}>{property.title}</Link></li>
          <li aria-current="page">お問い合わせ</li>
        </ol>
      </nav>

      <section className="sec sec--gray">
        <div className="container" style={{ maxWidth: "800px" }}>
          <div className="bg-white p-8 rounded-xl shadow-sm border border-reno-line mb-8">
            <h2 className="text-xl font-bold text-ink mb-4 border-b pb-4">お問い合わせ対象の物件</h2>
            <p className="text-lg font-bold text-teal">{property.title}</p>
            <p className="text-sm text-reno-mute-dark mt-2">
              価格: {property.priceMan?.toLocaleString()}万円 / エリア: {property.address}
            </p>
          </div>

          <ContactForm
            property={{ id: property.id, title: property.title ?? "" }}
            user={user}
          />
        </div>
      </section>
    </>
  );
}
