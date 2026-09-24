/**
 * 物件検索の条件を、URLのクエリ文字列から組み立てる。
 *
 * URLのクエリは**利用者が自由に書き換えられる外部入力**なので、
 * ここで必ず検証する。知らない値・壊れた値は「指定なし」として捨て、
 * 例外にも空一覧にもしない（不正な city を渡して0件になる、を防ぐ）。
 *
 * D-06：外部データのパースなのでテストを書いている（propertySearch.test.ts）。
 * D-09：画面（トップの検索フォーム／一覧ページ）とサーバーアクションの双方が
 *       この1つの関数を通す。条件を増やすときもここ1箇所を直す。
 */

// 相対パス＋拡張子つきで書くのは、node の標準テストランナーから読めるようにするため
// （tsconfig の allowImportingTsExtensions。src/lib/mailPayload.ts と同じ理由）。
import { isSupportedArea, isValidPropertyType } from "../config/property.ts";
import { HIMEJI_SCHOOLS, himejiDistrict, HIMEJI_CITY_CODE } from "../config/himejiAreas.ts";
import { MADORI_BUCKETS, madoriBucket, type MadoriBucketKey } from "./madori.ts";

/** 検索フォームが受け取れる生の値。URLSearchParams から取り出したそのまま。 */
export type RawSearchParams = {
  city?: string;
  type?: string;
  priceMin?: string;
  priceMax?: string;
  madori?: string;
  age?: string;
  school?: string;
  district?: string;
  down?: string;
  reform?: string;
};

/** 検証を通ったあとの条件。undefined は「指定なし」。 */
export type PropertyFilter = {
  cityCd?: string;
  syubetu?: number;
  /** 価格の下限・上限（万円） */
  priceMinMan?: number;
  priceMaxMan?: number;
  madori?: MadoriBucketKey;
  /** 築年数の上限（年）。「20年以内」なら 20 */
  maxAgeYears?: number;
  /** 小学校区。地区（district）を指定したときは、その地区の小学校区がここに入る */
  schools?: string[];
  priceDown?: boolean;
  reformTarget?: boolean;
};

/** 選べる築年数（画面のボタンと検証の両方がこの表を見る）。 */
export const AGE_OPTIONS = [5, 10, 15, 20, 25, 30] as const;

/** 選べる価格帯（万円）。上限 null は「以上」。 */
export const PRICE_OPTIONS = [
  { label: "〜1,000万円", min: undefined, max: 1000 },
  { label: "1,000〜1,500万円", min: 1000, max: 1500 },
  { label: "1,500〜2,000万円", min: 1500, max: 2000 },
  { label: "2,000〜2,500万円", min: 2000, max: 2500 },
  { label: "2,500万円〜", min: 2500, max: undefined },
] as const;

/** 0以上の整数として読む。読めなければ undefined。 */
function positiveInt(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : undefined;
}

/** チェックボックス。"1" のときだけ true。 */
function flag(value: string | undefined): boolean | undefined {
  return value === "1" ? true : undefined;
}

export function parseSearchParams(raw: RawSearchParams): PropertyFilter {
  const filter: PropertyFilter = {};

  if (raw.city && isSupportedArea(raw.city)) filter.cityCd = raw.city;

  const type = positiveInt(raw.type);
  if (type !== undefined && isValidPropertyType(type)) filter.syubetu = type;

  const min = positiveInt(raw.priceMin);
  const max = positiveInt(raw.priceMax);
  // 下限が上限を超えていたら、両方とも捨てる。
  // 片方だけ残すと「利用者が指定していない条件で絞られた」状態になる。
  if (min !== undefined && max !== undefined && min > max) {
    // 何も入れない
  } else {
    if (min !== undefined) filter.priceMinMan = min;
    if (max !== undefined) filter.priceMaxMan = max;
  }

  if (raw.madori && MADORI_BUCKETS.some((b) => b.key === raw.madori)) {
    filter.madori = raw.madori as MadoriBucketKey;
  }

  const age = positiveInt(raw.age);
  if (age !== undefined && (AGE_OPTIONS as readonly number[]).includes(age)) {
    filter.maxAgeYears = age;
  }

  // 地区は小学校区の集合に展開する。地区を指定したら市は姫路市に固定される。
  const district = raw.district ? himejiDistrict(raw.district) : null;
  if (district) {
    filter.schools = [...district.schools];
    filter.cityCd = HIMEJI_CITY_CODE;
  } else if (raw.school && HIMEJI_SCHOOLS.includes(raw.school)) {
    filter.schools = [raw.school];
    filter.cityCd = HIMEJI_CITY_CODE;
  }

  const down = flag(raw.down);
  if (down) filter.priceDown = true;
  const reform = flag(raw.reform);
  if (reform) filter.reformTarget = true;

  return filter;
}

/**
 * 条件を Prisma の where に直す。
 * 築年数は「建築年（bldY）が (今年 - 上限) 以上」で表す。
 * @param currentYear 今年。テストから固定値を渡せるように引数にしている。
 */
export function toPrismaWhere(
  filter: PropertyFilter,
  currentYear: number = new Date().getFullYear()
): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  if (filter.cityCd) where.cityCd = filter.cityCd;
  if (filter.syubetu !== undefined) where.syubetu = filter.syubetu;

  if (filter.priceMinMan !== undefined || filter.priceMaxMan !== undefined) {
    where.priceMan = {
      ...(filter.priceMinMan !== undefined ? { gte: filter.priceMinMan } : {}),
      ...(filter.priceMaxMan !== undefined ? { lte: filter.priceMaxMan } : {}),
    };
  }

  if (filter.maxAgeYears !== undefined) {
    where.bldY = { gte: currentYear - filter.maxAgeYears };
  }

  if (filter.schools && filter.schools.length > 0) {
    where.elementarySchool = { in: filter.schools };
  }

  if (filter.priceDown) where.priceDown = true;
  if (filter.reformTarget) where.reformTarget = true;

  return where;
}

/**
 * 間取りの絞り込み。
 *
 * 間取りはDBに "3LDK" のような**文字列**で入っており、「3K〜3LDK」のような
 * 区分に SQL で直せない。そのため toPrismaWhere には含めず、取得したあとに
 * この関数で絞る。呼び出し側が toPrismaWhere だけを見て間取り条件を
 * 取りこぼさないよう、ここに置いて名前で気づけるようにしている。
 */
export function matchesMadori(filter: PropertyFilter, madori: string | null | undefined): boolean {
  if (!filter.madori) return true;
  return madoriBucket(madori) === filter.madori;
}

/** 条件が1つでも入っているか（「すべて表示」との出し分けに使う）。 */
export function hasAnyCondition(filter: PropertyFilter): boolean {
  return Object.keys(filter).length > 0;
}

/** 条件を検索URLに戻す。空の条件は付けない。 */
export function toQueryString(raw: RawSearchParams): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (value !== undefined && value !== "") params.set(key, value);
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}
