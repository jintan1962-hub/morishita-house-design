import Link from "next/link";

export default function Footer() {
  const imgBase = "https://okazaki-bot.github.io/chuko-fudousan-design/";

  return (
    <>
      <div className="footerBnr">
        <Link href="#buy-form" id="buy">
          <img src={`${imgBase}assets/img/living.jpg`} alt="" />
          <span className="footerBnr__txt">
            <span className="footerBnr__en">FOR BUYER</span>
            <span className="footerBnr__ja">買いたい方へ</span>
            <span className="footerBnr__note">購入専用お問い合わせフォーム</span>
          </span>
        </Link>
        <Link href="#sell-form" id="sell">
          <img src={`${imgBase}assets/img/wide_green.jpg`} alt="" />
          <span className="footerBnr__txt">
            <span className="footerBnr__en">FOR SELLER</span>
            <span className="footerBnr__ja">売りたい方へ</span>
            <span className="footerBnr__note">無料査定・買取のご相談</span>
          </span>
        </Link>
      </div>

      <footer className="footer" id="company">
        <div className="container container--wide">
          <div className="footer__top">
            <div>
              <p className="footer__logo">
                <img src={`${imgBase}assets/img/top-logoB.svg`} alt="中古住宅×リノベーション RENOEL" />
              </p>
              <p className="footer__addr">
                リノベーションスタジオ RENOEL（リノエル）
                <br />
                〒385-0029 長野県佐久市佐久平駅南9-1
                <br />
                <a className="footer__tel" href="tel:0120556119">
                  0120-556-119
                </a>
                <span className="footer__hours">FAX 0267-77-7461 ／ 8:00〜17:00（お盆・年末年始を除く）</span>
              </p>
              <div className="footer__sns">
                <Link href="#instagram" aria-label="Instagram">
                  <img src={`${imgBase}assets/img/icon-instagramW.svg`} alt="" />
                </Link>
                <Link href="#facebook" aria-label="Facebook">
                  <img src={`${imgBase}assets/img/icon-facebookW.svg`} alt="" />
                </Link>
                <Link href="#youtube" aria-label="YouTube">
                  <img src={`${imgBase}assets/img/icon-youtubeW.svg`} alt="" />
                </Link>
              </div>
              <p className="footer__license">
                大井建設工業株式会社
                <br />
                宅地建物取引業免許：長野県知事（●）第●●●●号
                <br />
                建設業許可：長野県知事許可（般-●）第●●●●●号
              </p>
            </div>

            <div className="footer__navs">
              <div>
                <h3 className="footer__navTtl">物件を探す</h3>
                <ul>
                  <li><Link href="/properties">中古戸建て</Link></li>
                  <li><Link href="/properties">中古マンション</Link></li>
                  <li><Link href="/properties">土地</Link></li>
                  <li><Link href="/properties">新築</Link></li>
                  <li><Link href="/properties">事業用</Link></li>
                  <li><Link href="#area">エリアマップから探す</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="footer__navTtl">会員サービス</h3>
                <ul>
                  <li><Link href="/register">無料会員登録</Link></li>
                  <li><Link href="/login">会員ログイン</Link></li>
                  <li><Link href="#reserve">来店予約</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="footer__navTtl">リノベーション</h3>
                <ul>
                  <li><Link href="#renovation">リノベーション事例</Link></li>
                  <li><Link href="#modelhouse">モデルハウス</Link></li>
                  <li><Link href="#simulation">資金計画</Link></li>
                  <li><Link href="#voice">お客様の声</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="footer__navTtl">会社・その他</h3>
                <ul>
                  <li><Link href="#company-profile">会社案内</Link></li>
                  <li><Link href="#privacy">プライバシーポリシー</Link></li>
                  <li><Link href="/admin">管理者ログイン</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="footer__bottom">
            <p>© OOI KENSETSU KOGYO CO., LTD.</p>
            <p>掲載物件は情報更新予定日を過ぎたものを自動的に非公開としています。</p>
          </div>
        </div>
      </footer>
    </>
  );
}
