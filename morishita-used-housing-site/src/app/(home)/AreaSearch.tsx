"use client";

import { useState } from "react";
import Link from "next/link";
import HimejiAreaMap from "./HimejiAreaMap";
import { HIMEJI_DISTRICTS, HIMEJI_CITY_CODE, type HimejiDistrictKey } from "@/config/himejiAreas";
import { AREAS } from "@/config/property";
import { MADORI_BUCKETS } from "@/lib/madori";
import type { HomeStats } from "@/app/actions/homeStats";

/**
 * 「いま、姫路に何件あるか」— エリア別／小学校区別／間取り別の3つの切り口。
 *
 * 件数は全てサーバーで数えた実数（getHomeStats）。
 * 以前のRENOEL版は地図の中に「佐久市 86件」などの数字が直書きされていて、
 * すべて架空だった。ここでは件数を props でしか受け取らない作りにして、
 * 直書きが混じらないようにしている。
 *
 * 地図をクリックしたら、その条件の物件一覧ページへ送る。
 * 「押しても何も起きない地図」を作らないため、行き先は必ず実在するページにする。
 */

type Tab = "area" | "school" | "madori";

export default function AreaSearch({ stats }: { stats: HomeStats }) {
  const [tab, setTab] = useState<Tab>("area");
  const [hovered, setHovered] = useState<HimejiDistrictKey | null>(null);

  const totalPublic = Object.values(stats.byCity).reduce((n, c) => n + c.publicCount, 0);
  const totalMembers = Object.values(stats.byCity).reduce((n, c) => n + c.membersCount, 0);

  // 姫路市以外の対応エリア。地図は姫路市南部だけなので、表で並べる。
  const otherAreas = AREAS.filter((a) => a.cityCd !== HIMEJI_CITY_CODE);

  return (
    <section className="band" id="areamap">
      <div className="wrap">
        <div className="head-row">
          <div>
            <span className="eyebrow">Property Count</span>
            <h2>いま、姫路に何件あるか</h2>
          </div>
          <p className="lead" style={{ margin: 0 }}>
            エリア・小学校区・間取りの3つの切り口から、いま掲載している物件を探せます。
          </p>
        </div>

        <div className="count-bar">
          <span style={{ fontSize: 13, color: "var(--ink-soft)" }}>現在の掲載物件数</span>
          <strong>{stats.total.toLocaleString()}</strong>
          <span style={{ fontSize: 18, marginLeft: -8 }}>件</span>
          <span style={{ fontSize: 12.5, color: "var(--ink-faint)", marginLeft: "auto" }}>
            うち会員限定 {stats.membersOnly.toLocaleString()} 件
          </span>
        </div>

        <div className="qs-tabs" role="tablist" style={{ marginBottom: 28 }}>
          {(
            [
              ["area", "エリア別"],
              ["school", "小学校区別"],
              ["madori", "間取り別"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              className="qs-tab"
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
            >
              {label}
            </button>
          ))}
        </div>

        {/* ---------------- エリア別 ---------------- */}
        {tab === "area" && (
          <div className="areamap-layout">
            <div className="areamap-visual">
              <HimejiAreaMap
                counts={Object.fromEntries(
                  HIMEJI_DISTRICTS.map((d) => [
                    d.key,
                    {
                      public: stats.byDistrict[d.key]?.publicCount ?? 0,
                      members: stats.byDistrict[d.key]?.membersCount ?? 0,
                    },
                  ])
                )}
                active={hovered}
                onSelect={(key) => {
                  // 地図はリンクにできない（SVGのパス）ので、クリックで遷移させる。
                  window.location.href = `/properties?district=${key}`;
                }}
              />
            </div>

            <div>
              <div className="areamap-legend">
                <span>
                  <i className="dot dot-public" />
                  一般公開
                </span>
                <span>
                  <i className="dot dot-member" />
                  会員限定
                </span>
              </div>

              <table className="areamap-table">
                <caption className="visually-hidden">姫路市南部のエリア別 物件件数</caption>
                <thead>
                  <tr>
                    <th>エリア</th>
                    <th>一般公開</th>
                    <th>会員限定</th>
                  </tr>
                </thead>
                <tbody>
                  {HIMEJI_DISTRICTS.map((d) => {
                    const c = stats.byDistrict[d.key] ?? { publicCount: 0, membersCount: 0 };
                    return (
                      <tr
                        key={d.key}
                        className={hovered === d.key ? "is-active" : undefined}
                        onMouseEnter={() => setHovered(d.key)}
                        onMouseLeave={() => setHovered(null)}
                      >
                        <td>
                          <Link href={`/properties?district=${d.key}`}>{d.name}エリア</Link>
                        </td>
                        <td>{c.publicCount}</td>
                        <td>{c.membersCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <h3 style={{ fontSize: 16, marginTop: 30, marginBottom: 12 }}>姫路市以外のエリア</h3>
              <table className="areamap-table">
                <caption className="visually-hidden">姫路市以外の対応エリア 物件件数</caption>
                <thead>
                  <tr>
                    <th>市町</th>
                    <th>一般公開</th>
                    <th>会員限定</th>
                  </tr>
                </thead>
                <tbody>
                  {otherAreas.map((a) => {
                    const c = stats.byCity[a.cityCd] ?? { publicCount: 0, membersCount: 0 };
                    return (
                      <tr key={a.cityCd}>
                        <td>
                          <Link href={`/properties?city=${a.cityCd}`}>{a.name}</Link>
                        </td>
                        <td>{c.publicCount}</td>
                        <td>{c.membersCount}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td>合計</td>
                    <td>{totalPublic}</td>
                    <td>{totalMembers}</td>
                  </tr>
                </tfoot>
              </table>

              <p className="areamap-note">
                会員登録すると<b>会員限定物件 {stats.membersOnly} 件</b>も検索対象になります。
              </p>
              <Link className="btn btn-solid" style={{ marginTop: 18 }} href="/properties">
                エリアから物件を探す
              </Link>
            </div>
          </div>
        )}

        {/* ---------------- 小学校区別 ---------------- */}
        {tab === "school" && (
          <>
            <div className="school-grid">
              {HIMEJI_DISTRICTS.map((d) => {
                const total = d.schools.reduce((n, s) => n + (stats.bySchool[s] ?? 0), 0);
                return (
                  <div className="school-block" key={d.key}>
                    <h4>
                      {d.name}エリア <span>合計 {total}件</span>
                    </h4>
                    <div className="school-list">
                      {d.schools.map((s) => (
                        <Link
                          className="chip"
                          key={s}
                          href={`/properties?school=${encodeURIComponent(s)}`}
                        >
                          {s}
                          <b>({stats.bySchool[s] ?? 0})</b>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="areamap-caption" style={{ marginTop: 18, textAlign: "left" }}>
              ※エリア区分は小学校の位置による近似で、姫路市が定める通学区域とは一致しません。
              就学先は姫路市の通学区域をご確認ください。
            </p>
          </>
        )}

        {/* ---------------- 間取り別 ---------------- */}
        {tab === "madori" && (
          <div className="madori-grid">
            {MADORI_BUCKETS.map((b) => (
              <Link className="madori-tile" key={b.key} href={`/properties?madori=${b.key}`}>
                <span className="madori-name">{b.label}</span>
                <span className="madori-num">{stats.byMadori[b.key] ?? 0}</span>件
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
