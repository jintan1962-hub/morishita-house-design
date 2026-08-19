"use client";

import { useState, useRef, useEffect } from "react";
import { parseCsv, decodeCsvBuffer } from "@/lib/csv";
import {
  Search, Filter, Plus, Edit3, Eye,
  Upload, Download, X, Check, AlertCircle, Info
} from "lucide-react";
import Link from "next/link";
import {
  compareCSVData,
  importProperties,
  getProperties,
  type DiffResult,
  type IncomingProperty,
} from "@/app/actions/properties";

type PropertyRow = {
  id: number;
  /** 物件管理番号。DBは BigInt だがサーバーアクションが文字列にして返す。 */
  objMngNo: string;
  title: string;
  priceMan: number;
  madori: string | null;
  address: string | null;
  disclosureLevel: number;
  /** 市区町村コードから引いたエリア名。対象外なら null。 */
  areaName?: string | null;
};

export default function PropertyManagement() {
  const [properties, setProperties] = useState<PropertyRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "parsing" | "preview" | "importing" | "success" | "error">("idle");
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  const [approvedIndices, setApprovedItems] = useState<Set<number>>(new Set());
  const [errorMessage, setErrorMessage] = useState("");
  // 読み取ったCSVの文字コード。化けたときの切り分けに使う。
  const [detectedEncoding, setDetectedEncoding] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    count: number;
    created: number;
    overwritten: number;
    backupId: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 取得だけを行う（useEffect の同期本体で setState しないため分けている）
  const fetchProperties = async () => {
    const res = await getProperties();
    if (res.success) {
      setProperties(res.data as PropertyRow[]);
    } else {
      setErrorMessage(res.error);
    }
  };

  const loadProperties = async () => {
    setIsLoading(true);
    setErrorMessage("");
    await fetchProperties();
    setIsLoading(false);
  };

  useEffect(() => {
    // isLoading の初期値が true なので、ここで立て直さない
    void (async () => {
      await fetchProperties();
      setIsLoading(false);
    })();
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
    setErrorMessage("");
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        // Excel の「CSV形式で保存」は既定で Shift-JIS。UTF-8 決め打ちだと日本語が全て化けるため、
        // バイト列で受け取って文字コードを判定する。
        const buffer = event.target?.result as ArrayBuffer;
        const { text, encoding } = decodeCsvBuffer(buffer);
        setDetectedEncoding(encoding);
        // 引用符に対応した分解。値の中のカンマで列がずれない。
        const data = parseCsv(text) as IncomingProperty[];
        if (data.length === 0) {
          setErrorMessage("データ行がありません。1行目がヘッダー、2行目以降がデータになっているかご確認ください。");
          setImportStatus("error");
          return;
        }

        // D-17 手順1：まず数える。この時点ではまだ1件も書き込まれていない。
        const res = await compareCSVData(data);
        if (!res.success) {
          setErrorMessage(res.error);
          setImportStatus("error");
          return;
        }
        setDiffResults(res.data);
        setApprovedItems(new Set(res.data.map((_, i) => i)));
        setImportStatus("preview");
      } catch (err) {
        console.error("CSVの解析に失敗:", err);
        setErrorMessage("CSVを読み取れませんでした。文字コードと列名をご確認ください。");
        setImportStatus("error");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportExecute = async () => {
    const itemsToImport = diffResults
      .filter((_, i) => approvedIndices.has(i))
      .map(d => d.incoming);

    // D-17 手順3：画面に出ている件数を、そのまま想定件数としてサーバーへ渡す。
    // サーバー側で実際の対象件数と突き合わせ、ずれていれば書き込まずに中止する。
    const expectedCount = itemsToImport.length;

    if (!window.confirm(
      `${expectedCount}件を取り込みます。\n` +
      `うち ${diffResults.filter((d, i) => approvedIndices.has(i) && d.type === "update").length}件は既存データを上書きします。\n\n` +
      `上書き前のデータは控えとして保存されますが、実行してよろしいですか？`
    )) {
      return;
    }

    setImportStatus("importing");
    setErrorMessage("");
    const res = await importProperties(itemsToImport, expectedCount);
    if (!res.success) {
      setErrorMessage(res.error);
      setImportStatus("error");
      return;
    }
    setImportResult({
      count: res.count,
      created: res.created,
      overwritten: res.overwritten,
      backupId: res.backupId,
    });
    setImportStatus("success");
    loadProperties();
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
                  {/* D-17 手順3：実行前に、想定件数を人間が目で確認する */}
                  <div className="bg-blue-50 p-4 rounded-2xl flex items-start gap-3">
                    <Info className="text-blue-600 mt-0.5" size={18} />
                    <div className="text-xs font-bold text-blue-800 leading-relaxed">
                      <p className="mb-2">
                        データベースとの照合が完了しました。件数をご確認のうえ「取り込みを実行」を押してください。
                      </p>
                      <ul className="space-y-0.5">
                        <li>読み取った行数：{diffResults.length}件</li>
                        <li>新規登録：{diffResults.filter(d => d.type === "new").length}件</li>
                        <li className="text-orange-700">
                          上書き（既存データが変わります）：
                          {diffResults.filter(d => d.type === "update").length}件
                        </li>
                        <li>変更なし：{diffResults.filter(d => d.type === "no_change").length}件</li>
                        <li className="pt-1">現在チェックが入っている取込対象：{approvedIndices.size}件</li>
                      </ul>
                      <p className="mt-2 text-blue-700">
                        上書き前のデータは自動で控えを取ります。想定と件数が違う場合は実行しないでください。
                      </p>
                      {detectedEncoding && (
                        <p className="mt-2 text-blue-700">
                          読み取った文字コード：<strong>{detectedEncoding}</strong>
                          {detectedEncoding === "Shift_JIS" &&
                            "（Excelで保存したCSVです。下の物件名が化けていないかご確認ください）"}
                        </p>
                      )}
                    </div>
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
                  <p className="font-black mb-4">インポートが完了しました</p>
                  {importResult && (
                    <div className="text-xs font-bold text-gray-500 space-y-1">
                      <p>取り込み：{importResult.count}件</p>
                      <p>新規登録：{importResult.created}件 ／ 上書き：{importResult.overwritten}件</p>
                      {/* 戻すときに使う控えの番号を必ず画面に出す（D-17・O-03） */}
                      <p className="text-gray-400">
                        上書き前データの控え番号：#{importResult.backupId}
                      </p>
                    </div>
                  )}
                  <button onClick={() => { setIsImportModalOpen(false); setImportStatus("idle"); setImportResult(null); }} className="mt-6 bg-blue-900 text-white px-8 py-2 rounded-xl">閉じる</button>
                </div>
              )}

              {importStatus === "error" && (
                <div className="text-center py-12">
                  <AlertCircle size={48} className="mx-auto mb-4 text-red-600" />
                  <p className="font-black mb-2">取り込みを中止しました</p>
                  {/* D-07：内部情報ではなく、対処できる文言だけを出す */}
                  <p className="text-xs font-bold text-gray-500 max-w-md mx-auto leading-relaxed">
                    {errorMessage || "取り込みに失敗しました。"}
                  </p>
                  <button onClick={() => { setImportStatus("idle"); setErrorMessage(""); }} className="mt-6 bg-gray-100 text-gray-700 px-8 py-2 rounded-xl font-bold">戻る</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
