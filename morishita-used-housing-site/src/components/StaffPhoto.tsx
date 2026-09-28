/**
 * スタッフの顔写真。写真が未入手（null）のときは人型アイコンを出す。
 * トップページと会社概要ページの両方で使う（D-09）。
 * 丸型・縦長の枠は呼び出し側の className（.staff-photo / .pro-photo）で決める。
 */
export default function StaffPhoto({ src, alt }: { src: string | null; alt: string }) {
  if (!src) {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true" style={{ width: 44, height: 44, color: "var(--indigo)" }}>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 3.6-6 8-6s8 2 8 6" />
      </svg>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element -- public/staff に WebP で縮小済みのものを置いているため
  return <img src={src} alt={alt} loading="lazy" />;
}
