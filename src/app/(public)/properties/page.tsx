"use client";

import { Lock, MapPin } from "lucide-react";
import Link from "next/link";
import { useSession, signIn } from "next-auth/react";

// モックの物件データ
const mockProperties = [
  { id: 1, title: "青葉区 中古戸建", price: "2,980", area: "仙台市青葉区", disclosureLevel: 0, type: "中古一戸建て", img: "assets/img/saku-lqh-thm.jpg" },
  { id: 2, title: "泉区 リノベ済マンション", price: "1,850", area: "仙台市泉区", disclosureLevel: 0, type: "中古マンション", img: "assets/img/miyota-lqh-thm.jpg" },
  { id: 3, title: "【会員限定】太白区 未公開戸建", price: "3,200", area: "仙台市太白区", disclosureLevel: 1, type: "中古一戸建て", img: "assets/img/t_thm.jpg" },
  { id: 4, title: "若林区 駅徒歩5分 マンション", price: "2,400", area: "仙台市若林区", disclosureLevel: 0, type: "中古マンション", img: "assets/img/living.jpg" },
  { id: 5, title: "【会員限定】宮城野区 収益物件", price: "4,500", area: "仙台市宮城野区", disclosureLevel: 1, type: "事業用", img: "assets/img/kitchen.jpg" },
];

export default function PropertiesPage() {
  const { data: session, status } = useSession();
  const isLoggedIn = !!session;
  const imgBase = "https://okazaki-bot.github.io/chuko-fudousan-design/";

  if (status === "loading") {
    return <div className="min-h-[50vh] flex items-center justify-center">読み込み中...</div>;
  }

  return (
    <>
      <div className="pageHead">
        <div className="pageHead__bg">
          <img src={`${imgBase}assets/img/gallery.jpg`} alt="" />
        </div>
        <div className="container container--wide pageHead__inner">
          <span className="pageHead__en">PROPERTIES</span>
          <h1 className="pageHead__ttl">物件一覧</h1>
        </div>
      </div>

      <nav className="container container--wide breadcrumb" aria-label="パンくずリスト">
        <ol>
          <li><Link href="/">HOME</Link></li>
          <li aria-current="page">物件一覧</li>
        </ol>
      </nav>

      <section className="sec">
        <div className="container container--wide listLayout">
          {/* サイド絞り込み */}
          <aside className="sideBox pc-only">
            <h2 className="sideBox__ttl">条件で絞り込む</h2>
            <div className="sideBox__body">
              <h3 className="sideBox__sub">物件種別</h3>
              <div>
                <label className="chk"><input type="checkbox" defaultChecked /><span>中古戸建て</span></label>
                <label className="chk"><input type="checkbox" defaultChecked /><span>中古マンション</span></label>
                <label className="chk"><input type="checkbox" /><span>土地</span></label>
              </div>

              <h3 className="sideBox__sub">エリア</h3>
              <div>
                <label className="chk"><input type="checkbox" defaultChecked /><span>仙台市青葉区</span></label>
                <label className="chk"><input type="checkbox" /><span>仙台市泉区</span></label>
                <label className="chk"><input type="checkbox" /><span>仙台市太白区</span></label>
              </div>

              <h3 className="sideBox__sub">公開レベル</h3>
              <div>
                <label className="chk"><input type="checkbox" defaultChecked /><span>一般公開</span></label>
                <label className="chk"><input type="checkbox" defaultChecked /><span>会員限定</span></label>
              </div>
              
              <div className="mt-6">
                <button type="button" className="btn btn--fill btn--block">検索する</button>
              </div>
            </div>
          </aside>

          {/* メインリスト */}
          <div>
            {!isLoggedIn && (
              <div className="alertNote flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <div>
                  <strong>非公開物件を閲覧するには</strong>
                  <p className="mt-1">無料会員登録またはログインしていただくと、すべての限定物件がご覧いただけます。</p>
                </div>
                <button onClick={() => signIn()} className="btn btn--sm btn--fill whitespace-nowrap">
                  ログイン・会員登録
                </button>
              </div>
            )}

            <div className="listBar">
              <div className="listBar__hit">
                該当物件 <strong>{mockProperties.length}</strong> 件
              </div>
              <div className="listBar__sort selectWrap">
                <select aria-label="並び替え">
                  <option>新着順</option>
                  <option>価格が安い順</option>
                  <option>価格が高い順</option>
                </select>
              </div>
            </div>

            <div className="cardGrid cardGrid--2">
              {mockProperties.map((property) => {
                const isMemberOnly = property.disclosureLevel === 1;
                const canView = !isMemberOnly || isLoggedIn;
                
                if (!canView) {
                  return (
                    <Link key={property.id} className="propCard propCard--locked" href="/register">
                      <div className="propCard__thumb">
                        <img src={`${imgBase}${property.img}`} alt="会員限定公開の物件" />
                        <div className="propCard__labels">
                          <span className="label label--member">会員限定</span>
                        </div>
                      </div>
                      <div className="propCard__body">
                        <p className="propCard__cat">{property.type}／{property.area}</p>
                        <h3 className="propCard__ttl">{property.area}　（詳細は会員限定）</h3>
                        <p className="propCard__price">
                          <span className="val num">{property.price}</span>
                          <span className="unit">万円</span>
                        </p>
                        <dl className="propCard__spec mt-auto">
                          <div>
                            <dt>所在地</dt>
                            <dd className="masked">–</dd>
                          </div>
                          <div>
                            <dt>間取り</dt>
                            <dd className="masked">–</dd>
                          </div>
                        </dl>
                        <p className="lockNote">
                          この物件は<strong>無料会員限定</strong>で公開しています。所在地・写真・図面は会員登録後にご覧いただけます。
                        </p>
                      </div>
                    </Link>
                  );
                }

                return (
                  <Link key={property.id} className="propCard" href={`/property/${property.id}`}>
                    <div className="propCard__thumb">
                      <img src={`${imgBase}${property.img}`} alt={property.title} />
                      <div className="propCard__labels">
                        {isMemberOnly ? (
                          <span className="label label--member">会員限定</span>
                        ) : (
                          <span className="label label--new">NEW</span>
                        )}
                      </div>
                    </div>
                    <div className="propCard__body">
                      <p className="propCard__cat">{property.type}／{property.area}</p>
                      <h3 className="propCard__ttl">{property.title}</h3>
                      <p className="propCard__price">
                        <span className="val num">{property.price}</span>
                        <span className="unit">万円</span>
                      </p>
                      <dl className="propCard__spec mt-auto">
                        <div>
                          <dt>所在地</dt>
                          <dd>{property.area}</dd>
                        </div>
                        <div>
                          <dt>間取り</dt>
                          <dd>4LDK</dd>
                        </div>
                      </dl>
                    </div>
                  </Link>
                );
              })}
            </div>

            <nav className="pager" aria-label="ページ送り">
              <span className="is-current" aria-current="page">1</span>
              <Link href="#">2</Link>
              <Link href="#">3</Link>
              <Link href="#">›</Link>
            </nav>
          </div>
        </div>
      </section>
    </>
  );
}
