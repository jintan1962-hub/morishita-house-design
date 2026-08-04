import Link from "next/link";
import { 
  LayoutDashboard, Users, Home, Settings, 
  LogOut, Bell, Search, Menu, Building2
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-reno-bg text-ink font-gothic">
      {/* Sidebar */}
      <aside className="w-64 bg-ink text-white flex flex-col fixed h-full z-20">
        <div className="p-8">
          <Link href="/admin" className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter">
              RENO<span className="text-pink">ADMIN</span>
            </span>
            <span className="text-[10px] text-white/40 font-bold -mt-1 uppercase tracking-widest">Management System</span>
          </Link>
        </div>

        <nav className="flex-grow px-4 space-y-1">
          <Link href="/admin" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors font-bold text-sm bg-white/5">
            <LayoutDashboard size={20} />
            ダッシュボード
          </Link>
          <Link href="/admin/users" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors font-bold text-sm">
            <Users size={20} />
            会員管理
          </Link>
          <Link href="/admin/properties" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors font-bold text-sm">
            <Building2 size={20} />
            物件管理
          </Link>
          <div className="pt-8 pb-2 px-4">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Settings</span>
          </div>
          <Link href="/admin/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors font-bold text-sm text-white/60">
            <Settings size={20} />
            システム設定
          </Link>
        </nav>

        <div className="p-4 border-t border-white/5">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-pink/20 transition-colors font-bold text-sm text-white/50 hover:text-pink">
            <LogOut size={20} />
            サイトへ戻る
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-grow ml-64 flex flex-col">
        {/* Admin Header */}
        <header className="h-16 bg-white border-b border-reno-line flex items-center justify-between px-8 sticky top-0 z-10">
          <div className="flex items-center gap-4 bg-reno-bg px-4 py-2 rounded-full w-96">
            <Search size={16} className="text-reno-mute-dark" />
            <input type="text" placeholder="会員名、物件IDで検索..." className="bg-transparent border-none outline-none text-xs w-full font-medium" />
          </div>
          
          <div className="flex items-center gap-6">
            <button className="relative text-reno-mute-dark hover:text-pink transition-colors">
              <Bell size={20} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-pink rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-px bg-reno-line" />
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-xs font-bold text-ink">管理者 太郎</p>
                <p className="text-[10px] font-bold text-reno-mute-dark">System Admin</p>
              </div>
              <div className="w-10 h-10 bg-ink text-white rounded-full flex items-center justify-center font-black text-xs">
                管
              </div>
            </div>
          </div>
        </header>

        <main className="p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
