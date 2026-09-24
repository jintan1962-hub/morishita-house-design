import { AREAS, PROPERTY_TYPE, PROPERTY_TYPE_LABEL } from "@/config/property";
import { MADORI_BUCKETS } from "@/lib/madori";
import { AGE_OPTIONS, PRICE_OPTIONS, type RawSearchParams } from "@/lib/propertySearch";

/**
 * こだわり条件の検索フォーム。トップページと物件一覧ページの両方で使う（D-09）。
 *
 * **素のGETフォーム**にしてある。JavaScript を使わないので、
 * 「押しても何も起きない」が構造的に起きない（過去にこの種の不具合が7か所あった）。
 * 選択状態の見た目はラジオボタン＋CSS（.chip-radio）で表す。
 *
 * 出せる条件は、DBに列があって実際に絞れるものだけ（D-03）。
 * デザイン案にあった「沿線・駅」「土地面積」「建物面積」は、
 * 列はあるが検索条件としての仕様（範囲の刻み方）が未確定のため出していない。
 */
export default function PropertySearchPanel({
  current = {},
  showHeading = true,
}: {
  /** いま選ばれている条件。一覧ページから戻ってきたときに選択を保つ */
  current?: RawSearchParams;
  showHeading?: boolean;
}) {
  return (
    <form className="search-panel" action="/properties" method="get">
      {showHeading && <h3 className="visually-hidden">こだわり条件から物件を探す</h3>}

      <div className="sp-grid">
        {/* --- 1. 種別 --- */}
        <div className="sp-field">
          <h4>
            <span className="idx">1</span>物件種別
          </h4>
          <div className="chip-row">
            <ChipRadio name="type" value="" label="指定なし" current={current.type} />
            {Object.values(PROPERTY_TYPE).map((code) => (
              <ChipRadio
                key={code}
                name="type"
                value={String(code)}
                label={PROPERTY_TYPE_LABEL[code]}
                current={current.type}
              />
            ))}
          </div>
        </div>

        {/* --- 2. エリア --- */}
        <div className="sp-field">
          <h4>
            <span className="idx">2</span>エリア
          </h4>
          <div className="field">
            <label htmlFor="sp-city">市区町村</label>
            <select id="sp-city" name="city" defaultValue={current.city ?? ""}>
              <option value="">指定なし（全エリア）</option>
              {AREAS.map((a) => (
                <option key={a.cityCd} value={a.cityCd}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
          <p className="note-line">
            姫路市内は、トップページの地図から地区・小学校区で絞り込めます。
          </p>
        </div>

        {/* --- 3. 価格 --- */}
        <div className="sp-field">
          <h4>
            <span className="idx">3</span>価格帯
          </h4>
          <div className="range-row">
            <select name="priceMin" defaultValue={current.priceMin ?? ""} aria-label="価格の下限">
              <option value="">下限なし</option>
              {PRICE_OPTIONS.filter((o) => o.min !== undefined).map((o) => (
                <option key={o.min} value={String(o.min)}>
                  {o.min?.toLocaleString()}万円
                </option>
              ))}
            </select>
            <span className="to">〜</span>
            <select name="priceMax" defaultValue={current.priceMax ?? ""} aria-label="価格の上限">
              <option value="">上限なし</option>
              {PRICE_OPTIONS.filter((o) => o.max !== undefined).map((o) => (
                <option key={o.max} value={String(o.max)}>
                  {o.max?.toLocaleString()}万円
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* --- 4. 間取り --- */}
        <div className="sp-field">
          <h4>
            <span className="idx">4</span>間取り
          </h4>
          <div className="chip-row">
            <ChipRadio name="madori" value="" label="指定なし" current={current.madori} />
            {MADORI_BUCKETS.map((b) => (
              <ChipRadio
                key={b.key}
                name="madori"
                value={b.key}
                label={b.label}
                current={current.madori}
              />
            ))}
          </div>
        </div>

        {/* --- 5. 築年数 --- */}
        <div className="sp-field">
          <h4>
            <span className="idx">5</span>築年数
          </h4>
          <div className="chip-row">
            <ChipRadio name="age" value="" label="指定なし" current={current.age} />
            {AGE_OPTIONS.map((y) => (
              <ChipRadio
                key={y}
                name="age"
                value={String(y)}
                label={`築${y}年以内`}
                current={current.age}
              />
            ))}
          </div>
          <p className="note-line">建築年が登録されていない物件は、築年数で絞ると出てきません。</p>
        </div>

        {/* --- 6. こだわり --- */}
        <div className="sp-field">
          <h4>
            <span className="idx">6</span>こだわり条件
          </h4>
          <div className="check-grid">
            <label className="check-item">
              <input type="checkbox" name="down" value="1" defaultChecked={current.down === "1"} />
              価格変更あり
            </label>
            <label className="check-item">
              <input
                type="checkbox"
                name="reform"
                value="1"
                defaultChecked={current.reform === "1"}
              />
              リノベーション向き
            </label>
          </div>
        </div>
      </div>

      <div className="search-cta">
        <p className="note-line" style={{ margin: 0 }}>
          会員登録をすると、会員限定物件も検索結果に出るようになります。
        </p>
        <button type="submit" className="btn btn-solid btn-lg">
          この条件で検索する
        </button>
      </div>
    </form>
  );
}

/** チップの見た目をしたラジオボタン。 */
function ChipRadio({
  name,
  value,
  label,
  current,
}: {
  name: string;
  value: string;
  label: string;
  current?: string;
}) {
  // 未指定のときは「指定なし」（value="") を選んだ状態にする
  const checked = (current ?? "") === value;
  return (
    <label className="chip-radio">
      <input type="radio" name={name} value={value} defaultChecked={checked} />
      <span>{label}</span>
    </label>
  );
}
