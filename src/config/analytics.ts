/**
 * D-19：アクセス解析・広告タグのIDはこのファイルだけに書く。
 *
 * 【なぜ空なのか】
 * ここには元々 RENOEL（大井建設工業）の計測IDが直書きされていた：
 *   GA4 G-8B64PSYP4M ／ UA-161807317-6 ／ Google広告 AW-951165690 ／
 *   Yahoo ytag ／ Microsoft Clarity htt9wpb13p ／ Meta Pixel 612628776889149
 * このまま公開すると、モリシタハウスのサイト訪問者の行動が
 * **他社（大井建設工業）の解析アカウントへ送られる**。個人データの
 * 第三者提供にあたるため、IDを空にして送信を止めている。
 *
 * TODO:未確認 モリシタハウス側の計測IDが決まったら、環境変数で渡す。
 * 値が空のあいだ、タグは1本も出力されない（src/components/Analytics.tsx）。
 */

export const ANALYTICS = {
  /** GA4 測定ID（G-XXXXXXXXXX） */
  ga4Id: process.env.NEXT_PUBLIC_GA4_ID || "",
  /** Google 広告 コンバージョンID（AW-XXXXXXXXX） */
  googleAdsId: process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || "",
  /** Microsoft Clarity プロジェクトID */
  clarityId: process.env.NEXT_PUBLIC_CLARITY_ID || "",
  /** Meta ピクセルID */
  metaPixelId: process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
} as const;
