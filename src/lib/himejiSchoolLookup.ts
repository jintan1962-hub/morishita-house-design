/**
 * 住所から小学校区を引く。物件取込で `Property.elementarySchool` を埋めるために使う。
 *
 * 【何をしているか】
 * 姫路市立学校校区規則 別表第1・別表第3（himejiSchoolDistrictsSource.ts）を読み、
 * 「町名 → 小学校」の対応表を作る。住所は最も長く一致する町名で引く
 * （「飾磨区中島」と「飾磨区中島三丁目」の両方があるとき、長い方を選ぶ）。
 *
 * 【決められないものは決めない（D-03）】
 * 規則には次の2つの書き方がある。
 *   (a) 「広畑区才の一部」          … 町名だけでは校区が決まらない
 *   (b) 「八代(城乾小学校校区を除く。)」… 但し書きを外した町名で数える
 * 同じ町名が複数の学校に現れる場合、または「の一部」が付く場合は、
 * 丁目・番地まで見ないと決まらない。これらは null を返す。
 * 「たぶんこちら」で埋めると、件数が静かに狂う。
 *
 * 【この対応表の限界】
 * ・丁目や番地の区切りで校区が分かれる町は判定できない（上記 (a)）。
 * ・これは通学区域であり、正式な就学校の指定は教育委員会が行う。
 *   画面で「通学区域」として案内してはならない（himejiAreas.ts と同じ注意）。
 */

import { HIMEJI_SCHOOL_DISTRICT_SOURCE } from "../config/himejiSchoolDistrictsSource.ts";

/** 住所の先頭に付く表記。ここを落としてから町名を探す。 */
const ADDRESS_PREFIX = /^(兵庫県)?姫路市/;

const KANJI_DIGITS = "〇一二三四五六七八九";

/** 「三」「十二」などの漢数字を数値にする。丁目に使う範囲（1〜99）だけを見る。 */
function kanjiToNumber(kanji: string): number | null {
  const [upper, lower] = kanji.split("十");
  if (kanji.includes("十")) {
    const tens = upper === "" ? 1 : KANJI_DIGITS.indexOf(upper);
    const ones = lower === undefined || lower === "" ? 0 : KANJI_DIGITS.indexOf(lower);
    if (tens < 1 || ones < 0) return null;
    return tens * 10 + ones;
  }
  const n = KANJI_DIGITS.indexOf(kanji);
  return n > 0 ? n : null;
}

/**
 * 町名の表記をそろえる。
 *
 * 規則は「北平野三丁目」と漢数字で書くが、athome の住所は「北平野3丁目」と
 * 算用数字で来る。そろえないと、丁目のある町（実データの343件）が全て外れる。
 * 規則側にも「東夢前台1丁目」のように算用数字の項があるため、両側を通す。
 * 全角数字も半角にする。
 */
export function normalizeTown(town: string): string {
  return town
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    // 異体字をそろえる。規則は「夢前町山富」、athome の住所は「夢前町山冨」で来る。
    // 同じ字の書き分けであり、どの学校かを推測しているわけではない。
    .replace(/冨/g, "富")
    .replace(/([〇一二三四五六七八九十]+)丁目/g, (whole, kanji: string) => {
      const n = kanjiToNumber(kanji);
      return n === null ? whole : `${n}丁目`;
    });
}

/** 「(…を除く。)」「の一部」を外して、素の町名と「一部かどうか」を返す。 */
function parseEntry(entry: string): { town: string; partial: boolean } {
  const trimmed = entry.trim();
  if (trimmed.endsWith("の一部")) {
    return { town: trimmed.slice(0, -"の一部".length), partial: true };
  }
  const excluded = trimmed.match(/^(.+?)\([^)]*を除く。\)$/);
  if (excluded) {
    return { town: excluded[1], partial: false };
  }
  return { town: trimmed, partial: false };
}

/** 町名 → 小学校名。1校に確定できるものだけ。 */
const resolved = new Map<string, string>();
/** 町名 → 候補の学校名。町名だけでは決められないもの。 */
const ambiguous = new Map<string, string[]>();

{
  const schoolsOfTown = new Map<string, Set<string>>();
  const partialTowns = new Set<string>();

  for (const [school, towns] of Object.entries(HIMEJI_SCHOOL_DISTRICT_SOURCE)) {
    for (const entry of towns.split("・")) {
      if (entry.trim() === "") continue;
      const parsed = parseEntry(entry);
      const town = normalizeTown(parsed.town);
      const partial = parsed.partial;
      if (!schoolsOfTown.has(town)) schoolsOfTown.set(town, new Set());
      schoolsOfTown.get(town)!.add(school);
      if (partial) partialTowns.add(town);
    }
  }

  for (const [town, schools] of schoolsOfTown) {
    if (schools.size === 1 && !partialTowns.has(town)) {
      resolved.set(town, [...schools][0]);
    } else {
      ambiguous.set(town, [...schools].sort());
    }
  }
}

/** 1校に確定できる町名の対応表。 */
export const RESOLVED_TOWNS: ReadonlyMap<string, string> = resolved;
/** 町名だけでは決められない町名と、候補の学校。 */
export const AMBIGUOUS_TOWNS: ReadonlyMap<string, readonly string[]> = ambiguous;

/**
 * 住所から小学校区名を返す。決められなければ null。
 *
 * @param address 「兵庫県姫路市飾磨区中島三丁目1-2」のような表記
 */
export function elementarySchoolFromAddress(
  address: string | null | undefined
): string | null {
  if (!address) return null;
  const trimmed = address.trim();
  // 姫路市の住所でなければ引かない（他市の町名と偶然一致するのを防ぐ）。
  if (!ADDRESS_PREFIX.test(trimmed)) return null;
  const rest = normalizeTown(trimmed.replace(ADDRESS_PREFIX, ""));

  // 確定するものも、決められないものも含めて、最も長く一致する町名を探す。
  let bestTown = "";
  let bestSchool: string | null = null;
  for (const [town, school] of resolved) {
    if (rest.startsWith(town) && town.length > bestTown.length) {
      bestTown = town;
      bestSchool = school;
    }
  }
  for (const town of ambiguous.keys()) {
    if (rest.startsWith(town) && town.length > bestTown.length) {
      bestTown = town;
      bestSchool = null;
    }
  }
  return bestSchool;
}
