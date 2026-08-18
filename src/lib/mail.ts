import nodemailer from "nodemailer";
import { COMPANY, MAIL_FROM, SITE_ORIGIN, MAIL_SIGNATURE } from "@/config/company";
import { isMailSendingEnabled } from "@/lib/killSwitch";

async function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
}

export async function sendRegistrationEmail(data: {
  name: string;
  email: string;
  tel: string;
}) {
  try {
    // O-05：停止スイッチ。事故時にコードを直さず送信を止められるようにしてある。
    if (!(await isMailSendingEnabled())) {
      console.warn("停止スイッチが入っているため、メールを送信しませんでした。");
      return false;
    }

    const transporter = await createTransporter();

    const mailOptions = {
      from: `"${MAIL_FROM.name}" <${MAIL_FROM.address}>`,
      to: data.email,
      subject: `【${COMPANY.shortName}】無料会員登録が完了しました`,
      text: `${data.name} 様

中古住宅×リノベーション RENOEL の無料会員にご登録いただき、誠にありがとうございます。
以下の内容で登録が完了いたしました。

■ 登録内容の控え
--------------------------------------------------
お名前: ${data.name} 様
ログインID(メールアドレス): ${data.email}
お電話番号: ${data.tel || "未登録"}
--------------------------------------------------

※ セキュリティの観点から、パスワードは記載しておりません。
ご自身で設定されたパスワードを用いて、以下のURLよりマイページへログインいただけます。

▼ マイページ（ログイン）
${SITE_ORIGIN}/mypage

ご希望条件に合った物件情報の提供や、会員限定の非公開物件の閲覧などをぜひご活用ください。

${MAIL_SIGNATURE}`
    };

    const info = await transporter.sendMail(mailOptions);

    console.log("===========================================");
    console.log("✉️ 登録完了メールを送信しました");
    if (info.messageId && !process.env.SMTP_HOST) {
      console.log("プレビューURL: %s", nodemailer.getTestMessageUrl(info));
    }
    console.log("===========================================");

    return true;
  } catch (error) {
    console.error("メール送信エラー:", error);
    return false;
  }
}

export async function sendInquiryEmail(data: {
  name: string;
  email: string;
  tel: string;
  message: string;
  propertyTitle: string;
}) {
  try {
    // O-05：停止スイッチ。事故時にコードを直さず送信を止められるようにしてある。
    if (!(await isMailSendingEnabled())) {
      console.warn("停止スイッチが入っているため、メールを送信しませんでした。");
      return false;
    }

    const transporter = await createTransporter();

    const mailOptions = {
      from: `"${MAIL_FROM.name}" <${MAIL_FROM.address}>`,
      to: data.email,
      subject: `【${COMPANY.shortName}】物件へのお問い合わせを承りました`,
      text: `${data.name} 様

中古住宅×リノベーション RENOEL です。
以下の内容で物件へのお問い合わせを承りました。
担当者より順次ご返信いたしますので、今しばらくお待ちください。

■ お問い合わせ内容
--------------------------------------------------
【対象物件】 ${data.propertyTitle}
【お名前】 ${data.name} 様
【メールアドレス】 ${data.email}
【お電話番号】 ${data.tel || "未記入"}

【お問い合わせ内容】
${data.message}
--------------------------------------------------

${MAIL_SIGNATURE}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("===========================================");
    console.log("✉️ お問い合わせ完了メールを送信しました");
    if (info.messageId && !process.env.SMTP_HOST) {
      console.log("プレビューURL: %s", nodemailer.getTestMessageUrl(info));
    }
    console.log("===========================================");
    return true;
  } catch (error) {
    console.error("お問い合わせメール送信エラー:", error);
    return false;
  }
}
