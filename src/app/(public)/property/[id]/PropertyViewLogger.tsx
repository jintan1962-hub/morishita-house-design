"use client";

import { useEffect } from "react";
import { logPropertyView } from "@/app/actions/logActivity";

/**
 * 物件の閲覧履歴を記録するだけのコンポーネント。表示は何も行わない。
 * ページ本体をサーバーコンポーネントに保つために切り出している（C-03）。
 * 記録の可否（ログイン済みか）はサーバー側の logPropertyView が判定する。
 */
export default function PropertyViewLogger({
  propertyId,
  propertyTitle,
}: {
  propertyId: number;
  propertyTitle: string;
}) {
  useEffect(() => {
    logPropertyView(propertyId, propertyTitle);
  }, [propertyId, propertyTitle]);

  return null;
}
