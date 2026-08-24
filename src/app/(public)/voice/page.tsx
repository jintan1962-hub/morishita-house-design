import Link from "next/link";
import type { Metadata } from "next";
import PageHead from "@/components/PageHead";

/**
 * お客様の声。
 *
 * 【なぜ空なのか】
 * 以前このページには「仙台市太白区 T様」などの体験談が4件載っていたが、
 * すべてRENOEL版の見本文で、実在のお客様の声ではなかった。
 * 実際に寄せられていない感想を掲載することは、景品表示法の
 * 「一般消費者に誤認される表示」（いわゆるステルスマーケティング告示）に
 * あたるおそれがあるため、実データを受け取るまで空にしている（D-03）。
 *
 * TODO:未確認 掲載の許諾を得たお客様の声を受け取ったら、
 * 掲載範囲（氏名の出し方・写真の有無）を決めたうえで実装する。
 */
export const metadata: Metadata = {
  title: "お客様の声",
};

export default function VoicePage() {
  return (
    <>
      <PageHead
        en="Customer Voice"
        title="お客様の声"
        lead="実際にご利用いただいたお客様からいただいた声をご紹介します。"
        crumbs={[{ label: "お客様の声" }]}
      />

      <section className="band">
        <div className="wrap-narrow">
          <div className="empty-panel">
            <h2>掲載準備中です</h2>
            <p>
              お客様の声は、掲載の許諾をいただいたものから順に公開します。
              ご相談の様子や進め方は、店舗で直接お話しさせていただけます。
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 24 }}>
              <Link className="btn btn-solid" href="/showroom">
                来店予約・アクセス
              </Link>
              <Link className="btn btn-line" href="/company">
                会社概要を見る
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
