-- S-08 / S-12：公開エンドポイント（問い合わせ・会員登録・ログイン）の濫用対策。
-- レート制限のカウンタ置き場。使い捨てデータ。戻すときは DROP TABLE "RateLimit"; で足りる。
CREATE TABLE "RateLimit" (
    "bucket" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "windowEndsAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("bucket")
);

-- 期限切れ行の掃除に使う
CREATE INDEX "RateLimit_windowEndsAt_idx" ON "RateLimit"("windowEndsAt");
