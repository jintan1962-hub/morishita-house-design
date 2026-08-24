"use client";

import { useState, useEffect } from "react";
import {
  ArrowLeft, Mail, MapPin, History, ShieldCheck, ShieldOff, Phone,
  User as UserIcon, Loader2,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getUserById, updateUserStatus } from "@/app/actions/users";
import { USER_STATUS } from "@/config/security";

type ActivityLog = {
  id: number;
  action: string;
  details: string | null;
  createdAt: string | Date;
};

type UserWithLogs = {
  id: number;
  name: string | null;
  email: string;
  tel: string | null;
  address: string | null;
  zip: string | null;
  memberType: string;
  status: string;
  createdAt: string | Date;
  activityLogs?: ActivityLog[];
};

/** 活動ログの action を日本語にする。訳が無いものはそのまま出す。 */
const ACTION_LABEL: Record<string, string> = {
  LOGIN: "ログイン",
  VIEW_PROPERTY: "物件閲覧",
};

function DefinitionRow({
  icon: Icon, label, value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="text-reno-mute-dark mt-0.5 shrink-0" size={18} />
      <div className="min-w-0">
        <dt className="text-xs font-bold text-reno-mute-dark mb-0.5">{label}</dt>
        <dd className="text-sm font-bold text-ink break-all">{value}</dd>
      </div>
    </div>
  );
}

export default function UserDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [user, setUser] = useState<UserWithLogs | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const res = await getUserById(id);
        if (res.success && res.data) {
          setUser(res.data as UserWithLogs);
        } else {
          setErrorMessage(res.error ?? "会員データを取得できませんでした。");
        }
      } catch (error) {
        // D-07：握り潰さずログに残し、画面には内部情報を出さない
        console.error("会員データの取得に失敗:", error);
        setErrorMessage("通信エラーが発生しました。時間をおいて再度お試しください。");
      } finally {
        setIsLoading(false);
      }
    };
    void loadUser();
  }, [id]);

  /**
   * 有効／停止の切り替え。
   * これまでこの画面には押しても何も起きない「情報を編集する」ボタンだけが置かれ、
   * 実装済みの updateUserStatus はどこからも呼ばれていなかった。
   */
  const toggleStatus = async () => {
    if (!user || isSaving) return;
    const next =
      user.status === USER_STATUS.ACTIVE ? USER_STATUS.SUSPENDED : USER_STATUS.ACTIVE;
    const label = next === USER_STATUS.SUSPENDED ? "停止" : "有効";
    if (!confirm(`この会員を「${label}」にします。よろしいですか？`)) return;

    setIsSaving(true);
    setErrorMessage("");
    const res = await updateUserStatus(id, next);
    setIsSaving(false);
    if (!res.success) {
      setErrorMessage(res.error ?? "状態を変更できませんでした。");
      return;
    }
    setUser(res.data as UserWithLogs);
  };

  if (isLoading) {
    return (
      <p className="p-16 text-center text-sm font-bold text-reno-mute-dark">
        会員データを読み込み中です…
      </p>
    );
  }
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/admin/users"
          className="text-sm font-bold text-reno-mute-dark flex items-center gap-2 hover:text-teal"
        >
          <ArrowLeft size={18} />
          会員一覧へ戻る
        </Link>
        <p
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 rounded-2xl px-6 py-4 text-sm font-bold"
        >
          {errorMessage || "会員が見つかりませんでした。"}
        </p>
      </div>
    );
  }

  const isActive = user.status === USER_STATUS.ACTIVE;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <Link
          href="/admin/users"
          className="text-sm font-bold text-reno-mute-dark flex items-center gap-2 hover:text-teal transition-colors"
        >
          <ArrowLeft size={18} />
          会員一覧へ戻る
        </Link>
        <button
          onClick={toggleStatus}
          disabled={isSaving}
          className={`px-5 py-2.5 rounded-xl flex items-center gap-2 text-sm font-bold border transition-colors disabled:opacity-50 ${
            isActive
              ? "bg-white border-red-200 text-red-700 hover:bg-red-50"
              : "bg-white border-teal/40 text-teal hover:bg-teal/5"
          }`}
        >
          {isSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : isActive ? (
            <ShieldOff size={18} />
          ) : (
            <ShieldCheck size={18} />
          )}
          {isActive ? "この会員を停止する" : "この会員を有効に戻す"}
        </button>
      </div>

      {errorMessage && (
        <p
          role="alert"
          className="bg-red-50 border border-red-200 text-red-800 rounded-2xl px-6 py-4 text-sm font-bold"
        >
          {errorMessage}
        </p>
      )}

      <section className="bg-white p-8 rounded-2xl border border-reno-line">
        <div className="flex flex-col md:flex-row md:items-center gap-6 pb-6 border-b border-reno-line">
          <span className="w-20 h-20 bg-reno-bg text-ink rounded-full flex items-center justify-center text-2xl font-bold shrink-0">
            {(user.name ?? user.email).slice(0, 2)}
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-1">
              <h1 className="text-2xl font-mincho font-bold text-ink">
                {user.name || "名前未設定"}
              </h1>
              <span
                className={`px-2.5 py-1 rounded border text-xs font-bold flex items-center gap-1 ${
                  isActive
                    ? "border-teal/40 text-teal bg-teal/5"
                    : "border-red-200 text-red-700 bg-red-50"
                }`}
              >
                {isActive ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
                {isActive ? "有効" : "停止中"}
              </span>
              <span
                className={`px-2.5 py-1 rounded border text-xs font-bold ${
                  user.memberType === "STORE"
                    ? "border-pink/40 text-pink bg-pink/5"
                    : "border-reno-line text-reno-mute-dark bg-reno-bg"
                }`}
              >
                {user.memberType === "STORE" ? "店舗会員" : "無料会員"}
              </span>
            </div>
            <p className="text-sm text-reno-mute-dark break-all">{user.email}</p>
          </div>
        </div>

        <dl className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
          <DefinitionRow icon={Mail} label="メールアドレス" value={user.email} />
          <DefinitionRow icon={Phone} label="電話番号" value={user.tel || "未登録"} />
          <DefinitionRow
            icon={MapPin}
            label="住所"
            value={[user.zip && `〒${user.zip}`, user.address].filter(Boolean).join(" ") || "未登録"}
          />
          <DefinitionRow
            icon={UserIcon}
            label="登録日"
            value={new Date(user.createdAt).toLocaleString("ja-JP")}
          />
        </dl>
      </section>

      <section className="bg-white rounded-2xl border border-reno-line overflow-hidden">
        <h2 className="px-6 py-4 border-b border-reno-line text-base font-bold text-ink font-mincho flex items-center gap-2">
          <History size={20} className="text-teal" />
          活動履歴
          <span className="text-xs font-bold text-reno-mute-dark">（最新20件）</span>
        </h2>
        {/* お気に入り物件の欄があったが、お気に入りを保存する仕組みがDBに無く
            （src/app/actions/properties.ts のコメント参照）、常に空の欄だったため撤去した。 */}
        {!user.activityLogs || user.activityLogs.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm font-bold text-reno-mute-dark">
            履歴はまだありません。
          </p>
        ) : (
          <ul className="divide-y divide-reno-line">
            {user.activityLogs.map((log) => (
              <li key={log.id} className="flex flex-wrap gap-x-4 gap-y-1 px-6 py-4">
                <span className="text-sm font-bold text-reno-mute-dark whitespace-nowrap tabular-nums">
                  {new Date(log.createdAt).toLocaleString("ja-JP", {
                    year: "numeric", month: "2-digit", day: "2-digit",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
                <span className="text-sm font-bold text-ink">
                  {ACTION_LABEL[log.action] ?? log.action}
                </span>
                {log.details && (
                  <span className="text-sm text-reno-mute-dark w-full md:w-auto">{log.details}</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
