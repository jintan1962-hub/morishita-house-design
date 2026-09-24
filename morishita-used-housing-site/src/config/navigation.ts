/**
 * D-19：サイトの導線（グローバルメニュー・フッターのリンク）はこのファイルだけに書く。
 * ヘッダーとフッターの両方が同じ表を読むので、リンクを増やすときはここ1箇所を直す（D-09）。
 *
 * D-03：この表には「実在するページ」しか置かない。
 * 参考デザイン案には買取LP（kaitori.html）とイベント情報（event.html）があるが、
 * 当システムには対応するページが無いため入れていない。作ったらここに追加する。
 */

import { COMPANY } from "./company";

export type NavLink = {
  label: string;
  href: string;
  /** 外部サイトへ出るリンク（別タブで開き、rel を付ける） */
  external?: boolean;
};

/** グローバルメニュー（ヘッダー2段目）。 */
export const PRIMARY_NAV: readonly NavLink[] = [
  { label: "物件を探す", href: "/properties" },
  { label: "リノベーション事例", href: "/cases" },
  { label: "資金計画", href: "/simulation" },
  { label: "お客様の声", href: "/voice" },
  { label: "実家・空き家相談", href: COMPANY.legacySiteUrl, external: true },
  { label: "会社概要", href: "/company" },
] as const;

/** フッターの列。 */
export const FOOTER_NAV: readonly { heading: string; links: readonly NavLink[] }[] = [
  {
    heading: "物件を探す",
    links: [
      { label: "物件一覧", href: "/properties" },
      { label: "エリアから探す", href: "/#areamap" },
      { label: "こだわり条件から探す", href: "/#search" },
      { label: "無料会員登録", href: "/member" },
    ],
  },
  {
    heading: "サービス",
    links: [
      { label: "資金計画シミュレーション", href: "/simulation" },
      { label: "リノベーション事例", href: "/cases" },
      { label: "実家・空き家の相談", href: COMPANY.legacySiteUrl, external: true },
      { label: "来店予約・アクセス", href: "/showroom" },
    ],
  },
  {
    heading: "会社情報",
    links: [
      { label: "会社概要", href: "/company" },
      { label: "お客様の声", href: "/voice" },
      { label: "お知らせ", href: "/information" },
    ],
  },
] as const;
