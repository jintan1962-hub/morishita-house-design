import Link from "next/link";

const cases = [
  { id: 1, title: "ヴィンテージモダンが奏でる、大人の隠れ家", category: "マンション", area: "仙台市", tags: ["#フルリノベ", "#造作キッチン"], image: "assets/img/saku-lqh-thm.jpg" },
  { id: 2, title: "北欧スタイルと暮らす、光溢れるリビング", category: "一戸建て", area: "名取市", tags: ["#無垢床", "#断熱改修"], image: "assets/img/miyota-lqh-thm.jpg" },
  { id: 3, title: "インダストリアル×和モダン、異素材の融合", category: "マンション", area: "福島市", tags: ["#趣味の部屋", "#土間"], image: "assets/img/t_thm.jpg" },
  { id: 4, title: "開放感にこだわった、吹き抜けのある家", category: "一戸建て", area: "仙台市", tags: ["#吹き抜け", "#収納重視"], image: "assets/img/living.jpg" },
  { id: 5, title: "カフェスタイルを楽しむ、こだわりのキッチン", category: "一戸建て", area: "宇都宮市", tags: ["#キッチン", "#DIY"], image: "assets/img/kitchen.jpg" },
  { id: 6, title: "限られた空間を最大化する、都心のリノベ", category: "マンション", area: "仙台市", tags: ["#狭小", "#機能的"], image: "assets/img/living.jpg" },
];

export default function CasesPage() {
  const imgBase = "https://okazaki-bot.github.io/chuko-fudousan-design/";

  return (
    <>
      <div className="pageHead">
        <div className="pageHead__bg">
          <img src={`${imgBase}assets/img/hero.jpg`} alt="" />
        </div>
        <div className="container container--wide pageHead__inner">
          <span className="pageHead__en">WORKS</span>
          <h1 className="pageHead__ttl">施工事例</h1>
        </div>
      </div>

      <nav className="container container--wide breadcrumb" aria-label="パンくずリスト">
        <ol>
          <li><Link href="/">HOME</Link></li>
          <li aria-current="page">施工事例</li>
        </ol>
      </nav>

      <section className="sec">
        <div className="container container--wide">
          <div className="listBar">
            <div className="listBar__hit">
              施工事例 <strong>{cases.length}</strong> 件
            </div>
            <div className="listBar__sort selectWrap">
              <select aria-label="物件種別">
                <option>すべての種別</option>
                <option>マンション</option>
                <option>一戸建て</option>
              </select>
              <select aria-label="テイスト">
                <option>すべてのテイスト</option>
                <option>ヴィンテージ</option>
                <option>ナチュラル</option>
                <option>モダン</option>
              </select>
            </div>
          </div>

          <div className="cardGrid cardGrid--3">
            {cases.map((work) => (
              <Link key={work.id} href={`/cases/${work.id}`} className="mediaCard">
                <div className="mediaCard__thumb">
                  <img src={`${imgBase}${work.image}`} alt={work.title} />
                  <span className="mediaCard__cat">{work.category}</span>
                </div>
                <div className="mediaCard__body">
                  <h3 className="mediaCard__ttl">{work.title}</h3>
                  <div className="mediaCard__meta flex justify-between items-center">
                    <span>{work.area}</span>
                    <div className="flex gap-2">
                      {work.tags.map(t => <span key={t}>{t}</span>)}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="btnWrap">
            <button className="btn btn--fill btn--lg">もっと事例を見る</button>
          </div>
        </div>
      </section>
    </>
  );
}
