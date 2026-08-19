"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requireAdmin, requireUser, authErrorMessage } from "@/lib/auth";
import { reportError } from "@/lib/errors";
import { DISCLOSURE_LEVEL } from "@/config/security";
import { parseJapaneseDate } from "@/lib/dates";
import { toJsonSafe } from "@/lib/json";
import {
  PREF_CODE,
  DEFAULT_CITY_CODE,
  DEFAULT_PROPERTY_TYPE,
  areaName,
  isSupportedArea,
  isValidPropertyType,
  PROPERTY_TYPE_LABEL,
} from "@/config/property";

/** 任意の文字列列。空・「－」は null にする（athome の「値なし」表記）。 */
function text(value: string | undefined): string | null {
  const t = (value ?? "").trim();
  if (t === "" || t === "-" || t === "－" || t === "―") return null;
  return t;
}

/** 任意の整数列。読めなければ null。 */
function int(value: string | undefined): number | null {
  const t = (value ?? "").replace(/[,，\s]/g, "").trim();
  if (t === "") return null;
  const n = parseInt(t, 10);
  return Number.isInteger(n) ? n : null;
}

/** 任意の小数列。読めなければ null。 */
function float(value: string | undefined): number | null {
  const t = (value ?? "").replace(/[,，\s]/g, "").trim();
  if (t === "") return null;
  const n = parseFloat(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * 物件管理番号を読む。athome / ATBB の番号は10桁あり Number では扱えないため BigInt にする。
 * 数字以外が混ざっている行は取り込まない（null を返す）。
 */
function parseObjMngNo(value: string | undefined): bigint | null {
  const trimmed = (value ?? "").trim();
  if (!/^\d+$/.test(trimmed)) return null;
  try {
    return BigInt(trimmed);
  } catch {
    return null;
  }
}

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
  /** 現況（例: 空家 / 所有者居住中）。既存の Property.currentState に入る。 */
  currentState?: string;

  // 物件概要（athome の表示項目）。全て任意。
  trafficNote?: string;
  trafficLine?: string;
  trafficStation?: string;
  walkMinutes?: string;
  leaseTermRent?: string;
  keyMoney?: string;
  depositGuarantee?: string;
  maintenanceCost?: string;
  otherLumpSum?: string;
  floorsInfo?: string;
  parking?: string;
  landRight?: string;
  deliveryTiming?: string;
  transactionType?: string;
  listingCompanyNo?: string;
  publishedOn?: string;
  nextUpdateOn?: string;

  // マンション固有
  mgmtFeeYen?: string;
  repairFundYen?: string;
  totalUnits?: string;
  floorNo?: string;
  direction?: string;
  balconyMen?: string;
  mgmtForm?: string;

  // 土地固有
  buildingCoverage?: string;
  floorAreaRatio?: string;
  zoning?: string;
  landCategory?: string;
  cityPlanning?: string;
  roadAccess?: string;
  privateRoad?: string;

  // 取扱店
  agencyName?: string;
  agencyAddress?: string;
  agencyTel?: string;
  agencyLicense?: string;
};

/** DBへ書き込む直前の、検証済みの1件分。 */
type PropertyRow = {
  objMngNo: bigint;
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
  currentState: string | null;

  // 物件概要。CSVに列が無ければ null が入る。
  trafficNote: string | null;
  trafficLine: string | null;
  trafficStation: string | null;
  walkMinutes: number | null;
  leaseTermRent: string | null;
  keyMoney: string | null;
  depositGuarantee: string | null;
  maintenanceCost: string | null;
  otherLumpSum: string | null;
  floorsInfo: string | null;
  parking: string | null;
  landRight: string | null;
  deliveryTiming: string | null;
  transactionType: string | null;
  listingCompanyNo: string | null;
  publishedOn: Date | null;
  nextUpdateOn: Date | null;
  mgmtFeeYen: number | null;
  repairFundYen: number | null;
  totalUnits: number | null;
  floorNo: number | null;
  direction: string | null;
  balconyMen: number | null;
  mgmtForm: string | null;
  buildingCoverage: number | null;
  floorAreaRatio: number | null;
  zoning: string | null;
  landCategory: string | null;
  cityPlanning: string | null;
  roadAccess: string | null;
  privateRoad: string | null;
  agencyName: string | null;
  agencyAddress: string | null;
  agencyTel: string | null;
  agencyLicense: string | null;
};

export type DiffResult = {
  type: "new" | "update" | "no_change";
  /** objMngNo は BigInt のままだと画面へ渡せないため文字列で返す。 */
  current?: { objMngNo: string; title: string; priceMan: number } | null;
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
    // objMngNo は BigInt。クライアントコンポーネントへ渡すため文字列にする。
    // あわせてエリア名を添える（画面側で対応表を持たせないため）。
    return {
      success: true as const,
      data: properties.map((p) => ({
        ...p,
        objMngNo: p.objMngNo.toString(),
        areaName: areaName(p.cityCd),
      })),
    };
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
      const objMngNo = parseObjMngNo(item.objMngNo);
      if (objMngNo === null) continue;

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
          objMngNo: existing.objMngNo.toString(),
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
    const objMngNo = parseObjMngNo(item.objMngNo);
    const priceMan = parseInt(item.priceMan ?? "");
    if (objMngNo === null || !Number.isInteger(priceMan)) {
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

    // 対象エリアの外は取り込まない。エリアを増やすときは src/config/property.ts の AREAS に足す。
    const cityCd = item.cityCd?.trim() || DEFAULT_CITY_CODE;
    if (!isSupportedArea(cityCd)) {
      return {
        success: false as const,
        error: `掲載対象のエリアではない市区町村コードがあるため、取込を中止しました（対象: ${objMngNo} / cityCd: ${cityCd}）。エリアを増やす場合は src/config/property.ts の AREAS に追加してください。`,
      };
    }

    // 種別は土地・一戸建て・マンションのみ。
    const syubetu = parseInt(item.syubetu ?? "") || DEFAULT_PROPERTY_TYPE;
    if (!isValidPropertyType(syubetu)) {
      const valid = Object.entries(PROPERTY_TYPE_LABEL)
        .map(([code, label]) => `${code}=${label}`)
        .join(" / ");
      return {
        success: false as const,
        error: `物件種別の番号が正しくない行があるため、取込を中止しました（対象: ${objMngNo} / syubetu: ${syubetu}）。使える値は ${valid} です。`,
      };
    }

    rows.push({
      objMngNo,
      syubetu,
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
      prefCd: item.prefCd?.trim() || PREF_CODE,
      cityCd,
      disclosureLevel: parseInt(item.disclosureLevel ?? "") || 0,
      currentState: text(item.currentState),

      trafficNote: text(item.trafficNote),
      trafficLine: text(item.trafficLine),
      trafficStation: text(item.trafficStation),
      walkMinutes: int(item.walkMinutes),
      leaseTermRent: text(item.leaseTermRent),
      keyMoney: text(item.keyMoney),
      depositGuarantee: text(item.depositGuarantee),
      maintenanceCost: text(item.maintenanceCost),
      otherLumpSum: text(item.otherLumpSum),
      floorsInfo: text(item.floorsInfo),
      parking: text(item.parking),
      landRight: text(item.landRight),
      deliveryTiming: text(item.deliveryTiming),
      transactionType: text(item.transactionType),
      listingCompanyNo: text(item.listingCompanyNo),
      publishedOn: parseJapaneseDate(item.publishedOn),
      nextUpdateOn: parseJapaneseDate(item.nextUpdateOn),

      mgmtFeeYen: int(item.mgmtFeeYen),
      repairFundYen: int(item.repairFundYen),
      totalUnits: int(item.totalUnits),
      floorNo: int(item.floorNo),
      direction: text(item.direction),
      balconyMen: float(item.balconyMen),
      mgmtForm: text(item.mgmtForm),

      buildingCoverage: int(item.buildingCoverage),
      floorAreaRatio: int(item.floorAreaRatio),
      zoning: text(item.zoning),
      landCategory: text(item.landCategory),
      cityPlanning: text(item.cityPlanning),
      roadAccess: text(item.roadAccess),
      privateRoad: text(item.privateRoad),

      agencyName: text(item.agencyName),
      agencyAddress: text(item.agencyAddress),
      agencyTel: text(item.agencyTel),
      agencyLicense: text(item.agencyLicense),
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
          // objMngNo は BigInt。素の JSON.stringify では落ちるため toJsonSafe を通す。
          // 既存が0件のうちは [] なので通ってしまい、2回目の取込で初めて失敗していた。
          before: toJsonSafe(before) as object,
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
