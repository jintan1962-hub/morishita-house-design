"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, User, Mail, MapPin, History, Heart, ShieldCheck, Edit3, Phone } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getUserById } from "@/app/actions/users";

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
  memberType: string;
  status: string;
  activityLogs?: ActivityLog[];
};

export default function UserDetail() {
  const params = useParams();
  const id = Number(params.id);
  const [user, setUser] = useState<UserWithLogs | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setIsLoading(true);
      try {
        const res = await getUserById(id);
        if (res.success && res.data) {
          setUser(res.data as UserWithLogs);
        } else {
          console.error(res.error);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setIsLoading(false);
      }
    };
    void loadUser();
  }, [id]);

  if (isLoading) return <div className="p-20 text-center font-bold text-gray-400">会員データを読み込み中...</div>;
  if (!user) return <div className="p-20 text-center font-bold text-gray-400">会員が見つかりませんでした。</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Link href="/admin/users" className="text-sm font-bold text-gray-500 flex items-center gap-2 hover:text-blue-900 transition-colors">
          <ArrowLeft size={18} />
          会員一覧へ戻る
        </Link>
        <button className="bg-white border border-gray-200 px-6 py-2 rounded-xl flex items-center gap-2 font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
          <Edit3 size={18} />
          情報を編集する
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-32 bg-blue-900/5" />
            <div className="relative flex flex-col md:flex-row items-center gap-6 mb-8 mt-4">
              <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-3xl font-black shadow-inner">
                {user.name?.substring(0, 2) || "U"}
              </div>
              <div className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-1">
                  <h1 className="text-2xl font-black text-gray-900">{user.name || "名前未設定"}</h1>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black flex items-center gap-1 ${user.status === 'ACTIVE' ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-400'}`}>
                    <ShieldCheck size={10} /> {user.status === 'ACTIVE' ? "有効" : "停止中"}
                  </span>
                </div>
                <p className="text-gray-400 font-medium text-sm">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50 pt-8">
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <Mail className="text-gray-300 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">メールアドレス</p>
                    <p className="font-bold text-gray-700">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <Phone className="text-gray-300 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">電話番号</p>
                    <p className="font-bold text-gray-700">{user.tel || "未登録"}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 text-sm">
                  <MapPin className="text-gray-300 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">住所</p>
                    <p className="font-bold text-gray-700">{user.address || "未登録"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 text-sm">
                  <User className="text-gray-300 mt-0.5" size={18} />
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">会員種別</p>
                    <p className="font-bold text-blue-600">{user.memberType === 'STORE' ? "店舗会員" : "無料会員"}</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
              <History size={20} className="text-blue-900" />
              アクティビティログ
            </h2>
            {(!user.activityLogs || user.activityLogs.length === 0) ? (
              <div className="text-sm text-gray-400 text-center py-10">履歴データはありません</div>
            ) : (
              <div className="space-y-4">
                {user.activityLogs.map((log: ActivityLog) => (
                  <div key={log.id} className="flex gap-4 p-4 border border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors">
                    <div className="bg-blue-50 text-blue-900 px-3 py-1 rounded-xl text-xs font-bold h-fit whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">{log.action === "LOGIN" ? "ログイン" : log.action === "VIEW_PROPERTY" ? "物件閲覧" : log.action}</p>
                      {log.details && <p className="text-sm text-gray-600 mt-1">{log.details}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
            <Heart size={20} className="text-orange-500" />
            お気に入り物件
          </h2>
          <div className="text-sm text-gray-400 text-center py-10">登録されている物件はありません</div>
        </section>
      </div>
    </div>
  );
}
