import Link from "next/link";
import { isBlankMark } from "@/lib/blank";
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
import PageHead from "@/components/PageHead";

/**
 * C-03 / S-07：会員限定物件の秘匿をサーバー側へ移した。
 * 以前は "use client" ＋ モック配列で、未ログインでも価格・所在地がソースから読めていた。
 * いまは getPublicPropertyById() が、鍵つきの場合そもそも中身を返さない。
 */
export const dynamic = "force-dynamic";

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
      <>
        <PageHead en="Not Found" title="物件が見つかりません" crumbs={[{ label: "物件一覧", href: "/properties" }, { label: "物件が見つかりません" }]} />
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

  // 会員限定 × 未ログイン。ここには価格も所在地も画像も渡ってきていない。
  if (property.locked) {
    return (
      <>
        <PageHead
          en="Members Only"
          title="会員限定物件"
          crumbs={[{ label: "物件一覧", href: "/properties" }, { label: "会員限定物件" }]}
        />
        <section className="band">
          <div className="wrap-narrow">
            <div className="empty-panel">
              <h2>この物件は会員限定で公開しています</h2>
              <p>
                価格・所在地・写真・図面は、無料会員登録またはログインのうえでご覧いただけます。
              </p>
              <div
                style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}
              >
                <SignInButton className="btn btn-line">ログインして詳細を見る</SignInButton>
                <Link href="/member" className="btn btn-gold">
                  無料会員登録はこちら
                </Link>
              </div>
            </div>
          </div>
        </section>
      </>
    );
  }

  const priceMan = property.priceMan ?? 0;

  // 物件概要の追加行。値が入っている項目だけを、athome の表示順に近い並びで出す。
  // 取扱店（会社名・免許番号など）は宅建業法の表示の扱いが未決定のため、まだ出さない。
  const specRows = (
    [
      ["交通", property.trafficNote],
      ["階建/階", property.floorsInfo],
      ["駐車場", property.parking],
      ["土地権利", property.landRight],
      ["現況", property.currentState],
      ["引渡可能時期", property.deliveryTiming],
      ["取引態様", property.transactionType],
      ["借地期間・地代", property.leaseTermRent],
      ["権利金", property.keyMoney],
      ["敷金・保証金", property.depositGuarantee],
      ["維持費等", property.maintenanceCost],
      ["その他一時金", property.otherLumpSum],
      ["管理費", property.mgmtFeeYen ? `${property.mgmtFeeYen.toLocaleString()}円/月` : null],
      ["修繕積立金", property.repairFundYen ? `${property.repairFundYen.toLocaleString()}円/月` : null],
      ["総戸数", property.totalUnits ? `${property.totalUnits}戸` : null],
      ["所在階", property.floorNo ? `${property.floorNo}階` : null],
      ["向き", property.direction],
      ["バルコニー面積", property.balconyMen ? `${property.balconyMen}m²` : null],
      ["管理形態", property.mgmtForm],
      ["建ぺい率", property.buildingCoverage ? `${property.buildingCoverage}%` : null],
      ["容積率", property.floorAreaRatio ? `${property.floorAreaRatio}%` : null],
      ["用途地域", property.zoning],
      ["地目", property.landCategory],
      ["都市計画", property.cityPlanning],
      ["接道状況", property.roadAccess],
      ["私道負担", property.privateRoad],
      ["掲載会社管理番号", property.listingCompanyNo],
      [
        "情報公開日",
        property.publishedOn ? property.publishedOn.toLocaleDateString("ja-JP") : null,
      ],
      [
        "次回更新予定日",
        property.nextUpdateOn ? property.nextUpdateOn.toLocaleDateString("ja-JP") : null,
      ],
    ] as [string, string | null | undefined][]
  )
    // 取込より前に入った「－ / －」のような値も出さない。判定は src/lib/blank.ts に集約。
    .filter(([, value]) => !isBlankMark(value))
    .map(([label, value]) => ({ label, value: value as string }));

  // 取扱店。宅建業法の広告表示に関わる項目のため、値が入っていれば必ず出す。
  const agencyRows = (
    [
      ["会社名", property.agencyName],
      ["所在地", property.agencyAddress],
      ["電話番号", property.agencyTel],
      ["免許番号", property.agencyLicense],
    ] as [string, string | null | undefined][]
  )
    .filter(([, value]) => !isBlankMark(value))
    .map(([label, value]) => ({ label, value: value as string }));
  const totalLoanAmountYen = priceMan * MAN_YEN + DEFAULT_RENOVATION_COST_YEN;
  const monthlyPayment = calculateMonthlyPayment(
    totalLoanAmountYen,
    DEFAULT_ANNUAL_RATE_PERCENT,
    DEFAULT_LOAN_YEARS
  );
  const mainImage = property.images[0] ?? null;

  return (
    <>
      <PropertyViewLogger propertyId={property.id} propertyTitle={property.title ?? ""} />

      <PageHead
        en="Property"
        title={property.title ?? "物件詳細"}
        crumbs={[{ label: "物件一覧", href: "/properties" }, { label: property.title ?? "物件詳細" }]}
      />

      <section className="band">
        <div className="wrap">
          <div className="detail-layout">
            {/* 左：写真と物件概要 */}
            <div>
              <div className="detail-gallery">
                <div className="detail-gallery__main">
                  {mainImage ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 物件画像は外部ストレージ配信
                    <img src={mainImage} alt={property.title ?? "物件画像"} />
                  ) : (
                    <p className="state-msg">写真は準備中です</p>
                  )}
                </div>
                {property.images.length > 1 && (
                  <div className="detail-gallery__thumbs">
                    {property.images.slice(1, 9).map((src) => (
                      // eslint-disable-next-line @next/next/no-img-element -- 物件画像は外部ストレージ配信
                      <img key={src} src={src} alt="" loading="lazy" />
                    ))}
                  </div>
                )}
              </div>

              <h2 style={{ fontSize: 22, margin: "48px 0 18px" }}>物件概要</h2>
              <table className="spec-table">
                <tbody>
                  <tr>
                    <th>物件種別</th>
                    <td>{property.syumoku}</td>
                  </tr>
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
                      {property.landMen ? `${property.landMen}m²` : "－"} /{" "}
                      {property.bldMen ? `${property.bldMen}m²` : "－"}
                    </td>
                  </tr>
                  <tr>
                    <th>構造</th>
                    <td>{property.bldStructure || "－"}</td>
                  </tr>
                  <tr>
                    <th>築年月</th>
                    <td>{property.bldY ? `${property.bldY}年${property.bldM ?? ""}月` : "－"}</td>
                  </tr>
                  {/* 値が入っている項目だけ出す。空の行を並べても読みにくくなるだけのため。 */}
                  {specRows.map((row) => (
                    <tr key={row.label}>
                      <th>{row.label}</th>
                      <td>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {agencyRows.length > 0 && (
                <>
                  <h2 style={{ fontSize: 22, margin: "40px 0 18px" }}>取扱店</h2>
                  <table className="spec-table">
                    <tbody>
                      {agencyRows.map((row) => (
                        <tr key={row.label}>
                          <th>{row.label}</th>
                          <td>{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </div>

            {/* 右：価格・支払い目安・問い合わせ */}
            <aside className="detail-side">
              {property.isMemberOnly && (
                <span className="badge badge-member" style={{ display: "inline-block", marginBottom: 10 }}>
                  会員限定
                </span>
              )}
              <p className="detail-side__price">
                {priceMan.toLocaleString()}
                <span>万円</span>
              </p>

              <div className="detail-side__loan">
                リノベ込み月々{" "}
                <strong>{Math.round(monthlyPayment).toLocaleString()}</strong> 円
                <small>
                  （物件{priceMan.toLocaleString()}万円＋リノベ
                  {(DEFAULT_RENOVATION_COST_YEN / MAN_YEN).toLocaleString()}万円／金利
                  {DEFAULT_ANNUAL_RATE_PERCENT}%・{DEFAULT_LOAN_YEARS}年で試算。
                  実際の借入条件により変わります）
                </small>
              </div>

              <Link href={`/property/${property.id}/contact`} className="btn btn-solid btn-block">
                見学予約・お問い合わせ
              </Link>

              <div className="detail-side__tel">
                <small>お電話でのお問い合わせ</small>
                <a href={COMPANY.telLink}>{COMPANY.tel}</a>
                <small>受付時間：{COMPANY.businessHours}</small>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
