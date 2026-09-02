import Link from "next/link";
import { COMPANY } from "@/config/company";
import { AREAS, PROPERTY_TYPE, PROPERTY_TYPE_LABEL } from "@/config/property";
import { STAFF, CEO_MESSAGE, REASONS, MEMBER_MERITS } from "@/config/staff";
import { getHomeStats, emptyHomeStats } from "@/app/actions/homeStats";
import PropertySearchPanel from "@/components/PropertySearchPanel";
import AreaSearch from "./AreaSearch";
import NewArrivals from "./NewArrivals";
import { signInPath, AFTER_LOGIN_PATH } from "@/lib/authPaths";

/**
 * トップページ。
 *
 * デザインは jintan1962-hub.github.io/morishita-house-design/ の index.html を移植したもの。
 * デザイン案は「デザイン案（モックアップ）」として件数・物件・お客様の声を仮データで
 * 埋めていたが、ここでは**実データが取れるものだけ**を出している。
 * 取れないもの（お客様の声など）は、架空の内容を置かずに空の状態を出す（D-03）。
 *
 * サーバーコンポーネントにしているのは、件数をサーバーで数えてから描くため。
 * 数字が後から差し替わってレイアウトが飛ぶのを防ぐ。
 */
export const dynamic = "force-dynamic";

/**
 * 種別の並び順。設定ファイルの定義順（土地→一戸建て→マンション）ではなく、
 * 中古住宅専門店として探される順に並べる。
 */
const TYPE_TILE_ORDER = [PROPERTY_TYPE.HOUSE, PROPERTY_TYPE.MANSION, PROPERTY_TYPE.LAND];

export default async function HomePage() {
  const result = await getHomeStats();
  // 件数が取れなくてもページは出す。数字は0で、注記を出す。
  const stats = result.success ? result.data : await emptyHomeStats();
  const statsError = result.success ? "" : result.error;

  return (
    <>
      {/* ================= ヒーロー ================= */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-kicker">{COMPANY.areaLabel}　中古住宅専門店</div>
          <h1>
            ネットに出ている物件は、
            <br />
            姫路の中古住宅情報の<em>全部ではありません</em>。
          </h1>
          <p className="hero-lead">あなたにちょうどいい家は、まだネットに出ていないかもしれません。</p>
          <div className="sub">
            <p>
              家探しは、ホームページに掲載されている物件だけでは終わりません。販売準備中の物件や、
              公開前の新着物件、売主様のご希望により一般公開していない物件など、
              インターネットには掲載されない住まいもあります。
            </p>
            <p>
              さらに私たちは、「実家をどうしよう」「空き家をどう活かそう」といった住まいの終活相談を
              数多くお受けしています。そのため、売却が正式に決まる前の段階から
              住まいに関するご相談をいただくことも少なくありません。
            </p>
            <p>
              ご希望をお聞かせいただければ、公開・未公開を問わず、その時点でご紹介できる住まいの中から、
              できる限り条件に合うものをご提案します。
            </p>
          </div>
          <div className="hero-actions">
            <Link className="btn btn-solid" href="#search">
              物件を検索する
            </Link>
            <Link className="btn btn-line" href="/member">
              希望条件を登録する
            </Link>
          </div>

          {/* クイック検索。詳細検索と同じ /properties へ送る（D-20：入口は複数、処理は1つ） */}
          <form className="quicksearch" action="/properties" method="get">
            <h2 className="visually-hidden">かんたん物件検索</h2>
            <div className="qs-grid">
              <div className="field">
                <label htmlFor="qType">種別</label>
                <select id="qType" name="type" defaultValue="">
                  <option value="">指定なし</option>
                  {TYPE_TILE_ORDER.map((code) => (
                    <option key={code} value={code}>
                      {PROPERTY_TYPE_LABEL[code]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="qArea">エリア</label>
                <select id="qArea" name="city" defaultValue="">
                  <option value="">指定なし（全エリア）</option>
                  {AREAS.map((a) => (
                    <option key={a.cityCd} value={a.cityCd}>
                      {a.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="qPrice">価格の上限</label>
                <select id="qPrice" name="priceMax" defaultValue="">
                  <option value="">指定なし</option>
                  <option value="1000">〜1,000万円</option>
                  <option value="1500">〜1,500万円</option>
                  <option value="2000">〜2,000万円</option>
                  <option value="2500">〜2,500万円</option>
                </select>
              </div>
              <button type="submit" className="btn btn-solid">
                この条件で検索
              </button>
            </div>
          </form>

          <ul className="hero-stats">
            <li>
              <span className="num">{stats.total.toLocaleString()}</span>
              <span className="cap">掲載物件数</span>
            </li>
            <li>
              <span className="num">{stats.membersOnly.toLocaleString()}</span>
              <span className="cap">会員限定物件</span>
            </li>
            <li>
              <span className="num">{stats.newCount.toLocaleString()}</span>
              <span className="cap">直近30日の新着</span>
            </li>
            <li>
              <span className="num">{stats.areaCount}</span>
              <span className="cap">対応市区町村数</span>
            </li>
          </ul>
          {statsError && (
            <p className="note-line" style={{ textAlign: "center" }}>
              ※{statsError}
            </p>
          )}
        </div>
      </section>

      {/* ================= 種別タイル ================= */}
      <div className="wrap">
        <div className="type-tiles" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
          {/* デザイン案は5種別（新築一戸建て・事業用を含む）だったが、
              当システムが扱う種別は3つだけ（src/config/property.ts）。
              押しても該当0件になるタイルは置かない。 */}
          {TYPE_TILE_ORDER.map((code) => (
            <Link className="type-tile" key={code} href={`/properties?type=${code}`}>
              <TypeIcon code={code} />
              {PROPERTY_TYPE_LABEL[code]}
            </Link>
          ))}
        </div>
      </div>

      {/* ================= エリア別物件数 ================= */}
      <AreaSearch stats={stats} />

      {/* ================= 会員登録 ================= */}
      <section className="band band-alt" id="member">
        <div className="wrap">
          <div className="head-row">
            <div>
              <span className="eyebrow">Member Benefit</span>
              <h2>あなたに合う住まいが見つかったら、いち早くお知らせします。</h2>
            </div>
          </div>
          <p className="lead" style={{ margin: "0 0 34px" }}>
            会員登録では、ご希望のエリアやご予算、間取りなどを登録していただけます。
            新しくご紹介できる住まいがあれば、ご希望に近いお客様へ優先的にご案内いたします。
          </p>
          <div className="merit-grid">
            {MEMBER_MERITS.map((m, i) => (
              <div className="merit-card" key={m.title}>
                <div className="kicker">{String(i + 1).padStart(2, "0")}</div>
                <h3>{m.title}</h3>
                <p>{m.body}</p>
              </div>
            ))}
          </div>

          <div className="member-panel">
            <div className="member-login">
              <h3>すでに会員の方</h3>
              <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 14 }}>
                ログインすると、会員限定物件の価格・所在地・写真までご覧いただけます。
              </p>
              {/* ログインフォームはここに置かない。
                  認証は NextAuth のログイン画面が1箇所で担当する（D-20）。
                  ここに似たフォームを作ると、パスワードの入口が2つになる。 */}
              <Link
                className="btn btn-line btn-block"
                href={signInPath(AFTER_LOGIN_PATH)}
                style={{ marginTop: 20 }}
              >
                ログインする
              </Link>
            </div>
            <div className="member-register">
              <h3>はじめての方へ（無料会員登録）</h3>
              <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 14, marginBottom: 24 }}>
                家探しを続けるなら、待つだけではもったいない。
                理想の住まいとの出会いを広げるために、まずは無料会員登録をご利用ください。
              </p>
              <Link className="btn btn-gold btn-block" href="/member">
                無料で会員登録する
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 物件知識 ================= */}
      <section className="band" id="chishiki">
        <div className="wrap">
          <div className="head-row">
            <div>
              <span className="eyebrow">Knowledge</span>
              <h2>物件情報だけでは、わからない。</h2>
            </div>
          </div>
          <p className="lead" style={{ margin: "0 0 34px" }}>
            図面や資料に書かれていることだけでなく、この街で家をつくってきたプロの目線で、
            その家が本当に「買っていい家」かどうかを見立てます。
          </p>

          <div className="pro-layout">
            <div>
              <div className="pro-photo">
                <PersonIcon />
                <span style={{ fontSize: 12, color: "var(--ink-faint)", marginTop: 10 }}>
                  写真は準備中です
                </span>
              </div>
              <p style={{ fontSize: 12, color: "var(--gold)", marginTop: 14, marginBottom: 0 }}>
                {STAFF[0].role}
              </p>
              <p style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "4px 0 4px" }}>
                {STAFF[0].name}
              </p>
              <p style={{ fontSize: 12, color: "var(--ink-faint)", margin: 0 }}>
                {STAFF[0].certifications}
              </p>
            </div>

            <div>
              {CEO_MESSAGE.map((paragraph) => (
                <p key={paragraph} style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>
                  {paragraph}
                </p>
              ))}

              <div className="pro-points">
                <div className="pro-point">
                  <h4>建物の状態を診断</h4>
                  <p>図面と現地の両方から、傷み・構造・改修コストを見立てます。</p>
                </div>
                <div className="pro-point">
                  <h4>リフォーム費用まで含めて試算</h4>
                  <p>物件価格だけでなく、住めるようにするまでの総額で考えます。</p>
                </div>
                <div className="pro-point">
                  <h4>「買わない方がいい」も言う</h4>
                  <p>条件に合わなければ、正直にお伝えします。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 新着物件 ================= */}
      <NewArrivals />

      {/* ================= こだわり検索 ================= */}
      <section className="band band-alt" id="search">
        <div className="wrap">
          <div className="head-row">
            <div>
              <span className="eyebrow">Property Search</span>
              <h2>こだわり条件から物件を探す</h2>
            </div>
          </div>
          <PropertySearchPanel />
        </div>
      </section>

      {/* ================= 選ばれる理由 ================= */}
      <section className="band" id="service">
        <div className="wrap">
          <div className="head-row">
            <div>
              <span className="eyebrow">Why {COMPANY.brandNameEn}</span>
              <h2>{COMPANY.shortName}が選ばれる理由</h2>
            </div>
          </div>
          <div className="reason-grid">
            {REASONS.map((r) => (
              <div className="reason-card" key={r.title}>
                <CheckIcon />
                <h3>{r.title}</h3>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 実家・空き家クロスリンク ================= */}
      <section className="cross-section" id="jikka">
        <div className="wrap">
          <div className="cross-head">
            <span className="eyebrow">住まいの終活相談カウンター 兵庫</span>
            <h2>実家をどうしたいか、迷っている方へ。</h2>
            <p>
              「売る」か「残す」かも決まっていない段階からご相談いただけます。
              中古住宅として売り出す前に、片づけ・空き家管理・査定までまとめてサポートする姉妹窓口です。
            </p>
          </div>
          <div className="cross-grid">
            {[
              ["ワンストップ相談", "実家じまい全般をまとめて相談"],
              ["実家片づけ代行", "荷物整理・遺品整理も依頼可能"],
              ["空き家管理", "遠方からでも定期巡回で安心"],
              ["無料査定", "まずは概算価格をご相談ください"],
              ["買い取り", "売却期限がある方も直接買取"],
            ].map(([title, body]) => (
              <div className="cross-card" key={title}>
                <DocIcon />
                <h4>{title}</h4>
                <p>{body}</p>
              </div>
            ))}
          </div>
          <div className="cross-cta">
            <a
              className="btn btn-gold"
              href={COMPANY.legacySiteUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              住まいの終活相談カウンターへ
            </a>
            <span className="note">別サイト（m-house.co.jp）が新しいタブで開きます。</span>
          </div>
        </div>
      </section>

      {/* ================= スタッフ ================= */}
      <section className="band band-alt">
        <div className="wrap">
          <div className="head-row">
            <div>
              <span className="eyebrow">Staff</span>
              <h2>ご案内するスタッフ</h2>
            </div>
          </div>
          <div className="staff-grid">
            {STAFF.map((s) => (
              <div className="staff-card" key={s.name}>
                <div className="staff-photo">
                  <PersonIcon />
                </div>
                <p className="staff-role">{s.role}</p>
                <p className="staff-name">{s.name}</p>
                <p className="staff-cert">{s.certifications}</p>
                <p className="staff-msg">{s.message}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 相談窓口 ================= */}
      <section className="band" id="action">
        <div className="wrap">
          <div className="head-row">
            <div>
              <span className="eyebrow">Contact</span>
              <h2>まずは気軽にご相談ください</h2>
            </div>
          </div>
          <p className="lead" style={{ margin: "0 0 34px" }}>
            どれも無料です。「まだ買うと決めていない」段階のご相談も歓迎しています。
          </p>
          <div className="action-grid">
            <div className="action-card">
              <PhoneIcon />
              <h3>電話で相談</h3>
              <p>{COMPANY.businessHours}</p>
              <a className="btn btn-solid" href={COMPANY.telLink}>
                {COMPANY.tel}
              </a>
            </div>
            <div className="action-card">
              <ShopIcon />
              <h3>来店予約・アクセス</h3>
              <p>店舗でじっくり物件をご案内します。</p>
              <Link className="btn btn-line" href="/showroom">
                アクセスを見る
              </Link>
            </div>
            <div className="action-card">
              <MailIcon />
              <h3>会員登録して探す</h3>
              <p>会員限定物件を含めて、条件に合う住まいをお探しします。</p>
              <Link className="btn btn-gold" href="/member">
                無料会員登録
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* -------------------------------------------------------------------------
   アイコン。lucide-react を入れているが、ここでは線の太さと大きさを
   デザイン案に合わせたいので直接SVGで書いている。
   ------------------------------------------------------------------------- */

function TypeIcon({ code }: { code: number }) {
  if (code === PROPERTY_TYPE.MANSION) {
    return (
      <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <rect x="5" y="3" width="14" height="18" />
        <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
      </svg>
    );
  }
  if (code === PROPERTY_TYPE.LAND) {
    return (
      <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
        <path d="M3 20h18" />
        <path d="M5 20V9l7-5 7 5v11" />
      </svg>
    );
  }
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" style={{ width: 44, height: 44, color: "var(--indigo)" }}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M5 4h4l2 5-2.5 1.5a12 12 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z" />
    </svg>
  );
}

function ShopIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 7h18l-1 4a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0z" />
      <path d="M5 12v8h14v-8" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  );
}
