"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicProperties, getAreaPropertyCounts } from "@/app/actions/properties";
import { AREAS, areaName } from "@/config/property";

/**
 * トップページの地図で市区町村を選んだときに、その地域の物件を地図の下に出す。
 *
 * 地図の SVG は確定版HTMLの中にあり、クリック処理は public/assets/js/main.js が持っている。
 * SVG をReactへ作り直すと差分が大きくなるため、main.js から CustomEvent を投げてもらい、
 * ここで受け取る形にした。イベント名は下の AREA_SELECT_EVENT だけが決めている。
 *
 * 以前は main.js が `search.html?city=…` へ遷移していた。そのページは存在せず、
 * Vercel 上では404になっていた（地図を押しても何も起きない状態だった）。
 */
export const AREA_SELECT_EVENT = "renoel:area-select";

/** 地図の下に出す件数。 */
const PREVIEW_COUNT = 6;

type Item = {
  id: number;
  title: string | null;
  priceMan: number | null;
  madori: string | null;
  address: string | null;
  images: string[];
  locked: boolean;
};

export default function AreaProperties() {
  const [cityCd, setCityCd] = useState<string | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 地図の件数を実データで埋める。
  // 数字は確定版HTMLの中に直書きされており（佐久市86件など）、すべて架空だった。
  // SVGごとReactへ作り直すと差分が大きいため、値だけ後から入れる。
  useEffect(() => {
    getAreaPropertyCounts().then((res) => {
      if (!res.success) return;
      document.querySelectorAll<HTMLElement>("[data-count-for]").forEach((el) => {
        const code = el.dataset.countFor;
        if (!code) return;
        const n = res.data[code] ?? 0;
        el.textContent = String(n);
        const button = el.closest<HTMLElement>(".areaMap__listItem");
        if (button) button.setAttribute("aria-label", `${button.textContent?.trim() ?? ""} ${n}件`);
      });
    });
  }, []);

  // 取得はイベントハンドラの中で行う。effect の本体で同期的に setState すると
  // 再レンダリングが連鎖するため（eslint の react-hooks の指摘どおり）。
  useEffect(() => {
    // 選択が続けて起きたとき、古い応答で新しい表示を上書きしないための番号
    let latest = 0;

    async function select(code: string) {
      if (!AREAS.some((a) => a.cityCd === code)) return;

      const seq = ++latest;
      setCityCd(code);
      setLoading(true);
      setError("");

      const res = await getPublicProperties(code, PREVIEW_COUNT);
      if (seq !== latest) return; // より新しい選択が来ていれば捨てる

      if (res.success) setItems(res.data as Item[]);
      else setError(res.error);
      setLoading(false);

      // 結果の位置までスクロールする
      window.setTimeout(() => {
        const el = document.getElementById("area-results");
        if (!el) return;
        window.scrollTo({
          top: el.getBoundingClientRect().top + window.pageYOffset - 90,
          behavior: "smooth",
        });
      }, 100);
    }

    // 地図のクリックは React 側で直接受ける。
    // 以前は main.js が CustomEvent を投げる作りにしていたが、main.js の
    // 読み込みタイミングによっては要素を掴めず、地図が無反応になった。
    // この effect は DOM が組み上がったあとに必ず走るため、取りこぼしがない。
    function onClick(e: Event) {
      const el = (e.target as Element | null)?.closest?.(
        ".areaMap__region.is-target, .areaMap__listItem"
      ) as HTMLElement | null;
      if (!el?.dataset.code) return;
      void select(el.dataset.code);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== "Enter" && e.key !== " ") return;
      const el = (e.target as Element | null)?.closest?.(
        ".areaMap__region.is-target, .areaMap__listItem"
      ) as HTMLElement | null;
      if (!el?.dataset.code) return;
      e.preventDefault();
      void select(el.dataset.code);
    }

    // document で受ける（委譲）。地図が後から差し替わっても効き続ける。
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKeyDown);

    // main.js 側から投げられた場合にも対応する（従来の経路）
    function onEvent(e: Event) {
      const code = (e as CustomEvent<{ code?: string }>).detail?.code;
      if (code) void select(code);
    }
    window.addEventListener(AREA_SELECT_EVENT, onEvent);

    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener(AREA_SELECT_EVENT, onEvent);
    };
  }, []);

  if (!cityCd) return null;

  const name = areaName(cityCd) ?? "";

  return (
    <section className="sec sec--gray" style={{ paddingTop: 0 }} id="area-results">
      <div className="container container--wide">
        <h3
          className="ja"
          style={{ fontSize: "1.5rem", color: "var(--c-ink)", marginBottom: "20px" }}
        >
          {name}の物件
        </h3>

        {loading && <p style={{ padding: "24px 0" }}>読み込んでいます…</p>}

        {error && <p style={{ padding: "24px 0", color: "#b91c1c" }}>{error}</p>}

        {!loading && !error && items.length === 0 && (
          <p style={{ padding: "24px 0" }}>{name}に現在公開中の物件はありません。</p>
        )}

        {items.length > 0 && (
          <div className="propGrid">
            {items.map((p) =>
              p.locked ? (
                <Link key={p.id} className="propCard is-locked" href="/member">
                  <figure className="propCard__fig">
                    <span className="badge badge--member">会員限定</span>
                  </figure>
                  <div className="propCard__body">
                    <h3 className="propCard__ttl">詳細は会員限定</h3>
                    <p className="propCard__note">無料会員登録でご覧いただけます</p>
                  </div>
                </Link>
              ) : (
                <Link key={p.id} className="propCard" href={`/property/${p.id}`}>
                  <figure className="propCard__fig">
                    {p.images[0] && (
                      // eslint-disable-next-line @next/next/no-img-element -- 外部ストレージ配信のため
                      <img src={p.images[0]} alt={p.title ?? "物件画像"} />
                    )}
                  </figure>
                  <div className="propCard__body">
                    <h3 className="propCard__ttl">{p.title}</h3>
                    <p className="propCard__price">
                      {p.priceMan !== null ? `${p.priceMan.toLocaleString()}万円` : "価格応談"}
                    </p>
                    <p className="propCard__note">
                      {[p.madori, p.address].filter(Boolean).join(" / ")}
                    </p>
                  </div>
                </Link>
              )
            )}
          </div>
        )}

        <div className="btnWrap" style={{ marginTop: "28px" }}>
          <Link className="btn btn--navy" href={`/properties?city=${cityCd}`}>
            {name}のすべての物件はこちら
          </Link>
        </div>
      </div>
    </section>
  );
}
