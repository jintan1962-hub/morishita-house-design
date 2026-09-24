"use server";

import prisma from "@/lib/prisma";
import { reportError } from "@/lib/errors";
import { DISCLOSURE_LEVEL } from "@/config/security";
import { AREAS } from "@/config/property";
import { HIMEJI_DISTRICTS, HIMEJI_CITY_CODE } from "@/config/himejiAreas";
import { countByMadori, MADORI_BUCKETS, type MadoriBucketKey } from "@/lib/madori";

/**
 * トップページの件数表示（ヒーローの数字・地図・小学校区・間取り）をまとめて返す。
 *
 * 【なぜ1つの関数にまとめるか】
 * トップは同じ Property テーブルを5つの切り口で数える。別々のアクションにすると
 * 画面表示のたびにDBへ5往復する。1回読んで、集計はアプリ側で行う。
 *
 * 【権限】
 * 返すのは**件数だけ**で、物件の中身（価格・所在地）も個人情報も含まない。
 * 「会員限定が何件あるか」は会員登録を促すための情報で、意図的に未ログインにも見せる。
 * 物件の中身の出し分けは getPublicProperties 側が担当する（S-07）。
 *
 * 【数字の意味】
 * publicCount  = 誰でも見られる物件の件数
 * membersCount = ログインした会員だけが中身を見られる物件の件数
 * デザイン案には「店頭限定（非公開）」の列もあったが、当システムの公開区分は
 * PUBLIC / MEMBERS の2つしか無いため出していない（src/config/security.ts）。
 * 3つ目を出すにはDBの区分を増やす必要があり、別途の変更になる。
 */

/** 1つの切り口あたりの件数。 */
export type SplitCount = { publicCount: number; membersCount: number };

export type HomeStats = {
  /** 掲載中の総件数 */
  total: number;
  /** うち会員限定 */
  membersOnly: number;
  /** 対応している市区町村の数 */
  areaCount: number;
  /** 直近30日に登録された件数 */
  newCount: number;
  /** 市区町村コード → 件数 */
  byCity: Record<string, SplitCount>;
  /** 姫路市内の地区キー → 件数 */
  byDistrict: Record<string, SplitCount>;
  /** 小学校区名 → 件数 */
  bySchool: Record<string, number>;
  /** 間取り区分 → 件数 */
  byMadori: Record<MadoriBucketKey, number>;
};

/** 30日を「新着」とする。ここを変えればヒーローの数字と一覧の並びが揃って変わる。 */
const NEW_ARRIVAL_DAYS = 30;

export async function getHomeStats() {
  try {
    // 件数を出すのに必要な列だけを取る。
    // select を省くと Prisma が全列（取扱店の免許番号なども）を持ってくる。
    const rows = await prisma.property.findMany({
      select: {
        cityCd: true,
        disclosureLevel: true,
        elementarySchool: true,
        madori: true,
        createdAt: true,
      },
    });

    const since = new Date();
    since.setDate(since.getDate() - NEW_ARRIVAL_DAYS);

    const byCity: Record<string, SplitCount> = {};
    const byDistrict: Record<string, SplitCount> = {};
    const bySchool: Record<string, number> = {};

    // 小学校区 → 地区キー の逆引き。1件ごとに全地区を舐めないための下ごしらえ。
    const districtOfSchool = new Map<string, string>();
    for (const d of HIMEJI_DISTRICTS) {
      byDistrict[d.key] = { publicCount: 0, membersCount: 0 };
      for (const school of d.schools) districtOfSchool.set(school, d.key);
    }
    for (const a of AREAS) byCity[a.cityCd] = { publicCount: 0, membersCount: 0 };

    let membersOnly = 0;
    let newCount = 0;

    for (const row of rows) {
      const isMembers = row.disclosureLevel === DISCLOSURE_LEVEL.MEMBERS;
      if (isMembers) membersOnly += 1;
      if (row.createdAt >= since) newCount += 1;

      const city = byCity[row.cityCd];
      if (city) {
        if (isMembers) city.membersCount += 1;
        else city.publicCount += 1;
      }

      // 地区は姫路市の中の話。他市の物件に姫路の学校名が入っていても数えない。
      if (row.cityCd === HIMEJI_CITY_CODE && row.elementarySchool) {
        bySchool[row.elementarySchool] = (bySchool[row.elementarySchool] ?? 0) + 1;
        const key = districtOfSchool.get(row.elementarySchool);
        if (key) {
          if (isMembers) byDistrict[key].membersCount += 1;
          else byDistrict[key].publicCount += 1;
        }
      }
    }

    const stats: HomeStats = {
      total: rows.length,
      membersOnly,
      areaCount: AREAS.length,
      newCount,
      byCity,
      byDistrict,
      bySchool,
      byMadori: countByMadori(rows.map((r) => r.madori)),
    };

    return { success: true as const, data: stats };
  } catch (error) {
    return reportError("getHomeStats", error, "件数を取得できませんでした。");
  }
}

/** 画面が「読み込み前」に使う、全て0の件数。表示が一瞬崩れるのを防ぐ。 */
export async function emptyHomeStats(): Promise<HomeStats> {
  return {
    total: 0,
    membersOnly: 0,
    areaCount: AREAS.length,
    newCount: 0,
    byCity: Object.fromEntries(AREAS.map((a) => [a.cityCd, { publicCount: 0, membersCount: 0 }])),
    byDistrict: Object.fromEntries(
      HIMEJI_DISTRICTS.map((d) => [d.key, { publicCount: 0, membersCount: 0 }])
    ),
    bySchool: {},
    byMadori: Object.fromEntries(MADORI_BUCKETS.map((b) => [b.key, 0])) as Record<
      MadoriBucketKey,
      number
    >,
  };
}
