import "@/app/globals.css";
import "@/app/components.css";
import "./style.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Analytics from "@/components/Analytics";

/**
 * トップページのレイアウト。
 * 以前はトップだけがヘッダー・フッターを埋め込みHTMLとして自前で持っていたため、
 * 他ページへ移動するとフッターが消えていた。共通コンポーネントに揃える。
 */
export default function HomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Analytics />
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}
