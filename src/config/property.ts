/**
 * D-19：物件の区分に関する決めごとはこのファイルだけに書く。
 * 対象エリアを増やす・物件種別を変えるときは、ここ1箇所を直す。
 *
 * 【出典】市区町村コードは総務省の全国地方公共団体コード。
 * 2026-08-25 に geolonia/japanese-addresses（総務省コード準拠）の全国データと
 * 突き合わせ、下記20件すべてコード・名称の一致を確認した。
 * コードを追加したら同じ方法で検算すること（末尾の checkDigit も使える）。
 */

/** 都道府県コード（兵庫県）。 */
export const PREF_CODE = "28";

/** 都道府県名（表示用）。 */
export const PREF_NAME = "兵庫県";

/**
 * 掲載対象のエリア。ここに無い市区町村コードのデータは、取込時に警告する。
 * cityCd は5桁（検査数字なし）。CSVにもこの5桁を書く。
 *
 * 会社概要ページの営業エリア（姫路市・明石市・加古郡・加古川市・高砂市・たつの市・
 * 揖保郡・相生市・赤穂市・赤穂郡・佐用郡・宍粟市・神崎郡・加西市・小野市・三木市・西脇市）
 * を市区町村コードに展開したもの。
 *
 * TODO:未確認 営業エリアには「神戸市（一部）」も含まれるが、どの区が対象かが
 * 公開情報から特定できないため入れていない。対象区が決まったら 28101〜28111 から追加する。
 */
export const AREAS = [
  { cityCd: "28201", name: "姫路市" },
  { cityCd: "28203", name: "明石市" },
  { cityCd: "28208", name: "相生市" },
  { cityCd: "28210", name: "加古川市" },
  { cityCd: "28212", name: "赤穂市" },
  { cityCd: "28213", name: "西脇市" },
  { cityCd: "28215", name: "三木市" },
  { cityCd: "28216", name: "高砂市" },
  { cityCd: "28218", name: "小野市" },
  { cityCd: "28220", name: "加西市" },
  { cityCd: "28227", name: "宍粟市" },
  { cityCd: "28229", name: "たつの市" },
  { cityCd: "28381", name: "稲美町" },
  { cityCd: "28382", name: "播磨町" },
  { cityCd: "28442", name: "市川町" },
  { cityCd: "28443", name: "福崎町" },
  { cityCd: "28446", name: "神河町" },
  { cityCd: "28464", name: "太子町" },
  { cityCd: "28481", name: "上郡町" },
  { cityCd: "28501", name: "佐用町" },
] as const;

export type AreaCode = (typeof AREAS)[number]["cityCd"];

/** 既定のエリア。CSVで cityCd を省略した行に入る。 */
export const DEFAULT_CITY_CODE = "28201";

/**
 * 1回のCSV取込で受け付ける最大行数。
 * これを超える配列が来たら、数える前に中止する（巨大な配列で関数がタイムアウトしたり、
 * 長時間のトランザクションでDBのロックが詰まるのを防ぐ）。掲載件数の実態から見て十分広い。
 */
export const MAX_IMPORT_ROWS = 2000;

/** 市区町村コードから名称を引く。未登録なら null。 */
export function areaName(cityCd: string): string | null {
  return AREAS.find((a) => a.cityCd === cityCd)?.name ?? null;
}

/** 掲載対象のエリアかどうか。 */
export function isSupportedArea(cityCd: string): boolean {
  return AREAS.some((a) => a.cityCd === cityCd);
}

/**
 * 物件種別。`Property.syubetu` に入る値。
 * 【要確認】この番号は当システムの独自定義。athome / ATBB のCSVが別の番号体系を
 * 使っている場合は、取込前に変換するか、この表を向こうに合わせる必要がある（D-03）。
 */
export const PROPERTY_TYPE = {
  /** 土地 */
  LAND: 1,
  /** 一戸建て */
  HOUSE: 2,
  /** マンション */
  MANSION: 3,
} as const;

export type PropertyTypeCode = (typeof PROPERTY_TYPE)[keyof typeof PROPERTY_TYPE];

/** 種別コード → 表示名。 */
export const PROPERTY_TYPE_LABEL: Record<number, string> = {
  [PROPERTY_TYPE.LAND]: "土地",
  [PROPERTY_TYPE.HOUSE]: "一戸建て",
  [PROPERTY_TYPE.MANSION]: "マンション",
};

/** 既定の種別。CSVで syubetu を省略した行に入る。 */
export const DEFAULT_PROPERTY_TYPE: number = PROPERTY_TYPE.HOUSE;

/** 種別コードとして妥当か。 */
export function isValidPropertyType(code: number): boolean {
  return Object.values(PROPERTY_TYPE).includes(code as PropertyTypeCode);
}

/**
 * 5桁の市区町村コードから検査数字（6桁目）を求める。
 * 総務省の全国地方公共団体コードの算出方法。AREAS の値を検算するために置いてある。
 */
export function checkDigit(cityCd5: string): number {
  const weights = [6, 5, 4, 3, 2];
  const sum = cityCd5
    .split("")
    .reduce((acc, ch, i) => acc + Number(ch) * weights[i], 0);
  const remainder = sum % 11;
  if (remainder === 0) return 1;
  if (remainder === 1) return 0;
  return 11 - remainder;
}
