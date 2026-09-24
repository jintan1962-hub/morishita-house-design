/**
 * RLS を有効にしたあと、アプリ（Prisma／postgres ロール）の読み書きが
 * 通ることを実データで確かめる。2026-09-03 の是正の検品用。
 *
 * 使い方: node scripts/check-rls-app-access.mjs .env.production.local
 *
 * 書き込みの確認には RateLimit テーブルを使う。ここは使い捨てのカウンタで、
 * 行を足しても消しても失う情報が無い（prisma/schema.prisma の注記のとおり）。
 * 入れた行はこのスクリプトの中で必ず消す。
 */
import { readFileSync } from "node:fs";

const envPath = process.argv[2];
if (!envPath) {
  console.error("使い方: node scripts/check-rls-app-access.mjs <envファイル>");
  process.exit(1);
}

const env = readFileSync(envPath, "utf8");
const get = (k) => (env.match(new RegExp(`^${k}="?([^"\n]+)"?`, "m")) || [])[1];
const direct = get("DIRECT_URL") || "";
const pooled = get("DATABASE_URL") || "";
const sessionPooler = pooled.replace(":6543", ":5432").replace("?pgbouncer=true", "");
// --pooled を付けると、Vercel の本番ランタイムが使う DATABASE_URL
// （トランザクションプーラー・6543）をそのまま使う。条件を本番と揃えたいとき用。
process.env.DATABASE_URL = process.argv.includes("--pooled")
  ? pooled
  : /@db\.[a-z0-9]+\.supabase\.co/.test(direct)
    ? sessionPooler
    : direct || sessionPooler;
console.log(
  `接続先: ${process.env.DATABASE_URL.replace(/:\/\/([^:]*):[^@]*@/, "://$1:********@")}`,
);

const { PrismaClient } = await import("../src/generated/client/index.js");
const prisma = new PrismaClient();

// 読み取り: 全テーブルを1回ずつ数える
const counts = {};
for (const model of [
  "property",
  "propertyImage",
  "propertyImportBackup",
  "systemSetting",
  "user",
  "rateLimit",
  "activityLog",
  "inquiry",
  "mailLog",
]) {
  counts[model] = await prisma[model].count();
}
console.table([counts]);

// 書き込み: 検証用の行を1つ入れて、読み直して、消す
const bucket = `rls-check:${Date.now()}`;
let writeOk = false;
try {
  await prisma.rateLimit.create({
    data: { bucket, count: 1, windowEndsAt: new Date(Date.now() + 60_000) },
  });
  const back = await prisma.rateLimit.findUnique({ where: { bucket } });
  writeOk = back?.count === 1;
} finally {
  await prisma.rateLimit.deleteMany({ where: { bucket } });
}
const leftover = await prisma.rateLimit.count({ where: { bucket } });

console.log(`読み取り: ${Object.keys(counts).length} テーブルすべて成功`);
console.log(`書き込み（INSERT→SELECT→DELETE）: ${writeOk ? "成功" : "失敗"}`);
console.log(`検証行の後始末: ${leftover === 0 ? "残骸なし" : `残骸あり(${leftover}件)`}`);

await prisma.$disconnect();
process.exit(writeOk && leftover === 0 ? 0 : 1);
