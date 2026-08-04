import { ArrowLeft, Save, ExternalLink, Eye, BarChart3, Clock, Users, ShieldCheck, MapPin, Home, Ruler, Calendar } from "lucide-react";
import Link from "next/link";

export default function PropertyAdminDetail() {
  // モックデータ: ID: 1 の物件
  const property = {
    id: 1,
    title: "青葉区 中山吉成 5LDK 広々リビングの邸宅",
    price: "2,480万円",
    type: "中古一戸建て",
    address: "宮城県仙台市青葉区中山吉成1丁目",
    level: "一般公開",
    status: "公開中",
    createdAt: "2026/07/01",
    updatedAt: "2026/07/25",
    stats: {
      views: 1248,
      favorites: 42,
      inquiries: 8
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <Link href="/admin/properties" className="text-sm font-bold text-gray-500 flex items-center gap-2 hover:text-blue-900 transition-colors">
          <ArrowLeft size={18} />
          物件一覧へ戻る
        </Link>
        <div className="flex gap-3">
          <Link href={`/property/${property.id}`} target="_blank" className="bg-white border border-gray-200 px-6 py-2 rounded-xl flex items-center gap-2 font-bold text-gray-600 hover:bg-gray-50 transition-all shadow-sm">
            <ExternalLink size={18} />
            サイトで確認
          </Link>
          <button className="bg-blue-900 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-black hover:bg-blue-800 transition-all shadow-lg shadow-blue-900/20">
            <Save size={18} />
            変更を保存
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header Card */}
          <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="bg-blue-50 text-blue-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest">{property.type}</span>
              <span className={`text-[10px] font-black px-2 py-1 rounded uppercase tracking-widest ${property.level === '会員限定' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                {property.level}
              </span>
            </div>
            <h1 className="text-3xl font-black text-gray-900 mb-6 leading-tight">{property.title}</h1>
            
            <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-8">
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">閲覧数</p>
                <div className="flex items-center justify-center gap-2 text-blue-900">
                  <Eye size={16} />
                  <span className="text-xl font-black">{property.stats.views.toLocaleString()}</span>
                </div>
              </div>
              <div className="text-center border-x border-gray-50">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">お気に入り</p>
                <div className="flex items-center justify-center gap-2 text-orange-500">
                  <BarChart3 size={16} />
                  <span className="text-xl font-black">{property.stats.favorites}</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">問い合わせ</p>
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <Users size={16} />
                  <span className="text-xl font-black">{property.stats.inquiries}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Detailed Info Form Mock */}
          <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-8">
            <h2 className="text-lg font-black text-gray-900 border-b border-gray-50 pb-4 flex items-center gap-2">
              <Home size={20} className="text-blue-900" />
              物件詳細情報
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">物件価格</label>
                  <div className="relative">
                    <input type="text" defaultValue="2,480" className="w-full pl-4 pr-12 py-3 rounded-2xl border border-gray-100 font-bold text-gray-900 focus:border-blue-900 outline-none transition-all" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">万円</span>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">所在地</label>
                  <div className="flex gap-2">
                    <input type="text" defaultValue={property.address} className="w-full px-4 py-3 rounded-2xl border border-gray-100 font-bold text-gray-900 focus:border-blue-900 outline-none transition-all" />
                    <button className="p-3 bg-gray-50 rounded-2xl text-gray-400 hover:text-blue-900 transition-colors">
                      <MapPin size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">間取り</label>
                    <input type="text" defaultValue="5LDK" className="w-full px-4 py-3 rounded-2xl border border-gray-100 font-bold text-gray-900 focus:border-blue-900 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">築年月</label>
                    <input type="text" defaultValue="2009年6月" className="w-full px-4 py-3 rounded-2xl border border-gray-100 font-bold text-gray-900 focus:border-blue-900 outline-none transition-all" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">建物面積</label>
                    <input type="text" defaultValue="125.40㎡" className="w-full px-4 py-3 rounded-2xl border border-gray-100 font-bold text-gray-900 focus:border-blue-900 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">土地面積</label>
                    <input type="text" defaultValue="200.15㎡" className="w-full px-4 py-3 rounded-2xl border border-gray-100 font-bold text-gray-900 focus:border-blue-900 outline-none transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-8">
          {/* Status Settings */}
          <section className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 space-y-6">
            <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
              <ShieldCheck size={18} className="text-blue-900" />
              公開ステータス
            </h3>
            
            <div className="space-y-4">
              <div className="p-1 bg-gray-50 rounded-2xl flex">
                <button className="flex-1 py-3 rounded-xl text-xs font-black bg-blue-900 text-white shadow-lg">公開中</button>
                <button className="flex-1 py-3 rounded-xl text-xs font-black text-gray-400 hover:text-gray-600 transition-colors">下書き</button>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">公開範囲レベル</label>
                <select className="w-full px-4 py-3 rounded-2xl border border-gray-100 font-bold text-sm bg-white outline-none focus:border-blue-900 transition-all">
                  <option>一般公開</option>
                  <option selected>会員限定</option>
                  <option>店舗公開</option>
                </select>
              </div>
            </div>
          </section>

          {/* Audit Info */}
          <section className="bg-slate-900 text-white p-8 rounded-[40px] shadow-xl space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-blue-400">
              <Clock size={18} />
              変更履歴
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">作成日時</span>
                <span className="text-xs font-bold">{property.createdAt}</span>
              </div>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">最終更新</span>
                <span className="text-xs font-bold">{property.updatedAt}</span>
              </div>
              <div className="pt-4 border-t border-white/10">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">更新者</p>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-black">管</div>
                  <span className="text-xs font-bold">管理者 太郎</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
