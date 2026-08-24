"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2, AlertTriangle } from "lucide-react";
import {
  uploadImagesForProperty,
  deletePropertyImage,
  type ImageUploadResult,
} from "@/app/actions/propertyImages";
import { MAX_FILE_LABEL, MAX_IMAGES_PER_PROPERTY, ALLOWED_EXTENSIONS } from "@/config/images";

type Image = { id: number; path: string; sortOrder: number };

export default function PropertyImages({
  propertyId,
  images,
  storageReady,
}: {
  propertyId: number;
  images: Image[];
  storageReady: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<ImageUploadResult[]>([]);
  const [error, setError] = useState("");

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setBusy(true);
    setError("");
    setResults([]);

    const fd = new FormData();
    for (const f of Array.from(files)) fd.append("files", f);

    const res = await uploadImagesForProperty(propertyId, fd);
    if (res.success) setResults(res.results);
    else setError(res.error);

    setBusy(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleDelete(id: number) {
    setBusy(true);
    setError("");
    const res = await deletePropertyImage(id);
    if (!res.success) setError(res.error);
    setBusy(false);
  }

  return (
    <section className="bg-white p-8 rounded-2xl shadow-sm border border-reno-line space-y-6">
      <div className="border-b border-reno-line pb-4">
        <h2 className="text-lg font-bold text-ink">物件画像</h2>
        <p className="text-xs font-bold text-reno-mute-dark mt-1">
          {ALLOWED_EXTENSIONS.join(" / ")}・1枚 {MAX_FILE_LABEL} まで・1物件 {MAX_IMAGES_PER_PROPERTY} 枚まで。
          先頭の画像が一覧のサムネイルになります。
        </p>
      </div>

      {!storageReady && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm font-bold text-amber-800">
            画像の保管先が未設定のため、アップロードできません。
            Vercel の環境変数に SUPABASE_URL と SUPABASE_SERVICE_ROLE_KEY を設定してください。
          </p>
        </div>
      )}

      {error && (
        <p className="text-sm font-bold text-red-700 bg-red-50 border border-red-200 rounded-2xl p-4">
          {error}
        </p>
      )}

      {images.length === 0 ? (
        <p className="text-sm font-bold text-reno-mute-dark py-6 text-center">
          画像が登録されていません。
        </p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {images.map((img) => (
            <div key={img.id} className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element -- 外部ストレージ配信のため */}
              <img
                src={img.path}
                alt={`物件画像 ${img.sortOrder}`}
                className="w-full aspect-[4/3] object-cover rounded-2xl border border-reno-line"
              />
              <span className="absolute top-2 left-2 bg-black/60 text-white text-xs font-bold px-2 py-1 rounded">
                {img.sortOrder}
              </span>
              <button
                type="button"
                onClick={() => handleDelete(img.id)}
                disabled={busy}
                className="absolute top-2 right-2 bg-white/90 text-red-600 p-2 rounded-full shadow hover:bg-red-50 disabled:opacity-50"
                aria-label="この画像を削除"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          multiple
          onChange={handleFiles}
          disabled={busy || !storageReady}
          className="hidden"
          id="property-image-input"
        />
        <label
          htmlFor="property-image-input"
          className={`inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm cursor-pointer transition-all ${
            busy || !storageReady
              ? "bg-reno-bg text-reno-mute-dark cursor-not-allowed"
              : "bg-ink text-white hover:bg-teal"
          }`}
        >
          <ImagePlus size={18} />
          {busy ? "アップロード中…" : "画像を追加"}
        </label>
      </div>

      {results.length > 0 && (
        <ul className="text-xs font-bold space-y-1 border-t border-reno-line pt-4">
          {results.map((r, i) => (
            <li key={i} className={r.ok ? "text-green-700" : "text-red-700"}>
              {r.ok ? "✓" : "✕"} {r.fileName}：{r.message}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
