"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function HomePage() {
  const [searchTab, setSearchTab] = useState("kodate");
  const [areaView, setAreaView] = useState("areaView"); // areaView or distView

  // Simulation State
  const [price, setPrice] = useState(1380);
  const [reno, setReno] = useState(1518);
  const [down, setDown] = useState(0);
  const [rate, setRate] = useState(0.75);
  const [years, setYears] = useState(35);

  const monthlyPayment = useMemo(() => {
    const principal = (price + reno - down) * 10000;
    if (principal <= 0) return 0;
    const monthlyRate = rate / 100 / 12;
    const numPayments = years * 12;
    if (monthlyRate === 0) return Math.floor(principal / numPayments);
    const payment = Math.floor(
      (principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments))) /
        (Math.pow(1 + monthlyRate, numPayments) - 1)
    );
    return payment;
  }, [price, reno, down, rate, years]);

  const imgBase = "https://okazaki-bot.github.io/chuko-fudousan-design/";

  return (
    <div id="indexPage">
      <main>
        {/* ===================== ヒーロー ===================== */}
        <section className="hero">
          <div className="hero__bg">
            <img src={`${imgBase}assets/img/hero-living.jpg`} alt="リノベーションした住まいのリビング" />
          </div>
          <div className="hero__inner">
            <p className="hero__sub">佐久・小諸・御代田・軽井沢の中古住宅</p>
            <h1 className="hero__ttl">
              中古を買って、<br />
              <span className="accent">好きなように</span>つくり直す。
            </h1>
            <p className="hero__lead">
              古い家の性能とデザインは、リノベーションで変えられます。<br />
              注文住宅と別荘を手がけてきた大井建設工業が、物件探しから設計・工事・資金計画までワンストップでお手伝いします。
            </p>
            <ul className="hero__badges">
              <li className="hero__badge">物件＋リノベを一括ローンに</li>
              <li className="hero__badge">耐震・断熱の性能診断つき</li>
              <li className="hero__badge">自社施工だから工事費が明快</li>
            </ul>
          </div>
          <span className="hero__scroll" aria-hidden="true">
            SCROLL
          </span>
        </section>

        {/* ===================== 物件検索 ===================== */}
        <section className="container container--wide" aria-labelledby="searchTtl">
          <h2 id="searchTtl" className="visually-hidden">
            物件を検索する
          </h2>
          <div className="searchBox">
            <div className="searchBox__head" role="tablist" aria-label="物件種別">
              {[
                { id: "kodate", label: "中古戸建て" },
                { id: "mansion", label: "中古マンション" },
                { id: "tochi", label: "土地" },
                { id: "shinchiku", label: "新築" },
                { id: "jigyo", label: "事業用" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  className="searchTab"
                  role="tab"
                  id={`tab-${tab.id}`}
                  aria-controls={`panel-${tab.id}`}
                  aria-selected={searchTab === tab.id}
                  type="button"
                  onClick={() => setSearchTab(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="searchBox__body">
              {/* 中古戸建て */}
              <div
                className="searchBox__panel"
                role="tabpanel"
                id="panel-kodate"
                aria-labelledby="tab-kodate"
                hidden={searchTab !== "kodate"}
              >
                <div className="searchRow">
                  <div className="searchRow__ttl">
                    エリア<span className="req">必須</span>
                  </div>
                  <div className="areaList">
                    {[
                      { name: "佐久市", count: 42 },
                      { name: "小諸市", count: 28 },
                      { name: "御代田町", count: 11 },
                      { name: "軽井沢町", count: 19 },
                      { name: "上田市", count: 35 },
                      { name: "東御市", count: 9 },
                      { name: "立科町", count: 4 },
                      { name: "佐久穂町", count: 7 },
                    ].map((area, index) => (
                      <label key={area.name} className="chk">
                        <input type="checkbox" defaultChecked={index === 0} />
                        <span>{area.name}</span>
                        <span className="cnt">({area.count})</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="searchRow">
                  <div className="searchRow__ttl">価格</div>
                  <div className="selectWrap">
                    <select aria-label="価格下限">
                      <option>下限なし</option>
                      <option>500万円</option>
                      <option>1,000万円</option>
                      <option>1,500万円</option>
                      <option>2,000万円</option>
                    </select>
                    <span>〜</span>
                    <select aria-label="価格上限">
                      <option>上限なし</option>
                      <option>1,000万円</option>
                      <option>1,500万円</option>
                      <option>2,000万円</option>
                      <option>3,000万円</option>
                    </select>
                  </div>
                </div>
                <div className="searchRow">
                  <div className="searchRow__ttl">間取り</div>
                  <div className="areaList">
                    <label className="chk">
                      <input type="checkbox" />
                      <span>2LDK以上</span>
                    </label>
                    <label className="chk">
                      <input type="checkbox" defaultChecked />
                      <span>3LDK以上</span>
                    </label>
                    <label className="chk">
                      <input type="checkbox" />
                      <span>4LDK以上</span>
                    </label>
                    <label className="chk">
                      <input type="checkbox" />
                      <span>5LDK以上</span>
                    </label>
                  </div>
                </div>
                <div className="searchRow">
                  <div className="searchRow__ttl">学区で探す</div>
                  <div className="selectWrap">
                    <select aria-label="小学校区">
                      <option>小学校区を選ぶ</option>
                      <option>佐久市立中込小学校</option>
                      <option>佐久市立岩村田小学校</option>
                      <option>軽井沢町立軽井沢中部小学校</option>
                    </select>
                    <select aria-label="中学校区">
                      <option>中学校区を選ぶ</option>
                      <option>佐久市立浅間中学校</option>
                      <option>佐久市立野沢中学校</option>
                    </select>
                  </div>
                </div>
                <div className="searchRow">
                  <div className="searchRow__ttl">こだわり条件</div>
                  <div className="areaList">
                    {[
                      "リノベーションプラン付き",
                      "耐震診断済み",
                      "駐車2台以上",
                      "南向き",
                      "土地50坪以上",
                      "ペット可",
                    ].map((cond) => (
                      <label key={cond} className="chk">
                        <input type="checkbox" />
                        <span>{cond}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* 他タブ（プレースホルダー） */}
              {["mansion", "tochi", "shinchiku", "jigyo"].map((id) => (
                <div
                  key={id}
                  className="searchBox__panel"
                  role="tabpanel"
                  id={`panel-${id}`}
                  aria-labelledby={`tab-${id}`}
                  hidden={searchTab !== id}
                >
                  <p className="p-10 text-center text-gray-500">
                    {id === "mansion" && "中古マンションの検索条件を表示します"}
                    {id === "tochi" && "土地の検索条件を表示します"}
                    {id === "shinchiku" && "新築の検索条件を表示します"}
                    {id === "jigyo" && "事業用の検索条件を表示します"}
                  </p>
                </div>
              ))}
            </div>

            <div className="searchBox__foot">
              <p className="hit">
                現在の条件で <strong>42</strong> 件
              </p>
              <Link className="btn btn--fill" href="/properties">
                この条件で物件を見る
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== エリアから探す ===================== */}
        <section className="sec sec--gray" id="area">
          <div className="container container--wide">
            <h2 className="secTtl">
              <span className="en">AREA</span>
              <span className="ja">エリア・物件分布から探す</span>
            </h2>
            <p className="leadTxt">
              佐久市・小諸市・軽井沢町を中心に、東信エリアの中古住宅をお預かりしています。
              <br />
              市町ごとの件数で見るか、地図上の物件分布で見るかを切り替えられます。
            </p>

            <div
              className="planTabs"
              role="tablist"
              aria-label="地図の表示切り替え"
              style={{ justifyContent: "center" }}
            >
              <button
                className="planTab"
                role="tab"
                id="tab-areaView"
                aria-controls="panel-areaView"
                aria-selected={areaView === "areaView"}
                type="button"
                onClick={() => setAreaView("areaView")}
              >
                エリアから探す
              </button>
              <button
                className="planTab"
                role="tab"
                id="tab-distView"
                aria-controls="panel-distView"
                aria-selected={areaView === "distView"}
                type="button"
                onClick={() => setAreaView("distView")}
              >
                物件分布から探す
              </button>
            </div>

            <div
              className="areaMap"
              role="tabpanel"
              id="panel-areaView"
              aria-labelledby="tab-areaView"
              hidden={areaView !== "areaView"}
            >
              <svg viewBox="0 0 800 540" role="img" aria-labelledby="areaMapTtl areaMapDesc">
                <title id="areaMapTtl">東信エリアの物件所在地マップ</title>
                <desc id="areaMapDesc">
                  佐久市・小諸市・軽井沢町・御代田町・上田市・東御市・立科町・佐久穂町の位置関係を示した模式図です。
                </desc>

                {/* 上田市 */}
                <Link href="/properties" aria-label="上田市の物件 55件">
                  <polygon className="areaMap__region" points="40,152 122,88 196,104 202,190 150,252 58,226" />
                  <text className="areaMap__name" x="120" y="158">
                    上田市
                  </text>
                  <text className="areaMap__cnt" x="120" y="180">
                    55件
                  </text>
                </Link>

                {/* 東御市 */}
                <Link href="/properties" aria-label="東御市の物件 15件">
                  <polygon className="areaMap__region" points="196,104 300,94 316,176 256,236 202,190" />
                  <text className="areaMap__name" x="253" y="158">
                    東御市
                  </text>
                  <text className="areaMap__cnt" x="253" y="180">
                    15件
                  </text>
                </Link>

                {/* 小諸市 */}
                <Link href="/properties" aria-label="小諸市の物件 44件">
                  <polygon
                    className="areaMap__region areaMap__region--primary"
                    points="300,94 400,80 436,148 422,214 330,226 316,176"
                  />
                  <text className="areaMap__name" x="371" y="150">
                    小諸市
                  </text>
                  <text className="areaMap__cnt" x="371" y="172">
                    44件
                  </text>
                </Link>

                {/* 御代田町 */}
                <Link href="/properties" aria-label="御代田町の物件 20件">
                  <polygon className="areaMap__region" points="400,80 505,72 528,130 500,196 428,208 436,148" />
                  <text className="areaMap__name" x="466" y="132">
                    御代田町
                  </text>
                  <text className="areaMap__cnt" x="466" y="154">
                    20件
                  </text>
                </Link>

                {/* 軽井沢町 */}
                <Link href="/properties" aria-label="軽井沢町の物件 68件">
                  <polygon
                    className="areaMap__region areaMap__region--primary"
                    points="505,72 642,58 732,120 746,242 660,322 562,292 512,210 500,196 528,130"
                  />
                  <text className="areaMap__name" x="624" y="192">
                    軽井沢町
                  </text>
                  <text className="areaMap__cnt" x="624" y="214">
                    68件
                  </text>
                </Link>

                {/* 立科町 */}
                <Link href="/properties" aria-label="立科町の物件 8件">
                  <polygon className="areaMap__region" points="150,252 256,236 270,322 200,366 120,332" />
                  <text className="areaMap__name" x="197" y="298">
                    立科町
                  </text>
                  <text className="areaMap__cnt" x="197" y="320">
                    8件
                  </text>
                </Link>

                {/* 佐久市 */}
                <Link href="/properties" aria-label="佐久市の物件 82件">
                  <polygon
                    className="areaMap__region areaMap__region--primary"
                    points="256,236 330,226 422,214 500,196 512,210 562,292 522,382 402,412 302,392 270,322"
                  />
                  <text className="areaMap__name" x="398" y="308">
                    佐久市
                  </text>
                  <text className="areaMap__cnt" x="398" y="330">
                    82件
                  </text>
                </Link>

                {/* 佐久穂町 */}
                <Link href="/properties" aria-label="佐久穂町の物件 5件">
                  <polygon className="areaMap__region" points="302,392 402,412 462,472 380,502 280,472 256,416" />
                  <text className="areaMap__name" x="360" y="450">
                    佐久穂町
                  </text>
                  <text className="areaMap__cnt" x="360" y="472">
                    5件
                  </text>
                </Link>

                {/* 北陸新幹線と主要駅 */}
                <polyline className="areaMap__rail" points="650,126 540,182 404,252 300,218 190,190 96,158" />
                <circle className="areaMap__station" cx="650" cy="126" r="7" />
                <text className="areaMap__stationName" x="664" y="120">
                  軽井沢駅
                </text>
                <circle className="areaMap__station" cx="404" cy="252" r="7" />
                <text className="areaMap__stationName" x="416" y="246">
                  佐久平駅
                </text>
              </svg>

              <ul className="areaMap__legend">
                <li>
                  <span className="sw sw--primary"></span>主要エリア
                </li>
                <li>
                  <span className="sw sw--sub"></span>その他の対応エリア
                </li>
                <li>
                  <span className="sw sw--rail"></span>北陸新幹線
                </li>
                <li>
                  <span className="sw sw--station"></span>新幹線駅
                </li>
              </ul>
              <p className="areaMap__note">
                ※ 位置関係を示す模式図です。実際の行政区域の形状・面積とは異なります。件数は一般公開＋会員限定の合計です。
              </p>
            </div>

            {/* 物件分布ビュー */}
            <div
              className="distMap"
              role="tabpanel"
              id="panel-distView"
              aria-labelledby="tab-distView"
              hidden={areaView !== "distView"}
            >
              <svg viewBox="0 0 800 540" role="img" aria-labelledby="distMapTtl distMapDesc">
                <title id="distMapTtl">東信エリアの物件分布地図</title>
                <g aria-hidden="true">
                  <polygon className="distMap__region" points="40,152 122,88 196,104 202,190 150,252 58,226" />
                  <polygon className="distMap__region" points="196,104 300,94 316,176 256,236 202,190" />
                  <polygon className="distMap__region" points="300,94 400,80 436,148 422,214 330,226 316,176" />
                  <polygon className="distMap__region" points="400,80 505,72 528,130 500,196 428,208 436,148" />
                  <polygon
                    className="distMap__region"
                    points="505,72 642,58 732,120 746,242 660,322 562,292 512,210 500,196 528,130"
                  />
                  <polygon className="distMap__region" points="150,252 256,236 270,322 200,366 120,332" />
                  <polygon
                    className="distMap__region"
                    points="256,236 330,226 422,214 500,196 512,210 562,292 522,382 402,412 302,392 270,322"
                  />
                  <polygon className="distMap__region" points="302,392 402,412 462,472 380,502 280,472 256,416" />
                  <polyline className="distMap__rail" points="650,126 540,182 404,252 300,218 190,190 96,158" />
                </g>

                {/* 一般公開物件：価格ピン */}
                <Link className="pin" href="/properties" transform="translate(318,282)">
                  <path className="pin__tail" d="M0,0 -7,-11 7,-11Z" />
                  <rect className="pin__bubble" x="-40" y="-35" width="80" height="24" rx="12" />
                  <text className="pin__txt" y="-18">
                    1,380万
                  </text>
                </Link>
                <Link className="pin" href="/properties" transform="translate(600,170)">
                  <path className="pin__tail" d="M0,0 -7,-11 7,-11Z" />
                  <rect className="pin__bubble" x="-40" y="-35" width="80" height="24" rx="12" />
                  <text className="pin__txt" y="-18">
                    2,480万
                  </text>
                </Link>
              </svg>

              <ul className="areaMap__legend">
                <li>
                  <span className="sw sw--pin"></span>一般公開物件（価格を表示）
                </li>
                <li>
                  <span className="sw sw--approx"></span>会員限定物件（おおよその範囲）
                </li>
                <li>
                  <span className="sw sw--rail"></span>北陸新幹線
                </li>
              </ul>
            </div>

            <ul className="areaLinks">
              <li>
                <Link className="is-primary" href="/properties">
                  佐久市<span className="cnt">82件</span>
                </Link>
              </li>
              <li>
                <Link className="is-primary" href="/properties">
                  小諸市<span className="cnt">44件</span>
                </Link>
              </li>
              <li>
                <Link className="is-primary" href="/properties">
                  軽井沢町<span className="cnt">68件</span>
                </Link>
              </li>
              <li>
                <Link href="/properties">
                  御代田町<span className="cnt">20件</span>
                </Link>
              </li>
              <li>
                <Link href="/properties">
                  上田市<span className="cnt">55件</span>
                </Link>
              </li>
              <li>
                <Link href="/properties">
                  東御市<span className="cnt">15件</span>
                </Link>
              </li>
              <li>
                <Link href="/properties">
                  立科町<span className="cnt">8件</span>
                </Link>
              </li>
              <li>
                <Link href="/properties">
                  佐久穂町<span className="cnt">5件</span>
                </Link>
              </li>
            </ul>
          </div>
        </section>

        {/* ===================== 新着物件 ===================== */}
        <section className="sec" id="newarrival">
          <div className="container container--wide">
            <h2 className="secTtl">
              <span className="en">NEW ARRIVAL</span>
              <span className="ja">新着物件</span>
            </h2>
            <p className="leadTxt">
              毎日更新しています。物件価格の下に出ている金額は、
              <strong>リノベーション費用まで含めた月々のお支払い目安</strong>です。
            </p>

            <div className="cardGrid">
              <Link className="propCard" href="/properties">
                <div className="propCard__thumb">
                  <img src={`${imgBase}assets/img/saku-lqh-thm.jpg`} alt="佐久市の中古戸建て" />
                  <div className="propCard__labels">
                    <span className="label label--new">NEW</span>
                  </div>
                </div>
                <div className="propCard__body">
                  <p className="propCard__cat">中古戸建て／佐久市</p>
                  <h3 className="propCard__ttl">佐久市中込　4LDK　南面採光の平屋</h3>
                  <p className="propCard__price">
                    <span className="val num">1,380</span>
                    <span className="unit">万円</span>
                  </p>
                  <p className="propCard__loan">
                    リノベ込み月々 <strong>78,473</strong> 円<br />
                    <span>（物件1,380万円＋リノベ1,518万円／金利0.75%・35年）</span>
                  </p>
                  <dl className="propCard__spec">
                    <div>
                      <dt>間取り</dt>
                      <dd>4LDK</dd>
                    </div>
                    <div>
                      <dt>土地/建物</dt>
                      <dd>198.4㎡ / 105.6㎡</dd>
                    </div>
                    <div>
                      <dt>築年月</dt>
                      <dd>1996年5月</dd>
                    </div>
                    <div>
                      <dt>最寄り</dt>
                      <dd>JR中込駅 徒歩12分</dd>
                    </div>
                  </dl>
                </div>
              </Link>

              <Link className="propCard" href="/properties">
                <div className="propCard__thumb">
                  <img src={`${imgBase}assets/img/miyota-lqh-thm.jpg`} alt="御代田町の中古戸建て" />
                  <div className="propCard__labels">
                    <span className="label label--new">NEW</span>
                    <span className="label label--price-down">価格変更</span>
                  </div>
                </div>
                <div className="propCard__body">
                  <p className="propCard__cat">中古戸建て／御代田町</p>
                  <h3 className="propCard__ttl">御代田町馬瀬口　5LDK　浅間山を望む高台</h3>
                  <p className="propCard__price">
                    <span className="val num">1,780</span>
                    <span className="unit">万円</span>
                    <span className="before num">1,980万円</span>
                  </p>
                  <p className="propCard__loan">
                    リノベ込み月々 <strong>89,650</strong> 円<br />
                    <span>（物件1,780万円＋リノベ1,480万円／金利0.75%・35年）</span>
                  </p>
                  <dl className="propCard__spec">
                    <div>
                      <dt>間取り</dt>
                      <dd>5LDK</dd>
                    </div>
                    <div>
                      <dt>土地/建物</dt>
                      <dd>264.0㎡ / 128.2㎡</dd>
                    </div>
                    <div>
                      <dt>築年月</dt>
                      <dd>1989年11月</dd>
                    </div>
                    <div>
                      <dt>最寄り</dt>
                      <dd>しなの鉄道 御代田駅 車6分</dd>
                    </div>
                  </dl>
                </div>
              </Link>

              <Link className="propCard propCard--locked" href="/register">
                <div className="propCard__thumb">
                  <img src={`${imgBase}assets/img/t_thm.jpg`} alt="会員限定公開の物件" />
                  <div className="propCard__labels">
                    <span className="label label--member">会員限定</span>
                  </div>
                </div>
                <div className="propCard__body">
                  <p className="propCard__cat">中古戸建て／軽井沢町</p>
                  <h3 className="propCard__ttl">軽井沢町　4LDK　林間の平屋（詳細は会員限定）</h3>
                  <p className="propCard__price">
                    <span className="val num">2,480</span>
                    <span className="unit">万円</span>
                  </p>
                  <dl className="propCard__spec">
                    <div>
                      <dt>所在地</dt>
                      <dd className="masked">–</dd>
                    </div>
                    <div>
                      <dt>間取り</dt>
                      <dd>4LDK</dd>
                    </div>
                    <div>
                      <dt>土地/建物</dt>
                      <dd className="masked">–</dd>
                    </div>
                    <div>
                      <dt>築年月</dt>
                      <dd>1998年（推定）</dd>
                    </div>
                  </dl>
                  <p className="lockNote">
                    この物件は<strong>無料会員限定</strong>
                    で公開しています。所在地・写真・図面は会員登録後にご覧いただけます。
                  </p>
                </div>
              </Link>
            </div>

            <div className="btnWrap">
              <Link className="btn" href="/properties">
                新着物件をもっと見る
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== 3段階公開レベル ===================== */}
        <section className="sec sec--gray" id="membership">
          <div className="container container--wide">
            <h2 className="secTtl">
              <span className="en">MEMBERSHIP</span>
              <span className="ja">物件情報の3つの公開レベル</span>
            </h2>
            <p className="leadTxt">
              流通している中古住宅のうち、Webで一般公開できるのはごく一部です。
              <br />
              当社では公開レベルを3段階に分けて、無料会員のお客様・ご来店のお客様に順にお見せしています。
            </p>

            <div className="tierWrap">
              <div className="tier tier--1">
                <p className="tier__step">LEVEL 01</p>
                <h3 className="tier__ttl">一般公開</h3>
                <p className="tier__cnt">
                  <strong className="num">84</strong> 件
                </p>
                <p className="tier__txt">
                  どなたでもご覧いただける物件です。所在地・写真・間取り図・リノベ込みの月々支払いまで公開しています。
                </p>
              </div>
              <div className="tier tier--2">
                <p className="tier__step">LEVEL 02</p>
                <h3 className="tier__ttl">会員限定公開</h3>
                <p className="tier__cnt">
                  <strong className="num">213</strong> 件
                </p>
                <p className="tier__txt">
                  無料会員登録をされた方だけにお見せする物件です。ご希望条件を登録いただくと、合致する新着物件をメールでお知らせします。
                </p>
              </div>
              <div className="tier tier--3">
                <p className="tier__step">LEVEL 03</p>
                <h3 className="tier__ttl">店舗公開</h3>
                <p className="tier__cnt">
                  <strong className="num">1,240</strong> 件
                </p>
                <p className="tier__txt">
                  売主さまのご事情でWeb掲載ができない物件です。RENOELの店舗にお越しいただいた方にのみ、直接ご案内しています。
                </p>
              </div>
            </div>

            <div className="btnWrap">
              <Link className="btn btn--pink btn--lg" href="/register">
                無料会員登録で会員限定物件を見る
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== 資金計画シミュレーション ===================== */}
        <section className="sec" id="simulation">
          <div className="container container--wide">
            <h2 className="secTtl">
              <span className="en">SIMULATION</span>
              <span className="ja">資金計画シミュレーション</span>
            </h2>
            <p className="leadTxt">
              中古住宅は「物件価格」だけでは判断できません。
              <strong>物件＋リノベーション費用を1本のローンにまとめた</strong>月々のお支払いで比べてください。
            </p>

            <div className="simWrap">
              <div className="simForm">
                <div className="simForm__row">
                  <label htmlFor="simPrice">物件価格</label>
                  <span className="val">{price} 万円</span>
                  <input
                    type="range"
                    id="simPrice"
                    min="300"
                    max="6000"
                    step="10"
                    value={price}
                    onChange={(e) => setPrice(Number(e.target.value))}
                  />
                </div>
                <div className="simForm__row">
                  <label htmlFor="simReno">リノベーション費用</label>
                  <span className="val">{reno} 万円</span>
                  <input
                    type="range"
                    id="simReno"
                    min="0"
                    max="3000"
                    step="1"
                    value={reno}
                    onChange={(e) => setReno(Number(e.target.value))}
                  />
                </div>
                <div className="simForm__row">
                  <label htmlFor="simDown">自己資金（頭金）</label>
                  <span className="val">{down} 万円</span>
                  <input
                    type="range"
                    id="simDown"
                    min="0"
                    max="2000"
                    step="10"
                    value={down}
                    onChange={(e) => setDown(Number(e.target.value))}
                  />
                </div>
                <div className="simForm__row">
                  <label htmlFor="simRate">金利（年）</label>
                  <span className="val">{rate} ％</span>
                  <input
                    type="range"
                    id="simRate"
                    min="0.3"
                    max="3"
                    step="0.05"
                    value={rate}
                    onChange={(e) => setRate(Number(e.target.value))}
                  />
                </div>
                <div className="simForm__row">
                  <label htmlFor="simYears">返済期間</label>
                  <span className="val">{years} 年</span>
                  <input
                    type="range"
                    id="simYears"
                    min="10"
                    max="40"
                    step="1"
                    value={years}
                    onChange={(e) => setYears(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="simResult">
                <p className="simResult__label">月々のお支払い（元利均等・ボーナス払いなし）</p>
                <p className="simResult__val">
                  <span>{monthlyPayment.toLocaleString()}</span>
                  <span className="unit"> 円</span>
                </p>
                <p className="simResult__note">
                  金利は当社提携金融機関の変動金利を想定した参考値です。
                  <br />
                  実際の借入可能額・適用金利はご年収や審査結果により異なります。
                </p>
                <div className="simResult__break">
                  <div>
                    <span>借入総額</span>
                    <span>{(price + reno - down).toLocaleString()} 万円</span>
                  </div>
                  <div>
                    <span>返済期間</span>
                    <span>{years} 年</span>
                  </div>
                  <div>
                    <span>適用金利</span>
                    <span>{rate} ％</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="btnWrap">
              <Link className="btn" href="/simulation">
                資金計画の考え方を詳しく見る
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== リノベーション事例 ===================== */}
        <section className="sec sec--gray" id="renovation">
          <div className="container container--wide">
            <h2 className="secTtl">
              <span className="en">RENOVATION</span>
              <span className="ja">リノベーション事例</span>
            </h2>
            <p className="leadTxt">
              実際に中古住宅をご購入いただき、当社で設計・施工した事例です。物件価格・工事費・月々のお支払いまで公開しています。
            </p>

            <div className="cardGrid">
              {[
                {
                  id: 1,
                  cat: "佐久市／戸建て",
                  ttl: "築28年をフルリノベーション、耐震等級3と断熱等級6へ",
                  price: "1,380万円",
                  cost: "1,518万円",
                  monthly: "78,473",
                  imgBefore: "assets/img/saku-lqh-thm.jpg",
                  imgAfter: "assets/img/living.jpg",
                },
                {
                  id: 2,
                  cat: "御代田町／戸建て",
                  ttl: "間仕切りを取り払い、浅間山を眺める大きな一室に",
                  price: "1,780万円",
                  cost: "1,480万円",
                  monthly: "89,650",
                  imgBefore: "assets/img/miyota-lqh-thm.jpg",
                  imgAfter: "assets/img/kitchen.jpg",
                },
                {
                  id: 3,
                  cat: "軽井沢町／別荘",
                  ttl: "古い別荘を、通年で暮らせる家に",
                  price: "2,480万円",
                  cost: "1,960万円",
                  monthly: "120,380",
                  imgBefore: "assets/img/t_thm.jpg",
                  imgAfter: "assets/img/gallery.jpg",
                },
              ].map((item) => (
                <Link key={item.id} className="mediaCard" href={`/cases`}>
                  <div className="mediaCard__thumb">
                    <div className="caseBA">
                      <figure>
                        <img src={`${imgBase}${item.imgBefore}`} alt="BEFORE" />
                        <figcaption>BEFORE</figcaption>
                      </figure>
                      <figure>
                        <img src={`${imgBase}${item.imgAfter}`} alt="AFTER" />
                        <figcaption>AFTER</figcaption>
                      </figure>
                    </div>
                    <span className="mediaCard__cat">{item.cat}</span>
                  </div>
                  <h3 className="mediaCard__ttl">{item.ttl}</h3>
                  <dl className="mediaCard__data">
                    <div>
                      <dt>物件価格</dt>
                      <dd>{item.price}</dd>
                    </div>
                    <div>
                      <dt>工事費</dt>
                      <dd>{item.cost}</dd>
                    </div>
                    <div>
                      <dt>月々の支払い</dt>
                      <dd>
                        <strong className="num">{item.monthly}</strong>円
                      </dd>
                    </div>
                  </dl>
                </Link>
              ))}
            </div>

            <div className="btnWrap">
              <Link className="btn" href="/cases">
                リノベーション事例をもっと見る
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== モデルハウス・店舗 ===================== */}
        <section className="sec" id="showroom">
          <div className="container container--wide">
            <h2 className="secTtl">
              <span className="en">SHOWROOM</span>
              <span className="ja">リノベーションモデルハウス・店舗案内</span>
            </h2>
            <p className="leadTxt">
              図面や写真ではわからない「中古のリノベーション」を、実際に建った家で体感してください。長野県最大級のリノベーション専門店です。
            </p>

            <div className="shopList">
              <Link className="shop" href="/showroom">
                <div className="shop__thumb">
                  <img src={`${imgBase}assets/img/modelhouse_bnr.png`} alt="リノベーションモデルハウス" />
                </div>
                <div className="shop__body">
                  <h3 className="shop__ttl">
                    リノベーションモデルハウス<span className="sub">MODEL HOUSE ／ 佐久市</span>
                  </h3>
                  <p className="shop__addr">
                    築30年の住宅をフルリノベーションした常設モデルハウス。断熱・耐震の改修部分も見学いただけます。
                    <br />
                    見学は予約制（当日可）
                  </p>
                </div>
              </Link>

              <Link className="shop" href="/showroom">
                <div className="shop__thumb">
                  <img src={`${imgBase}assets/img/waiting_room.jpg`} alt="リノベーションスタジオRENOEL" />
                </div>
                <div className="shop__body">
                  <h3 className="shop__ttl">
                    リノベーションスタジオ RENOEL<span className="sub">STUDIO ／ 佐久平駅南</span>
                  </h3>
                  <p className="shop__addr">
                    〒385-0029 長野県佐久市佐久平駅南9-1
                    <br />
                    8:00〜17:00（お盆・年末年始を除く）
                  </p>
                  <p className="shop__tel">0120-556-119</p>
                </div>
              </Link>

              <Link className="shop" href="/showroom">
                <div className="shop__thumb">
                  <img src={`${imgBase}assets/img/Entrance_approach.jpg`} alt="大井建設工業株式会社 本社" />
                </div>
                <div className="shop__body">
                  <h3 className="shop__ttl">
                    大井建設工業株式会社 本社<span className="sub">HEAD OFFICE ／ 御代田町</span>
                  </h3>
                  <p className="shop__addr">
                    〒389-0207 長野県北佐久郡御代田町馬瀬口1670-74
                    <br />
                    FAX 0267-77-7461
                  </p>
                </div>
              </Link>
            </div>

            <div className="btnWrap">
              <Link className="btn btn--fill" href="#reserve">
                来店・見学のご予約
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== お客様の声 ===================== */}
        <section className="sec sec--gray" id="voice">
          <div className="container container--wide">
            <h2 className="secTtl">
              <span className="en">VOICE</span>
              <span className="ja">お客様の声</span>
            </h2>

            <div className="cardGrid">
              {[
                {
                  id: 1,
                  who: "佐久市 A様ご家族\n30代・4人家族",
                  ttl: "「新築だと届かなかった立地に住めました」",
                  txt: "学区を変えたくなくて、この地区にこだわっていました。新築の土地は出てこないと言われていたところ、会員限定の物件を紹介してもらえて。中身は全部つくり直したので、住み心地は新築と変わりません。",
                  img: "assets/img/living_2.jpg",
                },
                {
                  id: 2,
                  who: "御代田町 B様ご夫婦\n40代・2人暮らし",
                  ttl: "「物件と工事の窓口が1つで助かった」",
                  txt: "不動産屋さんと工務店を別々に回っていた頃は、話が噛み合わなくて疲れました。最初から「この物件ならこの工事でいくら」と出てきたので、迷わずに決められました。",
                  img: "assets/img/kitchen.jpg",
                },
                {
                  id: 3,
                  who: "軽井沢町 C様\n50代・別荘から定住へ",
                  ttl: "「寒くて使えなかった別荘が、冬も暖かい家に」",
                  txt: "夏だけの家でしたが、断熱と窓を全部やり直してもらって、今は冬もこちらで過ごしています。改修前の性能を数値で見せてもらえたのが決め手でした。",
                  img: "assets/img/gallery_2.jpg",
                },
              ].map((item) => (
                <div key={item.id} className="voiceCard">
                  <div className="voiceCard__head">
                    <div className="voiceCard__ph">
                      <img src={`${imgBase}${item.img}`} alt="" />
                    </div>
                    <p className="voiceCard__who" style={{ whiteSpace: "pre-wrap" }}>
                      {item.who}
                    </p>
                  </div>
                  <h3 className="voiceCard__ttl">{item.ttl}</h3>
                  <p className="voiceCard__txt">{item.txt}</p>
                </div>
              ))}
            </div>

            <div className="btnWrap">
              <Link className="btn" href="/voice">
                お客様の声をもっと見る
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== お役立ちコラム ===================== */}
        <section className="sec" id="column">
          <div className="container container--wide">
            <h2 className="secTtl">
              <span className="en">COLUMN</span>
              <span className="ja">お役立ちコラム</span>
            </h2>
            <p className="leadTxt">中古住宅の購入とリノベーションで、知っておくと得をするお金と制度の話です。</p>

            <div className="cardGrid--4 cardGrid">
              {[
                {
                  id: 1,
                  cat: "税金・制度",
                  ttl: "中古住宅でも住宅ローン控除は使える？条件を整理しました",
                  date: "2026.07.20",
                  img: "assets/img/wide_green.jpg",
                },
                {
                  id: 2,
                  cat: "住宅ローン",
                  ttl: "物件費用とリノベ費用を1本にまとめる「一体型ローン」の使い方",
                  date: "2026.07.08",
                  img: "assets/img/gallery.jpg",
                },
                {
                  id: 3,
                  cat: "物件探し",
                  ttl: "内見で必ず見るべき7か所。リノベできる家・できない家の境目",
                  date: "2026.06.28",
                  img: "assets/img/living.jpg",
                },
                {
                  id: 4,
                  cat: "補助金",
                  ttl: "長期優良住宅化リフォーム推進事業を使うと、いくら戻るのか",
                  date: "2026.06.15",
                  img: "assets/img/Entrance_approach.jpg",
                },
              ].map((item) => (
                <Link key={item.id} className="mediaCard" href="/information">
                  <div className="mediaCard__thumb">
                    <img src={`${imgBase}${item.img}`} alt="" />
                    <span className="mediaCard__cat">{item.cat}</span>
                  </div>
                  <h3 className="mediaCard__ttl">{item.ttl}</h3>
                  <p className="mediaCard__meta">{item.date}</p>
                </Link>
              ))}
            </div>

            <div className="btnWrap">
              <Link className="btn" href="/information">
                お役立ちコラムをもっと見る
              </Link>
            </div>
          </div>
        </section>

        {/* ===================== お知らせ／ブログ ===================== */}
        <section className="sec sec--tight" id="news">
          <div className="container container--wide">
            <div className="newsCols">
              <div className="newsCol">
                <h2 className="newsCol__ttl">
                  <span className="en">NEWS</span>
                  <span className="ja">お知らせ</span>
                </h2>
                <ul className="postList">
                  <li>
                    <Link href="/information">
                      <time dateTime="2026-06-17">2026.06.17</time>
                      <span className="ttl">
                        おかげさまで20年！大井のリフォーム「大感謝祭」開催決定！
                        <span className="cat">イベント</span>
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/information">
                      <time dateTime="2026-05-10">2026.05.10</time>
                      <span className="ttl">
                        【5/16（土）開催】第25回にこにこフェスティバル！<span className="cat">イベント</span>
                      </span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/information">
                      <time dateTime="2026-04-08">2026.04.08</time>
                      <span className="ttl">
                        4/26（日）空き家対策セミナー開催のお知らせ<span className="cat">セミナー</span>
                      </span>
                    </Link>
                  </li>
                </ul>
                <Link className="moreLink" href="/information">
                  新着情報一覧
                </Link>
              </div>

              <div className="newsCol">
                <h2 className="newsCol__ttl">
                  <span className="en">BLOG</span>
                  <span className="ja">スタッフブログ</span>
                </h2>
                <ul className="postList">
                  <li>
                    <Link href="/information">
                      <time dateTime="2026-03-23">2026.03.23</time>
                      <span className="ttl">4/26（日）「実家・空き家問題対策セミナー＆相談会」開催予定です。</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/information">
                      <time dateTime="2024-08-04">2024.08.04</time>
                      <span className="ttl">空き家管理サービスをはじめました</span>
                    </Link>
                  </li>
                  <li>
                    <Link href="/information">
                      <time dateTime="2024-03-10">2024.03.10</time>
                      <span className="ttl">フルリノベモデルハウスの見学会が無事に終わりました</span>
                    </Link>
                  </li>
                </ul>
                <Link className="moreLink" href="/information">
                  新着記事一覧
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ===================== 会員登録CTA ===================== */}
        <section className="memberCta" id="member-cta">
          <div className="memberCta__bg">
            <img src={`${imgBase}assets/img/gallery_2.jpg`} alt="" />
          </div>
          <div className="container container--wide memberCta__inner">
            <h2 className="memberCta__ttl">
              Web上の物件は、<span className="accent">全体の1割</span>ほどです。
            </h2>
            <p className="memberCta__lead">
              無料会員登録をしていただくと、会員限定の213件が見られるようになります。
              <br />
              ご希望の条件を登録しておけば、条件に合う新着物件を届いた順にメールでお知らせします。
            </p>
            <ul className="memberCta__merit">
              <li>
                会員限定
                <br />
                213件を公開
              </li>
              <li>
                合致物件の
                <br />
                お知らせメール
              </li>
              <li>
                間取り図・
                <br />
                資料のダウンロード
              </li>
              <li>
                リノベ費用込みの
                <br />
                見積り依頼
              </li>
            </ul>
            <div className="memberCta__btns">
              <Link className="btn btn--pink btn--lg" href="/register">
                無料会員登録はこちら
              </Link>
              <Link className="btn btn--white" href="/login">
                会員ログイン
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
