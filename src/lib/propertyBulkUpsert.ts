/**
 * 物件の一括取込を **SQL 1文** で行うための組み立て。
 *
 * 【なぜ必要か】
 * 以前は行数分の upsert を送っていた。ローカルでは959行が0.7秒で終わるが、
 * 本番は Vercel（関数）と Supabase（DBは ap-south-1）が離れており、
 * 1文ごとの往復時間が積み上がる。959文 × 往復およそ0.3秒で300秒を超え、
 * `Vercel Runtime Timeout Error: Task timed out after 300 seconds` で
 * 中止していた（2026-09-02）。文の数を減らさない限り、トランザクションの
 * 書き方を変えても解決しない。
 *
 * 【やり方】
 * 全行を JSON 1個にまとめて引数1つで渡し、`jsonb_array_elements` で行に開いて
 * 1文で流し込む。行数がいくつでも、送る文は1つ・引数は1つ。
 *
 * 【なぜ列ごとの配列ではなく JSON なのか】
 * 列ごとに配列を渡す形も試したが、ある列が全行 null だと、
 * ドライバがその配列の型を決められず `integer[]` として送ってしまい、
 * `cannot cast type integer[] to timestamp without time zone[]` で落ちた
 * （publishedOn / nextUpdateOn は空のことがあるため、実際に起きる）。
 * JSON なら値の型を推測させず、列ごとに SQL 側で明示的に変換できる。
 * 文字列の引用符・カンマ・波括弧の扱いも JSON に任せられる。
 *
 * 【SQL文を組み立てているが、入力は混ぜていない】
 * 文字列として組み立てるのは、下の表に**直書きした列名と型だけ**。
 * 取り込む値は JSON 1個にまとめて引数として渡す（SQL文には入らない）。
 */

export const BULK_UPSERT_COLUMNS = [
  ["objMngNo", "bigint"],
  ["syubetu", "integer"],
  ["syumoku", "text"],
  ["title", "text"],
  ["priceMan", "integer"],
  ["madori", "text"],
  ["landMen", "double precision"],
  ["bldMen", "double precision"],
  ["bldStructure", "text"],
  ["bldY", "integer"],
  ["bldM", "integer"],
  ["address", "text"],
  ["prefCd", "text"],
  ["cityCd", "text"],
  ["disclosureLevel", "integer"],
  ["currentState", "text"],
  ["trafficNote", "text"],
  ["trafficLine", "text"],
  ["trafficStation", "text"],
  ["walkMinutes", "integer"],
  ["leaseTermRent", "text"],
  ["keyMoney", "text"],
  ["depositGuarantee", "text"],
  ["maintenanceCost", "text"],
  ["otherLumpSum", "text"],
  ["floorsInfo", "text"],
  ["parking", "text"],
  ["landRight", "text"],
  ["deliveryTiming", "text"],
  ["transactionType", "text"],
  ["listingCompanyNo", "text"],
  ["publishedOn", "timestamp"],
  ["nextUpdateOn", "timestamp"],
  ["mgmtFeeYen", "integer"],
  ["repairFundYen", "integer"],
  ["totalUnits", "integer"],
  ["floorNo", "integer"],
  ["direction", "text"],
  ["balconyMen", "double precision"],
  ["mgmtForm", "text"],
  ["buildingCoverage", "integer"],
  ["floorAreaRatio", "integer"],
  ["zoning", "text"],
  ["landCategory", "text"],
  ["cityPlanning", "text"],
  ["roadAccess", "text"],
  ["privateRoad", "text"],
  ["agencyName", "text"],
  ["agencyAddress", "text"],
  ["agencyTel", "text"],
  ["agencyLicense", "text"],
] as const satisfies readonly (readonly [string, string])[];

/** 取込1行分。BULK_UPSERT_COLUMNS の列名をすべて持つ。 */
export type BulkUpsertRow = Record<
  (typeof BULK_UPSERT_COLUMNS)[number][0],
  string | number | bigint | boolean | Date | null
>;

/**
 * 全行を1文で書き込む SQL と、その引数を組み立てる。
 * 既に同じ `objMngNo` があれば更新する（突合キーは objMngNo）。
 *
 * `createdAt` は新規のときだけ入り、更新では触らない。
 * `updatedAt` は Prisma の `@updatedAt` が効かない経路なので、ここで明示的に入れる。
 *
 * @returns `sql` は `$1` を1つだけ含む文。`values` はその引数（JSON 文字列1個）。
 */
export function buildBulkUpsert(rows: readonly BulkUpsertRow[]): {
  sql: string;
  values: [string];
} {
  if (rows.length === 0) {
    throw new Error("buildBulkUpsert: 行が空のまま呼ばれた");
  }

  const columnNames = BULK_UPSERT_COLUMNS.map(([name]) => `"${name}"`).join(", ");

  // JSON の各値（text）を列の型へ変換する。値が無ければ null のまま入る。
  const selects = BULK_UPSERT_COLUMNS.map(([name, sqlType]) => {
    const value = `r->>'${name}'`;
    if (sqlType === "text") return value;
    // 日時は UTC の瞬間として解釈してから、時差を持たない列に合わせる
    // （Prisma が書くときと同じ形にそろえる）。
    if (sqlType === "timestamp") return `(${value})::timestamptz AT TIME ZONE 'UTC'`;
    return `(${value})::${sqlType}`;
  }).join(", ");

  // 更新の対象は突合キー以外の全列。createdAt は残す。
  const updates = BULK_UPSERT_COLUMNS.filter(([name]) => name !== "objMngNo")
    .map(([name]) => `"${name}" = EXCLUDED."${name}"`)
    .join(", ");

  const sql =
    `INSERT INTO "Property" (${columnNames}, "createdAt", "updatedAt") ` +
    `SELECT ${selects}, NOW(), NOW() ` +
    `FROM jsonb_array_elements($1::jsonb) AS r ` +
    `ON CONFLICT ("objMngNo") DO UPDATE SET ${updates}, "updatedAt" = NOW()`;

  // 行を JSON にする。BigInt と Date は JSON.stringify がそのままでは扱えない。
  // 数値は文字列にしても SQL 側で列の型へ変換するため、精度は落ちない。
  const payload = rows.map((row) => {
    const out: Record<string, string | number | boolean | null> = {};
    for (const [name] of BULK_UPSERT_COLUMNS) {
      const value = row[name];
      out[name] =
        value === null || value === undefined ? null
        : typeof value === "bigint" ? value.toString()
        : value instanceof Date ? value.toISOString()
        : value;
    }
    return out;
  });

  return { sql, values: [JSON.stringify(payload)] };
}
