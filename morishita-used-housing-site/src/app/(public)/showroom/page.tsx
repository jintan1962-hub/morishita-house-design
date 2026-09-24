import Link from "next/link";
import type { Metadata } from "next";
import { COMPANY } from "@/config/company";
import PageHead from "@/components/PageHead";

/**
 * 来店予約・アクセス。
 *
 * 以前このページには「仙台中山スタジオ」「福島スタジオ」など、
 * 実在しない3拠点が住所・電話番号つきで載っていた（RENOEL版の見本データが
 * そのまま残っていたもの）。来店しようとした方が存在しない住所へ向かう状態だったため、
 * 実在する本社1拠点だけに直している（D-03）。
 *
 * TODO:未確認 本社以外に来店を受け付ける拠点があれば、src/config/company.ts の
 * 情報と同じ形で追加する。
 */
export const metadata: Metadata = {
  title: "来店予約・アクセス",
};

export default function ShowroomPage() {
  const mapQuery = encodeURIComponent(`${COMPANY.legalName} ${COMPANY.address}`);

  return (
    <>
      <PageHead
        en="Access"
        title="来店予約・アクセス"
        lead="店舗では、公開・未公開を含めてご希望に近い物件をまとめてご覧いただけます。まだ購入を決めていない段階のご相談も歓迎しています。"
        crumbs={[{ label: "来店予約・アクセス" }]}
      />

      <section className="band">
        <div className="wrap">
          <div className="detail-layout">
            <div>
              <h2 style={{ fontSize: 22, marginBottom: 18 }}>{COMPANY.legalName}</h2>
              <table className="spec-table">
                <tbody>
                  <tr>
                    <th>所在地</th>
                    <td>〒{COMPANY.zip}　{COMPANY.address}</td>
                  </tr>
                  <tr>
                    <th>電話番号</th>
                    <td>
                      {COMPANY.telDirect}（フリーダイヤル {COMPANY.tel}）
                    </td>
                  </tr>
                  <tr>
                    <th>受付時間</th>
                    <td>{COMPANY.businessHours}</td>
                  </tr>
                  <tr>
                    <th>アクセス</th>
                    <td>JR姫路駅・山陽姫路駅よりお車で約10分</td>
                  </tr>
                  <tr>
                    <th>対応エリア</th>
                    <td>{COMPANY.areaLabel}</td>
                  </tr>
                </tbody>
              </table>

              <p className="note-line" style={{ marginTop: 18 }}>
                {/* 地図APIは未契約のため、地図は埋め込まずGoogleマップへのリンクにしている。
                    未契約のまま埋め込むと、公開後に地図が「開発用」の表示になる。 */}
                地図は Google マップでご確認ください。
              </p>
              <a
                className="btn btn-line"
                href={`https://www.google.com/maps/search/?api=1&query=${mapQuery}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Google マップで見る
              </a>
            </div>

            <aside className="detail-side">
              <h2 style={{ fontSize: 18 }}>ご来店の前に</h2>
              <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: 12 }}>
                ご希望条件をあらかじめ登録いただくと、当日ご案内できる物件をご用意してお待ちできます。
              </p>
              <Link className="btn btn-gold btn-block" href="/member" style={{ marginTop: 18 }}>
                無料会員登録して条件を伝える
              </Link>

              <div className="detail-side__tel">
                <small>お電話でのご予約</small>
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
