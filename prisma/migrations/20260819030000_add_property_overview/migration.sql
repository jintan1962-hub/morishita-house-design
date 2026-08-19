-- 物件概要（athome の表示項目）を保持する列を追加する。
-- 一戸建て・マンション・土地の3種別分をまとめて入れており、種別により使わない列は NULL のまま。
--
-- 全て NULL 許容の追加のみ。既存行への影響はなく、既定値も置かないため書き込みロックは短い。
-- IF NOT EXISTS を付けているのは、既存環境へ流しても失敗しないようにするため
-- （このリポジトリの既存マイグレーションと同じ方針）。

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "trafficNote" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "trafficLine" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "trafficStation" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "walkMinutes" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "leaseTermRent" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "keyMoney" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "depositGuarantee" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "maintenanceCost" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "otherLumpSum" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "floorsInfo" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "parking" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "landRight" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "deliveryTiming" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "transactionType" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "listingCompanyNo" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "publishedOn" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "nextUpdateOn" TIMESTAMP(3);
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "mgmtFeeYen" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "repairFundYen" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "totalUnits" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "floorNo" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "direction" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "balconyMen" DOUBLE PRECISION;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "mgmtForm" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "buildingCoverage" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "floorAreaRatio" INTEGER;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "zoning" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "landCategory" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "cityPlanning" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "roadAccess" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "privateRoad" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "agencyName" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "agencyAddress" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "agencyTel" TEXT;
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "agencyLicense" TEXT;
