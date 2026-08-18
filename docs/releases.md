# リリース記録

本番環境へのデプロイや設定変更の内容を記録します。

O-03：次の3つが言えない変更は本番へ出さない。
① 何を変えるか ② 問題が出たらどう気付くか ③ どうやって元に戻すか（所要時間つき）

---

## 2026-08-18 セキュリティ是正（**未リリース**）

**状態：コード修正済み・本番未適用。** 実行者欄が空のうちは本番へ出ていない。

### ① 何を変えるか

1. 認証バックドア（`user@example.com` / `password`）と固定シークレットの削除
2. 管理画面と全サーバーアクションへの認可追加（`requireAdmin` / `requireUser`）
3. 会員限定物件の秘匿をサーバー側へ移動
4. 問い合わせ送信が常に失敗するバグの修正（`updatedInquiry` 未定義）
5. 会員削除を物理削除から論理削除へ（DBスキーマ変更あり）
6. 一括取込に件数確認・控え・トランザクションを追加（DBスキーマ変更あり）
7. メール送信の停止スイッチ追加（DBスキーマ変更あり）
8. 会社情報・金利などの設定値を `src/config/` へ集約

### ①-2 Vercel向けの是正（2026-08-18 追加。Linuxコンテナでの実機検証で判明）

9. **Prismaのエンジンバイナリ問題** — `src/generated` にmacOS用バイナリ(17MB)がコミットされており、
   Linux(Vercel)では実行時に落ちる状態だった。`binaryTargets = ["native", "rhel-openssl-3.0.x"]` を追加し、
   `postinstall: prisma generate` で各環境が自前で生成する形にした。`src/generated` はGit追跡から外した。
10. **ActivityLog / Inquiry のマイグレーション欠落** — schema.prisma に定義はあるのに
    CREATE TABLE がどのマイグレーションにも無かった（過去に `prisma db push` で直接反映され履歴が残らなかったため）。
    新しいDBへ `migrate deploy` してもこの2テーブルだけ作られず、問い合わせ機能と行動履歴が動かない。
    `20260818030000_add_activitylog_and_inquiry` を追加（`IF NOT EXISTS` 付きなので既存DBへ流しても安全）。

### ② 問題が出たらどう気付くか

| 起こりうる問題 | 気付き方 |
|---|---|
| `NEXTAUTH_SECRET` 未設定 | **ビルドが失敗する**（実測済み：`Failed to collect configuration for /admin/inquiries`）。フォールバック値を消したため、未設定なら必ず落ちる。**環境変数を先に設定してからデプロイすること** |
| Prismaエンジンの不一致 | 画面が500になり、ログに `Query engine library for current platform could not be found`。`postinstall` が走っているか確認する |
| Inquiry/ActivityLog が無い | 問い合わせ管理が「取得できませんでした」。ログに `P2021 table does not exist` |
| マイグレーション未適用でDBエラー | 会員管理・物件管理の画面に「取得できませんでした（お問い合わせID: …）」が出る。サーバーログに Prisma のカラム不明エラー |
| 管理者が誰もログインできない | `User.role` が `ADMIN` の行が1件も無いと、全員が `/admin` から弾かれる。**下記の事前準備を必ず行うこと** |
| メールが届かない | `SMTP_HOST` が未設定のままだと ethereal のテスト送信になる（従来から） |

### ③ どうやって元に戻すか

| 手順 | 所要時間 |
|---|---|
| Vercel のダッシュボードから直前のデプロイへ Rollback | 約2分 |
| DBスキーマを戻す（追加した列・テーブルを削除）※下記SQL | 約5分 |
| 合計 | **約10分** |

```sql
-- 戻す場合のみ。追加した列とテーブルを落とす。
-- 論理削除された会員は、戻すと「削除されていない状態」に戻る点に注意。
DROP TABLE IF EXISTS "PropertyImportBackup";
DROP TABLE IF EXISTS "SystemSetting";
DROP INDEX IF EXISTS "User_deletedAt_idx";
ALTER TABLE "User" DROP COLUMN IF EXISTS "deletedAt";
ALTER TABLE "User" DROP COLUMN IF EXISTS "deletedBy";
ALTER TABLE "User" DROP COLUMN IF EXISTS "failedLoginCount";
ALTER TABLE "User" DROP COLUMN IF EXISTS "lockedUntil";
```

### リリース前に人間が行う作業（O-04：AIは実行しない）

順番どおりに行うこと。

1. **GitHubリポジトリを private にする**（現在 public。O-08）
2. **`NEXTAUTH_SECRET` を再発行する**（旧値 `fallback-secret-for-demo-only` は公開済み。S-02：削除より先にローテーション）
   `openssl rand -base64 32` で生成し、Vercelの環境変数に設定
3. **Supabaseの接続情報を確認・必要ならローテーション**
4. **マイグレーションを適用**：`pnpm prisma migrate deploy`
5. **管理者アカウントを1件作る**（これを忘れると誰も管理画面に入れない）
   ```sql
   UPDATE "User" SET role = 'ADMIN' WHERE email = '<管理者のメールアドレス>';
   ```
6. Vercelへデプロイ
7. 動作確認：未ログインで `/admin` が signin へ飛ぶこと、管理者でログインして会員一覧が出ること
8. **この表の「実行者」欄に自分の名前と日時を記入する**

| 日付 | 何を変えたか | 実行者（人間の氏名） |
| :--- | :--- | :--- |
| | | |
