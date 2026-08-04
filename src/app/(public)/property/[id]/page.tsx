"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

// モックの物件データ (一覧ページと共通)
const mockProperties = [
  { id: 1, title: "青葉区 中古戸建", price: "2,980", priceNum: 29800000, area: "仙台市青葉区", disclosureLevel: 0, type: "中古一戸建て", address: "仙台市青葉区中山吉成1丁目", img: "assets/img/saku-lqh-thm.jpg" },
  { id: 2, title: "泉区 リノベ済マンション", price: "1,850", priceNum: 18500000, area: "仙台市泉区", disclosureLevel: 0, type: "中古マンション", address: "仙台市泉区泉中央", img: "assets/img/miyota-lqh-thm.jpg" },
  { id: 3, title: "【会員限定】太白区 未公開戸建", price: "3,200", priceNum: 32000000, area: "仙台市太白区", disclosureLevel: 1, type: "中古一戸建て", address: "仙台市太白区長町", img: "assets/img/t_thm.jpg" },
  { id: 4, title: "若林区 駅徒歩5分 マンション", price: "2,400", priceNum: 24000000, area: "仙台市若林区", disclosureLevel: 0, type: "中古マンション", address: "仙台市若林区卸町", img: "assets/img/living.jpg" },
  { id: 5, title: "【会員限定】宮城野区 収益物件", price: "4,500", priceNum: 45000000, area: "仙台市宮城野区", disclosureLevel: 1, type: "収益物件", address: "仙台市宮城野区榴岡", img: "assets/img/kitchen.jpg" },
];

const calculateMortgage = (principal: number, annualRate: number, years: number) => {
  const monthlyRate = annualRate / 12 / 100;
  const numberOfPayments = years * 12;
  if (monthlyRate === 0) return principal / numberOfPayments;
  return (
    (principal * monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
    (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
  );
};

export default function PropertyDetailPage() {
  const params = useParams();
  const id = Number(params.id);
  const { data: session, status } = useSession();
  
  const imgBase = "https://okazaki-bot.github.io/chuko-fudousan-design/";
  const property = mockProperties.find(p => p.id === id) || mockProperties[0];
  const isMemberOnly = property.disclosureLevel === 1;
  const isLoggedIn = !!session;
  const canView = !isMemberOnly || isLoggedIn;

  const annualRate = 0.75;
  const loanYears = 35;
  const renoPrice = 15180000;
  const totalLoanAmount = property.priceNum + renoPrice;
  const monthlyPayment = useMemo(() => calculateMortgage(totalLoanAmount, annualRate, loanYears), [totalLoanAmount]);

  if (status === "loading") {
    return <div className="min-h-[50vh] flex items-center justify-center">読み込み中...</div>;
  }

  if (!canView) {
    return (
      <>
        <div className="pageHead">
          <div className="pageHead__bg"><img src={`${imgBase}assets/img/gallery.jpg`} alt="" /></div>
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
              <button onClick={() => signIn()} className="btn btn--fill btn--lg" style={{ width: "100%" }}>ログインして詳細を見る</button>
              <Link href="/register" className="btn btn--pink btn--lg">無料会員登録はこちら</Link>
            </div>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
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
                <span className="label label--new">NEW</span>
                <span className="label label--member">{property.type}</span>
              </div>
              <h1 style={{ fontSize: "2.4rem", lineHeight: "1.4", fontWeight: "bold" }}>{property.title}</h1>
            </div>

            <div className="gallery">
              <div className="gallery__main">
                <img src={`${imgBase}${property.img}`} alt={property.title} />
              </div>
              <div className="gallery__thumbs">
                <button aria-current="true"><img src={`${imgBase}${property.img}`} alt="" /></button>
                <button><img src={`${imgBase}assets/img/living.jpg`} alt="" /></button>
                <button><img src={`${imgBase}assets/img/kitchen.jpg`} alt="" /></button>
                <button><img src={`${imgBase}assets/img/gallery.jpg`} alt="" /></button>
              </div>
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
                    <th>交通</th>
                    <td>最寄り駅 徒歩15分</td>
                  </tr>
                  <tr>
                    <th>間取り</th>
                    <td>4LDK</td>
                  </tr>
                  <tr>
                    <th>土地面積 / 建物面積</th>
                    <td>200.15m² / 125.40m²</td>
                  </tr>
                  <tr>
                    <th>築年月</th>
                    <td>2009年6月</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* 右側：価格・ローン・CTA */}
          <aside className="detailSide">
            <p className="detailSide__price">
              <span className="val">{property.price}</span>
              <span className="unit">万円</span>
            </p>

            <div className="detailSide__loan">
              リノベ込み月々 <strong className="num">{Math.round(monthlyPayment).toLocaleString()}</strong> 円<br />
              <span style={{ fontSize: "1.1rem", color: "var(--c-mute-dark)" }}>
                （物件{property.price}万円＋リノベ1,518万円／金利0.75%・35年）
              </span>
            </div>

            <div className="detailSide__btns">
              <Link href="#reserve" className="btn btn--fill btn--block">見学を予約する</Link>
              <Link href="#inquiry" className="btn btn--block">この物件について問い合わせる</Link>
            </div>

            <div className="detailSide__tel">
              <small>お電話でのお問い合わせ</small>
              <a className="num gothic" href="tel:0120556119">0120-556-119</a>
              <small>営業時間：8:00〜17:00</small>
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
