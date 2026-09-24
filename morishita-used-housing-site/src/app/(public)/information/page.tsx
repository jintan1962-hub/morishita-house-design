import Link from "next/link";
import type { Metadata } from "next";
import PageHead from "@/components/PageHead";

/**
 * お知らせ。
 *
 * 【なぜ空なのか】
 * 以前は「【仙台】中古住宅×リノベーション相談会」など、RENOEL版の
 * 見本のお知らせ5件が日付つきで載っていた。日付入りの告知は
 * 実際の予定と取り違えられるため、実データを受け取るまで空にしている（D-03）。
 *
 * TODO:未確認 お知らせを継続的に出すなら、管理画面から投稿できるように
 * DBのテーブルを追加する必要がある（現状は Property / User / Inquiry のみ）。
 * 更新頻度を確認してから設計する。
 */
export const metadata: Metadata = {
  title: "お知らせ",
};

export default function InformationPage() {
  return (
    <>
      <PageHead en="Information" title="お知らせ" crumbs={[{ label: "お知らせ" }]} />

      <section className="band">
        <div className="wrap-narrow">
          <div className="empty-panel">
            <h2>現在お知らせはありません</h2>
            <p>新しいお知らせを掲載しましたら、こちらでお伝えします。</p>
            <Link className="btn btn-solid" href="/properties">
              物件を探す
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
