/**
 * D-19：姫路市南部の地区区分（トップページの地図）はこのファイルだけに書く。
 *
 * 【この区分は何か】
 * 姫路市は市区町村コード上は 28201 の1つだが、市域が広く、
 * 「姫路市 300件」とだけ出しても利用者には手掛かりにならない。
 * そこで市南部を6地区に分け、各地区に属する小学校区で物件を絞り込む。
 *
 * 【出典と限界（D-03）】
 * 地区の形（SVGのパス）と小学校の割り当ては、デザイン案
 * jintan1962-hub.github.io/morishita-house-design/ のものをそのまま使っている。
 * デザイン案の注記いわく、市域境界・海岸線は OpenStreetMap（ODbL）の実データ、
 * 地区の境界は**小学校33校の位置による最近傍分割**で作った近似であり、
 * **姫路市が定める通学区域とは一致しない**。
 * 通学区域として案内してはならない。画面にもこの注記を出すこと。
 *
 * 【DBとの対応】
 * 物件の `elementarySchool`（小学校区）が下の schools のどれかと一致する物件を、
 * その地区の物件として数える。`elementarySchool` が空の物件はどの地区にも入らない。
 */

/** 地区の識別子。SVG の data-area と対応する。 */
export type HimejiDistrictKey =
  | "himejinishi"
  | "takaoka"
  | "ekikita"
  | "ekiminami"
  | "shikama"
  | "shirahama";

export type HimejiDistrict = {
  key: HimejiDistrictKey;
  /** 表示名（「エリア」は付けない。画面側で付ける） */
  name: string;
  /** 地図のピルの色 */
  color: string;
  /** ピルの位置（SVG viewBox 0 0 1000 855.8 上の座標） */
  pin: { x: number; y: number; w: number; h: number };
  /** この地区に属する小学校区。Property.elementarySchool と突き合わせる */
  schools: readonly string[];
};

export const HIMEJI_DISTRICTS: readonly HimejiDistrict[] = [
  {
    key: "himejinishi",
    name: "姫路西",
    color: "#1d395a",
    pin: { x: 118, y: 502, w: 229, h: 72 },
    schools: [
      "八幡小学校",
      "広畑小学校",
      "広畑第二小学校",
      "大津小学校",
      "南大津小学校",
      "大津茂小学校",
      "網干小学校",
      "網干西小学校",
      "勝原小学校",
      "旭陽小学校",
      "余部小学校",
    ],
  },
  {
    key: "takaoka",
    name: "高岡・安室・青山",
    color: "#906b27",
    pin: { x: 388, y: 179, w: 233, h: 72 },
    schools: [
      "高岡西小学校",
      "高岡小学校",
      "安室小学校",
      "安室東小学校",
      "青山小学校",
    ],
  },
  {
    key: "ekikita",
    name: "駅北",
    color: "#457c52",
    pin: { x: 597, y: 279, w: 206, h: 72 },
    schools: [
      "白鷺小学校",
      "城西小学校",
      "船場小学校",
      "城東小学校",
      "東小学校",
      "城乾小学校",
      "野里小学校",
    ],
  },
  {
    key: "ekiminami",
    name: "駅南",
    color: "#ab5c35",
    pin: { x: 451, y: 353, w: 195, h: 72 },
    schools: [
      "手柄小学校",
      "城陽小学校",
      "荒川小学校",
    ],
  },
  {
    key: "shikama",
    name: "飾磨",
    color: "#66508a",
    pin: { x: 442, y: 511, w: 195, h: 72 },
    schools: [
      "飾磨小学校",
      "英賀保小学校",
      "津田小学校",
      "高浜小学校",
    ],
  },
  {
    key: "shirahama",
    name: "白浜",
    color: "#3f7db1",
    pin: { x: 660, y: 576, w: 195, h: 72 },
    schools: [
      "糸引小学校",
      "白浜小学校",
      "妻鹿小学校",
    ],
  },
] as const;

/** 姫路市の市区町村コード。地区区分はこの市の中だけの話。 */
export const HIMEJI_CITY_CODE = "28201";

/** 地区キーから地区を引く。未知のキーなら null。 */
export function himejiDistrict(key: string): HimejiDistrict | null {
  return HIMEJI_DISTRICTS.find((d) => d.key === key) ?? null;
}

/** 全地区の小学校区をまとめた一覧（重複なし）。 */
export const HIMEJI_SCHOOLS: readonly string[] = HIMEJI_DISTRICTS.flatMap((d) => d.schools);

/** 地図・注記に出す出典表記。ODbL は出典の明示が要る。 */
export const HIMEJI_MAP_CREDIT = {
  text:
    "※対象は姫路市南部エリアです。市域境界・海岸線は実データ、エリア区分は小学校33校の位置による" +
    "最近傍分割で作成しており、姫路市が定める通学区域とは一致しません。",
  license: "© OpenStreetMap contributors",
  licenseUrl: "https://www.openstreetmap.org/copyright",
} as const;
