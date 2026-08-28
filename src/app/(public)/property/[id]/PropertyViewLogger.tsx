"use client";

import { useEffect } from "react";
import { logPropertyView } from "@/app/actions/logActivity";

/**
 * 物件の閲覧履歴を記録するだけのコンポーネント。表示は何も行わない。
 * ページ本体をサーバーコンポーネントに保つために切り出している（C-03）。
 * 記録の可否（ログイン済みか）・物件名の取得はサーバー側の logPropertyView が行う。
 */
export default function PropertyViewLogger({ propertyId }: { propertyId: number }) {
  useEffect(() => {
    logPropertyView(propertyId);
  }, [propertyId]);

  return null;
}
