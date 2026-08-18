"use client";

import { useState, useEffect } from "react";
import { Search, Filter, UserPlus, Eye, Trash2, RefreshCw, Loader2 } from "lucide-react";
import Link from "next/link";
import { getUsers, deleteUser, createTestUsers } from "@/app/actions/users";

type User = {
  id: number;
  name: string | null;
  email: string;
  memberType: string;
  createdAt: string | Date;
  status: string;
};

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 取得だけを行う。読み込み中フラグは呼び出し側が面倒を見る。
  // （useEffect の同期本体で setState すると react-hooks/set-state-in-effect に触れるため）
  const fetchUsers = async () => {
    try {
      const response = await getUsers();
      if (response.success && response.data) {
        setUsers(response.data as User[]);
      } else {
        setErrorMessage(response.error ?? "会員データを取得できませんでした。");
      }
    } catch (error) {
      // D-07：握り潰さずログに残し、画面には内部情報を出さない
      console.error("会員一覧の取得に失敗:", error);
      setErrorMessage("通信エラーが発生しました。時間をおいて再度お試しください。");
    }
  };

  const reload = async () => {
    setIsLoading(true);
    setErrorMessage("");
    await fetchUsers();
    setIsLoading(false);
  };

  useEffect(() => {
    // 初期表示。isLoading は初期値が true なので、ここで立て直す必要はない。
    void (async () => {
      await fetchUsers();
      setIsLoading(false);
    })();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm("この会員を削除しますか？\n（データは論理削除され、一覧から見えなくなります）")) return;
    const res = await deleteUser(id);
    if (!res.success) {
      setErrorMessage(res.error ?? "削除できませんでした。");
      return;
    }
    await reload();
  };

  const handleCreateTest = async () => {
    if (isCreating) return;
    setIsCreating(true);
    setErrorMessage("");
    const res = await createTestUsers();
    setIsCreating(false);
    if (!res.success) {
      setErrorMessage(res.error ?? "テストデータを作成できませんでした。");
      return;
    }
    await reload();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">会員管理</h1>
          <p className="text-gray-500">Supabase連携：リアルタイム会員データ</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={reload}
            className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            リスト更新
          </button>
          <button 
            onClick={handleCreateTest} 
            disabled={isCreating}
            className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? (
              <Loader2 size={18} className="animate-spin text-blue-600" />
            ) : (
              <UserPlus size={18} />
            )}
            {isCreating ? "作成中..." : "テストデータ作成"}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl px-6 py-4 text-sm font-bold">
          {errorMessage}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="名前・メールで検索" className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-64" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50">
              <Filter size={16} />
              フィルタ
            </button>
          </div>
          <p className="text-xs font-bold text-gray-400">全 {users.length} 名表示</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading && users.length === 0 ? (
            <div className="p-20 text-center text-gray-400 font-bold">会員データを読み込み中...</div>
          ) : !isLoading && users.length === 0 ? (
            <div className="p-20 text-center text-gray-400 font-bold">
              会員が登録されていません。「テストデータ作成」を押してサンプルを追加してください。
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-8 py-4">名前</th>
                  <th className="px-8 py-4">メールアドレス</th>
                  <th className="px-8 py-4">会員種別</th>
                  <th className="px-8 py-4">登録日</th>
                  <th className="px-8 py-4">ステータス</th>
                  <th className="px-8 py-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-gray-600 divide-y divide-gray-50">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <Link href={`/admin/users/${user.id}`} className="font-bold text-gray-900 hover:text-blue-600 transition-colors">
                        {user.name || "未設定"}
                      </Link>
                    </td>
                    <td className="px-8 py-4">{user.email}</td>
                    <td className="px-8 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black ${user.memberType === 'STORE' ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                        {user.memberType === 'STORE' ? "店舗会員" : "無料会員"}
                      </span>
                    </td>
                    <td className="px-8 py-4 font-bold">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${user.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`} />
                        {user.status === 'ACTIVE' ? "有効" : "停止"}
                      </div>
                    </td>
                    <td className="px-8 py-4 text-center">
                      <div className="flex justify-center gap-2">
                        <Link href={`/admin/users/${user.id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400" title="詳細表示">
                          <Eye size={18} />
                        </Link>
                        <button onClick={() => handleDelete(user.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-400" title="削除">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
