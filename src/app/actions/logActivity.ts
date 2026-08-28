"use server";

import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/auth";

/**
 * 物件の閲覧履歴を残す。ログインしていなければ何も記録しない。
 * S-09：残すのは「誰が（ID）・いつ・何を・どのレコードに（ID）」まで。
 *
 * 物件名は画面から受け取らずDBから引く。"use server" は直接叩けるため、
 * 画面から渡された文字列を信用すると ActivityLog に任意の文字列を書き込めてしまう
 * （実在しない物件IDでログを量産する・別物件の名前を混ぜる等）。
 */
export async function logPropertyView(propertyId: number) {
  try {
    const auth = await requireUser();
    if (!auth.ok) return;
    if (!Number.isInteger(propertyId) || propertyId <= 0) return;

    // 実在する物件のときだけ記録する。名前もこの結果から取る。
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { title: true },
    });
    if (!property) return;

    await prisma.activityLog.create({
      data: {
        userId: auth.userId,
        action: "VIEW_PROPERTY",
        // 形式は「物件ID: N (物件名)」。getPropertyForAdmin の集計がこの形に依存している。
        details: `物件ID: ${propertyId} (${property.title.slice(0, 100)})`,
      },
    });
  } catch (error) {
    // D-07：握り潰さない。閲覧履歴の失敗で画面を止める必要はないのでログにだけ残す。
    console.error("Failed to log property view:", error);
  }
}
