import Link from "next/link";
import { areaName } from "@/config/property";
import { calculateMonthlyPayment } from "@/lib/loan";
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  DEFAULT_LOAN_YEARS,
  DEFAULT_RENOVATION_COST_YEN,
  MAN_YEN,
} from "@/config/loan";

/**
 * 物件カード。トップの新着・エリア別・物件一覧の3か所で使う（D-09）。
 *
 * 会員限定で伏せられた物件（locked）は、価格も所在地も**サーバーが返していない**。
 * ここで隠しているのではなく、届いていない（S-07）。
 */

/** searchPublicProperties が返す1件分。 */
export type PublicProperty = {
  id: number;
  title: string | null;
  syumoku: string;
  cityCd?: string;
  madori: string | null;
  priceMan: number | null;
  address: string | null;
  landMen: number | null;
  bldMen: number | null;
  images: string[];
  isMemberOnly?: boolean;
  locked: boolean;
};

export default function PropertyCard({
  property,
  showMonthly = false,
  isNew = false,
}: {
  property: PublicProperty;
  /** リノベ費用込みの月々目安を出すか（トップの新着で使う） */
  showMonthly?: boolean;
  isNew?: boolean;
}) {
  const p = property;

  if (p.locked) {
    return (
      <Link className="prop-card prop-locked" href="/member">
        <div className="prop-photo">
          <div className="badge-row">
            <span className="badge badge-member">会員限定</span>
          </div>
          <LockIcon />
        </div>
        <div className="prop-body">
          <p className="prop-price">詳細は会員限定</p>
          <p className="prop-title">無料会員登録でご覧いただけます</p>
          <p className="prop-loc">
            {p.syumoku}
            {p.cityCd && areaName(p.cityCd) ? `／${areaName(p.cityCd)}` : ""}
          </p>
        </div>
      </Link>
    );
  }

  const priceMan = p.priceMan ?? 0;
  const monthly = calculateMonthlyPayment(
    priceMan * MAN_YEN + DEFAULT_RENOVATION_COST_YEN,
    DEFAULT_ANNUAL_RATE_PERCENT,
    DEFAULT_LOAN_YEARS
  );

  return (
    <Link className="prop-card" href={`/property/${p.id}`}>
      <div className="prop-photo">
        <div className="badge-row">
          {isNew && <span className="badge badge-new">NEW</span>}
          {p.isMemberOnly && <span className="badge badge-member">会員限定</span>}
        </div>
        {p.images[0] ? (
          // eslint-disable-next-line @next/next/no-img-element -- 外部ストレージ配信のため
          <img src={p.images[0]} alt={p.title ?? "物件画像"} loading="lazy" />
        ) : (
          <HouseIcon />
        )}
      </div>
      <div className="prop-body">
        <p className="prop-price">
          {priceMan.toLocaleString()}
          <span>万円</span>
        </p>
        {showMonthly && (
          <p className="prop-monthly">
            リノベ込み月々 {Math.round(monthly).toLocaleString()} 円
            <br />
            <small>
              （リノベ{(DEFAULT_RENOVATION_COST_YEN / MAN_YEN).toLocaleString()}万円／金利
              {DEFAULT_ANNUAL_RATE_PERCENT}%・{DEFAULT_LOAN_YEARS}年で試算）
            </small>
          </p>
        )}
        <p className="prop-title">{p.title}</p>
        <p className="prop-spec">
          <span>
            <b>{p.madori ?? "－"}</b>
          </span>
          <span>土地 {p.landMen ? `${p.landMen}㎡` : "－"}</span>
          <span>建物 {p.bldMen ? `${p.bldMen}㎡` : "－"}</span>
        </p>
        <p className="prop-loc">
          {p.syumoku}／{p.address ?? (p.cityCd ? areaName(p.cityCd) : "－")}
        </p>
      </div>
    </Link>
  );
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
      <path d="M9 20v-6h6v6" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  );
}
