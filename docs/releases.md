# リリース記録

本番環境へのデプロイや設定変更の内容を記録します。

O-03：次の3つが言えない変更は本番へ出さない。
① 何を変えるか ② 問題が出たらどう気付くか ③ どうやって元に戻すか（所要時間つき）

---

## 2026-09-02 物件CSVの一括取込の是正＋ログイン導線の修正

**状態：デプロイ済み。** 実行者：Claude（大野の指示）
- コミット `fcee08a..faecd09` を push（`12ca957` / `db02740` / `faecd09` の3件）
- Vercel 本番デプロイ `morishita-used-housing-site-bx1o7brh6`（READY／29秒）。
  **GitHub連携の自動デプロイが動いた**（2026-08-28 時点では動かずCLIから実施していた）
- DBスキーマの変更なし。マイグレーションの適用なし

### ① 何を変えたか

**(A) 物件CSVの一括取込（`faecd09`）**

959行のCSVが「CSVを読み取れませんでした。文字コードと列名をご確認ください」で
中止していた。原因は文字コードでも列名でもなく、サーバーアクションへ送る本文が
上限を超えていたこと（44列959行で約1.26MB、既定の上限は1MB）。

| ファイル | 変更 |
| :--- | :--- |
| `next.config.ts` | `serverActions.bodySizeLimit` を 4MB に設定 |
| `src/app/actions/properties.ts` | `compareCSVData` の突合を959往復から1回の `findMany` に／`importProperties` のトランザクション制限時間を5秒から180秒に |
| `src/app/(admin)/admin/properties/page.tsx` | CSV解析の失敗と送信の失敗を別々に捕まえ、送信失敗時は行数と原因を表示 |

**(B) ログイン導線（`12ca957`）**

2026-08-31 の「管理画面にログインできない」の再発防止。`SignInButton` の
`callbackUrl` を必須の引数にし、ログイン後に元の画面へ戻すようにした。
素の `/api/auth/signin` 直書きを検出するテストを追加。

**(C) 記録の更新（`db02740`）** — CLAUDE.md・作業ログ・手順書。
`docs/物件CSVの形式.md` のエリア表が複製元（長野県佐久市）のままだったので兵庫県に直した。
`scripts/setup-vercel-env.sh` と `docs/操作マニュアル.html` を追加。

利用者から見た変化：
- 管理者：959行のCSVが取り込めるようになる
- 会員：ログイン後の遷移先が、押した導線に応じた画面に変わる
- 一般利用者：表示の変化なし

### ② デプロイ後の確認（実URLへのリクエストで確認）

| 対象 | 結果 |
| :--- | :--- |
| `/` `/properties` `/member` `/simulation` `/company` | いずれも 200 |
| `/admin` `/admin/properties` `/mypage` | 307 →`/api/auth/signin?callbackUrl=…`（戻り先が付いている） |
| トップの「ログインする」 | `href="/api/auth/signin?callbackUrl=%2Fafter-login"`。(B) が効いている |
| セキュリティヘッダ | `x-frame-options` `content-security-policy` `x-content-type-options` `referrer-policy` `permissions-policy` `strict-transport-security` を確認。`x-powered-by` なし（2026-08-28 の是正を維持） |

### ③ ⚠️ 未確認（この作業では確認していない）

- **本番の管理画面から959行のCSVを取り込む確認は未実施。**
  管理者としてのログインが必要なため。**大野が実際に取り込んで確認すること。**
- **本番で本文上限が4MBになっていることの直接確認も未実施。**
  1MB超のリクエストを本番へ投げる確認が実行環境で拒否されたため。
  ローカルでは1MB超で `Body exceeded 1 MB limit.` が出ること、
  設定後のビルドで `Experiments (use with caution): · serverActions` が
  認識されることまでを確認している。
- ローカルで確認したのは次の3点。
  ①CSVが959行×44列に解析できる ②1MB超で 413 が起きる（検証ページで実測。
  302,803バイト＝成功／1,312,143バイト＝`Body exceeded 1 MB limit.`）
  ③DB側の処理が959行で1,443ms（`findMany` 28ms＋トランザクション1,443ms）

### ④ どうやって元に戻すか

`vercel rollback`、またはVercelの画面から `morishita-used-housing-site-m7g3r8mcl`
（2026-08-31 のデプロイ）を Promote する。所要1〜2分。
DBスキーマの変更がないため、戻すSQLは不要。
取込を実行済みの場合、上書き前のデータは `PropertyImportBackup` に残る。

---

## 2026-08-28 脆弱性是正（レート制限・情報漏えい・ヘッダ）

**状態：デプロイ済み。** 実行者：Claude（大野の指示）
- コミット `c5a95bc`（`f05a283..c5a95bc` を push）
- 本番マイグレーション `20260828010000_add_rate_limit` 適用済み（`DIRECT_URL` 経由）
- Vercel 本番デプロイ `dpl_7RJiB8vQ9g4UWfRFs1FF8xHoM8BG`（READY）。`vercel deploy --prod` で実施
  （GitHub連携の自動デプロイは動いていないため、従来どおりCLIから）

### デプロイ後の確認（実URLへのリクエストで確認）

| 対象 | 結果 |
|---|---|
| `curl -I https://morishita-used-housing-site.vercel.app/` | `x-frame-options: DENY` ／ `content-security-policy: frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'` ／ `x-content-type-options: nosniff` ／ `referrer-policy` ／ `permissions-policy` ／ HSTS を確認。`x-powered-by` は消えた |
| `/` `/properties` `/member` `/property/1` `/simulation` `/company` | いずれも 200 |
| `/admin` `/mypage` | 307 → `…/signin?callbackUrl=…` |
| `/api/auth/signin` `/api/auth/providers` | 200（NextAuth 動作） |
| ログイン失敗を5回（存在しないアカウント宛） | 全て 401。本番 `RateLimit` に `loginfail:ip:… count=5` の行ができることを確認 → 検証行は削除済み |
| 本番 `RateLimit` テーブル | Prisma から `count()` 可能。現在0行 |

### ⚠️ この作業で判明したこと（別途対応が必要）

- **`https://morishita-used-housing-site.vercel.app`（プロジェクト既定エイリアス）が
  Deployment Protection の対象外で、認証なしで 200 が返る。**
  CLAUDE.md は「Deployment Protection が有効なので実質非公開」としているが、
  この URL は誰でも閲覧できる状態。`…-o-dec4.vercel.app` の方は 302→SSO で保護されている。
  Vercel の Deployment Protection の適用範囲を「全デプロイ（Production 含む）」にするか、
  独自ドメイン設定と公開判断をまとめて行うこと（人間の作業）。
- 本番の管理者アカウントは未作成のため、管理者ログイン後の画面は未確認（従来どおり）。

### ① 何を変えたか

### ① 何を変えるか

- 対象コミット：この是正一式（`src/lib/rateLimit*.ts` / `src/lib/requestIp.ts` 新規、
  `src/lib/auth.ts` / `src/config/security.ts` / `src/config/property.ts` /
  `src/app/actions/{inquiry,registerUser,users,properties,logActivity}.ts` /
  `src/app/(public)/mypage/**` / `next.config.ts` / `prisma/schema.prisma` ＋ migration）
- **DBスキーマ変更あり**：`RateLimit` テーブルを1つ追加（`20260828010000_add_rate_limit`）。
  既存テーブルの変更・列削除・データ移行は**なし**。
- 利用者から見た変化：
  - 問い合わせ・会員登録・ログインを短時間に繰り返すと一時的に断られる（正常な利用では起きない頻度）
  - 会員登録で既存アドレスを入れたときの文言が変わる（退会済みか有効かを言わなくなった）
  - 全ページにセキュリティヘッダが付く（`X-Frame-Options` 等）。iframe 埋め込みが不可に
  - マイページ編集で、これまでブラウザへ送られていた自分のパスワードハッシュが送られなくなる

### ② 問題が出たらどう気付くか

| 見る場所 | 正常な状態 |
|---|---|
| Vercel 実行ログ | `レート制限の判定に失敗しました` が出ていない（出ていれば DB 到達不可。フェイルオープンで通してはいる） |
| `/member`（会員登録） | 新規メールで登録→自動ログイン→ `/mypage` まで通る |
| `/property/[id]/contact` | 1回目の送信が成功し、控えメールが届く |
| ログイン | 正しいパスワードで一発ログインできる（失敗を数えるのは誤入力時のみ） |
| `curl -I https://<本番>/` | `x-frame-options: DENY` と `content-security-policy: frame-ancestors 'none'…` が返る |
| `/admin`（管理者ログイン後） | 会員一覧・物件一覧・問い合わせ一覧が従来どおり表示される |
| `RateLimit` テーブル | 行が増減している（掃除で古い行は消える）。肥大していない |

### ③ どうやって元に戻すか

**コード**：`git revert <このデプロイのコミット>` して push（Vercel 自動ビルド 約2〜3分）。
または Vercel ダッシュボードで前デプロイへ即時ロールバック。

**DB**：`RateLimit` テーブルはコードが revert されれば参照されなくなる（残っていても無害）。
明示的に消すなら Supabase の SQL Editor で下記（`DROP` は D-15 のため人間が実行）：

```sql
DROP TABLE IF EXISTS "RateLimit";
DELETE FROM "_prisma_migrations" WHERE migration_name = '20260828010000_add_rate_limit';
```

所要：コード5分・DB2分。データ損失なし（`RateLimit` は使い捨てのカウンタのみ）。

### 実際の適用手順（2026-08-28 実施）

1. 自分の変更ファイルのみをステージしてコミット `c5a95bc`（作者 `oono.web.pd@gmail.com`）
2. `prisma migrate deploy`（`DIRECT_URL` 経由）→ `20260828010000_add_rate_limit` 適用
3. `git push origin main`
4. `vercel deploy --prod --yes` → `dpl_7RJiB8vQ9g4UWfRFs1FF8xHoM8BG`（READY）
5. 上記②の表を実URLで確認

---

## 2026-08-25 モリシタハウス用 Supabase へのスキーマ適用

**状態：適用済み。** 実行者：Claude（大野の指示）

※ これはモリシタハウス版（morishita-used-housing-site）の記録。
以降の RENOEL 版の記録とは対象環境が異なる。

### ① 何を変えたか

新規作成した Supabase プロジェクト（リージョン ap-south-1）へ
`prisma migrate deploy` でマイグレーション8件を適用した。

利用者から見た変化は**なし**。サイトはまだ公開しておらず、
テーブルの器を作っただけでデータは入れていない。

適用後の実測：

- public のテーブル 9件（ActivityLog / Inquiry / MailLog / Property /
  PropertyImage / PropertyImportBackup / SystemSetting / User / _prisma_migrations）
- `_prisma_migrations` に8件すべて applied、ロールバック0件
- データ件数 User 0 / Property 0 / Inquiry 0 / MailLog 0
- SystemSetting のみ1件（`MAIL_SENDING_ENABLED = true`。O-05 停止スイッチの行。
  マイグレーションが入れるもので、想定どおり）

接続は `DIRECT_URL`（ポート5432）を使用。pooler 経由ではマイグレーションが失敗するため。

### ② 問題が出たらどう気付くか

この時点ではサイトが公開されていないため、利用者側の兆候は無い。
次にデプロイした際、以下で気付く。

- Vercel のビルド／実行ログに `P1001`（DB到達不可）や `P2021`（テーブル無し）が出る
- 会員登録や物件一覧が「処理できませんでした（お問い合わせID: …）」を返す
- 管理画面 /admin/mail-logs にメール送信の失敗が並ぶ

### ③ どうやって元に戻すか

データが0件のため損失なく戻せる。所要5分程度。

1. Supabase の SQL Editor で `drop schema public cascade; create schema public;`
   （`DROP` は D-15 の禁止コマンドのため、AIは実行しない。人間が操作する）
2. または Supabase のプロジェクトごと削除して作り直す

このマイグレーションはテーブル作成のみで、既存データの変換や列削除を含まない。
そのため「戻すSQL」は上記に集約される。

### 併せて記録

- `DATABASE_URL`（Transaction pooler）に `?pgbouncer=true` が付いていなかったため追記した
- リージョンが推奨（東京）ではなくムンバイである件は、大野の判断で現状のまま進める。
  経緯と見直し条件は docs/exceptions.md

### この時点で未了

- GitHub への push（未実施）
- Vercel プロジェクトの作成と環境変数の登録（未実施）
- Supabase Storage のバケット `property-images`（Public）の作成 — 未確認
- 管理者アカウントの作成（サイト公開後、/member で登録 → Table Editor で role を ADMIN へ）

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

| 日付 | 何を変えたか | 実行者 |
| :--- | :--- | :--- |
| 2026-08-19 09:40頃 | セキュリティ是正（8/18分）とResend移行を**同時に**本番へ反映。`29a6b13` | Claude（大野の指示・D-14の変更後） |


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

| 日付 | 何を変えたか | 実行者 |
| :--- | :--- | :--- |
| 2026-08-19 09:40頃 | セキュリティ是正（8/18分）とResend移行を**同時に**本番へ反映。`29a6b13` | Claude（大野の指示・D-14の変更後） |


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


---

## 2026-08-19 デプロイ実施の記録

**`29a6b13` を Production へ反映。** push から約90秒で公開。
8/18 のセキュリティ是正と 8/19 の Resend 移行が、この1回で同時に本番へ出た。

DBマイグレーションは事前に適用済み（大野が `migrate-supabase.sh` を実行）。
このデプロイでスキーマは変更していない。

### 反映後に確認したこと

| 項目 | 結果 |
|---|---|
| 未ログインでの `/admin` `/admin/mail-logs` `/admin/users` `/admin/properties` `/admin/inquiries` | 全て 307 → `/api/auth/signin` |
| 未ログインでの `/mypage` `/mypage/edit` | 307 → `/api/auth/signin` |
| 公開ページ `/` `/properties` | 200 |

### 確認できていないこと（**合格と書かないこと**）

| 項目 | 理由 |
|---|---|
| **会員限定物件の秘匿（S-07 / C-03）** | DBに物件が0件のため、HTMLに価格・所在地が無いことは何も証明していない。**物件を登録してから再確認が必要** |
| **サーバーアクションへの未認証POST** | アクションIDはビルドごとに変わり、手元のIDは本番で `Server action not found` になる。本番のIDを配信JSから取り出して再検証すること。同一コードでのローカル検証では認可が効いている |
| **メール送信の実挙動** | 管理画面へのログインが必要なため未確認 |
| **管理者がログインできること** | 未確認。`User.role='ADMIN'` は1件あるが、そのアカウントのパスワードで実際に入れるかは試していない |

### 次にやること

1. 管理者アカウントでログインし、`/admin/mail-logs` が表示されることを確認
2. 物件を1件登録し、未ログインで価格・所在地が漏れないことを確認
3. 会員登録を1件試し、MailLog が記録されることを確認
4. **Vercel を Pro へ**（Hobbyは非商用限定。docs/debt.md 起票済み）
5. **Resend の送信ドメイン認証**（済むまでお客様へは1通も届かない）

---

## 2026-08-21 ログイン後の戻り先を修正（`2622d9c`）

**症状**：`/admin` を開いてログインしても、管理画面ではなくトップページに戻る。
ログイン後に自分でURLへ `admin` と打ち直せば入れる、という状態だった。

**原因**：未ログイン時に**戻り先を渡さずに** `/api/auth/signin` へ送っていた。
NextAuth は `?callbackUrl=` が無いとログイン後にサイトのトップへ戻す
（`next-auth/core/lib/callback-url.js` の `let callbackUrl = url.origin`）。
`/mypage`・`/mypage/edit`・会員限定物件の問い合わせ画面も同じ書き方だった。

**変更**（ログイン後の行き先のみ。権限判定・DBスキーマには触れていない）

| 追加・変更 | 内容 |
|---|---|
| `src/lib/authPaths.ts`（新規） | `signInPath()` と `AFTER_LOGIN_PATH`。ログイン画面のURL組み立てはここだけ（D-09） |
| `src/app/after-login/page.tsx`（新規） | ログイン直後の中継。管理者→`/admin`、会員→`/mypage` に振り分けるだけで画面は出さない |
| `(admin)/layout.tsx` ほか4画面 | 自分自身を戻り先に指定 |
| `(home)/page.tsx` | 「ログイン」「会員ログイン」を `/after-login` 経由に |

**ローカルでの確認**（Docker の dev DB ＋ `pnpm dev`。画面を実際に操作した）

| 操作 | 結果 |
|---|---|
| 未ログインで `/admin` → 管理者でログイン | `/admin` の管理者ダッシュボードが表示された |
| トップの「ログイン」→ 管理者でログイン | `/admin` に着いた |
| トップの「ログイン」→ 一般会員でログイン | `/mypage` に着いた |
| 一般会員のまま `/admin` を開く | トップへ弾かれる（従来どおり。権限の穴は開けていない） |
| ログアウト後に `/mypage` | `…/signin?callbackUrl=%2Fmypage` へ |

**機械ゲート**：`tsc --noEmit` エラー0／`eslint .` エラー0（警告18は既存）／`node --test` 49件全通過。

**本番で確認したこと**（デプロイ後、実URLへのリクエストで確認）

| パス | 応答 |
|---|---|
| `/admin` | 307 → `…/signin?callbackUrl=%2Fadmin` |
| `/admin/properties` | 307 → `…/signin?callbackUrl=%2Fadmin` |
| `/mypage` | 307 → `…/signin?callbackUrl=%2Fmypage` |
| `/mypage/edit` | 307 → `…/signin?callbackUrl=%2Fmypage%2Fedit` |
| `/after-login` | 307 → `…/signin?callbackUrl=%2Fafter-login` |
| トップのログイン導線 | `href="/api/auth/signin?callbackUrl=%2Fafter-login"` |

**本番で確認していないこと（合格と書かない）**
本番の管理者アカウントで実際にログインし `/admin` に着地するところまでは未確認。
本番のパスワードはAIが扱わないため、大野が1回ログインして確かめること。

**この修正では直らないこと**
未ログインで `/admin/properties/5` のような深いURLを開いた場合、ログイン後は `/admin` に着く。
レイアウトからは元のパスが取れないため（直すならミドルウェアの追加が必要＝別件）。

**戻し方**：`git revert 2622d9c` して push。DBの変更が無いので戻しは1手で済む。

---

## 2026-08-24 管理画面の検品と修正（`fba91c7`）

**変更レベル L3。**着手前に3点を提示し大野の承認を得た（D-02）。詳細は `docs/作業ログ_2026-08-24.md`。

### ① 何を変えるか

1. **管理画面の寸法** — `src/app/(admin)/admin.css` を新設し、根要素 `.admin-root` にだけ
   px で書き直した Tailwind のトークンを載せる。`html { font-size: 62.5% }` の下で
   Tailwind の寸法が 62.5% に縮んでいた（`text-sm`→8.75px／`w-64`→160px／`h-16`→40px）。
   ヘッダーは `h-16` → `min-h-16` に変更（40px のヘッダーに 45.49px が入り上端が切れていた）
2. **会員データの列制限** — `getUsers` / `getUserById` / `updateUserStatus` が `select` 未指定で、
   会員全員の `password`（bcryptハッシュ）等をブラウザへ返していた。`USER_FIELDS` で明示（S-01）
3. **ダッシュボード** — 全数値・一覧が架空だったため `src/app/actions/dashboard.ts` を新設し実測値へ
4. **物件一覧のサムネイル** — 全件に Unsplash の同じ写真を出していたのを実画像／「画像なし」へ
5. **公開サイトへの影響がある唯一の変更** — `globals.css` のフォーム指定に
   `:not(.admin-root …)` を付与（詳細度で Tailwind を打ち消していたため）
6. 押しても何も起きない／404 の UI 7か所を実装または撤去。配色を RENOEL パレットへ統一

**DBのスキーマ変更なし**（`prisma migrate deploy` 不要）。**環境変数の追加なし。**

### ② 問題が出たらどう気付くか

| 見る場所 | 正常な状態 |
|---|---|
| `/admin` | 数値が本番の実数と一致する。右上のログインIDが切れていない |
| `/admin/users` | 一覧が表示される（`select` で列を絞ったため、壊れるならこの変更が原因） |
| `/properties`・`/property/[id]/contact` | 公開サイトのフォーム・検索欄が従来どおり |

### ③ どうやって元に戻すか

`git revert fba91c7` して push（Vercelの自動ビルドで約2分）。
Vercel のダッシュボードから前のデプロイへ即時ロールバックも可。
**DBに触っていないのでデータ側の後始末は不要。**

### 機械ゲート

`tsc --noEmit` エラー0／`eslint .` エラー0（警告17は全て今回触っていないファイルの既存分・**新規0**）／
`node --test` 49件全通過／`next build` 成功。

### 開発環境で確認したこと

Chrome で全画面を操作。ヘッダー 65px・IDブロック上端 y=14（切れなし）・サイドバー 256px・
サイドバー文字 14px・本文余白 40px を計算済みスタイルで実測。
一覧の検索が効くこと（「軽井沢」で 1件/全4件）、お問い合わせの対応済み切り替えで完了日時が入ることを確認。
公開サイトの素の `input[type=text]` が従来どおり 游明朝/15px/余白10px 14px/角0/#C7C7C7 で
描画されることを実測し、`globals.css` の変更が公開サイトへ影響していないことを確認。

### 本番で確認したこと（デプロイ後、実URLへのリクエストで確認）

| 対象 | 結果 |
|---|---|
| GitHub の deployment status（`fba91c7`） | `used-housing-site-m2yk` / `used-housing-site` とも **success** |
| 配信されている `globals` のCSS | `select:not(.admin-root select),…` を含む＝新コードが出ている |
| `/` `/properties` `/property/1` `/simulation` `/member` `/information` | いずれも 200 |
| `/admin` | 307 → `…/signin?callbackUrl=%2Fadmin` |
| `/mypage` | 307 → `…/signin?callbackUrl=%2Fmypage` |

### 本番で確認していないこと（合格と書かない）

**本番の管理者アカウントでログインした状態の管理画面は未確認。**
本番のパスワードはAIが扱わないため、大野が1回ログインして次を確かめること。

- 右上のログインIDが切れていないか
- ダッシュボードの数値が実際の会員数・物件数と合っているか
- 「対応が必要なこと」に出る未対応件数・送信失敗メール件数が実態と合っているか
- 会員一覧・物件一覧が表示され、検索と絞り込みが効くか

**本番DBには実会員のデータが入っているため、ダッシュボードに実在の会員の氏名とメールが
表示されるようになった**（管理者のみ閲覧可）。本番で初めて実データが載る画面である。
