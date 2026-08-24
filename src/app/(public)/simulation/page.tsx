import type { Metadata } from "next";
import Link from "next/link";
import LoanSimulator from "@/components/LoanSimulator";
import PageHead from "@/components/PageHead";
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  DEFAULT_LOAN_YEARS,
  DEFAULT_RENOVATION_COST_YEN,
  MAN_YEN,
} from "@/config/loan";

/**
 * 資金計画シミュレーション。
 *
 * D-09：このページには元利均等返済の計算式が**もう1つ**書かれていた
 * （calculateMortgage というローカル関数）。テストのある src/lib/loan.ts と
 * 式が二重になっており、片方だけ直すとページごとに金額が食い違う状態だった。
 * 計算とUIは LoanSimulator（src/lib/loan.ts を使う）に1本化している。
 */
export const metadata: Metadata = {
  title: "資金計画シミュレーション",
};

export default function SimulationPage() {
  return (
    <>
      <PageHead
        en="Simulation"
        title="資金計画シミュレーション"
        lead="中古住宅は「物件価格」だけでは判断できません。物件＋リノベーション費用を1本のローンにまとめた月々のお支払いで比べてください。"
        crumbs={[{ label: "資金計画シミュレーション" }]}
      />

      <LoanSimulator />

      <section className="band band-alt">
        <div className="wrap-narrow">
          <h2 style={{ fontSize: 22, marginBottom: 18 }}>試算の前提</h2>
          <table className="spec-table">
            <tbody>
              <tr>
                <th>返済方式</th>
                <td>元利均等返済・ボーナス払いなし</td>
              </tr>
              <tr>
                <th>金利の初期値</th>
                <td>年 {DEFAULT_ANNUAL_RATE_PERCENT}％（変動金利を想定した参考値）</td>
              </tr>
              <tr>
                <th>返済期間の初期値</th>
                <td>{DEFAULT_LOAN_YEARS}年</td>
              </tr>
              <tr>
                <th>リノベーション費用の初期値</th>
                <td>{(DEFAULT_RENOVATION_COST_YEN / MAN_YEN).toLocaleString()}万円</td>
              </tr>
              <tr>
                <th>含まれない費用</th>
                <td>仲介手数料・登記費用・火災保険料・引越費用などの諸費用</td>
              </tr>
            </tbody>
          </table>
          <p className="note-line">
            実際の借入可能額・適用金利は、ご年収や金融機関の審査結果により異なります。
            具体的なご相談は店舗で承ります。
          </p>
          <div style={{ marginTop: 24 }}>
            <Link className="btn btn-solid" href="/showroom">
              来店予約・アクセス
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
