"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin, requireUser, authErrorMessage } from "@/lib/auth";
import { reportError } from "@/lib/errors";
import { sendInquiryEmail, sendInquiryAdminNotice } from "@/lib/mail";

/** S-08：外部から受け取る値の長さを制限する。 */
const LIMITS = { name: 100, email: 254, tel: 30, message: 4000 } as const;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= LIMITS.email;
}

/**
 * 物件への問い合わせ送信。未ログインでも送れる（公開フォーム）。
 * ログイン済みの場合だけ、本人の行動履歴に残す。
 */
export async function submitInquiry(formData: FormData) {
  try {
    // ログインしていれば本人のIDを使う。フォームから来たIDは信用しない。
    const auth = await requireUser();
    const userId = auth.ok ? auth.userId : null;

    const propertyIdStr = formData.get("propertyId")?.toString();
    const parsedPropertyId = propertyIdStr ? parseInt(propertyIdStr) : NaN;
    const propertyId = Number.isInteger(parsedPropertyId) ? parsedPropertyId : null;
    const propertyTitle =
      formData.get("propertyTitle")?.toString()?.slice(0, LIMITS.name) || "不明な物件";

    const name = formData.get("name")?.toString()?.trim();
    const email = formData.get("email")?.toString()?.trim();
    const tel = formData.get("tel")?.toString()?.trim();
    const message = formData.get("message")?.toString()?.trim();

    if (!name || !email || !message) {
      return {
        success: false as const,
        error: "お名前、メールアドレス、お問い合わせ内容は必須です",
      };
    }
    if (!isValidEmail(email)) {
      return { success: false as const, error: "メールアドレスの形式が正しくありません" };
    }
    if (
      name.length > LIMITS.name ||
      message.length > LIMITS.message ||
      (tel && tel.length > LIMITS.tel)
    ) {
      return { success: false as const, error: "入力された文字数が上限を超えています" };
    }

    const inquiry = await prisma.inquiry.create({
      data: { propertyId, userId, name, email, tel, message },
    });

    // 管理者が受信箱だけで対応できるよう、通知メールにも物件管理番号を入れる。
    const property =
      propertyId === null || propertyId === undefined
        ? null
        : await prisma.property.findUnique({
            where: { id: propertyId },
            select: { objMngNo: true },
          });

    // メール送信が失敗しても、問い合わせ自体は受け付け済みとして扱う。
    // ここで例外を投げると、保存できているのに利用者へ失敗と伝えることになる。
    const notice = { name, email, tel: tel || "", message, propertyTitle };
    const mail = await sendInquiryEmail(notice);
    // 管理者が管理画面を見に行かなくても着信に気付けるようにする。
    await sendInquiryAdminNotice({
      ...notice,
      inquiryId: inquiry.id,
      propertyObjMngNo: property ? property.objMngNo.toString() : null,
    });

    if (userId) {
      await prisma.activityLog.create({
        data: {
          userId,
          action: "INQUIRY",
          // S-09：問い合わせ本文や氏名はログに残さない。物件IDまで。
          details: `物件ID: ${propertyId ?? "-"}`,
        },
      });
    }

    // C-04：ここで以前は別関数のローカル変数 updatedInquiry を返しており、
    // 常に ReferenceError → catch へ落ちて「送信中にエラーが発生しました」と表示していた。
    // 保存もメール送信も成功しているのに失敗と伝えるため、利用者が再送信し重複が発生していた。
    // D-03：控えメールが送れていないのに「送信しました」と画面に出さない。
    return { success: true as const, data: { id: inquiry.id }, mailSent: mail.ok };
  } catch (error) {
    return reportError("submitInquiry", error, "送信できませんでした。");
  }
}

/** 問い合わせ一覧（管理者のみ）。氏名・メール・電話・本文を含むため認可必須。 */
export async function getInquiries() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false as const, error: authErrorMessage(auth.reason) };
  }

  try {
    const inquiries = await prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Inquiry は Property へのリレーションを持っていない（propertyId は素の数値）ため、
    // 必要な物件だけをまとめて引いて対応付ける。1件ずつ引くとN+1になる。
    const propertyIds = [
      ...new Set(inquiries.map((i) => i.propertyId).filter((id): id is number => id !== null)),
    ];
    const properties =
      propertyIds.length === 0
        ? []
        : await prisma.property.findMany({
            where: { id: { in: propertyIds } },
            select: { id: true, objMngNo: true, title: true },
          });
    const byId = new Map(properties.map((p) => [p.id, p]));

    return {
      success: true as const,
      data: inquiries.map((inq) => {
        const property = inq.propertyId === null ? undefined : byId.get(inq.propertyId);
        return {
          ...inq,
          // 物件管理番号（athome の番号）。BigInt は画面へ渡せないため文字列にする。
          // 物件が削除されている場合は null。
          propertyObjMngNo: property ? property.objMngNo.toString() : null,
          propertyTitle: property?.title ?? null,
        };
      }),
    };
  } catch (error) {
    return reportError("getInquiries", error, "お問い合わせを取得できませんでした。");
  }
}

/** 対応ステータスの更新（管理者のみ）。 */
export async function updateInquiryStatus(id: number, status: string) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false as const, error: authErrorMessage(auth.reason) };
  }

  try {
    const dataToUpdate: { status: string; repliedAt?: Date | null } = { status };
    if (status === "REPLIED") {
      dataToUpdate.repliedAt = new Date();
    } else if (status === "UNREAD") {
      dataToUpdate.repliedAt = null;
    }

    const updatedInquiry = await prisma.inquiry.update({
      where: { id },
      data: dataToUpdate,
    });
    revalidatePath("/admin/inquiries");
    return { success: true as const, data: updatedInquiry };
  } catch (error) {
    return reportError("updateInquiryStatus", error, "ステータスを更新できませんでした。");
  }
}
