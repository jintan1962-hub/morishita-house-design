/**
 * ロゴマーク（緑の丸＋白の家アイコン）。
 * ヘッダー・フッター・管理画面の3か所で使うため、ここ1箇所に置く（D-09）。
 *
 * 色は className から渡さず、fill を props で受ける。
 * フッターと管理画面サイドバーは濃紺地なので、丸を白抜きにする必要があるため。
 */
export default function BrandLogo({
  size = 42,
  circleFill = "var(--indigo)",
  strokeColor = "#fff",
  className,
}: {
  size?: number;
  circleFill?: string;
  strokeColor?: string;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx="50" cy="50" r="50" fill={circleFill} />
      <circle cx="50" cy="22.5" r="6.5" fill="none" stroke={strokeColor} strokeWidth="5" />
      <path
        d="M30,77 L30,45.5 L50,29 L70,45.5 L70,77"
        fill="none"
        stroke={strokeColor}
        strokeWidth="9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line x1="30" y1="60" x2="70" y2="60" stroke={strokeColor} strokeWidth="9" strokeLinecap="round" />
    </svg>
  );
}
