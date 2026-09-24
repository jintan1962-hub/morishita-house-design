
"use client";

import React, { useState } from "react";
import { submitInquiry } from "@/app/actions/inquiry";
import Link from "next/link";
import { COMPANY } from "@/config/company";

type ContactProperty = { id: number; title: string };
type ContactUser = { name: string | null; email: string | null; tel: string | null } | null;

export default function ContactForm({
  property,
  user,
}: {
  property: ContactProperty;
  user: ContactUser;
}) {
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  // 控えメールが実際に送れたか。届いていないのに「送信しました」と出さないため。
  const [mailSent, setMailSent] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const res = await submitInquiry(formData);

    if (res.success) {
      setSuccess(true);
      setMailSent(res.mailSent);
    } else {
      setError(res.error || "エラーが発生しました");
      setIsSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white p-12 rounded-xl shadow-sm border border-reno-line text-center">
        <h2 className="text-2xl font-bold text-ink mb-4">お問い合わせを受け付けました</h2>
        <p className="text-reno-mute-dark mb-8">
          {mailSent ? (
            <>
              ご入力いただいたメールアドレスに控えのメールを送信しました。<br/>
              担当者からの連絡を今しばらくお待ちください。
            </>
          ) : (
            <>
              お問い合わせは確かに受け付けております。<br/>
              ただいまシステムの都合により<strong>控えのメールをお送りできておりません</strong>。
              重ねてご送信いただく必要はございません。<br/>
              担当者からの連絡を今しばらくお待ちください。お急ぎの場合は {COMPANY.tel}（{COMPANY.businessHours}）へお電話ください。
            </>
          )}
        </p>
        <Link href={`/property/${property.id}`} className="btn btn--navy inline-block">
          物件ページへ戻る
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="formSheet bg-white p-8 rounded-xl shadow-sm border border-reno-line">
      <input type="hidden" name="propertyId" value={property.id} />
      <input type="hidden" name="propertyTitle" value={property.title} />

      {error && (
        <p style={{ color: "red", textAlign: "center", padding: "10px", fontWeight: "bold", background: "#fee", marginBottom: "20px" }}>
          {error}
        </p>
      )}

      <div className="fRow">
        <p className="fRow__lb">お名前<span className="tag tag--req">必須</span></p>
        <div className="fRow__ctl">
          <input type="text" name="name" defaultValue={user?.name || ""} required style={{ width: "100%", padding: "12px", border: "1px solid #ccc", borderRadius: "4px" }} />
        </div>
      </div>

      <div className="fRow">
        <p className="fRow__lb">メールアドレス<span className="tag tag--req">必須</span></p>
        <div className="fRow__ctl">
          <input type="email" name="email" defaultValue={user?.email || ""} required style={{ width: "100%", padding: "12px", border: "1px solid #ccc", borderRadius: "4px" }} />
        </div>
      </div>

      <div className="fRow">
        <p className="fRow__lb">電話番号</p>
        <div className="fRow__ctl">
          <input type="tel" name="tel" defaultValue={user?.tel || ""} placeholder="090-1234-5678" style={{ width: "100%", padding: "12px", border: "1px solid #ccc", borderRadius: "4px" }} />
        </div>
      </div>

      <div className="fRow">
        <p className="fRow__lb">お問い合わせ内容<span className="tag tag--req">必須</span></p>
        <div className="fRow__ctl">
          <textarea 
            name="message" 
            required 
            rows={6}
            placeholder="この物件の見学を希望します。来週末の土日で空いている時間はありますか？"
            style={{ width: "100%", padding: "12px", border: "1px solid #ccc", borderRadius: "4px", resize: "vertical" }}
          ></textarea>
        </div>
      </div>

      <div className="formSheet__foot text-center mt-8">
        <button type="submit" disabled={isSubmitting} className="btn btn--accent px-12 py-4">
          {isSubmitting ? "送信中..." : "この内容で問い合わせる"}
        </button>
      </div>
    </form>
  );
}
