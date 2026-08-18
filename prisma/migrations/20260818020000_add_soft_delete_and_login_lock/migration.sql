-- S-13 論理削除：削除フラグ（削除日時）と削除実行者
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "deletedBy" TEXT;

-- S-12 ログイン試行回数の制限
ALTER TABLE "User" ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN "lockedUntil" TIMESTAMP(3);

-- 参照系は deletedAt IS NULL で絞るため索引を張る
CREATE INDEX "User_deletedAt_idx" ON "User"("deletedAt");

-- D-17 一括更新の控え置き場
CREATE TABLE "PropertyImportBackup" (
    "id" SERIAL NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importedBy" TEXT NOT NULL,
    "itemCount" INTEGER NOT NULL,
    "before" JSONB NOT NULL,

    CONSTRAINT "PropertyImportBackup_pkey" PRIMARY KEY ("id")
);

-- O-05 停止スイッチ（キルスイッチ）の置き場
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "note" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- 既定値：メール送信は有効。事故時はこの value を 'false' に書き換えれば即座に止まる。
INSERT INTO "SystemSetting" ("key", "value", "note", "updatedAt")
VALUES (
  'MAIL_SENDING_ENABLED',
  'true',
  'false にすると会員登録メール・問い合わせ控えメールの送信を全て止める（O-05 停止スイッチ）',
  CURRENT_TIMESTAMP
);
