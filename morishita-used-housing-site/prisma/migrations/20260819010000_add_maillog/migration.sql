-- メール送信の結果を記録するテーブル。
-- 送信基盤を SMTP(nodemailer) から Resend へ移すのに合わせて追加した。
-- 以前は送信に失敗しても console.error に出るだけで、運用側からは気付けなかった。
--
-- IF NOT EXISTS を付けているのは、既存環境へ流しても失敗しないようにするため
-- （このリポジトリの既存マイグレーションと同じ方針）。

CREATE TABLE IF NOT EXISTS "MailLog" (
    "id" SERIAL NOT NULL,
    "kind" TEXT NOT NULL,
    "to" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "providerId" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MailLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "MailLog_status_createdAt_idx" ON "MailLog"("status", "createdAt");
