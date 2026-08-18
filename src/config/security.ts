/**
 * D-19：認証・認可のしきい値はこのファイルだけに書く。
 * S-12（認証の最低ライン）が要求する「試行回数の制限」「セッションの有効期限」の値もここ。
 */

/** 権限区分。role カラムに入る値はこの2つだけ。 */
export const ROLE = {
  USER: "USER",
  ADMIN: "ADMIN",
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

/** 会員の状態。 */
export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

/** S-12：この回数だけ連続で失敗したらアカウントを一時ロックする。 */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

/** S-12：ロックする時間（分）。 */
export const LOGIN_LOCK_MINUTES = 15;

/** S-12：セッションの有効期限（秒）。既定は8時間。 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

/**
 * 物件の公開レベル。
 * PUBLIC   … 誰でも全情報を見られる
 * MEMBERS  … 未ログインには価格・所在地・画像を返さない（サーバー側で落とす。S-07）
 */
export const DISCLOSURE_LEVEL = {
  PUBLIC: 0,
  MEMBERS: 1,
} as const;
