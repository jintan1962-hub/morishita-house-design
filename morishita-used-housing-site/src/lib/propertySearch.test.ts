import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseSearchParams,
  toPrismaWhere,
  hasAnyCondition,
  toQueryString,
  matchesMadori,
} from "./propertySearch.ts";

/**
 * D-06：外部データ（URLのクエリ）のパースにはテストを書く。
 * ここで守りたいのは「利用者が書き換えたURLで、意図しない絞り込みが起きないこと」。
 */

test("何も指定しなければ条件は空", () => {
  const filter = parseSearchParams({});
  assert.deepEqual(filter, {});
  assert.equal(hasAnyCondition(filter), false);
  assert.deepEqual(toPrismaWhere(filter), {});
});

test("掲載対象外の市区町村コードは捨てる（空一覧にしない）", () => {
  // 20217 は長野県佐久市。移行前のコードで、いまは掲載対象ではない。
  assert.equal(parseSearchParams({ city: "20217" }).cityCd, undefined);
  assert.equal(parseSearchParams({ city: "'; DROP TABLE" }).cityCd, undefined);
  assert.equal(parseSearchParams({ city: "28201" }).cityCd, "28201", "姫路市は通る");
});

test("物件種別は定義済みの番号だけ通す", () => {
  assert.equal(parseSearchParams({ type: "2" }).syubetu, 2, "一戸建て");
  assert.equal(parseSearchParams({ type: "9" }).syubetu, undefined, "未定義の番号");
  assert.equal(parseSearchParams({ type: "abc" }).syubetu, undefined);
  assert.equal(parseSearchParams({ type: "-1" }).syubetu, undefined);
});

test("価格の下限が上限を超えていたら両方捨てる", () => {
  const filter = parseSearchParams({ priceMin: "3000", priceMax: "1000" });
  assert.equal(filter.priceMinMan, undefined);
  assert.equal(filter.priceMaxMan, undefined);

  const ok = parseSearchParams({ priceMin: "1000", priceMax: "3000" });
  assert.equal(ok.priceMinMan, 1000);
  assert.equal(ok.priceMaxMan, 3000);
});

test("価格は片側だけの指定もできる", () => {
  assert.deepEqual(toPrismaWhere(parseSearchParams({ priceMax: "1500" })), {
    priceMan: { lte: 1500 },
  });
  assert.deepEqual(toPrismaWhere(parseSearchParams({ priceMin: "2500" })), {
    priceMan: { gte: 2500 },
  });
});

test("築年数は選択肢にある値だけ通し、建築年の下限に直す", () => {
  const filter = parseSearchParams({ age: "20" });
  assert.equal(filter.maxAgeYears, 20);
  // 2026年に「築20年以内」なら、建築年が2006年以降
  assert.deepEqual(toPrismaWhere(filter, 2026), { bldY: { gte: 2006 } });

  assert.equal(parseSearchParams({ age: "7" }).maxAgeYears, undefined, "選択肢に無い年数");
  assert.equal(parseSearchParams({ age: "99999" }).maxAgeYears, undefined);
});

test("地区を指定すると、その地区の小学校区に展開され、市は姫路市に固定される", () => {
  const filter = parseSearchParams({ district: "shikama" });
  assert.equal(filter.cityCd, "28201");
  assert.deepEqual(filter.schools, ["飾磨小学校", "英賀保小学校", "津田小学校", "高浜小学校"]);

  const where = toPrismaWhere(filter);
  assert.deepEqual(where.elementarySchool, {
    in: ["飾磨小学校", "英賀保小学校", "津田小学校", "高浜小学校"],
  });
});

test("知らない地区名・知らない学校名は捨てる", () => {
  assert.equal(parseSearchParams({ district: "nowhere" }).schools, undefined);
  assert.equal(parseSearchParams({ school: "架空小学校" }).schools, undefined);
  assert.deepEqual(parseSearchParams({ school: "白鷺小学校" }).schools, ["白鷺小学校"]);
});

test("地区の指定は、同時に来た市の指定より優先される（矛盾した条件で0件にしない）", () => {
  // 飾磨は姫路市の中の地区なので、city=加古川市 と同時に指定されたら姫路市が正。
  const filter = parseSearchParams({ city: "28210", district: "shikama" });
  assert.equal(filter.cityCd, "28201");
});

test("こだわり条件は '1' のときだけ立つ", () => {
  assert.equal(parseSearchParams({ down: "1" }).priceDown, true);
  assert.equal(parseSearchParams({ down: "true" }).priceDown, undefined);
  assert.equal(parseSearchParams({ down: "0" }).priceDown, undefined);
  assert.equal(parseSearchParams({ reform: "1" }).reformTarget, true);
});

test("条件をURLに戻すとき、空の項目は付けない", () => {
  assert.equal(toQueryString({ city: "28201", type: "", priceMax: "1500" }), "?city=28201&priceMax=1500");
  assert.equal(toQueryString({}), "");
});

test("間取りの区分は定義済みのキーだけ通す", () => {
  assert.equal(parseSearchParams({ madori: "b3" }).madori, "b3");
  assert.equal(parseSearchParams({ madori: "b9" }).madori, undefined);
});

test("間取りは SQL では絞れないので、取得後に matchesMadori で絞る", () => {
  const filter = parseSearchParams({ madori: "b3" });

  // where には入らない（入れると Prisma が "b3" という間取りを探しに行ってしまう）
  assert.equal(toPrismaWhere(filter).madori, undefined);

  assert.equal(matchesMadori(filter, "3LDK"), true);
  assert.equal(matchesMadori(filter, "3K"), true);
  assert.equal(matchesMadori(filter, "4LDK"), false);
  assert.equal(matchesMadori(filter, null), false, "読めない間取りは該当しない");

  // 間取りを指定していなければ全て通す
  assert.equal(matchesMadori({}, null), true);
  assert.equal(matchesMadori({}, "4LDK"), true);
});
