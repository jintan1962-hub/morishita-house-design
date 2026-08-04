const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log("Querying all users from Supabase...")
  const users = await prisma.user.findMany();
  console.log(`Current users in DB (${users.length}):`);
  users.forEach(u => {
    console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}, Status: ${u.status}`);
  });
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
