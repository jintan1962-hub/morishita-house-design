/**
 * D-19：会社に関する決めごとはこのファイルだけに書く。
 * 電話番号・住所・差出人アドレスなどを変えるときは、ここ1箇所を直せば全画面とメールに反映される。
 * このファイルは D-10 の行数上限の対象外。
 *
 * 秘密情報（パスワード・APIキー・SMTPの認証情報）はここに書かないこと（D-08 / S-01）。
 * それらは .env から process.env 経由で読む。
 */

export const COMPANY = {
  /** ブランド名（サイト表記） */
  brandName: "中古住宅専門店 モリシタハウス",
  /** 短縮ブランド名（メール件名の【】内など） */
  shortName: "モリシタハウス",
  /** ブランド名の英字表記（ロゴ下） */
  brandNameEn: "MORISHITA HOUSE",
  /** 運営法人名 */
  legalName: "株式会社モリシタハウス",
  /** 郵便番号 */
  zip: "670-0085",
  /** 所在地 */
  address: "兵庫県姫路市山吹2丁目12番30号",
  /** 問い合わせ電話番号（表示用。フリーダイヤル） */
  tel: "0120-975-856",
  /** 問い合わせ電話番号（tel: リンク用。ハイフンなし） */
  telLink: "tel:0120975856",
  /** 代表電話番号（表示用） */
  telDirect: "079-260-8878",
  /** 代表電話番号（tel: リンク用） */
  telDirectLink: "tel:0792608878",
  /** 営業時間・定休日 */
  businessHours: "平日 9:00〜18:00（水曜定休）",
  /** 対応エリアの表示名（ヘッダーのタグライン等） */
  areaLabel: "姫路・播磨エリア",
  /** 代表取締役 */
  ceo: "森下 誉樹",
  /** コーポレートサイトURL */
  siteUrl: "https://www.m-house.co.jp/",
  /** 姉妹サイト（住まいの終活相談カウンター）。実家・空き家の相談はこちらへ送る */
  legacySiteUrl: "https://www.m-house.co.jp/",
} as const;

/**
 * 許認可の表示。物件情報を扱うサイトでは宅建業免許番号の掲示が要る。
 * 出典：m-house.co.jp の会社案内ページ（2026-08-25 時点の公開情報）。
 */
export const LICENSES = [
  "建設業許可　兵庫県知事（特-2）第450225号",
  "一級建築士事務所登録　第01A00961号",
  "宅地建物取引業者免許　兵庫県知事（13）第450028号",
] as const;

/**
 * メール差出人。
 * TODO:未確認 送信ドメインが未決のため、既定値は届かないプレースホルダのまま。
 * MAIL_FROM_ADDRESS に実在する認証済みドメインのアドレスを設定すること
 * （example.com 宛は到達しない／なりすまし判定される）。
 */
export const MAIL_FROM = {
  name: "中古住宅専門店 モリシタハウス",
  address: process.env.MAIL_FROM_ADDRESS || "noreply@morishita-house.example.com",
} as const;

/**
 * メール本文や画面に載せる自サイトのURL。
 * M-08：以前はメール本文に http://localhost:3000 が直書きされており、
 * 本番から送ると受信者が開けないリンクになっていた。環境変数を正とする。
 */
export const SITE_ORIGIN =
  process.env.NEXT_PUBLIC_SITE_ORIGIN ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

/** メール署名（登録完了・問い合わせ控えで共通利用） */
export const MAIL_SIGNATURE = `--------------------------------------------------
${COMPANY.brandName}
${COMPANY.legalName}
〒${COMPANY.zip} ${COMPANY.address}
TEL: ${COMPANY.tel}
URL: ${COMPANY.siteUrl}
--------------------------------------------------`;

/**
 * 管理者への通知メールの宛先（問い合わせ着信・新規入会）。
 * 未設定なら通知は送らず、その事実を MailLog に SKIPPED として残す。
 * D-03：宛先を推測で埋めない（「たぶん info@ だろう」で送ると誤送信になる）。
 */
export const MAIL_ADMIN_ADDRESS = (process.env.MAIL_ADMIN_ADDRESS || "").trim();
