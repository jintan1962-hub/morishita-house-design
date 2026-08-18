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
    zip: "385-0029",
    address: "テスト県テスト市1-1-1",
  },
  {
    email: "member@example.invalid",
    name: "開発 会員",
    role: "USER",
    memberType: "MEMBER",
    tel: "090-0000-0002",
    zip: "385-0029",
    address: "テスト県テスト市2-2-2",
  },
];

const properties = [
  {
    objMngNo: 1001,
    syubetu: 2,
    syumoku: "中古一戸建て",
    title: "佐久平 南向き中古戸建",
    priceMan: 2980,
    madori: "4LDK",
    landMen: 200.15,
    bldMen: 125.4,
    bldStructure: "木造2階建",
    bldY: 2009,
    bldM: 6,
    address: "長野県佐久市佐久平1-1",
    prefCd: "20",
    cityCd: "20217",
    disclosureLevel: 0, // 一般公開
  },
  {
    objMngNo: 1002,
    syubetu: 2,
    syumoku: "中古マンション",
    title: "小諸駅前 リノベ済マンション",
    priceMan: 1850,
    madori: "3LDK",
    landMen: null,
    bldMen: 72.3,
    bldStructure: "RC造",
    bldY: 2005,
    bldM: 3,
    address: "長野県小諸市相生町2-2",
    prefCd: "20",
    cityCd: "20208",
    disclosureLevel: 0, // 一般公開
  },
  {
    objMngNo: 1003,
    syubetu: 2,
    syumoku: "中古一戸建て",
    title: "軽井沢 未公開別荘地戸建",
    priceMan: 3200,
    madori: "3LDK",
    landMen: 330.0,
    bldMen: 98.6,
    bldStructure: "木造平屋",
    bldY: 2012,
    bldM: 9,
    address: "長野県北佐久郡軽井沢町長倉3-3",
    prefCd: "20",
    cityCd: "20321",
    disclosureLevel: 1, // 会員限定 ← 未ログインでは価格・所在地が返らないことの確認用
  },
  {
    objMngNo: 1004,
    syubetu: 3,
    syumoku: "収益物件",
    title: "御代田 一棟アパート",
    priceMan: 4500,
    madori: "1K×8戸",
    landMen: 450.0,
    bldMen: 260.0,
    bldStructure: "軽量鉄骨",
    bldY: 2015,
    bldM: 4,
    address: "長野県北佐久郡御代田町馬瀬口4-4",
    prefCd: "20",
    cityCd: "20323",
    disclosureLevel: 1, // 会員限定
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
