"use client";

import { useState } from "react";
import Link from "next/link";
import { calculateMonthlyPayment } from "@/lib/loan";
import {
  DEFAULT_ANNUAL_RATE_PERCENT,
  DEFAULT_LOAN_YEARS,
  DEFAULT_RENOVATION_COST_YEN,
  MAN_YEN,
} from "@/config/loan";

/**
 * トップページの資金計画シミュレーション。
 *
 * もとは確定版HTMLの中にあり、計算は public/assets/js/main.js が持っていた。
 * main.js は読み込みのタイミング次第で機能しなくなることがあり（実際に本番で
 * 無反応になった）、計算式も src/lib/loan.ts と重複していた。
 * 計算はテストのある src/lib/loan.ts の1本に寄せる。
 */

const fmt = (n: number) => Math.round(n).toLocaleString("ja-JP");

export default function LoanSimulator() {
  const [priceMan, setPriceMan] = useState(1380);
  const [renoMan, setRenoMan] = useState(DEFAULT_RENOVATION_COST_YEN / MAN_YEN);
  const [downMan, setDownMan] = useState(0);
  const [rate, setRate] = useState(DEFAULT_ANNUAL_RATE_PERCENT);
  const [years, setYears] = useState(DEFAULT_LOAN_YEARS);

  const totalMan = Math.max(priceMan + renoMan - downMan, 0);
  const monthly = calculateMonthlyPayment(totalMan * MAN_YEN, rate, years);

  const rows: {
    id: string;
    label: string;
    min: number;
    max: number;
    step: number;
    value: number;
    set: (n: number) => void;
    unit: string;
    display: string;
  }[] = [
    { id: "simPrice", label: "物件価格", min: 300, max: 6000, step: 1, value: priceMan, set: setPriceMan, unit: "万円", display: fmt(priceMan) },
    { id: "simReno", label: "リノベーション費用", min: 300, max: 4000, step: 1, value: renoMan, set: setRenoMan, unit: "万円", display: fmt(renoMan) },
    { id: "simDown", label: "自己資金（頭金）", min: 0, max: 2000, step: 1, value: downMan, set: setDownMan, unit: "万円", display: fmt(downMan) },
    { id: "simRate", label: "金利（年）", min: 0.3, max: 3, step: 0.05, value: rate, set: setRate, unit: "％", display: rate.toFixed(2) },
    { id: "simYears", label: "返済期間", min: 10, max: 40, step: 1, value: years, set: setYears, unit: "年", display: String(years) },
  ];

  return (
    <section className="sec" id="simulation">
      <div className="container container--wide">
        <h2 className="secTtl">
          <span className="secTtl__main">資金計画シミュレーション</span>
        </h2>
        <p className="secLead">
          中古住宅は「物件価格」だけでは判断できません。物件＋リノベーション費用を1本のローンにまとめた月々のお支払いで比べてください。
        </p>

        <div className="simu">
          <div className="simu__form">
            {rows.map((r) => (
              <div className="simu__row" key={r.id}>
                <label htmlFor={r.id}>{r.label}</label>
                <div className="simu__ctl">
                  <input
                    type="range"
                    id={r.id}
                    min={r.min}
                    max={r.max}
                    step={r.step}
                    value={r.value}
                    onChange={(e) => r.set(Number(e.target.value))}
                  />
                  <output htmlFor={r.id}>
                    <b>{r.display}</b> {r.unit}
                  </output>
                </div>
              </div>
            ))}
          </div>

          <div className="simu__result">
            <p className="simu__resultLb">
              月々のお支払い<small>（元利均等・ボーナス払いなし）</small>
            </p>
            <p className="simu__resultNum">
              <strong>{fmt(monthly)}</strong> 円
            </p>
            <dl className="simu__detail">
              <div>
                <dt>借入総額</dt>
                <dd>
                  <span>{fmt(totalMan)}</span> 万円
                </dd>
              </div>
              <div>
                <dt>返済期間</dt>
                <dd>
                  <span>{years}</span> 年
                </dd>
              </div>
              <div>
                <dt>適用金利</dt>
                <dd>
                  <span>{rate.toFixed(2)}</span> ％
                </dd>
              </div>
            </dl>
            <p className="simu__note">
              金利は当社提携金融機関の変動金利を想定した参考値です。
              <br />
              実際の借入可能額・適用金利はご年収や審査結果により異なります。
              <br />
              仲介手数料・登記費用などの諸費用は含みません。
            </p>
            <Link className="btn btn--navy" href="/simulation">
              資金計画をもっと詳しく見る
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
