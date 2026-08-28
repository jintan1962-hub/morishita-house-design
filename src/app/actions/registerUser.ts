"use server";

import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { reportError } from "@/lib/errors";
import { sendRegistrationEmail, sendRegistrationAdminNotice } from "@/lib/mail";
import { ROLE, USER_STATUS, RATE_LIMITS } from "@/config/security";
import { rateLimitByIp } from "@/lib/rateLimit";

/**
 * 既に登録がある（有効・退会済みを問わず）ときに返す文言。
 * S-12：どちらの状態かは伝えない。メールアドレスの在籍を1件ずつ確かめる手掛かりを減らす。
 * TODO:未確認 完全な非列挙にするには「常に成功扱いにして、既存アドレスには
 * “登録の試みがありました”メールを送る」方式へ変える必要がある。登録直後の自動ログイン
 * 導線（src/app/(home)/member/page.tsx）と両立しないため、仕様判断待ち。
 */
const ALREADY_REGISTERED_MESSAGE =
  "このメールアドレスはご利用いただけません。既にご登録がある場合はログインを、お心当たりがない場合はお問い合わせ窓口までご連絡ください。";

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

  // S-08 / S-12：未ログインでも叩ける。登録メールの増幅と、アドレス在籍の総当たりを
  // IP単位で遅くする。しきい値は RATE_LIMITS.registrationPerIp。
  const ipLimit = await rateLimitByIp("registration", RATE_LIMITS.registrationPerIp);
  if (!ipLimit.ok) {
    return {
      success: false as const,
      error:
        "短時間に登録の試みが集中しています。お手数ですが、しばらく時間をおいて再度お試しください。",
    };
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      // S-13 の論理削除により、退会済みでもレコードは残る（email は一意）。
      // S-12：有効／退会済みのどちらであっても同じ文言で返す（状態を推測させない）。
      return {
        success: false as const,
        error: ALREADY_REGISTERED_MESSAGE,
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
