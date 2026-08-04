"use server";

import { PrismaClient } from "../../generated/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export async function getUsers() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, error: String(error) };
  }
}

export async function getUserById(id: number) {
  try {
    return await prisma.user.findUnique({
      where: { id },
    });
  } catch (error) {
    return null;
  }
}

export async function updateUserStatus(id: number, status: string) {
  try {
    const user = await prisma.user.update({
      where: { id },
      data: { status },
    });
    revalidatePath("/admin/users");
    return user;
  } catch (error) {
    return null;
  }
}

export async function deleteUser(id: number) {
  try {
    const user = await prisma.user.delete({
      where: { id },
    });
    revalidatePath("/admin/users");
    return user;
  } catch (error) {
    return null;
  }
}

export async function createTestUsers() {
  try {
    const users = [
      { name: "山田 健太", email: "yamada@example.com", tel: "090-1111-2222", address: "宮城県仙台市...", memberType: "FREE", status: "ACTIVE" },
      { name: "佐藤 拓也", email: "sato@example.com", tel: "080-3333-4444", address: "宮城県名取市...", memberType: "STORE", status: "ACTIVE" },
    ];

    for (const user of users) {
      await prisma.user.upsert({
        where: { email: user.email },
        update: {},
        create: user,
      });
    }
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: String(error) };
  }
}
