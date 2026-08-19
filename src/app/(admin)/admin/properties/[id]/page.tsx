import { ArrowLeft, ExternalLink, Eye, MessageSquare, Clock, Hash } from "lucide-react";
import Link from "next/link";
import { getPropertyForAdmin } from "@/app/actions/properties";
import PropertyEditForm from "./PropertyEditForm";
import PropertyImages from "./PropertyImages";
import { isStorageConfigured } from "@/lib/storage";

/**
 * 管理画面の物件詳細。
 *
 * 以前このページは仙台の架空物件（「青葉区 中山吉成 5LDK」2,480万円、閲覧1,248件など）を
 * 直書きしており、URLの物件IDを一切見ていなかった。入力欄も defaultValue の直書きで、
 * 「変更を保存」は何にも繋がっていなかった。実データの表示と保存に作り直したもの。
 */
export const dynamic = "force-dynamic";

export default async function PropertyAdminDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const res = await getPropertyForAdmin(Number(id));

  if (!res.success) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/admin/properties"
          className="text-sm font-bold text-gray-500 flex items-center gap-2 hover:text-blue-900"
        >
          <ArrowLeft size={18} />
          物件一覧へ戻る
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-sm font-bold text-red-800">
          {res.error}
        </div>
      </div>
    );
  }

  const p = res.data;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Link
          href="/admin/properties"
          className="text-sm font-bold text-gray-500 flex items-center gap-2 hover:text-blue-900 transition-colors"
        >
          <ArrowLeft size={18} />
          物件一覧へ戻る
        </Link>
        <Link
          href={`/property/${p.id}`}
          target="_blank"
          className="bg-white border border-gray-200 px-6 py-2 rounded-xl flex items-center gap-2 font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm"
        >
          <ExternalLink size={18} />
          サイトで確認
        </Link>
      </div>

      <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
            {p.syumoku}
          </span>
          <span
            className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${
              p.disclosureLevel === 1
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-600"
            }`}
          >
            {p.disclosureLevel === 1 ? "会員限定" : "一般公開"}
          </span>
          {p.areaName && (
            <span className="bg-gray-50 text-gray-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">
              {p.areaName}
            </span>
          )}
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-2 leading-tight">{p.title}</h1>
        <p className="text-sm font-bold text-gray-400 flex items-center gap-2">
          <Hash size={14} />
          物件管理番号 {p.objMngNo}
          <span className="text-gray-300">|</span>
          この番号はCSV取込の突合キーのため、画面からは変更できません
        </p>

        <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-8 mt-8">
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              会員の閲覧数
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-900">
              <Eye size={16} />
              <span className="text-xl font-black">{p.stats.memberViews.toLocaleString()}</span>
            </div>
            <p className="text-[9px] font-bold text-gray-300 mt-1">未ログインの閲覧は含みません</p>
          </div>
          <div className="text-center border-x border-gray-50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              問い合わせ
            </p>
            <div className="flex items-center justify-center gap-2 text-green-600">
              <MessageSquare size={16} />
              <span className="text-xl font-black">{p.stats.inquiries}</span>
            </div>
          </div>
          <div className="text-center">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
              最終更新
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-600">
              <Clock size={16} />
              <span className="text-sm font-black">
                {p.updatedAt.toLocaleString("ja-JP")}
              </span>
            </div>
          </div>
        </div>
      </section>

      <PropertyImages
        propertyId={p.id}
        images={p.images.map((img) => ({
          id: img.id,
          path: img.path,
          sortOrder: img.sortOrder,
        }))}
        storageReady={isStorageConfigured()}
      />

      <PropertyEditForm property={p as unknown as Record<string, unknown>} />
    </div>
  );
}
