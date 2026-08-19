"use client";

import { useState } from "react";
import { Calendar, User, Mail, Phone, ExternalLink, MessageSquare, X } from "lucide-react";
import Link from "next/link";
import { updateInquiryStatus } from "@/app/actions/inquiry";

type Inquiry = {
  id: number;
  propertyId: number | null;
  userId: number | null;
  name: string;
  email: string;
  tel: string | null;
  message: string;
  status: string;
  createdAt: string | Date;
  repliedAt: string | Date | null;
  /** 物件管理番号（athome の番号）。物件が削除されていれば null */
  propertyObjMngNo?: string | null;
  /** 物件名。同上 */
  propertyTitle?: string | null;
};

export default function InquiryList({ inquiries: initialInquiries }: { inquiries: Inquiry[] }) {
  const [inquiries, setInquiries] = useState<Inquiry[]>(initialInquiries);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const toggleStatus = async (inq: Inquiry) => {
    const newStatus = inq.status === "UNREAD" ? "REPLIED" : "UNREAD";
    
    // UIを即座に更新する（オプティミスティックUI）
    setInquiries(inquiries.map(i => i.id === inq.id ? { ...i, status: newStatus } : i));
    if (selectedInquiry && selectedInquiry.id === inq.id) {
      setSelectedInquiry({ ...selectedInquiry, status: newStatus });
    }

    const res = await updateInquiryStatus(inq.id, newStatus);
    if (res.success && res.data) {
      // 成功時、サーバーで生成された時刻(repliedAt)を含む最新のデータでUIを更新する
      setInquiries(inquiries.map(i => i.id === inq.id ? { ...i, ...res.data } : i));
      if (selectedInquiry && selectedInquiry.id === inq.id) {
        setSelectedInquiry({ ...selectedInquiry, ...res.data });
      }
    } else {
      // 失敗した場合は元に戻す
      setInquiries(inquiries.map(i => i.id === inq.id ? { ...i, status: inq.status } : i));
      if (selectedInquiry && selectedInquiry.id === inq.id) {
        setSelectedInquiry({ ...selectedInquiry, status: inq.status });
      }
      alert(res.error);
    }
  };

  if (!inquiries || inquiries.length === 0) {
    return (
      <div className="p-20 text-center text-gray-400 font-bold bg-white rounded-[24px] shadow-sm border border-reno-line">
        お問い合わせはまだありません
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-[24px] shadow-sm border border-reno-line overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-reno-line text-gray-500 uppercase text-[10px] tracking-wider">
            <tr>
              <th className="px-6 py-4 font-bold">受信日時</th>
              <th className="px-6 py-4 font-bold">お名前 / 連絡先</th>
              <th className="px-6 py-4 font-bold">対象物件</th>
              <th className="px-6 py-4 font-bold">お問い合わせ内容</th>
              <th className="px-6 py-4 font-bold text-center">状態 / 詳細</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-reno-line">
            {inquiries.map((inq) => (
              <tr key={inq.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-5 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar size={14} />
                    {new Date(inq.createdAt).toLocaleDateString("ja-JP")}
                    <br />
                    <span className="text-xs text-gray-400">{new Date(inq.createdAt).toLocaleTimeString("ja-JP")}</span>
                  </div>
                </td>
                <td className="px-6 py-5">
                  <div className="font-bold text-ink flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    {inq.name} 様
                    {inq.userId && <span className="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full ml-1">会員</span>}
                  </div>
                  <div className="text-gray-500 mt-1 flex flex-col gap-0.5 text-xs">
                    <span className="flex items-center gap-1"><Mail size={12} /> {inq.email}</span>
                    {inq.tel && <span className="flex items-center gap-1"><Phone size={12} /> {inq.tel}</span>}
                  </div>
                </td>
                <td className="px-6 py-5">
                  {inq.propertyId ? (
                    <div className="space-y-0.5">
                      <Link href={`/property/${inq.propertyId}`} target="_blank" className="text-teal font-bold hover:underline flex items-center gap-1">
                        {inq.propertyObjMngNo ? `物件管理番号: ${inq.propertyObjMngNo}` : `物件ID: ${inq.propertyId}`}
                        <ExternalLink size={12} />
                      </Link>
                      {inq.propertyTitle && (
                        <p className="text-xs text-gray-500 font-medium max-w-[16rem] truncate" title={inq.propertyTitle}>
                          {inq.propertyTitle}
                        </p>
                      )}
                      {!inq.propertyObjMngNo && (
                        <p className="text-xs text-gray-400 font-medium">この物件は削除されています</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">一般のお問い合わせ</span>
                  )}
                </td>
                <td className="px-6 py-5">
                  <div className="text-gray-700 max-w-xs truncate cursor-pointer hover:text-teal" title="クリックして詳細を表示" onClick={() => setSelectedInquiry(inq)}>
                    {inq.message}
                  </div>
                </td>
                <td className="px-6 py-5 text-center">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <button 
                        onClick={() => toggleStatus(inq)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${
                          inq.status === "UNREAD" 
                            ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                            : "bg-teal/5 text-teal border-teal/20 hover:bg-teal/10"
                        }`}
                        title="クリックして状態を変更"
                      >
                        {inq.status === "UNREAD" ? "未対応" : "✓ 対応済"}
                      </button>
                      {inq.status === "REPLIED" && inq.repliedAt && (
                        <span className="text-[9px] text-gray-400">
                          {new Date(inq.repliedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })} {new Date(inq.repliedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedInquiry(inq)}
                      className="text-gray-400 hover:text-ink transition-colors p-2"
                      title="詳細を見る"
                    >
                      <MessageSquare size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 詳細モーダル */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4" onClick={() => setSelectedInquiry(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b border-reno-line flex justify-between items-center bg-gray-50">
              <h2 className="font-bold text-ink flex items-center gap-2">
                <MessageSquare size={18} className="text-teal" />
                お問い合わせ詳細
              </h2>
              <button onClick={() => setSelectedInquiry(null)} className="text-gray-400 hover:text-ink">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-gray-400 mb-1">受信日時</p>
                  <p className="font-bold">{new Date(selectedInquiry.createdAt).toLocaleString("ja-JP")}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">対応状態</p>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => toggleStatus(selectedInquiry)}
                      className={`px-3 py-1 rounded-full text-xs font-bold border transition-colors ${
                        selectedInquiry.status === "UNREAD" 
                          ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                          : "bg-teal/5 text-teal border-teal/20 hover:bg-teal/10"
                      }`}
                    >
                      {selectedInquiry.status === "UNREAD" ? "未対応 (クリックで対応済にする)" : "✓ 対応済 (クリックで未対応に戻す)"}
                    </button>
                    {selectedInquiry.status === "REPLIED" && selectedInquiry.repliedAt && (
                      <span className="text-xs text-teal font-bold bg-teal/5 px-2 py-1 rounded-lg border border-teal/10">
                        完了日時: {new Date(selectedInquiry.repliedAt).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">お名前</p>
                  <p className="font-bold">{selectedInquiry.name} 様</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">対象物件</p>
                  <p className="font-bold text-teal">
                    {selectedInquiry.propertyId
                      ? selectedInquiry.propertyObjMngNo
                        ? `物件管理番号: ${selectedInquiry.propertyObjMngNo}`
                        : `物件ID: ${selectedInquiry.propertyId}（この物件は削除されています）`
                      : "一般のお問い合わせ"}
                  </p>
                  {selectedInquiry.propertyTitle && (
                    <p className="text-xs text-gray-500 font-medium mt-1">
                      {selectedInquiry.propertyTitle}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-gray-400 mb-1">連絡先</p>
                  <p className="font-bold">Email: {selectedInquiry.email} {selectedInquiry.tel ? ` / Tel: ${selectedInquiry.tel}` : ""}</p>
                </div>
              </div>

              <div className="border-t border-reno-line pt-6">
                <p className="text-xs text-gray-400 mb-3">お問い合わせ内容</p>
                <div className="bg-gray-50 p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-gray-700">
                  {selectedInquiry.message}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-reno-line bg-gray-50 text-right">
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="px-6 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
