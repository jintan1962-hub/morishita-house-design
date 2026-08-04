"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Search, Filter, MoreVertical, Plus, 
  ExternalLink, Edit3, Trash2, Eye, 
  Upload, Download, X, Check, AlertCircle,
  ArrowRight, Info
} from "lucide-react";
import Link from "next/link";
import { compareCSVData, importProperties, getProperties, DiffResult } from "@/app/actions/properties";

export default function PropertyManagement() {
  const [properties, setProperties] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "preview" | "importing" | "success" | "error">("idle");
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  const [approvedIndices, setApprovedItems] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Supabaseからデータを取得
  const loadProperties = async () => {
    setIsLoading(true);
    try {
      const data = await getProperties();
      setProperties(data);
    } catch (error) {
      console.error("Failed to load properties:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProperties();
  }, []);

  const handleExport = () => {
    const headers = ["objMngNo", "title", "priceMan", "madori", "address", "disclosureLevel"];
    const rows = properties.map(p => [p.objMngNo, p.title, p.priceMan, p.madori || "", p.address || "", p.disclosureLevel || 0]);
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `properties_${new Date().getTime()}.csv`;
    link.click();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus("parsing");
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split("\n").filter(line => line.trim() !== "");
        const headers = lines[0].split(",").map(h => h.trim());
        const data = lines.slice(1).map(line => {
          const values = line.split(",").map(v => v.trim());
          return headers.reduce((obj: any, header, i) => {
            obj[header] = values[i];
            return obj;
          }, {});
        });

        const diffs = await compareCSVData(data);
        setDiffResults(diffs);
        setApprovedItems(new Set(diffs.map((_, i) => i)));
        setImportStatus("preview");
      } catch (err) {
        setImportStatus("error");
      }
    };
    reader.readAsText(file);
  };

  const handleImportExecute = async () => {
    setImportStatus("importing");
    try {
      const itemsToImport = diffResults
        .filter((_, i) => approvedIndices.has(i))
        .map(d => d.incoming);
      
      await importProperties(itemsToImport);
      setImportStatus("success");
      loadProperties(); // リストを再読み込み
    } catch (err) {
      setImportStatus("error");
    }
  };

  const toggleApproval = (index: number) => {
    const newSet = new Set(approvedIndices);
    if (newSet.has(index)) newSet.delete(index);
    else newSet.add(index);
    setApprovedItems(newSet);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">物件管理</h1>
          <p className="text-gray-500">Supabase連携：リアルタイムデータ管理</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsImportModalOpen(true)} className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            <Upload size={18} /> 一括入力 (CSV)
          </button>
          <button onClick={handleExport} className="bg-white border border-gray-200 px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
            <Download size={18} /> 一括出力 (CSV)
          </button>
          <Link href="/admin/properties/new" className="bg-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 text-sm font-bold hover:bg-orange-600 transition-all shadow-lg shadow-orange-500/20">
            <Plus size={18} /> 物件登録
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Filters */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input type="text" placeholder="物件名・IDで検索" className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500/20 outline-none w-64" />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-600 hover:bg-gray-50">
              <Filter size={16} /> フィルタ
            </button>
          </div>
          <p className="text-xs font-bold text-gray-400">全 {properties.length} 件表示</p>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-20 text-center text-gray-400">データを読み込み中...</div>
          ) : properties.length === 0 ? (
            <div className="p-20 text-center text-gray-400 font-bold">
              物件が登録されていません。CSVからインポートするか、新規登録してください。
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                  <th className="px-8 py-4">物件情報</th>
                  <th className="px-8 py-4">価格</th>
                  <th className="px-8 py-4">公開レベル</th>
                  <th className="px-8 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="text-sm font-medium text-gray-600 divide-y divide-gray-50">
                {properties.map((prop) => (
                  <tr key={prop.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                          <img src={`https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=200&sig=${prop.id}`} className="w-full h-full object-cover" alt="Prop" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 line-clamp-1">{prop.title}</p>
                          <p className="text-[10px] text-gray-400 font-bold">ID: {prop.objMngNo}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-4">
                      <span className="font-black text-orange-600">{prop.priceMan}万円</span>
                    </td>
                    <td className="px-8 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-black ${prop.disclosureLevel === 1 ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        {prop.disclosureLevel === 0 ? "一般公開" : prop.disclosureLevel === 1 ? "会員限定" : "店舗公開"}
                      </span>
                    </td>
                    <td className="px-8 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/properties/${prop.id}`} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                          <Eye size={18} />
                        </Link>
                        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400">
                          <Edit3 size={18} />
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

      {/* Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className={`bg-white w-full ${importStatus === 'preview' ? 'max-w-5xl' : 'max-w-lg'} rounded-[32px] shadow-2xl overflow-hidden transition-all duration-300`}>
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-black text-gray-900">CSV一括登録</h2>
                <p className="text-xs font-bold text-gray-400">差分検知と承認プレビュー</p>
              </div>
              <button onClick={() => { setIsImportModalOpen(false); setImportStatus("idle"); }} className="p-2 hover:bg-gray-50 rounded-full text-gray-400">
                <X size={24} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              {importStatus === "idle" && (
                <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center hover:bg-gray-50 cursor-pointer">
                  <Upload size={32} className="mx-auto mb-4 text-blue-600" />
                  <p className="text-sm font-black">CSVファイルを選択</p>
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv" className="hidden" />
                </div>
              )}

              {importStatus === "parsing" && <div className="text-center py-12"><div className="animate-spin w-10 h-10 border-4 border-blue-900 border-t-transparent rounded-full mx-auto mb-4" />解析中...</div>}

              {importStatus === "preview" && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3">
                    <Info className="text-blue-600 mt-0.5" size={18} />
                    <p className="text-xs font-bold text-blue-800 leading-relaxed">
                      データベースとの照合が完了しました。取り込む項目を選択して「インポート実行」を押してください。
                    </p>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 font-black uppercase tracking-widest border-b border-gray-100">
                        <th className="p-3 w-10"></th>
                        <th className="p-3">状態</th>
                        <th className="p-3">物件番号</th>
                        <th className="p-3">物件名</th>
                        <th className="p-3">価格</th>
                        <th className="p-3">変更箇所</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-bold text-gray-600">
                      {diffResults.map((diff, i) => (
                        <tr key={i} className={`${approvedIndices.has(i) ? 'bg-white' : 'bg-gray-50 opacity-50'}`}>
                          <td className="p-3 text-center">
                            <input type="checkbox" checked={approvedIndices.has(i)} onChange={() => toggleApproval(i)} className="w-4 h-4 rounded border-gray-300 text-blue-600" />
                          </td>
                          <td className="p-3">
                            {diff.type === 'new' && <span className="text-green-600 bg-green-50 px-2 py-1 rounded">新規</span>}
                            {diff.type === 'update' && <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded">変更あり</span>}
                            {diff.type === 'no_change' && <span className="text-gray-400 bg-gray-50 px-2 py-1 rounded">変更なし</span>}
                          </td>
                          <td className="p-3">{diff.incoming.objMngNo}</td>
                          <td className={`p-3 ${diff.changes?.includes('物件名') ? 'text-orange-600' : ''}`}>{diff.incoming.title}</td>
                          <td className={`p-3 ${diff.changes?.includes('価格') ? 'text-orange-600' : ''}`}>{diff.incoming.priceMan}万円</td>
                          <td className="p-3 text-gray-400">{diff.changes?.join(', ') || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                    <button onClick={() => setImportStatus("idle")} className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50">キャンセル</button>
                    <button onClick={handleImportExecute} className="bg-blue-900 text-white px-8 py-3 rounded-xl font-black shadow-lg hover:bg-blue-800 flex items-center gap-2">
                      <Check size={18} /> {approvedIndices.size}件の取り込みを実行
                    </button>
                  </div>
                </div>
              )}

              {importStatus === "importing" && <div className="text-center py-12">取り込み中...</div>}
              {importStatus === "success" && (
                <div className="text-center py-12">
                  <Check size={48} className="mx-auto mb-4 text-green-600" />
                  <p className="font-black">インポートが完了しました</p>
                  <button onClick={() => { setIsImportModalOpen(false); setImportStatus("idle"); }} className="mt-6 bg-blue-900 text-white px-8 py-2 rounded-xl">閉じる</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
