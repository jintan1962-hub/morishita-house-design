"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getPublicProperties } from "@/app/actions/properties";
import PropertyCard, { type PublicProperty } from "@/components/PropertyCard";

/**
 * トップページの新着物件。
 *
 * 以前はここに架空の物件3件が直書きされていた（佐久市中込 4LDK 1,380万円など）。
 * 実在しない物件を見て問い合わせが来る状態だったため、DBの新着に置き換えてある。
 * カードの見た目は PropertyCard に寄せている（一覧ページと同じ見え方にするため）。
 */
const COUNT = 8;

export default function NewArrivals() {
  const [items, setItems] = useState<PublicProperty[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getPublicProperties(undefined, COUNT).then((res) => {
      if (res.success) {
        setItems(res.data as PublicProperty[]);
      } else {
        // D-07：握り潰さない。画面には内部情報を出さず、失敗した事実だけ伝える。
        setItems([]);
        setError(res.error);
      }
    });
  }, []);

  return (
    <section className="band" id="newarrival">
      <div className="wrap">
        <div className="head-row">
          <div>
            <span className="eyebrow">New Arrival</span>
            <h2>新着物件</h2>
          </div>
          <Link className="more" href="/properties">
            物件一覧をすべて見る
          </Link>
        </div>

        {items === null && <p className="state-msg">読み込んでいます…</p>}
        {error && <p className="notice notice-ng">{error}</p>}
        {items !== null && !error && items.length === 0 && (
          <p className="state-msg">現在公開中の物件はありません。</p>
        )}

        {items !== null && items.length > 0 && (
          <>
            <div className="prop-grid">
              {items.map((p) => (
                <PropertyCard key={p.id} property={p} showMonthly isNew />
              ))}
            </div>
            <p className="note-line" style={{ marginTop: 18 }}>
              物件価格の下に出ている金額は、リノベーション費用まで含めた月々のお支払い目安です。
              実際の借入条件により変わります。
            </p>
          </>
        )}
      </div>
    </section>
  );
}
