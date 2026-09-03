/**
 * public スキーマのテーブルが公開ロールから守られているかを確認する（読み取りのみ）。
 *
 * 2026-09-03 の Supabase セキュリティ警告（rls_disabled_in_public /
 * sensitive_columns_exposed）への是正が効いているかを、適用の前後で見るために置いた。
 *
 * 使い方: node scripts/check-rls.mjs .env.production.local
 *
 * 合格の形:
 *   - rls が全テーブルで true
 *   - anon_select / anon_insert / auth_select が全テーブルで false
 *   - policies は 0 のままでよい（ポリシーを作らない＝既定で全拒否。
 *     アプリは所有者 postgres で接続するため RLS を素通りする）
 *
 * 接続について:
 *   直結ホスト db.<ref>.supabase.co は IPv6 のみで、IPv4 だけの回線からは届かない。
 *   その場合はセッションプーラー（ポート5432）へ自動で振り替える。
 */
import { readFileSync } from "node:fs";

const envPath = process.argv[2];
if (!envPath) {
  console.error("使い方: node scripts/check-rls.mjs <envファイル>");
  process.exit(1);
}

const env = readFileSync(envPath, "utf8");
const get = (k) => (env.match(new RegExp(`^${k}="?([^"\n]+)"?`, "m")) || [])[1];

const direct = get("DIRECT_URL") || "";
const pooled = get("DATABASE_URL") || "";
// 直結ホストは IPv6 専用。届かない環境では transaction pooler(6543) を
// session pooler(5432) に読み替えて使う
const sessionPooler = pooled.replace(":6543", ":5432").replace("?pgbouncer=true", "");
process.env.DATABASE_URL = /@db\.[a-z0-9]+\.supabase\.co/.test(direct)
  ? sessionPooler
  : direct || sessionPooler;

const { PrismaClient } = await import("../src/generated/client/index.js");
const prisma = new PrismaClient();

const tables = await prisma.$queryRawUnsafe(`
  select c.relname as "table",
         c.relrowsecurity as rls,
         (select count(*) from pg_policy pol where pol.polrelid = c.oid)::int as policies,
         has_table_privilege('anon', c.oid, 'SELECT') as anon_select,
         has_table_privilege('anon', c.oid, 'INSERT') as anon_insert,
         has_table_privilege('authenticated', c.oid, 'SELECT') as auth_select
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
  order by c.relname;`);
console.table(tables);

const conn = await prisma.$queryRawUnsafe(`
  select current_user as "接続ロール",
         pg_get_userbyid(c.relowner) as "テーブル所有者",
         has_schema_privilege('anon', 'public', 'USAGE') as "anon_schema_usage",
         has_schema_privilege('authenticated', 'public', 'USAGE') as "auth_schema_usage"
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'User';`);
console.table(conn);

const ng = tables.filter(
  (t) => !t.rls || t.anon_select || t.anon_insert || t.auth_select,
);
console.log(
  ng.length === 0
    ? "合格: public の全テーブルで RLS が有効、公開ロールの権限なし"
    : `不合格: ${ng.length} 件が未是正 → ${ng.map((t) => t.table).join(", ")}`,
);

await prisma.$disconnect();
process.exit(ng.length === 0 ? 0 : 1);
