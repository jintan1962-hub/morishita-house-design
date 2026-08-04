import { Users, Building2, BarChart3, Clock, ArrowUpRight, MessageSquare } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const stats = [
    { label: "登録会員数", value: "1,284", icon: Users, color: "text-ink", bg: "bg-ink/5" },
    { label: "掲載物件数", value: "45", icon: Building2, color: "text-pink", bg: "bg-pink/5" },
    { label: "今月の問い合わせ", value: "32", icon: MessageSquare, color: "text-teal", bg: "bg-teal/5" },
    { label: "閲覧数 (Total)", value: "12.4k", icon: BarChart3, color: "text-reno-mute-dark", bg: "bg-reno-bg" },
  ];

  return (
    <div className="space-y-10 font-gothic">
      <div>
        <h1 className="text-3xl font-mincho font-bold text-ink mb-2">管理者ダッシュボード</h1>
        <p className="text-sm text-reno-mute-dark">システム全体の概要と最近のアクティビティ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-8 border border-reno-line shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div className={`${stat.bg} ${stat.color} p-4 rounded-2xl`}>
                <stat.icon size={24} />
              </div>
              <span className="text-[10px] font-bold text-teal bg-teal/5 px-2 py-1 flex items-center gap-1">
                <ArrowUpRight size={10} /> +12%
              </span>
            </div>
            <p className="text-xs font-bold text-reno-mute-dark mb-1 tracking-widest uppercase">{stat.label}</p>
            <p className="text-3xl font-bold text-ink">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Recent Members */}
        <div className="bg-white border border-reno-line shadow-sm">
          <div className="p-6 border-b border-reno-line flex justify-between items-center">
            <h2 className="text-lg font-bold text-ink font-mincho">最近の登録会員</h2>
            <Link href="/admin/users" className="text-xs font-bold text-pink hover:underline">すべて表示</Link>
          </div>
          <div className="p-6 space-y-4">
            {[
              { name: "山田 健太", email: "yamada@example.com", time: "2時間前", initial: "YK" },
              { name: "佐藤 拓也", email: "sato@example.com", time: "5時間前", initial: "ST" },
              { name: "三浦 織江", email: "miura@example.com", time: "昨日", initial: "MO" },
            ].map((user, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-reno-bg last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-reno-bg rounded-full flex items-center justify-center font-bold text-reno-mute-dark text-xs">
                    {user.initial}
                  </div>
                  <div>
                    <p className="font-bold text-ink text-sm">{user.name}</p>
                    <p className="text-[10px] text-reno-mute-dark">{user.email}</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-reno-mute">{user.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Properties */}
        <div className="bg-white border border-reno-line shadow-sm">
          <div className="p-6 border-b border-reno-line flex justify-between items-center">
            <h2 className="text-lg font-bold text-ink font-mincho">最近の掲載物件</h2>
            <Link href="/admin/properties" className="text-xs font-bold text-pink hover:underline">すべて表示</Link>
          </div>
          <div className="p-6 space-y-4">
            {[
              { title: "青葉区 中山吉成 戸建", price: "2,480万円", status: "公開中", level: "一般", img: "1" },
              { title: "泉区 泉中央 マンション", price: "1,850万円", status: "公開中", level: "一般", img: "2" },
              { title: "太白区 長町 未公開物件", price: "3,200万円", status: "公開中", level: "会員限定", img: "3" },
            ].map((prop, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-reno-bg last:border-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-reno-bg overflow-hidden flex-shrink-0">
                    <img src={`https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=200&sig=${i}`} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div>
                    <p className="font-bold text-ink text-sm line-clamp-1">{prop.title}</p>
                    <p className="text-xs text-pink font-bold">{prop.price}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 border ${prop.level === '会員限定' ? 'border-pink text-pink bg-pink/5' : 'border-teal text-teal bg-teal/5'}`}>
                    {prop.level}
                  </span>
                  <span className="text-[9px] font-bold text-reno-mute uppercase">{prop.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
