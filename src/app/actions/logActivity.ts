"use server";

import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

/**
 * 物件の閲覧履歴を残す。ログインしていなければ何も記録しない。
 * S-09：残すのは「誰が（ID）・いつ・何を・どのレコードに（ID）」まで。
 * 物件名は公開情報なので残すが、長さは制限する。
 */
export async function logPropertyView(propertyId: number, propertyTitle: string) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return;
    if (!Number.isInteger(propertyId) || propertyId <= 0) return;

    await prisma.activityLog.create({
      data: {
        userId: auth.userId,
        action: "VIEW_PROPERTY",
        details: `物件ID: ${propertyId} (${propertyTitle.slice(0, 100)})`,
      },
    });
  } catch (error) {
    // D-07：握り潰さない。閲覧履歴の失敗で画面を止める必要はないのでログにだけ残す。
    console.error("Failed to log property view:", error);
  }
}
