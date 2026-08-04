const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log("Creating test users...")
  const users = [
    { name: "山田 健太", email: "yamada@example.com", tel: "090-1111-2222", address: "宮城県仙台市...", memberType: "FREE", status: "ACTIVE" },
    { name: "佐藤 拓也", email: "sato@example.com", tel: "080-3333-4444", address: "宮城県名取市...", memberType: "STORE", status: "ACTIVE" },
  ];

  for (const user of users) {
    try {
      const result = await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: user,
      });
      console.log(`User ${user.email} processed:`, result.id);
    } catch (e) {
      console.error(`Error processing ${user.email}:`, e.message);
      throw e;
    }
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
