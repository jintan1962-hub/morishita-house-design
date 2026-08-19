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


---

## 2026-08-19 メール送信を Resend へ移行（**未リリース**）

**状態：コード修正済み・本番未適用。** 実行者欄が空のうちは本番へ出ていない。
前項（2026-08-18 セキュリティ是正）も未リリースのため、**この2件はまとめて出ることになる**。

### ① 何を変えるか

1. 送信基盤を SMTP(nodemailer) から **Resend の REST API** へ変更（`src/lib/mail.ts`）。新規依存の追加は0
2. 未設定時に ethereal のテスト送信へ落ちる経路を撤去（「送ったつもり」で終わらないようにした）
3. 管理者宛の通知メールを追加（問い合わせ着信・新規入会）。`MAIL_ADMIN_ADDRESS` が未設定なら送らない
4. 送信結果を `MailLog` テーブルへ記録し、管理画面 `/admin/mail-logs` から確認できるようにした（DBスキーマ変更あり）

### ② 問題が出たらどう気付くか

| 起こりうる問題 | 気付き方 |
|---|---|
| `RESEND_API_KEY` の設定漏れ | `/admin/mail-logs` に「失敗」＋理由「RESEND_API_KEY が未設定です」が並ぶ |
| 送信ドメインが未認証 | 同画面に「失敗」＋ `HTTP 403` 系の理由（Resend が from を拒否する） |
| `MailLog` テーブルが無い | 送信自体は成功するが、サーバーログに `P2021 table does not exist`。画面は「取得できませんでした」 |
| 管理者へ通知が来ない | 同画面に「未送信」＋理由「MAIL_ADMIN_ADDRESS が未設定です」 |
| Resend の障害・遅延 | 同画面に「失敗」＋「Resend への接続が 10 秒で応答しませんでした」。10秒でタイムアウトするため画面は固まらない |

**この4件はいずれも `/admin/mail-logs` を見れば分かる。**
以前は `console.error` に出るだけで、運用側から気付く手段が無かった。

### ③ どうやって元に戻すか

| 手順 | 所要時間 |
|---|---|
| Vercel のダッシュボードから直前のデプロイへ Rollback | 約2分 |
| `DROP TABLE IF EXISTS "MailLog";`（残しておいても害はない） | 約2分 |
| 合計 | **約5分** |

戻した場合、メール送信は旧SMTP方式に戻る。`SMTP_*` がプレースホルダのままなら
**自動返信はまた届かなくなる**点に注意。

### リリース前に人間が行う作業（O-04：AIは実行しない）

前項「2026-08-18 セキュリティ是正」の作業に加えて、以下を行うこと。

1. **Resend のアカウントを作り、APIキーを発行する**（`re_` で始まる）
2. **送信ドメインを認証する**（Resend の Domains で対象ドメインを追加し、表示された
   SPF / DKIM の DNS レコードを登録する）。**ここが済むまで、お客様宛には届かない**
   - 認証前の動作確認をする場合は `MAIL_FROM_ADDRESS=onboarding@resend.dev` にすると、
     Resend アカウントの登録アドレス宛にだけ送れる
3. **Vercel に環境変数を設定する**：`RESEND_API_KEY` / `MAIL_FROM_ADDRESS` / `MAIL_ADMIN_ADDRESS`
   - あわせて `NEXT_PUBLIC_SITE_ORIGIN` も確認する。**未設定だとメール本文のリンクが
     `http://localhost:3000/mypage` になり、受信者が開けない**（検証中に実際に再現した）
4. **マイグレーションを適用**：`pnpm prisma migrate deploy`（`MailLog` テーブルが作られる）
5. デプロイ後、会員登録を1件試し、`/admin/mail-logs` が「送信済」になることを確認する
6. **この表の「実行者」欄に自分の名前と日時を記入する**

| 日付 | 何を変えたか | 実行者（人間の氏名） |
| :--- | :--- | :--- |
| | | |


---

## 補足：検証段階（ドメイン未認証）で動かすときの設定

2026-08-19 時点の方針。**Vercel で動かすが、送信ドメインの認証は行わない。**

### この状態で何が起きるか

| 相手 | 届くか | MailLog の記録 |
|---|---|---|
| 管理者（`MAIL_ADMIN_ADDRESS` = Resendアカウントの登録アドレス） | **届く** | `SENT` |
| お客様（それ以外のすべての宛先） | **届かない** | `FAILED / HTTP 403: You can only send testing emails to your own email address…` |

**お客様には自動返信が1通も届かない。**これは仕様どおりの状態であり、故障ではない。
Resend はドメイン未認証の間、アカウント登録アドレス以外への送信を拒否する。

### そのために入れた対応

会員登録の完了画面とお問い合わせの完了画面は、**実際の送信結果を見て文言を変える**
（`registerUser` / `submitInquiry` が `mailSent` を返す）。

- 送れた場合：「控えのメールを送信しました」
- 送れなかった場合：「受け付けております。ただいまシステムの都合により控えのメールをお送りできておりません。
  重ねてご送信いただく必要はございません」＋電話番号を案内

D-03。届いていないのに「送信しました」と出すと、利用者は届かないメールを待ち、
同じ内容を再送信する（過去に重複問い合わせが発生した経緯がある）。

### Vercel に設定する環境変数（検証段階）

| キー | 値 |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | Supabase の接続文字列（`.env.migrate` と同じもの） |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` で生成した新しい値 |
| `NEXTAUTH_URL` | Vercel が払い出したURL |
| `NEXT_PUBLIC_SITE_ORIGIN` | 同上。**未設定だとメール本文のリンクが localhost になる** |
| `RESEND_API_KEY` | Resend のAPIキー |
| `MAIL_FROM_ADDRESS` | `onboarding@resend.dev`（ドメイン認証までの暫定） |
| `MAIL_ADMIN_ADDRESS` | **Resendアカウントの登録アドレス**。それ以外にすると管理者通知も届かない |

### 検証段階を抜けるときにやること

1. Resend の Domains で `ooi-kensetsu.co.jp` を追加し、指示されたレコードを **Route 53** に登録
   （ネームサーバーは AWS。既存のMX・SPFはMicrosoft 365とmaildeliver.jpで運用中のため触らない。
   Resendはサブドメイン方式なので競合しない）
2. `MAIL_FROM_ADDRESS` を `noreply@ooi-kensetsu.co.jp` などに変更
3. 会員登録を1件試し、`/admin/mail-logs` が `SENT` になることを確認

**コードの変更は不要。**環境変数の差し替えだけで切り替わる。


---

## 2026-08-19 デプロイが Vercel にブロックされた件と対処

### 何が起きたか

`d42c96b` を push したがデプロイされず、`/admin/mail-logs` が 404 のままだった。
Vercel の Deployment Details に次の表示。

```
Deployment Blocked
The deployment was blocked because the commit author did not have
contributing access to the project on Vercel.
The Hobby Plan does not support collaboration for private repositories.
```

### 原因

**リポジトリを private にしたこと。**Vercel の Hobby プランは、private リポジトリの場合
プロジェクト所有者本人のコミットでないとデプロイを起動しない。
8/18 の時点では repo が public だったためこの判定が働かず、`8e9c6fd` はデプロイできていた。
全4コミットの作者が `awnoono <oono@awn.jp>` で、Vercel 側の所有者と一致していなかった。

private 化自体は 8/18 の検品（O-08）で指摘した正しい対処。その副作用として表面化した。

### 対処

コミット作者のメールアドレスを `oono.web.pd@gmail.com` に統一した（Vercel / GitHub 側も同アドレスへ）。
git の設定は**このリポジトリのみ**変更しており、グローバル設定（`oono@awn.jp`）は触っていない。

```
git config user.email "oono.web.pd@gmail.com"   # --global は付けない
```

既に push 済みのコミットは作り直していない（`git push --force` は D-15 の禁止コマンド）。
新しい作者名義のコミットを1つ積むことで、Vercel が評価する先端コミットを差し替える。

### 残っている論点：Hobby プランの商用利用

Vercel の Hobby プランは**非商用利用に限る**規約であり、本件は商用サイトである。
private 化とは無関係に、**本番公開の前に Pro（$20/月）へ切り替える必要がある**。
今回の停止はたまたま private 化で表面化しただけで、いずれ整理が必要だった。

→ docs/debt.md に起票。
