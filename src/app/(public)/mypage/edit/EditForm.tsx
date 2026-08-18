"use client";

import React, { useState } from "react";
import { updateMyProfile } from "@/app/actions/users";

type UserProfile = {
  name: string | null;
  tel: string | null;
  email: string;
};

export default function EditForm({ user }: { user: UserProfile }) {
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const res = await updateMyProfile(formData);

    if (res.success) {
      alert("会員情報を更新しました。");
      // セッション情報を再取得させるため、ハードリダイレクト
      window.location.href = "/mypage";
    } else {
      setError(res.error || "エラーが発生しました");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="formSheet" style={{ maxWidth: "600px", margin: "0 auto", background: "#fff", padding: "40px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0,0,0,0.05)" }}>
      {error && (
        <p style={{ color: "red", textAlign: "center", padding: "10px", fontWeight: "bold", background: "#fee", marginBottom: "20px" }}>
          {error}
        </p>
      )}

      <div className="fRow" style={{ marginBottom: "24px" }}>
        <p className="fRow__lb" style={{ fontWeight: "bold", marginBottom: "8px" }}>お名前<span className="tag tag--req" style={{ marginLeft: "8px", background: "#b4443c", color: "#fff", fontSize: "11px", padding: "2px 8px", borderRadius: "4px" }}>必須</span></p>
        <div className="fRow__ctl">
          <input 
            type="text" 
            name="name" 
            defaultValue={user?.name || ""} 
            required 
            style={{ width: "100%", padding: "12px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "16px" }}
          />
        </div>
      </div>

      <div className="fRow" style={{ marginBottom: "24px" }}>
        <p className="fRow__lb" style={{ fontWeight: "bold", marginBottom: "8px" }}>電話番号</p>
        <div className="fRow__ctl">
          <input 
            type="tel" 
            name="tel" 
            defaultValue={user?.tel || ""} 
            placeholder="090-1234-5678"
            style={{ width: "100%", padding: "12px", border: "1px solid #ccc", borderRadius: "4px", fontSize: "16px" }}
          />
        </div>
      </div>

      <div className="fRow" style={{ marginBottom: "32px" }}>
        <p className="fRow__lb" style={{ fontWeight: "bold", marginBottom: "8px" }}>メールアドレス</p>
        <div className="fRow__ctl">
          <input 
            type="email" 
            defaultValue={user?.email || ""} 
            readOnly 
            style={{ width: "100%", padding: "12px", border: "1px solid #eee", background: "#f9f9f9", borderRadius: "4px", color: "#666", fontSize: "16px" }}
          />
          <p className="fNote" style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
            ※ログインID（メールアドレス）は変更できません。
          </p>
        </div>
      </div>

      <div className="formSheet__foot" style={{ textAlign: "center" }}>
        <button type="submit" disabled={isSubmitting} className="btn btn--accent" style={{ padding: "16px 48px", background: "#a8874f", color: "#fff", border: "none", borderRadius: "4px", fontSize: "16px", cursor: isSubmitting ? "not-allowed" : "opacity: isSubmitting ? 0.7 : 1" }}>
          {isSubmitting ? "更新中..." : "変更を保存する"}
        </button>
      </div>
    </form>
  );
}
