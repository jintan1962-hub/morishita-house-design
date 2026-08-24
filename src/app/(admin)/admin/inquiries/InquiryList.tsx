"use client";

import { useState, useEffect } from "react";
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

  // モーダルは Esc で閉じられるようにする。開いている間は背面のスクロールを止める。
  useEffect(() => {
    if (!selectedInquiry) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelectedInquiry(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedInquiry]);

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
      <div className="p-20 text-center text-reno-mute-dark font-bold bg-white rounded-2xl shadow-sm border border-reno-line">
        お問い合わせはまだありません
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-reno-line overflow-hidden">
        {/* 親が overflow-hidden のままだと、狭い画面で「状態 / 詳細」列が
            スクロールもできずに切り落とされ、対応済への切り替えが押せなくなる。 */}
        <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left text-sm">
          <thead className="bg-reno-bg border-b border-reno-line text-reno-mute-dark text-xs">
            <tr>
              <th className="px-4 py-3 font-bold">受信日時</th>
              <th className="px-4 py-3 font-bold">お名前 / 連絡先</th>
              <th className="px-4 py-3 font-bold">対象物件</th>
              <th className="px-4 py-3 font-bold">お問い合わせ内容</th>
              <th className="px-4 py-3 font-bold text-center whitespace-nowrap">状態 / 詳細</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-reno-line">
            {inquiries.map((inq) => (
              <tr key={inq.id} className="hover:bg-reno-bg/60 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap align-top">
                  <div className="flex items-center gap-2 text-ink font-bold">
                    <Calendar size={14} className="text-reno-mute-dark" />
                    {new Date(inq.createdAt).toLocaleDateString("ja-JP")}
                  </div>
                  <p className="text-xs text-reno-mute-dark mt-1 pl-6">
                    {new Date(inq.createdAt).toLocaleTimeString("ja-JP", {
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <div className="font-bold text-ink flex items-center gap-2">
                    <User size={14} className="text-reno-mute-dark" />
                    {inq.name} 様
                    {inq.userId && <span className="bg-teal/5 text-teal text-xs px-2 py-0.5 rounded-full ml-1">会員</span>}
                  </div>
                  <div className="text-reno-mute-dark mt-1 flex flex-col gap-0.5 text-xs">
                    <span className="flex items-center gap-1"><Mail size={12} /> {inq.email}</span>
                    {inq.tel && <span className="flex items-center gap-1"><Phone size={12} /> {inq.tel}</span>}
                  </div>
                </td>
                <td className="px-4 py-4">
                  {inq.propertyId ? (
                    <div className="space-y-0.5">
                      <Link href={`/property/${inq.propertyId}`} target="_blank" className="text-teal font-bold hover:underline flex items-center gap-1">
                        {inq.propertyObjMngNo ? `物件管理番号: ${inq.propertyObjMngNo}` : `物件ID: ${inq.propertyId}`}
                        <ExternalLink size={12} />
                      </Link>
                      {inq.propertyTitle && (
                        <p className="text-xs text-reno-mute-dark font-medium max-w-[150px] truncate" title={inq.propertyTitle}>
                          {inq.propertyTitle}
                        </p>
                      )}
                      {!inq.propertyObjMngNo && (
                        <p className="text-xs text-reno-mute-dark font-medium">この物件は削除されています</p>
                      )}
                    </div>
                  ) : (
                    <span className="text-reno-mute-dark">一般のお問い合わせ</span>
                  )}
                </td>
                <td className="px-4 py-4">
                  <div className="text-ink max-w-[220px] truncate cursor-pointer hover:text-teal" title="クリックして詳細を表示" onClick={() => setSelectedInquiry(inq)}>
                    {inq.message}
                  </div>
                </td>
                <td className="px-4 py-4 text-center align-top">
                  <div className="flex items-center justify-center gap-3">
                    <div className="flex flex-col items-center gap-1">
                      <button 
                        onClick={() => toggleStatus(inq)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
                          inq.status === "UNREAD" 
                            ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                            : "bg-teal/5 text-teal border-teal/20 hover:bg-teal/10"
                        }`}
                        title="クリックして状態を変更"
                      >
                        {inq.status === "UNREAD" ? "未対応" : "✓ 対応済"}
                      </button>
                      {inq.status === "REPLIED" && inq.repliedAt && (
                        <span className="text-xs text-reno-mute-dark">
                          {new Date(inq.repliedAt).toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" })} {new Date(inq.repliedAt).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedInquiry(inq)}
                      className="text-reno-mute-dark hover:text-ink transition-colors p-2"
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
      </div>

      {/* 詳細モーダル */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-sm p-4" onClick={() => setSelectedInquiry(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="お問い合わせ詳細"
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 border-b border-reno-line flex justify-between items-center bg-reno-bg">
              <h2 className="font-bold text-ink flex items-center gap-2">
                <MessageSquare size={18} className="text-teal" />
                お問い合わせ詳細
              </h2>
              <button
                onClick={() => setSelectedInquiry(null)}
                className="text-reno-mute-dark hover:text-ink"
                aria-label="閉じる"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 flex-grow">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-reno-mute-dark mb-1">受信日時</p>
                  <p className="font-bold">{new Date(selectedInquiry.createdAt).toLocaleString("ja-JP")}</p>
                </div>
                <div>
                  <p className="text-xs text-reno-mute-dark mb-1">対応状態</p>
                  {/* 完了日時のバッジがモーダルの右端からはみ出して切れていたので折り返す */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button 
                      onClick={() => toggleStatus(selectedInquiry)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors whitespace-nowrap ${
                        selectedInquiry.status === "UNREAD" 
                          ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100" 
                          : "bg-teal/5 text-teal border-teal/20 hover:bg-teal/10"
                      }`}
                    >
                      {selectedInquiry.status === "UNREAD" ? "未対応 (クリックで対応済にする)" : "✓ 対応済 (クリックで未対応に戻す)"}
                    </button>
                    {selectedInquiry.status === "REPLIED" && selectedInquiry.repliedAt && (
                      <span className="text-xs text-teal font-bold bg-teal/5 px-2 py-1 rounded-lg border border-teal/20 whitespace-nowrap">
                        完了日時: {new Date(selectedInquiry.repliedAt).toLocaleString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-reno-mute-dark mb-1">お名前</p>
                  <p className="font-bold">{selectedInquiry.name} 様</p>
                </div>
                <div>
                  <p className="text-xs text-reno-mute-dark mb-1">対象物件</p>
                  <p className="font-bold text-teal">
                    {selectedInquiry.propertyId
                      ? selectedInquiry.propertyObjMngNo
                        ? `物件管理番号: ${selectedInquiry.propertyObjMngNo}`
                        : `物件ID: ${selectedInquiry.propertyId}（この物件は削除されています）`
                      : "一般のお問い合わせ"}
                  </p>
                  {selectedInquiry.propertyTitle && (
                    <p className="text-xs text-reno-mute-dark font-medium mt-1">
                      {selectedInquiry.propertyTitle}
                    </p>
                  )}
                </div>
                <div className="col-span-2">
                  <p className="text-xs text-reno-mute-dark mb-1">連絡先</p>
                  <p className="font-bold">Email: {selectedInquiry.email} {selectedInquiry.tel ? ` / Tel: ${selectedInquiry.tel}` : ""}</p>
                </div>
              </div>

              <div className="border-t border-reno-line pt-6">
                <p className="text-xs text-reno-mute-dark mb-3">お問い合わせ内容</p>
                <div className="bg-reno-bg p-4 rounded-xl text-sm leading-relaxed whitespace-pre-wrap text-ink">
                  {selectedInquiry.message}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-reno-line bg-reno-bg text-right">
              <button 
                onClick={() => setSelectedInquiry(null)}
                className="px-6 py-2 bg-white border border-reno-line rounded-lg text-sm font-bold text-ink hover:bg-reno-bg transition-colors"
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
