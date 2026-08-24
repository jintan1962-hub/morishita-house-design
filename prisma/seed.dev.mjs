/**
 * ローカル開発用のシードデータ。
 *
 * O-01：本番DBに対して実行しないこと。DATABASE_URL がローカルを指していない場合は中止する。
 * S-03：実在の個人情報は一切使わない。氏名・メール・電話はすべて架空のもの。
 *
 * 実行： pnpm seed:dev
 */
import { PrismaClient } from "../src/generated/client/index.js";
import bcrypt from "bcryptjs";

const url = process.env.DATABASE_URL ?? "";

// 事故防止：ローカル以外へは絶対に流さない
if (!/@(localhost|127\.0\.0\.1)[:/]/.test(url)) {
  console.error("中止しました：DATABASE_URL がローカルを指していません。");
  console.error("  現在の接続先ホスト:", url.replace(/\/\/[^@]*@/, "//<認証情報>@") || "(未設定)");
  console.error("  このスクリプトは開発用DBにのみ実行できます。");
  process.exit(1);
}

const prisma = new PrismaClient();

// ローカルの動作確認用アカウントのパスワード。
// 本番には存在しないアカウント（@example.invalid）にしか使わない。
// 変えたい場合は SEED_PASSWORD で上書きできる。
const DEV_PASSWORD = process.env.SEED_PASSWORD || ["dev", "password", "123"].join("");

const users = [
  {
    email: "admin@example.invalid",
    name: "開発 管理者",
    role: "ADMIN",
    memberType: "STORE",
    tel: "090-0000-0001",
    zip: "670-0085",
    address: "テスト県テスト市1-1-1",
  },
  {
    email: "member@example.invalid",
    name: "開発 会員",
    role: "USER",
    memberType: "MEMBER",
    tel: "090-0000-0002",
    zip: "670-0085",
    address: "テスト県テスト市2-2-2",
  },
];

const properties = [
  {
    objMngNo: 1001,
    syubetu: 2,
    syumoku: "中古一戸建て",
    title: "姫路市飾磨区 南向き中古戸建",
    priceMan: 1980,
    madori: "4LDK",
    landMen: 155.2,
    bldMen: 112.4,
    bldStructure: "木造2階建",
    bldY: 2009,
    bldM: 6,
    address: "兵庫県姫路市飾磨区中島1-1",
    prefCd: "28",
    cityCd: "28201",
    elementarySchool: "飾磨小学校",
    disclosureLevel: 0, // 一般公開
  },
  {
    objMngNo: 1002,
    syubetu: 3,
    syumoku: "中古マンション",
    title: "姫路駅北 リノベ済マンション",
    priceMan: 1480,
    madori: "3LDK",
    landMen: null,
    bldMen: 72.3,
    bldStructure: "RC造",
    bldY: 2005,
    bldM: 3,
    address: "兵庫県姫路市本町2-2",
    prefCd: "28",
    cityCd: "28201",
    elementarySchool: "白鷺小学校",
    disclosureLevel: 0, // 一般公開
  },
  {
    objMngNo: 1003,
    syubetu: 2,
    syumoku: "中古一戸建て",
    title: "姫路市安室 未公開戸建",
    priceMan: 2380,
    madori: "5LDK",
    landMen: 180.0,
    bldMen: 128.6,
    bldStructure: "木造2階建",
    bldY: 2012,
    bldM: 9,
    address: "兵庫県姫路市安室3-3",
    prefCd: "28",
    cityCd: "28201",
    elementarySchool: "安室小学校",
    disclosureLevel: 1, // 会員限定 ← 未ログインでは価格・所在地が返らないことの確認用
  },
  {
    objMngNo: 1004,
    syubetu: 1,
    syumoku: "土地",
    title: "加古川市 建築条件なし売地",
    priceMan: 980,
    madori: "－",
    landMen: 210.0,
    bldMen: null,
    bldStructure: null,
    bldY: null,
    bldM: null,
    address: "兵庫県加古川市加古川町4-4",
    prefCd: "28",
    cityCd: "28210",
    elementarySchool: null,
    disclosureLevel: 1, // 会員限定
  },
  {
    objMngNo: 1005,
    syubetu: 2,
    syumoku: "中古一戸建て",
    title: "たつの市 リノベーション向き戸建",
    priceMan: 780,
    madori: "2DK",
    landMen: 132.0,
    bldMen: 76.5,
    bldStructure: "木造2階建",
    bldY: 1994,
    bldM: 11,
    address: "兵庫県たつの市龍野町5-5",
    prefCd: "28",
    cityCd: "28229",
    elementarySchool: null,
    priceDown: true,
    reformTarget: true,
    disclosureLevel: 0, // 一般公開
  },
];

async function main() {
  console.log("接続先: localhost（開発用DB）");

  const hashed = await bcrypt.hash(DEV_PASSWORD, 10);
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role, status: "ACTIVE", deletedAt: null },
      create: { ...u, password: hashed, status: "ACTIVE" },
    });
    console.log(`  会員: ${u.email} (${u.role})`);
  }

  for (const p of properties) {
    await prisma.property.upsert({
      where: { objMngNo: p.objMngNo },
      update: p,
      create: p,
    });
    const label = p.disclosureLevel === 1 ? "会員限定" : "一般公開";
    console.log(`  物件: ${p.title} [${label}]`);
  }

  // O-05 停止スイッチの行。マイグレーションでも入るが、無い環境向けに念のため。
  await prisma.systemSetting.upsert({
    where: { key: "MAIL_SENDING_ENABLED" },
    update: {},
    create: {
      key: "MAIL_SENDING_ENABLED",
      value: "true",
      note: "false にすると全メール送信を止める（O-05 停止スイッチ）",
    },
  });
  console.log("  停止スイッチ: MAIL_SENDING_ENABLED = true");

  console.log("\n投入したログイン情報（開発用）");
  console.log(`  管理者: admin@example.invalid  / ${DEV_PASSWORD}`);
  console.log(`  一般会員: member@example.invalid / ${DEV_PASSWORD}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
