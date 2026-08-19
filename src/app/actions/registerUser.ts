"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { reportError } from "@/lib/errors";
import { sendRegistrationEmail, sendRegistrationAdminNotice } from "@/lib/mail";
import { ROLE, USER_STATUS } from "@/config/security";

/** S-08：外部から受け取る値の長さを制限する。 */
const LIMITS = { name: 100, email: 254, tel: 30, zip: 10, address: 200 } as const;
/** パスワードの最低文字数。 */
const MIN_PASSWORD_LENGTH = 8;

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= LIMITS.email;
}

export async function registerUser(formData: FormData) {
  const email = formData.get("email")?.toString()?.trim();
  const password = formData.get("password")?.toString();
  const passwordConfirm = formData.get("passwordConfirm")?.toString();
  const name = formData.get("name")?.toString()?.trim();
  const tel = formData.get("tel")?.toString()?.trim();
  const zip = formData.get("zip")?.toString()?.trim();
  const address = formData.get("address")?.toString()?.trim();

  if (!email || !password) {
    return { success: false as const, error: "メールアドレスとパスワードは必須です" };
  }
  if (!isValidEmail(email)) {
    return { success: false as const, error: "メールアドレスの形式が正しくありません" };
  }
  if (password !== passwordConfirm) {
    return { success: false as const, error: "パスワードが一致しません" };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      success: false as const,
      error: `パスワードは${MIN_PASSWORD_LENGTH}文字以上にしてください`,
    };
  }
  if (
    (name && name.length > LIMITS.name) ||
    (tel && tel.length > LIMITS.tel) ||
    (zip && zip.length > LIMITS.zip) ||
    (address && address.length > LIMITS.address)
  ) {
    return { success: false as const, error: "入力された文字数が上限を超えています" };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // S-13 の論理削除により、退会済みでもレコードは残る（email は一意）。
      // 復帰は本人確認が必要なため、自動では再登録させず窓口へ案内する。
      if (existingUser.deletedAt !== null) {
        return {
          success: false as const,
          error:
            "このメールアドレスは過去に退会された会員のものです。お手数ですがお問い合わせ窓口までご連絡ください。",
        };
      }
      return {
        success: false as const,
        error: "このメールアドレスは既に登録されています",
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        tel,
        zip,
        address,
        // 会員登録から管理者権限は絶対に付与しない（S-07）
        role: ROLE.USER,
        status: USER_STATUS.ACTIVE,
        memberType: "MEMBER",
      },
    });

    // メール送信が失敗しても、登録そのものは成立している。
    // 失敗は MailLog に記録され、管理画面 /admin/mail-logs から確認できる。
    const notice = { name: name || "ゲスト", email, tel: tel || "" };
    const mail = await sendRegistrationEmail(notice);
    await sendRegistrationAdminNotice(notice);

    // D-03：届いていないのに「送信しました」と画面に出さない。
    // 実際の送信結果を返し、画面側で文言を出し分ける。
    return { success: true as const, mailSent: mail.ok };
  } catch (error) {
    return reportError("registerUser", error, "登録できませんでした。");
  }
}
