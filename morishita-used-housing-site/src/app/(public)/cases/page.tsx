import Link from "next/link";
import type { Metadata } from "next";
import PageHead from "@/components/PageHead";

/**
 * リノベーション事例。
 *
 * 【なぜ空なのか】
 * このページには以前、仙台市・名取市・福島市などの施工事例6件が
 * 写真つきで載っていた。いずれもRENOEL版の見本データで、モリシタハウスの
 * 実績ではない。姫路の会社のサイトに他地域の架空事例を載せることはできないため、
 * 実データを受け取るまで空の状態にしている（D-03：推測で埋めない）。
 *
 * TODO:未確認 掲載する事例（写真・エリア・工事内容・費用）を受け取ったら、
 * 物件と同じくDBで管理するか、この配列に持つかを決めてから実装する。
 */
export const metadata: Metadata = {
  title: "リノベーション事例",
};

export default function CasesPage() {
  return (
    <>
      <PageHead
        en="Works"
        title="リノベーション事例"
        lead="中古住宅を買って、住みやすく直した事例をご紹介します。"
        crumbs={[{ label: "リノベーション事例" }]}
      />

      <section className="band">
        <div className="wrap-narrow">
          <div className="empty-panel">
            <h2>掲載準備中です</h2>
            <p>
              施工事例は現在準備しております。
              実際の事例は店舗でご覧いただけますので、お気軽にお問い合わせください。
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              <Link className="btn btn-solid" href="/properties">
                物件を探す
              </Link>
              <Link className="btn btn-line" href="/showroom">
                来店予約・アクセス
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
