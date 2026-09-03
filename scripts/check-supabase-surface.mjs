/**
 * Supabase の公開面をまとめて点検する（読み取りのみ）。
 *
 * 2026-09-03 の RLS 是正の続き。警告メールは public テーブルの件しか指摘しないため、
 * 同じ性質の穴（他スキーマの公開・Storage の公開設定・関数の search_path など）を自分で見る。
 *
 * 使い方: node scripts/check-supabase-surface.mjs .env.production.local
 */
import { readFileSync } from "node:fs";

const envPath = process.argv[2];
if (!envPath) {
  console.error("使い方: node scripts/check-supabase-surface.mjs <envファイル>");
  process.exit(1);
}

const env = readFileSync(envPath, "utf8");
const get = (k) => (env.match(new RegExp(`^${k}="?([^"\n]+)"?`, "m")) || [])[1];
const direct = get("DIRECT_URL") || "";
const pooled = get("DATABASE_URL") || "";
const sessionPooler = pooled.replace(":6543", ":5432").replace("?pgbouncer=true", "");
process.env.DATABASE_URL = /@db\.[a-z0-9]+\.supabase\.co/.test(direct)
  ? sessionPooler
  : direct || sessionPooler;

const { PrismaClient } = await import("../src/generated/client/index.js");
const prisma = new PrismaClient();
const findings = [];

// 1. PostgREST が公開しているスキーマ。public 以外に自前のスキーマを置いていないか
const schemas = await prisma.$queryRawUnsafe(`
  select n.nspname as "schema",
         has_schema_privilege('anon', n.nspname, 'USAGE') as anon_usage,
         count(c.oid) filter (where c.relkind = 'r')::int as "tables"
  from pg_namespace n
  left join pg_class c on c.relnamespace = n.oid
  where n.nspname not like 'pg_%' and n.nspname <> 'information_schema'
  group by n.nspname order by n.nspname;`);
console.log("■ スキーマ一覧");
console.table(schemas);

// 2. public に anon が触れるテーブルが残っていないか（RLS 是正の再確認）
const openTables = await prisma.$queryRawUnsafe(`
  select n.nspname || '.' || c.relname as "table", c.relrowsecurity as rls
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.relkind = 'r' and n.nspname = 'public'
    and (has_table_privilege('anon', c.oid, 'SELECT')
      or has_table_privilege('anon', c.oid, 'INSERT')
      or has_table_privilege('anon', c.oid, 'UPDATE')
      or has_table_privilege('anon', c.oid, 'DELETE'));`);
console.log("■ anon が権限を持つ public テーブル");
if (openTables.length === 0) console.log("  なし");
else {
  console.table(openTables);
  findings.push(`public に anon が触れるテーブルが ${openTables.length} 件残っている`);
}

// 3. SECURITY DEFINER のビュー・関数。呼び出し元の権限を無視して動くので公開面では危険
const definers = await prisma.$queryRawUnsafe(`
  select p.proname as "function",
         p.prosecdef as security_definer,
         coalesce(array_to_string(p.proconfig, ','), '(なし)') as config
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prosecdef;`);
console.log("■ public の SECURITY DEFINER 関数");
if (definers.length === 0) console.log("  なし");
else {
  console.table(definers);
  const noPath = definers.filter((d) => !d.config.includes("search_path"));
  if (noPath.length > 0) {
    findings.push(`SECURITY DEFINER 関数で search_path 未固定が ${noPath.length} 件`);
  }
}

// 4. Storage のバケット公開設定。public=true は誰でも中身を読める
const url = (get("SUPABASE_URL") || "").replace(/\/+$/, "");
const key = get("SUPABASE_SERVICE_ROLE_KEY") || "";
console.log("■ Storage のバケット");
if (url === "" || key === "") {
  console.log("  SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が無いので確認できない");
  findings.push("Storage のバケット設定は未確認");
} else {
  const res = await fetch(`${url}/storage/v1/bucket`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) {
    console.log(`  取得に失敗 (HTTP ${res.status})`);
    findings.push(`Storage のバケット設定を取得できなかった (HTTP ${res.status})`);
  } else {
    const buckets = await res.json();
    console.table(
      buckets.map((b) => ({
        name: b.name,
        public: b.public,
        file_size_limit: b.file_size_limit ?? "(無制限)",
        allowed_mime_types: b.allowed_mime_types?.join(",") ?? "(制限なし)",
      })),
    );
    for (const b of buckets.filter((b) => b.public)) {
      findings.push(`Storage バケット "${b.name}" が public（URLを知れば誰でも読める）`);
    }
  }
}

// 5. storage.objects のポリシー。anon に書き込みを許すポリシーがあると誰でも置ける
const storagePolicies = await prisma.$queryRawUnsafe(`
  select pol.polname as "policy",
         c.relname as "table",
         case pol.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT'
              when 'w' then 'UPDATE' when 'd' then 'DELETE' else 'ALL' end as "command",
         coalesce(array_to_string(array(
           select rolname from pg_roles where oid = any(pol.polroles)), ','), 'PUBLIC') as roles
  from pg_policy pol
  join pg_class c on c.oid = pol.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'storage';`);
console.log("■ storage スキーマのポリシー");
if (storagePolicies.length === 0) console.log("  なし（既定のまま）");
else console.table(storagePolicies);

console.log("\n■ まとめ");
if (findings.length === 0) console.log("指摘なし");
else findings.forEach((f, i) => console.log(`${i + 1}. ${f}`));

await prisma.$disconnect();
