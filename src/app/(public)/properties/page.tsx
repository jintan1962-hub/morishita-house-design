import Link from "next/link";
import type { Metadata } from "next";
import { searchPublicProperties } from "@/app/actions/properties";
import { areaName, PROPERTY_TYPE_LABEL, PROPERTIES_PER_PAGE } from "@/config/property";
import { himejiDistrict } from "@/config/himejiAreas";
import { MADORI_BUCKETS } from "@/lib/madori";
import {
  parseSearchParams,
  hasAnyCondition,
  toQueryString,
  type RawSearchParams,
} from "@/lib/propertySearch";
import { paginate, pageNumbers } from "@/lib/pagination";
import PropertyCard, { type PublicProperty } from "@/components/PropertyCard";
import PropertySearchPanel from "@/components/PropertySearchPanel";
import PageHead from "@/components/PageHead";

/**
 * 物件一覧。
 *
 * C-03 / S-07：会員限定物件の出し分けはサーバー側で行う。
 * 以前はこのファイルが "use client" で、非公開物件を含む全データを
 * ソース中の配列に持っていた。「価格非公開」と表示していても、
 * 開発者ツールやページソースから価格・所在地がそのまま読めていた。
 * いまは searchPublicProperties() が、未ログインには秘匿項目を含まないデータだけを返す。
 *
 * 絞り込み条件はURLのクエリで受ける。検証は parseSearchParams が1箇所で行う。
 *
 * 2026-09-28 から PROPERTIES_PER_PAGE 件ずつのページ分け（?page=）。
 * 検索は全件に対して行い、表示する分だけをここで切り出す（間取りの絞り込みが
 * SQL の外で行われるため、DB 側で件数を区切ると総件数とページ数がずれる）。
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "物件一覧",
};

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams & { page?: string }>;
}) {
  // page は検索条件ではないので分けておく（条件を変えたら1ページ目に戻す）
  const { page: pageParam, ...raw } = await searchParams;
  const filter = parseSearchParams(raw);
  const result = await searchPublicProperties(raw);

  const conditions = describeConditions(raw);
  const heading = conditions.length > 0 ? conditions.join("　") : "物件一覧";
  const total = result.success ? result.data.length : 0;
  const pager = paginate(total, pageParam, PROPERTIES_PER_PAGE);

  return (
    <>
      <PageHead en="Properties" title={heading} crumbs={[{ label: "物件一覧" }]} />

      <section className="band band-alt">
        <div className="wrap">
          <div className="head-row" style={{ marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 22 }}>
                {result.success ? `${total}件` : "検索結果"}
              </h2>
              {pager.totalPages > 1 && (
                <p className="note-line" style={{ marginTop: 6 }}>
                  {pager.start + 1}〜{pager.end}件目を表示（{pager.page}／{pager.totalPages}ページ）
                </p>
              )}
              {hasAnyCondition(filter) && (
                <p className="note-line" style={{ marginTop: 6 }}>
                  絞り込み中：{conditions.join("／")}
                </p>
              )}
            </div>
            {hasAnyCondition(filter) && (
              <Link className="more" href="/properties">
                条件をすべて解除する
              </Link>
            )}
          </div>

          {!result.success ? (
            <p className="notice notice-ng">{result.error}</p>
          ) : result.data.length === 0 ? (
            <p className="state-msg">
              条件に合う物件はありませんでした。
              <br />
              条件をゆるめるか、会員登録をすると会員限定物件も検索対象になります。
            </p>
          ) : (
            <>
              <div className="prop-grid">
                {result.data.slice(pager.start, pager.end).map((property) => (
                  <PropertyCard key={property.id} property={property as PublicProperty} />
                ))}
              </div>
              <Pager raw={raw} page={pager.page} totalPages={pager.totalPages} />
            </>
          )}
        </div>
      </section>

      <section className="band">
        <div className="wrap">
          <div className="head-row">
            <div>
              <span className="eyebrow">Property Search</span>
              <h2>条件を変えて探す</h2>
            </div>
          </div>
          <PropertySearchPanel current={raw} />
        </div>
      </section>
    </>
  );
}

/** ページ送り。検索条件はそのまま引き継ぎ、page だけを替える。 */
function Pager({ raw, page, totalPages }: { raw: RawSearchParams; page: number; totalPages: number }) {
  if (totalPages <= 1) return null;
  const href = (n: number) => `/properties${toQueryString({ ...raw, page: n > 1 ? String(n) : undefined })}`;
  return (
    <nav className="pager" aria-label="ページ送り">
      {page > 1 ? (
        <Link className="pager-step" href={href(page - 1)} rel="prev">
          前へ
        </Link>
      ) : (
        <span className="pager-step" aria-hidden="true" />
      )}
      <ol className="pager-nums">
        {pageNumbers(page, totalPages).map((n, i) =>
          n === null ? (
            <li key={`gap-${i}`} className="pager-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={n}>
              <Link href={href(n)} aria-current={n === page ? "page" : undefined} aria-label={`${n}ページ目`}>
                {n}
              </Link>
            </li>
          )
        )}
      </ol>
      {page < totalPages ? (
        <Link className="pager-step" href={href(page + 1)} rel="next">
          次へ
        </Link>
      ) : (
        <span className="pager-step" aria-hidden="true" />
      )}
    </nav>
  );
}

/**
 * いま効いている条件を、人が読める言葉にする。
 * 検証を通った値だけを言葉にするので、URLに不正な値を入れても表示に出ない。
 */
function describeConditions(raw: RawSearchParams): string[] {
  const filter = parseSearchParams(raw);
  const labels: string[] = [];

  // 地区・小学校区は市区町村より具体的なので、そちらを優先して見せる
  const district = raw.district ? himejiDistrict(raw.district) : null;
  if (district) {
    labels.push(`${district.name}エリア`);
  } else if (filter.schools?.length === 1) {
    labels.push(filter.schools[0]);
  } else if (filter.cityCd) {
    const name = areaName(filter.cityCd);
    if (name) labels.push(name);
  }

  if (filter.syubetu !== undefined) labels.push(PROPERTY_TYPE_LABEL[filter.syubetu]);

  if (filter.priceMinMan !== undefined || filter.priceMaxMan !== undefined) {
    const min = filter.priceMinMan?.toLocaleString() ?? "";
    const max = filter.priceMaxMan?.toLocaleString() ?? "";
    labels.push(`${min}〜${max}万円`);
  }

  if (filter.madori) {
    const bucket = MADORI_BUCKETS.find((b) => b.key === filter.madori);
    if (bucket) labels.push(bucket.label);
  }

  if (filter.maxAgeYears !== undefined) labels.push(`築${filter.maxAgeYears}年以内`);
  if (filter.priceDown) labels.push("価格変更あり");
  if (filter.reformTarget) labels.push("リノベーション向き");

  return labels;
}
