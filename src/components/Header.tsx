"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export default function Header() {
  const { data: session, status } = useSession();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isLoading = status === "loading";

  return (
    <>
      <header className={`header ${isScrolled ? "is-scrolled" : ""}`}>
        <div className="header__inner">
          <p className="header__logo">
            <Link href="/">
              <img className="logo-w" src="https://okazaki-bot.github.io/chuko-fudousan-design/assets/img/top-logoW.png" alt="中古住宅×リノベーション RENOEL" />
              <img className="logo-b" src="https://okazaki-bot.github.io/chuko-fudousan-design/assets/img/top-logoB.svg" alt="中古住宅×リノベーション RENOEL" />
            </Link>
          </p>

          <nav className="header__gnav" aria-label="メインメニュー">
            <ul className="gnav">
              <li><Link href="/properties">物件を探す</Link></li>
              <li><Link href="#area">エリアマップ</Link></li>
              <li><Link href="#renovation">リノベーション事例</Link></li>
              <li><Link href="#showroom">モデルハウス・店舗</Link></li>
              <li><Link href="#simulation">資金計画</Link></li>
              <li><Link href="#voice">お客様の声</Link></li>
              <li><Link href="#column">お役立ちコラム</Link></li>
              <li><Link href="#company">会社案内</Link></li>
            </ul>
          </nav>

          <div className="header__util">
            {!session && !isLoading && (
              <Link className="utilBtn utilBtn--member" href="/register">無料会員登録</Link>
            )}
            {session ? (
              <Link className="utilBtn utilBtn--login" href="/mypage">マイページ</Link>
            ) : (
              <button onClick={() => signIn()} className="utilBtn utilBtn--login">ログイン</button>
            )}
            <Link className="utilBtn utilBtn--reserve" href="#reserve">来店予約</Link>
          </div>

          <button 
            className={`drawerBtn ${isMenuOpen ? 'is-active' : ''}`} 
            type="button" 
            aria-expanded={isMenuOpen} 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="メニューを開く"
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </header>

      {/* Drawer Menu */}
      <div className={`drawer ${isMenuOpen ? 'is-open' : ''}`} id="drawer">
        <nav aria-label="全メニュー">
          <ul className="drawer__list">
            <li><Link href="/" onClick={() => setIsMenuOpen(false)}>HOME</Link></li>
            <li><Link href="/properties" onClick={() => setIsMenuOpen(false)}>物件を探す</Link></li>
            <li><Link href="#area" onClick={() => setIsMenuOpen(false)}>エリアマップから探す</Link></li>
            <li><Link href="#renovation" onClick={() => setIsMenuOpen(false)}>リノベーション事例</Link></li>
            <li><Link href="#showroom" onClick={() => setIsMenuOpen(false)}>リノベーションモデルハウス・店舗案内</Link></li>
            <li><Link href="#simulation" onClick={() => setIsMenuOpen(false)}>資金計画シミュレーション</Link></li>
            <li><Link href="#voice" onClick={() => setIsMenuOpen(false)}>お客様の声</Link></li>
            <li><Link href="#column" onClick={() => setIsMenuOpen(false)}>お役立ちコラム</Link></li>
            <li><Link href="/admin" onClick={() => setIsMenuOpen(false)}>管理者ログイン</Link></li>
          </ul>
          <div className="drawer__cta">
            <Link className="btn btn--pink" href="/register" onClick={() => setIsMenuOpen(false)}>無料会員登録</Link>
            <Link className="btn btn--white" href="#reserve" onClick={() => setIsMenuOpen(false)}>来店予約</Link>
          </div>
          <div className="drawer__info">
            <a className="tel" href="tel:0120556119">0120-556-119</a>
            8:00〜17:00（お盆・年末年始を除く）
          </div>
        </nav>
      </div>

      <style jsx>{`
        .drawerBtn {
          display: none;
          position: relative;
          z-index: 1001;
          width: 48px;
          height: 48px;
          background: none;
          border: none;
        }
        .drawerBtn span {
          position: absolute;
          left: 12px;
          width: 24px;
          height: 1px;
          background: ${isScrolled ? 'var(--c-ink)' : 'var(--c-white)'};
          transition: all 0.3s;
        }
        .drawerBtn span:nth-child(1) { top: 16px; }
        .drawerBtn span:nth-child(2) { top: 24px; }
        .drawerBtn span:nth-child(3) { top: 32px; }
        
        .drawerBtn.is-active span:nth-child(1) { transform: translateY(8px) rotate(45deg); background: #FFF; }
        .drawerBtn.is-active span:nth-child(2) { opacity: 0; }
        .drawerBtn.is-active span:nth-child(3) { transform: translateY(-8px) rotate(-45deg); background: #FFF; }

        .drawer {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: var(--c-ink);
          color: #FFF;
          padding: 100px 40px 40px;
          overflow-y: auto;
          transform: translateX(100%);
          transition: transform 0.4s ease;
        }
        .drawer.is-open {
          transform: translateX(0);
        }
        .drawer__list {
          font-family: var(--f-mincho);
          font-size: 2rem;
          font-weight: bold;
          line-height: 2;
          margin-bottom: 40px;
        }
        .drawer__cta {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .drawer__info {
          margin-top: 40px;
          text-align: center;
          font-size: 1.4rem;
        }
        .drawer__info .tel {
          display: block;
          font-size: 2.8rem;
          font-weight: bold;
          color: #FFF;
          margin-bottom: 8px;
        }

        @media (max-width: 1180px) {
          .drawerBtn { display: block; margin-left: auto; }
        }
      `}</style>
    </>
  );
}
