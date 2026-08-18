"use client";

import { useState } from "react";
import { deleteMyAccount } from "@/app/actions/users";
import { signOut } from "next-auth/react";

export default function DeleteAccountButton() {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(
      "本当に退会しますか？\n退会すると、お気に入り物件や登録条件などすべてのデータが完全に削除され、元に戻すことはできません。"
    );

    if (!confirmDelete) return;

    setIsDeleting(true);
    const res = await deleteMyAccount();
    
    if (res.success) {
      alert("退会手続きが完了しました。ご利用ありがとうございました。");
      await signOut({ callbackUrl: "/" });
    } else {
      alert(res.error || "エラーが発生しました。");
      setIsDeleting(false);
    }
  };

  return (
    <div style={{ marginTop: "32px", textAlign: "right", borderTop: "1px solid #eaeaea", paddingTop: "24px" }}>
      <button 
        onClick={handleDelete} 
        disabled={isDeleting}
        style={{
          background: "none",
          border: "none",
          color: "#999",
          textDecoration: "underline",
          fontSize: "13px",
          cursor: isDeleting ? "not-allowed" : "pointer",
        }}
      >
        {isDeleting ? "処理中..." : "退会をご希望の方はこちら"}
      </button>
    </div>
  );
}
