/**
 * D-19：資金計画の前提条件はこのファイルだけに書く。
 * 金利や想定リノベ費用が変わったら、ここ1箇所を直せば物件詳細もシミュレーションも変わる。
 *
 * 【要確認】いずれも実装時に画面へ直書きされていた値をそのまま移設したもの。
 * 実際の商品条件と合っているか、営業担当への確認が必要（D-03）。
 */

/** 想定年利（%） */
export const DEFAULT_ANNUAL_RATE_PERCENT = 0.75;

/** 想定借入年数（年） */
export const DEFAULT_LOAN_YEARS = 35;

/** 表示用の想定リノベーション費用（円） */
export const DEFAULT_RENOVATION_COST_YEN = 15_180_000;

/** 万円 → 円 */
export const MAN_YEN = 10_000;
