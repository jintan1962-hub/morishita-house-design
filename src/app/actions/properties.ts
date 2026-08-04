"use server";

import { PrismaClient } from "../../generated/client";
import { revalidatePath } from "next/cache";

const prisma = new PrismaClient();

export type DiffResult = {
  type: "new" | "update" | "no_change";
  current?: any;
  incoming: any;
  changes?: string[];
};

export async function getProperties() {
  return await prisma.property.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { images: true }
  });
}

export async function compareCSVData(csvData: any[]): Promise<DiffResult[]> {
  const results: DiffResult[] = [];

  for (const item of csvData) {
    const objMngNo = parseInt(item.objMngNo);
    if (isNaN(objMngNo)) continue;

    const existing = await prisma.property.findUnique({
      where: { objMngNo },
    });

    if (!existing) {
      results.push({
        type: "new",
        incoming: item,
      });
    } else {
      const changes: string[] = [];
      const incomingPrice = parseInt(item.priceMan);
      
      if (existing.title !== item.title) changes.push("物件名");
      if (existing.priceMan !== incomingPrice) changes.push("価格");
      if (existing.address !== item.address) changes.push("所在地");
      if (existing.madori !== item.madori) changes.push("間取り");
      if (existing.disclosureLevel !== parseInt(item.disclosureLevel)) changes.push("公開レベル");

      results.push({
        type: changes.length > 0 ? "update" : "no_change",
        current: existing,
        incoming: item,
        changes,
      });
    }
  }

  return results;
}

export async function importProperties(approvedItems: any[]) {
  const operations = approvedItems.map((item) => {
    const data = {
      objMngNo: parseInt(item.objMngNo),
      syubetu: parseInt(item.syubetu) || 2,
      syumoku: item.syumoku || "中古",
      title: item.title,
      priceMan: parseInt(item.priceMan),
      madori: item.madori,
      landMen: parseFloat(item.landMen) || null,
      bldMen: parseFloat(item.bldMen) || null,
      bldStructure: item.bldStructure || "",
      bldY: parseInt(item.bldY) || null,
      bldM: parseInt(item.bldM) || null,
      address: item.address,
      prefCd: item.prefCd || "04",
      cityCd: item.cityCd || "04101",
      disclosureLevel: parseInt(item.disclosureLevel) || 0,
    };

    return prisma.property.upsert({
      where: { objMngNo: data.objMngNo },
      update: data,
      create: data,
    });
  });

  await Promise.all(operations);
  revalidatePath("/admin/properties");
  return { success: true, count: operations.length };
}
