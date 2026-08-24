import "@/app/globals.css";
import "@/app/components.css";
import "@/app/(home)/style.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";

/**
 * 公開ページ（物件一覧・詳細・会員登録・マイページなど）のレイアウト。
 *
 * 計測タグは Analytics コンポーネントへ集約した。以前はここに RENOEL
 * （大井建設工業）の GA4／広告／Clarity／Meta のIDが直書きされており、
 * そのまま公開すると他社の解析アカウントへ訪問者データが流れる状態だった。
 */
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Analytics />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
