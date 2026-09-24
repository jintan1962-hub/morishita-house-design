import { AlertTriangle, CheckCircle2, MinusCircle } from "lucide-react";
import { getMailLogs } from "@/app/actions/mailLogs";
import { MAIL_STATUS } from "@/lib/mail";

/** 送信の種類を日本語にする。DBには英字で入れ、表示のときだけ訳す。 */
const KIND_LABEL: Record<string, string> = {
  REGISTRATION: "会員登録の完了（本人宛）",
  REGISTRATION_ADMIN: "新規入会の通知（管理者宛）",
  INQUIRY: "問い合わせ受付（本人宛）",
  INQUIRY_ADMIN: "問い合わせ着信（管理者宛）",
};

function StatusBadge({ status }: { status: string }) {
  if (status === MAIL_STATUS.SENT) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-teal bg-teal/5 px-2 py-1 rounded-full whitespace-nowrap">
        <CheckCircle2 size={13} /> 送信済
      </span>
    );
  }
  if (status === MAIL_STATUS.FAILED) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-bold text-red-700 bg-red-50 px-2 py-1 rounded-full whitespace-nowrap">
        <AlertTriangle size={13} /> 失敗
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-reno-mute-dark bg-reno-bg px-2 py-1 rounded-full whitespace-nowrap">
      <MinusCircle size={13} /> 未送信
    </span>
  );
}

export default async function AdminMailLogsPage() {
  const res = await getMailLogs();
  const logs = res.success ? res.data.logs : [];
  const failedCount = res.success ? res.data.failedCount : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ink mb-2">メール送信ログ</h1>
        <p className="text-sm text-reno-mute-dark">
          会員登録の完了メール・お問い合わせの控えと通知メールの送信結果。
          「失敗」が出ている間、その相手には自動返信が届いていない。
        </p>
      </div>

      {!res.success && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm font-bold text-red-800">
          {res.error}
        </div>
      )}

      {failedCount > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-3">
          <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
          <div className="text-sm text-red-800">
            <p className="font-bold mb-1">送信に失敗したメールが {failedCount} 件あります。</p>
            <p className="font-medium">
              下の「理由」欄を確認してください。RESEND_API_KEY の未設定・送信ドメインの未認証が
              代表的な原因です。原因を直したあと、必要なら該当のお客様へ手動で連絡してください
              （再送の機能はまだありません）。
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-reno-line overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-reno-bg text-left">
              <tr className="text-xs font-bold text-reno-mute-dark">
                <th className="px-6 py-4 whitespace-nowrap">日時</th>
                <th className="px-6 py-4 whitespace-nowrap">状態</th>
                <th className="px-6 py-4 whitespace-nowrap">種類</th>
                <th className="px-6 py-4 whitespace-nowrap">宛先</th>
                <th className="px-6 py-4">理由 / メッセージID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-reno-line">
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-reno-mute-dark font-bold">
                    記録がありません。
                  </td>
                </tr>
              )}
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-reno-bg/50">
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-reno-mute-dark">
                    {log.createdAt.toLocaleString("ja-JP")}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={log.status} />
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-ink whitespace-nowrap">
                    {KIND_LABEL[log.kind] ?? log.kind}
                  </td>
                  <td className="px-6 py-4 text-xs font-medium text-ink">{log.to || "（宛先未設定）"}</td>
                  <td className="px-6 py-4 text-xs font-medium text-reno-mute-dark break-all">
                    {log.reason ?? log.providerId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
