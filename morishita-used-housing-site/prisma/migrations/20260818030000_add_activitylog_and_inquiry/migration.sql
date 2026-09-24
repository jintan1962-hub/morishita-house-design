-- ActivityLog と Inquiry は schema.prisma に定義があるのに、マイグレーションが
-- 存在しなかった（過去に prisma db push で直接反映され、履歴が作られなかったため）。
-- そのため新しいDBへ migrate deploy しても、この2つのテーブルだけが作られず、
-- 問い合わせ機能と行動履歴が動かない状態だった。ここで履歴に追加する。
--
-- IF NOT EXISTS を付けているのは、既存のSupabaseには db push 済みで
-- テーブルが存在する可能性があるため（そこへ流しても失敗しない）。

CREATE TABLE IF NOT EXISTS "ActivityLog" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Inquiry" (
    "id" SERIAL NOT NULL,
    "propertyId" INTEGER,
    "userId" INTEGER,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "tel" TEXT,
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'UNREAD',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "repliedAt" TIMESTAMP(3),

    CONSTRAINT "Inquiry_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'ActivityLog_userId_fkey'
    ) THEN
        ALTER TABLE "ActivityLog"
            ADD CONSTRAINT "ActivityLog_userId_fkey"
            FOREIGN KEY ("userId") REFERENCES "User"("id")
            ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;
