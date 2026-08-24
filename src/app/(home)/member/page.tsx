
"use client";

import React, { useState, useRef } from "react";
import { registerUser } from "@/app/actions/registerUser";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { COMPANY } from "@/config/company";

type ConfirmData = {
  name?: string;
  kana?: string;
  email?: string;
  tel?: string;
  contact?: string;
  notify?: string;
  wantType?: string;
  wantCity?: string;
  wantPrice?: string;
  wantMadori?: string;
  wantCondition?: string;
  wantTiming?: string;
};

export default function MemberPage() {
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  // 登録完了メールが実際に送れたか。届いていないのに「お送りしました」と出さないため。
  const [mailSent, setMailSent] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  
  // States for confirmation display
  const [confirmData, setConfirmData] = useState<ConfirmData>({});

  const goToStep = (n: number) => {
    window.scrollTo(0, 0);
    setStep(n);
  };

  const handleNextToConfirm = () => {
    if (!formRef.current) return;
    const fd = new FormData(formRef.current);
    
    // Basic validation for Step 1
    const pw1 = fd.get('pw1');
    const pw2 = fd.get('pw2');
    if (pw1 !== pw2) {
      setError("パスワードが一致しません");
      goToStep(1);
      return;
    }
    
    // Gather data for confirmation
    const data: ConfirmData = {};
    data.name = (fd.get('lastName') || '') + ' ' + (fd.get('firstName') || '');
    data.kana = (fd.get('kanaSei') || '') + ' ' + (fd.get('kanaMei') || '');
    data.email = (fd.get('email1') as string) || '';
    data.tel = (fd.get('tel') as string) || '';
    data.contact = (fd.get('contact') as string) || '指定なし';
    data.notify = fd.getAll('notify').join(', ') || '受け取らない';
    
    data.wantType = fd.getAll('wantType').join(', ') || '指定なし';
    data.wantCity = fd.getAll('wantCity').join(', ') || '指定なし';
    const pmin = fd.get('wantPmin');
    const pmax = fd.get('wantPmax');
    data.wantPrice = (pmin || pmax) ? `${pmin || '下限なし'} 〜 ${pmax || '上限なし'}` : '指定なし';
    data.wantMadori = fd.getAll('wantMadori').join(', ') || '指定なし';
    data.wantCondition = fd.getAll('wantCond').join(', ') || '指定なし';
    data.wantTiming = (fd.get('wantTiming') as string) || '指定なし';

    setConfirmData(data);
    setError("");
    goToStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      goToStep(2);
      return;
    }
    if (step === 2) {
      handleNextToConfirm();
      return;
    }
    if (step === 3) {
      // Final Submit
      if (!formRef.current) return;
      const fd = new FormData(formRef.current);
      // Map fields to what the action expects
      fd.set('email', fd.get('email1') as string);
      fd.set('password', fd.get('pw1') as string);
      fd.set('passwordConfirm', fd.get('pw2') as string);
      fd.set('name', confirmData.name || '');
      
      const res = await registerUser(fd);
      if (res.success) {
        setMailSent(res.mailSent);
        // Auto login
        const email = fd.get("email") as string;
        const password = fd.get("password") as string;
        const loginRes = await signIn("credentials", {
          redirect: false,
          email,
          password,
        });
        
        if (loginRes && loginRes.ok) {
           window.location.href = "/mypage"; // Force redirect to refresh session fully
        } else {
           goToStep(4); // Fallback to step 4 if auto-login fails somehow
        }
      } else {
        setError(res.error || "エラーが発生しました");
        goToStep(1); // Go back to step 1 to show error
      }
    }
  };

  return (
    <>
      <main>
        <section className="memberHero">
          <div className="memberHero__photo"></div>
          <div className="memberHero__panel">
            <div className="memberHero__inner">
              <nav className="memberHero__crumb" aria-label="パンくずリスト">
                <ol>
                  <li><Link href="/">ホーム</Link></li>
                  <li>無料会員登録</li>
                </ol>
              </nav>
              <p className="memberHero__catch">1分で完了・完全無料</p>
              <div className="memberHero__head">
                <p className="memberHero__badge"><em>登録</em><strong>無料</strong></p>
                <h1 className="memberHero__ttl">{COMPANY.shortName}<br />無料会員登録</h1>
              </div>
              <p className="memberHero__lead">
                会員登録をいただくと、会員限定物件の閲覧や、ご希望条件の登録・メール通知などの特典をご利用いただけます。<br />
                もちろん登録は無料で、入会金や年会費は一切必要ありません。
              </p>
            </div>
          </div>
        </section>

        <section className="sec sec--gray" id="register">
          <div className="container container--wide">
            <h2 className="secTtl">
              <span className="secTtl__main">会員登録</span>
            </h2>

            {error && <p style={{ color: "red", textAlign: "center", padding: "10px", fontWeight: "bold", background: "#fee", marginBottom: "20px" }}>{error}</p>}

            <ol className="stepBar" id="stepBar">
              <li className={step >= 1 ? "is-current" + (step > 1 ? " is-done" : "") : ""} data-step="1"><em>1</em>アカウント情報</li>
              <li className={step >= 2 ? "is-current" + (step > 2 ? " is-done" : "") : ""} data-step="2"><em>2</em>希望条件</li>
              <li className={step >= 3 ? "is-current" + (step > 3 ? " is-done" : "") : ""} data-step="3"><em>3</em>入力内容の確認</li>
              <li className={step >= 4 ? "is-current" : ""} data-step="4"><em>4</em>登録完了</li>
            </ol>

            <form ref={formRef} onSubmit={handleSubmit} className="formSheet">
              
              {/* STEP 1 */}
              <div className={step === 1 ? "formStep is-active" : "formStep"} data-step="1" style={{ display: step === 1 ? "block" : "none" }}>
                <div className="fRow">
                  <p className="fRow__lb">お名前<span className="tag tag--req">必須</span></p>
                  <div className="fRow__ctl">
                    <div className="fCols2">
                      <input type="text" id="lastName" name="lastName" placeholder="姓（例：山田）" autoComplete="family-name" required />
                      <input type="text" id="firstName" name="firstName" placeholder="名（例：太郎）" autoComplete="given-name" required />
                    </div>
                  </div>
                </div>

                <div className="fRow">
                  <p className="fRow__lb">フリガナ<span className="tag">任意</span></p>
                  <div className="fRow__ctl">
                    <div className="fCols2">
                      <input type="text" id="kanaSei" name="kanaSei" placeholder="セイ（例：ヤマダ）" />
                      <input type="text" id="kanaMei" name="kanaMei" placeholder="メイ（例：タロウ）" />
                    </div>
                  </div>
                </div>

                <div className="fRow">
                  <p className="fRow__lb">ID（メールアドレス）<span className="tag tag--req">必須</span></p>
                  <div className="fRow__ctl">
                    <input type="email" id="email1" name="email1" placeholder="example@mail.com" autoComplete="email" required />
                    <p className="fNote">こちらのメールアドレスがログインIDになります。新着物件のお知らせもこちらにお送りします。</p>
                    <p className="fSub">確認のため、もう一度ご入力ください</p>
                    <input type="email" id="email2" name="email2" placeholder="example@mail.com" required />
                  </div>
                </div>

                <div className="fRow">
                  <p className="fRow__lb">パスワード<span className="tag tag--req">必須</span></p>
                  <div className="fRow__ctl">
                    <div className="pwField">
                      <input type="password" id="pw1" name="pw1" placeholder="半角英数字8文字以上" autoComplete="new-password" required />
                    </div>
                    <p className="fNote">半角英字と数字を組み合わせて8文字以上でご設定ください。</p>
                    <p className="fSub">確認のため、もう一度ご入力ください</p>
                    <div className="pwField">
                      <input type="password" id="pw2" name="pw2" placeholder="半角英数字8文字以上" autoComplete="new-password" required />
                    </div>
                  </div>
                </div>

                <div className="fRow">
                  <p className="fRow__lb">電話番号<span className="tag">任意</span></p>
                  <div className="fRow__ctl">
                    <input type="tel" id="tel" name="tel" placeholder="090-1234-5678" autoComplete="tel" />
                  </div>
                </div>

                <div className="fRow">
                  <p className="fRow__lb">ご希望の連絡方法<span className="tag tag--req">必須</span></p>
                  <div className="fRow__ctl">
                    <div className="pillGroup">
                      <label className="chk"><input type="radio" name="contact" value="どちらでも" defaultChecked />どちらでも</label>
                      <label className="chk"><input type="radio" name="contact" value="メール" />メール</label>
                      <label className="chk"><input type="radio" name="contact" value="電話" />電話</label>
                    </div>
                  </div>
                </div>

                <div className="fRow">
                  <p className="fRow__lb">お知らせメール<span className="tag tag--req">必須</span></p>
                  <div className="fRow__ctl">
                    <label className="chk"><input type="checkbox" name="notify" value="希望条件に合う新着物件の通知を受け取る" defaultChecked />希望条件に合う新着物件の通知を受け取る</label>
                  </div>
                </div>

                <div className="fRow">
                  <p className="fRow__lb">個人情報の取扱い<span className="tag tag--req">必須</span></p>
                  <div className="fRow__ctl">
                    <div className="fTerms">
                      <div className="fTerms__box">
                        <h4>プライバシーポリシー</h4>
                        <p>ここにプライバシーポリシーの本文が入ります。</p>
                      </div>
                      <label className="chk"><input type="checkbox" name="agree" value="1" required />個人情報の取扱いに同意する</label>
                    </div>
                  </div>
                </div>

                <div className="formSheet__foot">
                  <button type="submit" className="btn btn--accent">次へ：希望条件を入力する</button>
                </div>
              </div>

              {/* STEP 2 */}
              <div className={step === 2 ? "formStep is-active" : "formStep"} data-step="2" style={{ display: step === 2 ? "block" : "none" }}>
                <div className="fRow">
                  <p className="fRow__lb">お探しの物件種別<span className="tag">任意</span></p>
                  <div className="fRow__ctl">
                    <div className="pillGroup">
                      <label className="chk"><input type="checkbox" name="wantType" value="中古戸建て" />中古戸建て</label>
                      <label className="chk"><input type="checkbox" name="wantType" value="中古マンション" />中古マンション</label>
                      <label className="chk"><input type="checkbox" name="wantType" value="土地" />土地</label>
                      <label className="chk"><input type="checkbox" name="wantType" value="新築" />新築</label>
                      <label className="chk"><input type="checkbox" name="wantType" value="事業用物件" />事業用物件</label>
                    </div>
                  </div>
                </div>

                <div className="fRow">
                  <p className="fRow__lb">ご希望エリア<span className="tag">任意</span></p>
                  <div className="fRow__ctl">
                    <div className="pillGroup">
                      <label className="chk"><input type="checkbox" name="wantCity" value="佐久市" />佐久市</label>
                      <label className="chk"><input type="checkbox" name="wantCity" value="小諸市" />小諸市</label>
                      <label className="chk"><input type="checkbox" name="wantCity" value="御代田町" />御代田町</label>
                      <label className="chk"><input type="checkbox" name="wantCity" value="軽井沢町" />軽井沢町</label>
                      <label className="chk"><input type="checkbox" name="wantCity" value="上田市" />上田市</label>
                      <label className="chk"><input type="checkbox" name="wantCity" value="東御市" />東御市</label>
                      <label className="chk"><input type="checkbox" name="wantCity" value="佐久穂町" />佐久穂町</label>
                    </div>
                    <p className="fNote">複数選択できます。未選択の場合は全エリアが対象になります。</p>
                  </div>
                </div>

                <div className="fRow">
                  <p className="fRow__lb">ご希望価格帯<span className="tag">任意</span></p>
                  <div className="fRow__ctl">
                    <span className="sel"><select name="wantPmin">
                      <option value="">下限なし</option><option>500万円</option><option>1,000万円</option><option>1,500万円</option><option>2,000万円</option>
                    </select></span>
                    <span className="tilde">〜</span>
                    <span className="sel"><select name="wantPmax">
                      <option value="">上限なし</option><option>1,000万円</option><option>1,500万円</option><option>2,000万円</option><option>3,000万円</option>
                    </select></span>
                    <p className="fNote">リノベーション費用を含めた総額のご予算を選択してください。</p>
                  </div>
                </div>

                <div className="fRow">
                  <p className="fRow__lb">ご希望の間取り<span className="tag">任意</span></p>
                  <div className="fRow__ctl">
                    <div className="pillGroup">
                      <label className="chk"><input type="checkbox" name="wantMadori" value="1LDK以下" />1LDK以下</label>
                      <label className="chk"><input type="checkbox" name="wantMadori" value="2LDK" />2LDK</label>
                      <label className="chk"><input type="checkbox" name="wantMadori" value="3LDK" />3LDK</label>
                      <label className="chk"><input type="checkbox" name="wantMadori" value="4LDK" />4LDK</label>
                      <label className="chk"><input type="checkbox" name="wantMadori" value="5LDK以上" />5LDK以上</label>
                    </div>
                  </div>
                </div>

                <div className="fRow">
                  <p className="fRow__lb">こだわり条件<span className="tag">任意</span></p>
                  <div className="fRow__ctl">
                    <div className="pillGroup">
                      <label className="chk"><input type="checkbox" name="wantCond" value="駐車2台以上" />駐車2台以上</label>
                      <label className="chk"><input type="checkbox" name="wantCond" value="南向き" />南向き</label>
                      <label className="chk"><input type="checkbox" name="wantCond" value="角地" />角地</label>
                      <label className="chk"><input type="checkbox" name="wantCond" value="リノベーションプラン付き" />リノベーションプラン付き</label>
                      <label className="chk"><input type="checkbox" name="wantCond" value="駅徒歩15分以内" />駅徒歩15分以内</label>
                      <label className="chk"><input type="checkbox" name="wantCond" value="ペット相談可" />ペット相談可</label>
                    </div>
                  </div>
                </div>

                <div className="fRow">
                  <p className="fRow__lb">ご希望の時期<span className="tag">任意</span></p>
                  <div className="fRow__ctl">
                    <span className="sel"><select name="wantTiming">
                      <option value="">選択してください</option>
                      <option value="すぐにでも">すぐにでも</option>
                      <option value="3ヶ月以内">3ヶ月以内</option>
                      <option value="半年以内">半年以内</option>
                      <option value="1年以内">1年以内</option>
                      <option value="良い物件があれば">良い物件があれば</option>
                    </select></span>
                  </div>
                </div>

                <div className="formSheet__foot">
                  <button type="submit" className="btn btn--accent">次へ：入力内容を確認する</button>
                  <p className="formSheet__login"><button type="button" onClick={() => goToStep(1)} style={{ background: "none", border: "none", color: "inherit", textDecoration: "underline", cursor: "pointer" }}>← アカウント情報の入力に戻る</button></p>
                </div>
              </div>

              {/* STEP 3: Confirm */}
              <div className={step === 3 ? "formStep is-active" : "formStep"} data-step="3" style={{ display: step === 3 ? "block" : "none" }}>
                <p className="fSub">アカウント情報</p>
                <div className="fRow"><p className="fRow__lb">お名前</p><p className="fRow__ctl">{confirmData.name}</p></div>
                <div className="fRow"><p className="fRow__lb">フリガナ</p><p className="fRow__ctl">{confirmData.kana}</p></div>
                <div className="fRow"><p className="fRow__lb">ID（メールアドレス）</p><p className="fRow__ctl">{confirmData.email}</p></div>
                <div className="fRow"><p className="fRow__lb">電話番号</p><p className="fRow__ctl">{confirmData.tel}</p></div>
                <div className="fRow"><p className="fRow__lb">ご希望の連絡方法</p><p className="fRow__ctl">{confirmData.contact}</p></div>
                <div className="fRow"><p className="fRow__lb">お知らせメール</p><p className="fRow__ctl">{confirmData.notify}</p></div>

                <p className="fSub" style={{ marginTop: "clamp(26px, 3.4vw, 38px)" }}>希望条件</p>
                <div className="fRow"><p className="fRow__lb">物件種別</p><p className="fRow__ctl">{confirmData.wantType}</p></div>
                <div className="fRow"><p className="fRow__lb">エリア</p><p className="fRow__ctl">{confirmData.wantCity}</p></div>
                <div className="fRow"><p className="fRow__lb">価格帯</p><p className="fRow__ctl">{confirmData.wantPrice}</p></div>
                <div className="fRow"><p className="fRow__lb">間取り</p><p className="fRow__ctl">{confirmData.wantMadori}</p></div>
                <div className="fRow"><p className="fRow__lb">こだわり条件</p><p className="fRow__ctl">{confirmData.wantCondition}</p></div>
                <div className="fRow"><p className="fRow__lb">ご希望の時期</p><p className="fRow__ctl">{confirmData.wantTiming}</p></div>

                <div className="formSheet__foot">
                  <button type="submit" className="btn btn--accent">この内容で登録する</button>
                  <p className="formSheet__login"><button type="button" onClick={() => goToStep(2)} style={{ background: "none", border: "none", color: "inherit", textDecoration: "underline", cursor: "pointer" }}>← 希望条件の入力に戻る</button></p>
                </div>
              </div>

              {/* STEP 4: Complete */}
              <div className={step === 4 ? "formStep is-active" : "formStep"} data-step="4" style={{ display: step === 4 ? "block" : "none" }}>
                <div className="completeBox">
                  <div className="completeBox__head">
                    <h3>会員登録が完了しました。</h3>
                  </div>
                  <p className="completeBox__txt">
                    {mailSent ? (
                      <>ご入力いただいたメールアドレスに登録完了メールをお送りしましたのでご確認ください。<br /></>
                    ) : (
                      <>ご登録は完了しております。ただいまシステムの都合により<strong>登録完了メールをお送りできておりません</strong>。
                      重ねてご登録いただく必要はございません。<br /></>
                    )}
                    今すぐ、会員限定物件をご覧いただけます。
                  </p>
                  <div className="btnWrap">
                    <Link href="/properties" className="btn btn--accent">物件を探す</Link>
                    <Link href="/" className="btn btn--navy">トップページへ戻る</Link>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </section>
      </main>

    </>
  );
}
