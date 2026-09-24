import Link from "next/link";

/**
 * 下層ページの見出し帯（英字ラベル＋日本語タイトル＋パンくず）。
 * 全ての下層ページで同じ形にするため、ここ1箇所に置く（D-09）。
 *
 * 以前は各ページが他社サイト（okazaki-bot.github.io）の写真を背景に直リンクしていた。
 * 他人のサーバーに依存し、写真の中身も物件と無関係だったため、
 * デザイン案と同じ「地色＋罫線」の見出しに揃えている。
 */
export default function PageHead({
  en,
  title,
  lead,
  crumbs = [],
}: {
  /** 英字ラベル（eyebrow） */
  en: string;
  title: string;
  lead?: string;
  /** パンくず。ホームは自動で先頭に付く。最後の項目は href を付けない */
  crumbs?: { label: string; href?: string }[];
}) {
  return (
    <div className="page-head">
      <div className="wrap">
        <nav className="breadcrumb" aria-label="パンくず">
          <Link href="/">ホーム</Link>
          {crumbs.map((c) => (
            <span key={c.label}>
              <span className="sep">／</span>
              {c.href ? <Link href={c.href}>{c.label}</Link> : <span>{c.label}</span>}
            </span>
          ))}
        </nav>
        <span className="eyebrow">{en}</span>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
      </div>
    </div>
  );
}
