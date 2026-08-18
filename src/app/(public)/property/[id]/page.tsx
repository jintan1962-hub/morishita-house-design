import Link from "next/link";
import { getPublicPropertyById } from "@/app/actions/properties";
import { calculateMonthlyPayment } from "@/lib/loan";
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  DEFAULT_LOAN_YEARS,
  DEFAULT_RENOVATION_COST_YEN,
  MAN_YEN,
} from "@/config/loan";
import { COMPANY } from "@/config/company";
import SignInButton from "@/components/SignInButton";
import PropertyViewLogger from "./PropertyViewLogger";

/**
 * C-03 / S-07：会員限定物件の秘匿をサーバー側へ移した。
 * 以前は "use client" ＋ モック配列で、未ログインでも価格・所在地がソースから読めていた。
 * いまは getPublicPropertyById() が、鍵つきの場合そもそも中身を返さない。
 */
export const dynamic = "force-dynamic";

const imgBase = "https://okazaki-bot.github.io/chuko-fudousan-design/";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  const result = await getPublicPropertyById(id);

  if (!result.success) {
    return (
      <div className="p-20 text-center font-bold text-gray-500">
        物件が見つかりませんでした
      </div>
    );
  }

  const property = result.data;

  // 会員限定 × 未ログイン。ここには価格も所在地も画像も渡ってきていない。
  if (property.locked) {
    return (
      <>
        <div className="pageHead">
          <div className="pageHead__bg">
            {/* eslint-disable-next-line @next/next/no-img-element -- 外部CMS配信の固定画像 */}
            <img src={`${imgBase}assets/img/gallery.jpg`} alt="" />
          </div>
          <div className="container container--wide pageHead__inner">
            <span className="pageHead__en">MEMBERS ONLY</span>
            <h1 className="pageHead__ttl">会員限定物件</h1>
          </div>
        </div>

        <section className="sec">
          <div className="container" style={{ maxWidth: "600px", textAlign: "center" }}>
            <h2 className="text-2xl font-black text-blue-900 mb-4">この物件は会員限定公開です</h2>
            <p className="leadTxt">
              詳細な写真、所在地、周辺環境などを確認するには無料会員登録またはログインが必要です。
            </p>
            <div className="btnWrap" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <SignInButton className="btn btn--fill btn--lg" style={{ width: "100%" }}>
                ログインして詳細を見る
              </SignInButton>
              <Link href="/member" className="btn btn--pink btn--lg">無料会員登録はこちら</Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  const priceMan = property.priceMan ?? 0;
  const totalLoanAmountYen = priceMan * MAN_YEN + DEFAULT_RENOVATION_COST_YEN;
  const monthlyPayment = calculateMonthlyPayment(
    totalLoanAmountYen,
    DEFAULT_ANNUAL_RATE_PERCENT,
    DEFAULT_LOAN_YEARS
  );
  const mainImage = property.images[0] ?? `${imgBase}assets/img/gallery.jpg`;

  return (
    <>
      <PropertyViewLogger propertyId={property.id} propertyTitle={property.title ?? ""} />

      <nav className="container container--wide breadcrumb mt-8" aria-label="パンくずリスト">
        <ol>
          <li><Link href="/">HOME</Link></li>
          <li><Link href="/properties">物件一覧</Link></li>
          <li aria-current="page">{property.title}</li>
        </ol>
      </nav>

      <section className="sec" style={{ paddingTop: "20px" }}>
        <div className="container container--wide detailHead">
          {/* 左側：ギャラリー＆物件情報 */}
          <div>
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                <span className="label label--member">{property.syumoku}</span>
                {property.isMemberOnly && <span className="label label--new">会員限定</span>}
              </div>
              <h1 style={{ fontSize: "2.4rem", lineHeight: "1.4", fontWeight: "bold" }}>{property.title}</h1>
            </div>

            <div className="gallery">
              <div className="gallery__main">
                {/* eslint-disable-next-line @next/next/no-img-element -- 物件画像は外部CMS配信 */}
                <img src={mainImage} alt={property.title ?? "物件画像"} />
              </div>
              {property.images.length > 1 && (
                <div className="gallery__thumbs">
                  {property.images.slice(0, 4).map((src, i) => (
                    <button key={src} aria-current={i === 0 ? "true" : undefined}>
                      {/* eslint-disable-next-line @next/next/no-img-element -- 物件画像は外部CMS配信 */}
                      <img src={src} alt="" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: "48px" }}>
              <h2 className="secTtl secTtl--left">
                <span className="ja" style={{ fontSize: "2rem", color: "var(--c-ink)" }}>物件概要</span>
              </h2>
              <table className="specTable">
                <tbody>
                  <tr>
                    <th>所在地</th>
                    <td>{property.address}</td>
                  </tr>
                  <tr>
                    <th>間取り</th>
                    <td>{property.madori}</td>
                  </tr>
                  <tr>
                    <th>土地面積 / 建物面積</th>
                    <td>
                      {property.landMen ? `${property.landMen}m²` : "–"} /{" "}
                      {property.bldMen ? `${property.bldMen}m²` : "–"}
                    </td>
                  </tr>
                  <tr>
                    <th>構造</th>
                    <td>{property.bldStructure || "–"}</td>
                  </tr>
                  <tr>
                    <th>築年月</th>
                    <td>
                      {property.bldY ? `${property.bldY}年${property.bldM ?? ""}月` : "–"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 右側：価格・ローン・CTA */}
          <aside className="detailSide">
            <p className="detailSide__price">
              <span className="val">{priceMan.toLocaleString()}</span>
              <span className="unit">万円</span>
            </p>

            <div className="detailSide__loan">
              リノベ込み月々 <strong className="num">{Math.round(monthlyPayment).toLocaleString()}</strong> 円<br />
              <span style={{ fontSize: "1.1rem", color: "var(--c-mute-dark)" }}>
                （物件{priceMan.toLocaleString()}万円＋リノベ
                {(DEFAULT_RENOVATION_COST_YEN / MAN_YEN).toLocaleString()}万円／金利
                {DEFAULT_ANNUAL_RATE_PERCENT}%・{DEFAULT_LOAN_YEARS}年）
              </span>
            </div>

            <div className="detailSide__btns">
              <Link href={`/property/${property.id}/contact`} className="btn btn--fill btn--block">見学予約・お問い合わせ</Link>
            </div>

            <div className="detailSide__tel">
              <small>お電話でのお問い合わせ</small>
              <a className="num gothic" href={COMPANY.telLink}>{COMPANY.tel}</a>
              <small>営業時間：{COMPANY.businessHours}</small>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
