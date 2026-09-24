-- 物件画像に表示順と登録日時を持たせる。
-- 一括アップロードではファイル名の連番（6991580385_2.jpg の「2」）が sortOrder に入る。
-- これが無いと並び順が id 順（＝アップロードした順）に固定され、差し替えのたびに変わる。
--
-- 既定値つきの列追加のみ。既存行は sortOrder=0 / createdAt=現在時刻になる。

ALTER TABLE "PropertyImage" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PropertyImage" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX IF NOT EXISTS "PropertyImage_propertyId_sortOrder_idx"
  ON "PropertyImage"("propertyId", "sortOrder");

-- 物件を消したときに画像の行が残らないようにする（従来は制約に ON DELETE が無かった）。
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'PropertyImage_propertyId_fkey') THEN
        ALTER TABLE "PropertyImage" DROP CONSTRAINT "PropertyImage_propertyId_fkey";
    END IF;
    ALTER TABLE "PropertyImage"
        ADD CONSTRAINT "PropertyImage_propertyId_fkey"
        FOREIGN KEY ("propertyId") REFERENCES "Property"("id")
        ON DELETE CASCADE ON UPDATE CASCADE;
END $$;
