"use server";

import prisma from "@/lib/prisma";
import { requireAdmin, authErrorMessage } from "@/lib/auth";
import { reportError } from "@/lib/errors";
import { MAIL_STATUS } from "@/lib/mail";

/** 一覧に出す件数の上限。全件を読み込んで管理画面が重くなるのを避ける。 */
const LIST_LIMIT = 200;

/**
 * メール送信ログの取得（管理者のみ）。
 * S-07：宛先メールアドレスを含むため、"use server" の冒頭で必ず認可を判定する。
 */
export async function getMailLogs() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false as const, error: authErrorMessage(auth.reason) };
  }

  try {
    const [logs, failedCount] = await Promise.all([
      prisma.mailLog.findMany({
        orderBy: { createdAt: "desc" },
        take: LIST_LIMIT,
      }),
      prisma.mailLog.count({ where: { status: MAIL_STATUS.FAILED } }),
    ]);
    return { success: true as const, data: { logs, failedCount } };
  } catch (error) {
    return reportError("getMailLogs", error, "メール送信ログを取得できませんでした。");
  }
}
