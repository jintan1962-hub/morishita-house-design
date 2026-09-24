import test from "node:test";
import assert from "node:assert/strict";
import {
  buildBulkUpsert,
  BULK_UPSERT_COLUMNS,
  type BulkUpsertRow,
} from "./propertyBulkUpsert.ts";

/** 全列を埋めた1行を作る。文字列の列には列名を入れ、並びのずれを見つけやすくする。 */
function row(objMngNo: bigint): BulkUpsertRow {
  const r: Record<string, string | number | bigint | Date | null> = {};
  for (const [name, sqlType] of BULK_UPSERT_COLUMNS) {
    r[name] =
      sqlType === "bigint" ? objMngNo
      : sqlType === "integer" || sqlType === "double precision" ? 1
      : sqlType === "timestamp" ? new Date("2026-09-02T00:00:00.000Z")
      : name;
  }
  return r as BulkUpsertRow;
}

/** SQL に渡す JSON を戻す。 */
function payloadOf(rows: BulkUpsertRow[]): Record<string, unknown>[] {
  return JSON.parse(buildBulkUpsert(rows).values[0]);
}

test("引数は JSON 1個だけ（行数が増えても増えない）", () => {
  const one = buildBulkUpsert([row(BigInt(1))]);
  const many = buildBulkUpsert(Array.from({ length: 2000 }, (_, i) => row(BigInt(i))));
  assert.equal(one.values.length, 1);
  assert.equal(many.values.length, 1);
  // 文に現れる引数も $1 だけ
  assert.equal((many.sql.match(/\$\d+/g) ?? []).join(","), "$1");
});

test("行の順序と件数が保たれる", () => {
  const payload = payloadOf([row(BigInt(1)), row(BigInt(2)), row(BigInt(3))]);
  assert.equal(payload.length, 3);
  assert.deepEqual(payload.map((r) => r.objMngNo), ["1", "2", "3"]);
});

test("全列が JSON に入る（列を足して値を忘れる事故を見張る）", () => {
  const [first] = payloadOf([row(BigInt(1))]);
  assert.deepEqual(
    Object.keys(first).sort(),
    BULK_UPSERT_COLUMNS.map(([name]) => name).sort()
  );
});

test("BigInt と Date は JSON にできる形に変える", () => {
  const [first] = payloadOf([row(BigInt(6991355520))]);
  assert.equal(first.objMngNo, "6991355520", "BigInt が文字列になっていない");
  assert.equal(first.publishedOn, "2026-09-02T00:00:00.000Z");
});

test("値が無い列は null になる（空文字にしない）", () => {
  const r = row(BigInt(1));
  (r as Record<string, unknown>).agencyName = null;
  const [first] = payloadOf([r]);
  assert.equal(first.agencyName, null);
});

test("全行が空の日時列でも組み立てられる（型を推測させない）", () => {
  const r = row(BigInt(1));
  (r as Record<string, unknown>).publishedOn = null;
  (r as Record<string, unknown>).nextUpdateOn = null;
  const { sql } = buildBulkUpsert([r]);
  // 日時は SQL 側で明示的に変換する
  assert.ok(sql.includes(`(r->>'publishedOn')::timestamptz AT TIME ZONE 'UTC'`));
  assert.equal(payloadOf([r])[0].publishedOn, null);
});

test("列ごとに型変換を書いている（text はそのまま）", () => {
  const { sql } = buildBulkUpsert([row(BigInt(1))]);
  for (const [name, sqlType] of BULK_UPSERT_COLUMNS) {
    if (sqlType === "text") {
      assert.ok(sql.includes(`r->>'${name}'`), `${name} の取り出しが無い`);
    } else if (sqlType !== "timestamp") {
      assert.ok(
        sql.includes(`(r->>'${name}')::${sqlType}`),
        `${name} の ${sqlType} への変換が無い`
      );
    }
  }
});

test("突合キーは objMngNo で、更新では createdAt を触らない", () => {
  const { sql } = buildBulkUpsert([row(BigInt(1))]);
  assert.match(sql, /ON CONFLICT \("objMngNo"\) DO UPDATE SET/);
  assert.ok(!sql.includes('"createdAt" = EXCLUDED'), "更新時に createdAt を上書きしている");
  assert.match(sql, /"updatedAt" = NOW\(\)/);
});

test("突合キー以外の全列が更新の対象になっている", () => {
  const { sql } = buildBulkUpsert([row(BigInt(1))]);
  for (const [name] of BULK_UPSERT_COLUMNS) {
    if (name === "objMngNo") continue;
    assert.ok(
      sql.includes(`"${name}" = EXCLUDED."${name}"`),
      `${name} が更新の対象から漏れている`
    );
  }
});

test("取り込む値はSQL文に入らない（引数として渡す）", () => {
  const evil = row(BigInt(1));
  (evil as Record<string, unknown>).title = "'); DROP TABLE \"Property\"; --";
  const { sql, values } = buildBulkUpsert([evil]);
  assert.ok(!sql.includes("DROP TABLE"), "入力がSQL文に混ざっている");
  assert.equal(JSON.parse(values[0])[0].title, "'); DROP TABLE \"Property\"; --");
});

test("行が空なら組み立てずに落とす", () => {
  assert.throws(() => buildBulkUpsert([]), /行が空/);
});
