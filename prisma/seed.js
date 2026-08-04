const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.property.create({
    data: {
      objMngNo: 134295,
      syubetu: 2,
      syumoku: "中古",
      title: "仙台市青葉区中山吉成1丁目 5LDK",
      priceMan: 2480,
      madori: "5LDK",
      landMen: 200.15,
      bldMen: 125.40,
      bldStructure: "木造2階建",
      bldY: 2009,
      bldM: 6,
      address: "宮城県仙台市青葉区中山吉成1丁目",
      prefCd: "04",
      cityCd: "04101",
      elementarySchool: "中山小学校",
      juniorHighSchool: "中山中学校",
      currentState: "空家",
      disclosureLevel: 0,
      priceDown: true,
      reformTarget: true,
    },
  });

  console.log("Seed data created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
