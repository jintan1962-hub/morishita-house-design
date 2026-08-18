import { PrismaClient } from "@/generated/client";

// D-09：PrismaClient の生成箇所はこの1ファイルだけにする。
// 各所で new PrismaClient() すると、開発時のホットリロードで接続が枯渇する。
const prismaClientSingleton = () => new PrismaClient();

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>;
}

const prisma = globalThis.prismaGlobal ?? prismaClientSingleton();

export default prisma;

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobal = prisma;
