import Link from "next/link";
import { COMPANY, LICENSES } from "@/config/company";
import { FOOTER_NAV } from "@/config/navigation";
import BrandLogo from "@/components/BrandLogo";

/**
 * 全公開ページ共通のフッター。
 *
 * 以前はこのコンポーネントが空（<></>）で、フッターがトップページの
 * 埋め込みHTMLの中にしか無かった。そのため物件一覧や会員登録から
 * 先へ進むと、会社名も電話番号も免許番号も無い画面になっていた。
 *
 * 宅地建物取引業者の免許番号は、宅建業法で標識・広告への表示が要る。
 * 出所は src/config/company.ts の LICENSES 1箇所（D-08）。
 */
export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="site">
      <div className="wrap">
        <div className="foot-grid">
          <div className="foot-brand">
            <div className="foot-brand__head">
              <BrandLogo size={34} circleFill="#fff" strokeColor="var(--ink)" />
              <span className="mark">{COMPANY.shortName}</span>
            </div>
            <p>
              {COMPANY.legalName}
              <br />〒{COMPANY.zip} {COMPANY.address}
              <br />
              TEL {COMPANY.telDirect}（フリーダイヤル {COMPANY.tel}）
              <br />
              受付時間　{COMPANY.businessHours}
            </p>
            <p className="foot-license">
              {LICENSES.map((line) => (
                <span key={line}>
                  {line}
                  <br />
                </span>
              ))}
            </p>
          </div>

          {FOOTER_NAV.map((col) => (
            <div className="foot-col" key={col.heading}>
              <h5>{col.heading}</h5>
              <ul>
                {col.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a href={link.href} target="_blank" rel="noopener noreferrer">
                        {link.label}
                      </a>
                    ) : (
                      <Link href={link.href}>{link.label}</Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="foot-bottom">
          <span>
            © {year} {COMPANY.legalName}
          </span>
          <span>{COMPANY.areaLabel}の中古住宅・リノベーション</span>
        </div>
      </div>
    </footer>
  );
}
