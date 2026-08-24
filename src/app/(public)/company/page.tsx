import Link from "next/link";
import type { Metadata } from "next";
import { COMPANY, LICENSES } from "@/config/company";
import { STAFF, CEO_MESSAGE, GROUP_COMPANIES } from "@/config/staff";
import { AREAS } from "@/config/property";
import PageHead from "@/components/PageHead";

/**
 * 会社概要。
 *
 * 宅地建物取引業者の免許番号は、宅建業法で広告・標識への表示が求められる。
 * 出所は src/config/company.ts の LICENSES 1箇所（D-08 / D-19）。
 *
 * 掲載内容の出典は m-house.co.jp の会社案内ページ（2026-08-25 時点の公開情報）。
 * TODO:未確認 最新の内容をモリシタハウス側に確認のうえ確定させる。
 */
export const metadata: Metadata = {
  title: "会社概要",
};

export default function CompanyPage() {
  return (
    <>
      <PageHead
        en="Company"
        title="会社概要"
        lead={`${COMPANY.areaLabel}で中古住宅の仲介と買取、実家・空き家のご相談まで対応する${COMPANY.legalName}の会社情報です。`}
        crumbs={[{ label: "会社概要" }]}
      />

      <section className="band">
        <div className="wrap">
          <table className="spec-table">
            <tbody>
              <tr>
                <th>社名</th>
                <td>{COMPANY.legalName}</td>
              </tr>
              <tr>
                <th>本社所在地</th>
                <td>〒{COMPANY.zip}　{COMPANY.address}</td>
              </tr>
              <tr>
                <th>フリーダイヤル</th>
                <td>
                  <a href={COMPANY.telLink}>{COMPANY.tel}</a>
                </td>
              </tr>
              <tr>
                <th>TEL</th>
                <td>
                  <a href={COMPANY.telDirectLink}>{COMPANY.telDirect}</a>
                </td>
              </tr>
              <tr>
                <th>受付時間</th>
                <td>{COMPANY.businessHours}</td>
              </tr>
              <tr>
                <th>代表取締役</th>
                <td>
                  {COMPANY.ceo}（{STAFF[0].certifications}）
                </td>
              </tr>
              <tr>
                <th>グループ会社</th>
                <td>
                  {GROUP_COMPANIES.map((c) => (
                    <span key={c} style={{ display: "block" }}>
                      {c}
                    </span>
                  ))}
                </td>
              </tr>
              <tr>
                <th>許可など</th>
                <td>
                  {LICENSES.map((l) => (
                    <span key={l} style={{ display: "block" }}>
                      {l}
                    </span>
                  ))}
                </td>
              </tr>
              <tr>
                <th>物件の掲載エリア</th>
                <td>{AREAS.map((a) => a.name).join("／")}</td>
              </tr>
            </tbody>
          </table>
          <p className="note-line">
            ※上記は当サイトに物件を掲載しているエリアです。ご相談は近隣エリアも承ります。
            エリアによっては交通費の加算についてご相談する場合があります。
          </p>
        </div>
      </section>

      <section className="band band-alt">
        <div className="wrap">
          <div className="head-row">
            <div>
              <span className="eyebrow">Message</span>
              <h2>代表からのご挨拶</h2>
            </div>
          </div>
          <div className="pro-layout">
            <div>
              <div className="pro-photo">
                <span style={{ fontSize: 12, color: "var(--ink-faint)" }}>写真は準備中です</span>
              </div>
              <p style={{ fontSize: 12, color: "var(--gold)", marginTop: 14, marginBottom: 0 }}>
                {STAFF[0].role}
              </p>
              <p style={{ fontFamily: "var(--serif)", fontSize: 19, margin: "4px 0" }}>
                {COMPANY.ceo}
              </p>
              <p style={{ fontSize: 12, color: "var(--ink-faint)", margin: 0 }}>
                {STAFF[0].certifications}
              </p>
            </div>
            <div>
              {CEO_MESSAGE.map((p) => (
                <p key={p} style={{ color: "var(--ink-soft)", fontSize: 14.5 }}>
                  {p}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="band">
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
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
                  </svg>
                </div>
                <p className="staff-role">{s.role}</p>
                <p className="staff-name">{s.name}</p>
                <p className="staff-cert">{s.certifications}</p>
                <p className="staff-msg">{s.message}</p>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link className="btn btn-solid" href="/showroom">
              アクセス・来店予約はこちら
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
