"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin, requireUser, authErrorMessage } from "@/lib/auth";
import { reportError } from "@/lib/errors";
import { DISCLOSURE_LEVEL } from "@/config/security";

/** CSVの1行。取込元の列名に合わせた文字列で受け取る。 */
export type IncomingProperty = {
  objMngNo?: string;
  syubetu?: string;
  syumoku?: string;
  title?: string;
  priceMan?: string;
  madori?: string;
  landMen?: string;
  bldMen?: string;
  bldStructure?: string;
  bldY?: string;
  bldM?: string;
  address?: string;
  prefCd?: string;
  cityCd?: string;
  disclosureLevel?: string;
};

/** DBへ書き込む直前の、検証済みの1件分。 */
type PropertyRow = {
  objMngNo: number;
  syubetu: number;
  syumoku: string;
  title: string;
  priceMan: number;
  madori: string;
  landMen: number | null;
  bldMen: number | null;
  bldStructure: string;
  bldY: number | null;
  bldM: number | null;
  address: string;
  prefCd: string;
  cityCd: string;
  disclosureLevel: number;
};

export type DiffResult = {
  type: "new" | "update" | "no_change";
  current?: { objMngNo: number; title: string; priceMan: number } | null;
  incoming: IncomingProperty;
  changes?: string[];
};

/**
 * 一般公開用の物件一覧。
 * C-03 / S-07：会員限定物件の価格・所在地はサーバー側で落としてから返す。
 * 以前はクライアントコンポーネントが全物件データを保持しており、
 * 「価格非公開」と表示していても開発者ツールから価格が読めていた。
 */
export async function getPublicProperties() {
  const auth = await requireUser();
  const isMember = auth.ok;

  try {
    const properties = await prisma.property.findMany({
      orderBy: { updatedAt: "desc" },
      include: { images: true },
    });

    return {
      success: true as const,
      data: properties.map((p) => {
        const isMemberOnly = p.disclosureLevel === DISCLOSURE_LEVEL.MEMBERS;
        const locked = isMemberOnly && !isMember;

        // 鍵のかかった物件では、秘匿する項目をそもそも返さない。
        return {
          id: p.id,
          title: locked ? "詳細は会員限定" : p.title,
          syumoku: p.syumoku,
          madori: locked ? null : p.madori,
          priceMan: locked ? null : p.priceMan,
          address: locked ? null : p.address,
          landMen: locked ? null : p.landMen,
          bldMen: locked ? null : p.bldMen,
          images: locked ? [] : p.images.map((img) => img.path),
          isMemberOnly,
          locked,
        };
      }),
    };
  } catch (error) {
    return reportError("getPublicProperties", error, "物件を取得できませんでした。");
  }
}

/** 一般公開用の物件詳細。会員限定物件は未ログインなら中身を返さない。 */
export async function getPublicPropertyById(id: number) {
  const auth = await requireUser();
  const isMember = auth.ok;

  if (!Number.isInteger(id) || id <= 0) {
    return { success: false as const, error: "物件が見つかりません。" };
  }

  try {
    const p = await prisma.property.findUnique({
      where: { id },
      include: { images: true },
    });
    if (!p) {
      return { success: false as const, error: "物件が見つかりません。" };
    }

    const isMemberOnly = p.disclosureLevel === DISCLOSURE_LEVEL.MEMBERS;
    if (isMemberOnly && !isMember) {
      // 会員限定物件は、未ログインには存在と種別だけ返す。価格も所在地も渡さない。
      return {
        success: true as const,
        data: { id: p.id, syumoku: p.syumoku, isMemberOnly: true, locked: true as const },
      };
    }

    return {
      success: true as const,
      data: {
        id: p.id,
        title: p.title,
        syumoku: p.syumoku,
        madori: p.madori,
        priceMan: p.priceMan,
        address: p.address,
        landMen: p.landMen,
        bldMen: p.bldMen,
        bldStructure: p.bldStructure,
        bldY: p.bldY,
        bldM: p.bldM,
        currentState: p.currentState,
        images: p.images.map((img) => img.path),
        isMemberOnly,
        locked: false as const,
      },
    };
  } catch (error) {
    return reportError("getPublicPropertyById", error, "物件を取得できませんでした。");
  }
}

/** 管理用の物件一覧（管理者のみ）。 */
export async function getProperties() {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false as const, error: authErrorMessage(auth.reason) };
  }

  try {
    const properties = await prisma.property.findMany({
      orderBy: { updatedAt: "desc" },
      include: { images: true },
    });
    return { success: true as const, data: properties };
  } catch (error) {
    return reportError("getProperties", error, "物件を取得できませんでした。");
  }
}

/**
 * D-17 手順1「数える」：取込前のドライラン。
 * 何件が新規・何件が更新・何件が変更なしかを先に出す。実際の書き込みは行わない。
 */
export async function compareCSVData(csvData: IncomingProperty[]) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false as const, error: authErrorMessage(auth.reason) };
  }

  try {
    const results: DiffResult[] = [];

    for (const item of csvData) {
      const objMngNo = parseInt(item.objMngNo ?? "");
      if (isNaN(objMngNo)) continue;

      const existing = await prisma.property.findUnique({ where: { objMngNo } });

      if (!existing) {
        results.push({ type: "new", incoming: item });
        continue;
      }

      const changes: string[] = [];
      if (existing.title !== item.title) changes.push("物件名");
      if (existing.priceMan !== parseInt(item.priceMan ?? "")) changes.push("価格");
      if (existing.address !== item.address) changes.push("所在地");
      if (existing.madori !== item.madori) changes.push("間取り");
      if (existing.disclosureLevel !== parseInt(item.disclosureLevel ?? ""))
        changes.push("公開レベル");

      results.push({
        type: changes.length > 0 ? "update" : "no_change",
        current: {
          objMngNo: existing.objMngNo,
          title: existing.title,
          priceMan: existing.priceMan,
        },
        incoming: item,
        changes,
      });
    }

    return {
      success: true as const,
      data: results,
      // 画面に出して人間に確認してもらうための件数（D-17 手順3）
      summary: {
        total: results.length,
        new: results.filter((r) => r.type === "new").length,
        update: results.filter((r) => r.type === "update").length,
        noChange: results.filter((r) => r.type === "no_change").length,
        skipped: csvData.length - results.length,
      },
    };
  } catch (error) {
    return reportError("compareCSVData", error, "取込内容を確認できませんでした。");
  }
}

/**
 * 物件の一括取込（管理者のみ）。
 *
 * D-17：一括更新は「数えてから」実行する。
 *   1. 数える  … compareCSVData で件数を出す
 *   2. 控えを取る … 上書き前の既存レコードを PropertyImportBackup へ日時つきで退避
 *   3. 確認する … 呼び出し側が expectedCount を宣言し、一致しなければ中止
 *
 * D-18：全体を1つのトランザクションで実行する。途中で落ちても中途半端なデータを残さない。
 *       upsert（objMngNo が一意キー）なので、同じ入力での再実行は結果が変わらない（冪等）。
 *
 * @param approvedItems 人間が承認した取込対象
 * @param expectedCount 画面で確認した想定件数。approvedItems の件数と一致しなければ中止する。
 */
export async function importProperties(
  approvedItems: IncomingProperty[],
  expectedCount: number
) {
  const auth = await requireAdmin();
  if (!auth.ok) {
    return { success: false as const, error: authErrorMessage(auth.reason) };
  }

  // D-17 手順3：想定件数の宣言なしに一括処理を走らせない
  if (!Number.isInteger(expectedCount)) {
    return {
      success: false as const,
      error: "想定件数が指定されていないため、取込を中止しました。",
    };
  }
  if (approvedItems.length !== expectedCount) {
    return {
      success: false as const,
      error: `想定件数（${expectedCount}件）と実際の対象件数（${approvedItems.length}件）が一致しないため、取込を中止しました。`,
    };
  }
  if (approvedItems.length === 0) {
    return { success: false as const, error: "取込対象がありません。" };
  }

  // 取込データを先に検証する。1件でも壊れていれば、1件も書き込まない。
  const rows: PropertyRow[] = [];
  for (const item of approvedItems) {
    const objMngNo = parseInt(item.objMngNo ?? "");
    const priceMan = parseInt(item.priceMan ?? "");
    if (!Number.isInteger(objMngNo) || !Number.isInteger(priceMan)) {
      return {
        success: false as const,
        error: `物件管理番号または価格が数値として読めない行があるため、取込を中止しました（対象: ${
          item.objMngNo ?? "不明"
        }）。`,
      };
    }
    if (!item.title || !item.address || !item.madori) {
      return {
        success: false as const,
        error: `物件名・所在地・間取りのいずれかが空の行があるため、取込を中止しました（対象: ${objMngNo}）。`,
      };
    }

    rows.push({
      objMngNo,
      syubetu: parseInt(item.syubetu ?? "") || 2,
      syumoku: item.syumoku || "中古",
      title: item.title,
      priceMan,
      madori: item.madori,
      landMen: parseFloat(item.landMen ?? "") || null,
      bldMen: parseFloat(item.bldMen ?? "") || null,
      bldStructure: item.bldStructure || "",
      bldY: parseInt(item.bldY ?? "") || null,
      bldM: parseInt(item.bldM ?? "") || null,
      address: item.address,
      prefCd: item.prefCd || "04",
      cityCd: item.cityCd || "04101",
      disclosureLevel: parseInt(item.disclosureLevel ?? "") || 0,
    });
  }

  try {
    const objMngNos = rows.map((r) => r.objMngNo);

    const result = await prisma.$transaction(async (tx) => {
      // D-17 手順2：上書きされる既存レコードの控えを取る
      const before = await tx.property.findMany({
        where: { objMngNo: { in: objMngNos } },
      });

      const backup = await tx.propertyImportBackup.create({
        data: {
          importedBy: auth.email,
          itemCount: rows.length,
          before: JSON.parse(JSON.stringify(before)),
        },
      });

      for (const data of rows) {
        await tx.property.upsert({
          where: { objMngNo: data.objMngNo },
          update: data,
          create: data,
        });
      }

      return { backupId: backup.id, overwritten: before.length };
    });

    revalidatePath("/admin/properties");
    revalidatePath("/properties");

    return {
      success: true as const,
      count: rows.length,
      overwritten: result.overwritten,
      created: rows.length - result.overwritten,
      backupId: result.backupId,
    };
  } catch (error) {
    // トランザクションなので、ここへ来た時点で書き込みは1件も残っていない。
    return reportError("importProperties", error, "取込に失敗しました。");
  }
}
