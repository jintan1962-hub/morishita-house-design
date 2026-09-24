/**
 * 住宅ローンの毎月返済額を求める（元利均等返済）。
 *
 * D-06：金額の計算はテスト必須。テストは src/lib/loan.test.ts。
 * D-09：物件詳細ページとシミュレーションページに同じ式を書かない。計算はここだけ。
 *
 * 元利均等返済の毎月返済額 M は、
 *   M = P × r × (1+r)^n / ((1+r)^n − 1)
 *   P = 借入元金、r = 月利、n = 返済回数
 * 金利0%のときは 0 除算になるため、単純に元金を回数で割る。
 */
export function calculateMonthlyPayment(
  principalYen: number,
  annualRatePercent: number,
  years: number
): number {
  if (!Number.isFinite(principalYen) || principalYen <= 0) return 0;
  if (!Number.isFinite(years) || years <= 0) return 0;
  if (!Number.isFinite(annualRatePercent) || annualRatePercent < 0) return 0;

  const numberOfPayments = years * 12;
  const monthlyRate = annualRatePercent / 12 / 100;

  if (monthlyRate === 0) {
    return principalYen / numberOfPayments;
  }

  const growth = Math.pow(1 + monthlyRate, numberOfPayments);
  return (principalYen * monthlyRate * growth) / (growth - 1);
}
