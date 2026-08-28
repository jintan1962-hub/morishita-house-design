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

/** 会員の状態。status カラムに入ってよい値はこの2つだけ。 */
export const USER_STATUS = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
} as const;

/** 会員の状態として受け付けてよい値の集合（サーバー側の検証で使う）。 */
export const USER_STATUS_VALUES: readonly string[] = Object.values(USER_STATUS);

/** 問い合わせの対応状態。Inquiry.status に入ってよい値はこの2つだけ。 */
export const INQUIRY_STATUS = {
  UNREAD: "UNREAD",
  REPLIED: "REPLIED",
} as const;

/** 問い合わせの状態として受け付けてよい値の集合。 */
export const INQUIRY_STATUS_VALUES: readonly string[] = Object.values(INQUIRY_STATUS);

/** S-12：この回数だけ連続で失敗したらアカウントを一時ロックする。 */
export const MAX_FAILED_LOGIN_ATTEMPTS = 5;

/** S-12：ロックする時間（分）。 */
export const LOGIN_LOCK_MINUTES = 15;

/** S-12：セッションの有効期限（秒）。既定は8時間。 */
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

/**
 * S-08 / S-12：公開エンドポイント（未ログインでも叩ける）のレート制限のしきい値。
 * { 窓の中で許す回数, 窓の長さ(秒) }。ここを緩めると濫用対策が緩む。
 *
 * アカウントロック（MAX_FAILED_LOGIN_ATTEMPTS）は「1アカウントを狙った」防御、
 * こちらは「1つのIPから広く投げる」ことへの防御で、役割が違う。両方効かせる。
 */
export const RATE_LIMITS = {
  /** 問い合わせ送信：IP単位。攻撃者のメール増幅の主経路 */
  inquiryPerIp: { limit: 10, windowSeconds: 60 * 60 },
  /** 問い合わせ送信：宛先メール単位。同じ相手へ繰り返し送りつけるのを防ぐ */
  inquiryPerEmail: { limit: 5, windowSeconds: 60 * 60 },
  /** 会員登録：IP単位。登録メールの増幅とアカウント列挙の速度を落とす */
  registrationPerIp: { limit: 5, windowSeconds: 60 * 60 * 24 },
  /**
   * ログイン「失敗」：IP単位。成功はカウントしない（共有回線の正規利用者を締め出さない）。
   * アカウントロック（MAX_FAILED_LOGIN_ATTEMPTS）が1アカウント狙いの防御なのに対し、
   * こちらは1つのIPからの総当たり・パスワードスプレーを止める。
   */
  loginFailPerIp: { limit: 20, windowSeconds: 60 * 60 },
} as const;

/**
 * 物件の公開レベル。
 * PUBLIC   … 誰でも全情報を見られる
 * MEMBERS  … 未ログインには価格・所在地・画像を返さない（サーバー側で落とす。S-07）
 */
export const DISCLOSURE_LEVEL = {
  PUBLIC: 0,
  MEMBERS: 1,
} as const;
