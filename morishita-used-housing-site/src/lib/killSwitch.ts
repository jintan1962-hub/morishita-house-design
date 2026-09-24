import prisma from "@/lib/prisma";

/**
 * O-05：外部送信を伴う処理を、コードを直さずに止めるためのスイッチ。
 * S-14 が求める「調査より先に止める」を実行できるようにするための前提。
 *
 * 止め方は2通り。どちらか一方でも「止める」側なら送信しない。
 *
 *  1. Supabase の SystemSetting テーブルで
 *     key = 'MAIL_SENDING_ENABLED' の value を 'false' にする（デプロイ不要・即時）
 *  2. 環境変数 MAIL_SENDING_DISABLED=true を設定する（再デプロイが必要）
 *
 * 慌てているときに触るのは 1 の想定。場所は README にも書いてある。
 * このスイッチは撤去期限の対象外（恒久的に置く）。
 */

export const MAIL_SENDING_ENABLED_KEY = "MAIL_SENDING_ENABLED";

/** DBの value が「止める」と読める値。表記ゆれで止まらない事故を防ぐため広めに取る。 */
const OFF_VALUES = new Set(["false", "0", "off", "no", "disabled", "stop"]);

/** 環境変数 MAIL_SENDING_DISABLED が「止める」と読める値。 */
const ON_VALUES = new Set(["true", "1", "on", "yes"]);

export async function isMailSendingEnabled(): Promise<boolean> {
  // 環境変数側のスイッチが入っていれば、DBを見るまでもなく止める
  const envDisabled = (process.env.MAIL_SENDING_DISABLED ?? "").trim().toLowerCase();
  if (ON_VALUES.has(envDisabled)) {
    return false;
  }

  try {
    const setting = await prisma.systemSetting.findUnique({
      where: { key: MAIL_SENDING_ENABLED_KEY },
    });
    // 行が無い場合は「有効」。スイッチの取り付け前に送信が全部止まると、
    // それはそれで障害になるため。
    if (!setting) return true;
    return !OFF_VALUES.has(setting.value.trim().toLowerCase());
  } catch (error) {
    // D-07：握り潰さずログに残す。
    // スイッチが読めないときは送信を続ける（読めないこと自体で全停止させない）。
    console.error("停止スイッチの状態を読めませんでした:", error);
    return true;
  }
}
