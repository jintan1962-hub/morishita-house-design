
"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { COMPANY } from "@/config/company";
import Link from "next/link";
import SignInButton from "@/components/SignInButton";

export default function Header() {
  useSession();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const btn = document.getElementById("drawerBtn");
    if(btn) {
        btn.onclick = () => setIsDrawerOpen(prev => !prev);
    }
  }, []);

  return (
    <>
      <header className="header" id="header">
  <div className="header__inner">
    <p className="header__logo">
      <Link href="/" aria-label={`${COMPANY.brandName} トップページ`}>
        <img src="https://usedrenovation.ooi-kensetsu.co.jp/wp-content/themes/base/images/common/top/top-logoB.svg" alt={`${COMPANY.legalName} ${COMPANY.brandName}`} />
      </Link>
    </p>

    <nav className="header__gnav" aria-label="グローバルナビゲーション">
      <ul>
        <li><a href="/properties">物件を探す</a></li>
        <li><a href="https://usedrenovation.ooi-kensetsu.co.jp/sell/">物件を売る</a></li>
        <li><a href="./#renovation">リノベーション事例</a></li>
        <li><a href="./#simulation">資金計画</a></li>
        <li><a href="./#voice">お客様の声</a></li>
        <li><a href="./#company">会社案内</a></li>
      </ul>
    </nav>

    <div className="header__util">
      <Link className="btnMini btnMini--accent" href="/member">無料会員登録</Link>
      <SignInButton className="btnMini">ログイン</SignInButton>
      <a className="btnMini btnMini--navy" href="./#showroom">来店予約</a>
    </div>

    <button className="drawerBtn" id="drawerBtn" aria-label="メニューを開く" aria-expanded="false" aria-controls="drawer">
      <span></span><span></span><span></span>
    </button>
  </div>
</header>
      <div className={`drawer ${isDrawerOpen ? "is-open" : ""}`} id="drawer" style={{ display: isDrawerOpen ? "block" : "none" }}>
        
  <nav aria-label="メニュー">
    <ul className="drawer__list">
      <li><a href="/properties">物件を探す</a></li>
      <li><a href="https://usedrenovation.ooi-kensetsu.co.jp/sell/">物件を売る</a></li>
      <li><a href="./#newarrival">新着物件</a></li>
      <li><a href="./#membership">会員登録のメリット</a></li>
      <li><a href="./#simulation">資金計画</a></li>
      <li><a href="./#renovation">リノベーション事例</a></li>
      <li><a href="./#voice">お客様の声</a></li>
      <li><a href="./#news">お知らせ・ブログ</a></li>
      <li><a href="./#company">会社案内</a></li>
    </ul>

    <div className="drawer__cta">
      <Link className="btn btn--accent" href="/member">無料会員登録</Link>
      <a className="btn btn--light" href="./#showroom">来店予約</a>
    </div>

    <div className="drawer__info">
      <a className="drawer__tel" href={COMPANY.telLink}>{COMPANY.tel}</a>
      <p>{COMPANY.brandName}<br />{COMPANY.businessHours}</p>
    </div>
  </nav>
      </div>
    </>
  );
}
