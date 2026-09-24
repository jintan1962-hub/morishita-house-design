"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { COMPANY } from "@/config/company";
import { PRIMARY_NAV } from "@/config/navigation";
import BrandLogo from "@/components/BrandLogo";
import SignInButton from "@/components/SignInButton";
import { AFTER_LOGIN_PATH } from "@/lib/authPaths";

/**
 * 全公開ページ共通のヘッダー。
 *
 * 以前はここに RENOEL のロゴ（他社サーバー上の SVG を直リンク）と、
 * 存在しないページ（./#renovation など）へのアンカーが入っていた。
 * リンク先は src/config/navigation.ts に集約し、実在するページだけを出す。
 *
 * ログイン状態でボタンの出し分けをするため "use client"。
 * ここで見せ方を変えているだけで、認可の判定はサーバー側で別途行っている（S-07）。
 */
export default function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="site">
      <div className="topbar">
        <Link className="brand" href="/" aria-label={`${COMPANY.shortName} トップページ`}>
          <BrandLogo className="brand-logo" />
          <span className="brand-text">
            <span className="brand-badge">中古住宅専門店</span>
            <span className="mark">{COMPANY.shortName}</span>
            <span className="mark-en">{COMPANY.brandNameEn}</span>
          </span>
          <span className="tagline">{COMPANY.areaLabel}</span>
        </Link>

        <div className="utility">
          {status === "loading" ? (
            // 判定中に「会員登録」と出してから「マイページ」へ入れ替わるのを防ぐ。
            // 幅は確保しておき、レイアウトが飛ばないようにする。
            <span className="btn btn-ghost" aria-hidden="true" style={{ visibility: "hidden" }}>
              会員登録・ログイン
            </span>
          ) : session ? (
            <>
              {isAdmin && (
                <Link className="btn btn-ghost" href="/admin">
                  管理画面
                </Link>
              )}
              <Link className="btn btn-ghost" href="/mypage">
                マイページ
              </Link>
              <button className="btn btn-line" onClick={() => signOut({ callbackUrl: "/" })}>
                ログアウト
              </button>
            </>
          ) : (
            <>
              {/* 押した人が管理者か会員か、押す時点では分からない。
                  いったん /after-login へ送り、権限ごとの入り口へ振り分ける。 */}
              <SignInButton callbackUrl={AFTER_LOGIN_PATH} className="btn btn-ghost">
                ログイン
              </SignInButton>
              <Link className="btn btn-gold" href="/member">
                無料会員登録
              </Link>
            </>
          )}
          <Link className="btn btn-solid" href="/showroom">
            来店予約
          </Link>
        </div>
      </div>

      <div className="nav-row">
        <nav className="primary" aria-label="メインメニュー">
          {PRIMARY_NAV.map((item) =>
            item.external ? (
              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer">
                {item.label}
              </a>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
              >
                {item.label}
              </Link>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
