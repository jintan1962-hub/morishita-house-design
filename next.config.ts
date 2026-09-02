import type { NextConfig } from "next";

/**
 * セキュリティレスポンスヘッダを全ページに付ける。
 *
 * 【なぜ入れるか】
 * 以前は1本も付いておらず、管理画面・ログインフォームが iframe に埋め込める＝
 * クリックジャッキングが可能だった。ここで最低限を塞ぐ。
 *
 * 【Content-Security-Policy の範囲】
 * いまは frame-ancestors / object-src / base-uri / form-action だけに絞っている。
 * これらは default-src にフォールバックしないため、既存の描画（Next.js のインライン
 * スクリプト、next/script で読む解析タグ、Supabase Storage の画像）を壊さない。
 * TODO:未確認 script-src / style-src まで含めた本格的な CSP は、nonce 対応と
 * 画面ごとの動作確認が要るため別作業。公開前に必ず対応する（docs/inspections.md 参照）。
 */
const securityHeaders = [
  // クリックジャッキング対策。CSP 非対応の古いブラウザ向けの保険も併記する。
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Content-Security-Policy",
    value: [
      "frame-ancestors 'none'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  // Content-Type の推測を止める（XSS の温床になる）。
  { key: "X-Content-Type-Options", value: "nosniff" },
  // 他サイトへ遷移するとき、参照元にパス・クエリを載せない。
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 使っていないブラウザ機能を明示的に閉じる。
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
  // 一度 HTTPS で来たブラウザは、以後 HTTP を試させない（Vercel は常時 HTTPS）。
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // X-Powered-By を出さない（実装スタックを不必要に知らせない）。
  poweredByHeader: false,
  /**
   * サーバーアクションに送れる本文の上限。既定は 1MB。
   *
   * 【なぜ変えるか】
   * 物件CSVの一括取込は、解析した全行をサーバーアクションの引数として送る。
   * 44列・959行のCSVで本文が約1.3MBになり、既定の1MBを超えて 413 で弾かれていた。
   * 画面には「CSVを読み取れませんでした」と出るだけで、原因が分からない状態だった。
   *
   * 【4mb の根拠】
   * 1行あたり約1.3KB（実データ959行＝約1.26MB から算出）。
   * MAX_IMPORT_ROWS（2000行）で約2.6MB になるため、余裕を見て 4MB とする。
   * Vercel のリクエスト本文の上限は 4.5MB なので、その内側に収める。
   */
  experimental: {
    serverActions: { bodySizeLimit: "4mb" },
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
