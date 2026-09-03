# 検品記録

定期的なシステムの点検や検品結果を記録します。

| 検品日 | 対象 | 種別 | 判定者 | 結果 | 是正期限 |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-08-18 | used-housing-site 全体 | A・B・C混合 | Claude（実装セッション外） | **不合格**（下記） | 未定 |
| 2026-08-18 | 上記の是正 | A（変更） | Claude（同一セッション・**自己検品**） | 条件付き合格（下記） | — |
| 2026-08-19 | メール送信の Resend 移行 | A（変更） | Claude（同一セッション・**自己検品**） | 合格（実送信まで確認。下記） | — |
| 2026-08-28 | 脆弱性観点の検品＋是正（モリシタ版） | A（変更・L3） | Claude（同一セッション・**自己検品**） | 是正実施・**要再検品**（下記） | 公開前 |
| 2026-09-03 | Supabase の RLS 有効化（モリシタ版） | A（変更） | Claude（同一セッション・**自己検品**） | 合格（下記） | — |

---

## 2026-09-03 RLS 有効化の検品：合格

### この検品の限界（先に読むこと）

- **判定者が実装者と同一セッションである。**別セッションでの再検品が望ましい。
- 確認したのは「公開ロールから遮断できたか」と「アプリの読み書きが壊れていないか」の2点のみ。
  会員限定物件の出し分けなど**アプリ側の認可は今回の対象外**。
- **anon キーが過去に外部へ渡っていたかは確認できていない**（【要確認】）。
  渡っていた場合、是正前に読まれた可能性は否定できない。Supabase のログ調査は未実施。

### 適用前後の実測

`node scripts/check-rls.mjs .env.production.local` の出力。

| 状態 | RLS 有効 | `anon` の SELECT | `anon` の INSERT | `authenticated` の SELECT |
| :--- | :--- | :--- | :--- | :--- |
| 適用前 | 0 / 10 テーブル | 10 テーブルで可 | 10 テーブルで可 | 10 テーブルで可 |
| 適用後 | **10 / 10 テーブル** | **全テーブルで不可** | **全テーブルで不可** | **全テーブルで不可** |

対象10テーブル：`ActivityLog` `Inquiry` `MailLog` `Property` `PropertyImage`
`PropertyImportBackup` `RateLimit` `SystemSetting` `User` `_prisma_migrations`

### 検証したこと（証拠のあるもの）

| 項目 | 方法 | 結果 |
|---|---|---|
| RLS と権限 | `scripts/check-rls.mjs`（`pg_class` / `has_table_privilege` を直接参照） | 合格。上表のとおり |
| REST の遮断 | `curl` で `/rest/v1/User` `/Property` `/Inquiry` | いずれも 401（適用前から401。anon キー未流出が前提） |
| アプリの読み取り | `scripts/check-rls-app-access.mjs` で9モデルを `count()` | 全て成功。`Property` 959件 |
| アプリの書き込み | 同スクリプトで `RateLimit` へ INSERT → SELECT → DELETE | 成功。検証行の残骸なし |
| 本番と同一の接続 | 上記を `--pooled`（Vercel が使う 6543・`pgbouncer=true`）で再実行 | 成功。読み書きとも同結果 |
| 実機での表示 | Chrome で本番サイトを開いて目視 | `/properties` に「959件」と物件カードが表示。`/property/1241` も価格・面積・間取りまで表示 |

### 判断を誤りかけた点（記録として残す）

物件詳細ページを開いても `ActivityLog` が5件のまま増えなかった。RLS による書き込み拒否を
疑ったが、`src/app/actions/logActivity.ts` を読むと `logPropertyView` は
**ログイン時のみ記録する**仕様だった。未ログインでの閲覧だったため増えないのが正しい。
コードを読まずに「RLSで壊れた」と報告するところだった。

### 未実施

- 別セッションでの再検品
- Supabase のログによる、是正前の `anon` 経由アクセスの有無の確認
- `anon` / `authenticated` の schema USAGE 剥奪。`has_schema_privilege` は適用後も `true` を返す。
  これは `PUBLIC` ロールへの既定の GRANT を拾っているためで、
  テーブル権限を剥奪済みなら実害はない。`PUBLIC` からの剥奪は影響範囲が読み切れないため見送った

---

## 2026-08-18 初回検品：不合格

否の項目：D-05, D-06, D-07, D-08, D-09, D-10, D-13, D-17, D-18, D-19,
S-01, S-07, S-09, S-11, S-12, S-13, S-14,
O-01, O-02, O-03, O-05, O-06, O-08, O-09, O-10, O-12, O-13

致命的だったもの：
1. 認証バックドアと固定シークレットが public リポジトリに公開されていた
2. 管理画面・管理系サーバーアクションに認可が皆無（未認証で全会員のPII取得・削除が可能）
3. 会員限定物件の出し分けがクライアント側のみ（ソースから価格が読めた）
4. 機械ゲートが通らない（型エラー2件・Lint 507件・テスト0件）。うち1件は問い合わせが常に失敗する実バグ

---

## 2026-08-18 是正後の検品：条件付き合格

### ⚠️ この検品の限界（先に読むこと）

- **判定者が実装者と同一セッションである。**検品チェックリストは「判定者は変更を書いた本人以外」と
  定めており、この記録はその条件を満たしていない。**別セッションでの再検品が必要。**
- **DBに接続できない状態で検証した。**Supabase が
  `FATAL: (ENOTFOUND) tenant/user postgres.jbpcoixtakjsggntvnrf not found` を返す。
  そのためマイグレーションは適用しておらず、**データを伴う経路は未検証**。
- 以下は「該当なし」ではなく**未実施**：B1（バックアップ復元）、B13（停止スイッチを実際に切る）、
  A13（実際に失敗通知を受け取る）、A19（途中で止めて再実行）、A12（権限外ユーザーでの実アクセス）。

### 実際に検証したこと（証拠のあるもの）

| 項目 | 方法 | 結果 |
|---|---|---|
| A3 機械ゲート | `npx tsc --noEmit` / `npx eslint .` / `node --test` を検品者が実行 | 型エラー0（元2）／Lintエラー0（元507）／テスト5件全通過 |
| ビルド | `npx next build` | 成功。管理画面は全て動的レンダリングになった |
| S-07 画面 | 未ログインで `/admin` `/admin/users` `/admin/properties` `/admin/inquiries` `/mypage` `/mypage/edit` へ直接アクセス | 全て 307 → `/api/auth/signin` |
| S-07 サーバーアクション | ビルド成果物から全16アクションのIDを取り出し、未認証で直接POST | 管理系・本人系は全て `{"success":false,"error":"ログインが必要です。"}`。データは1件も返らず |
| C-03 会員限定物件 | 未ログインで `/properties` のHTMLを取得し全文検索 | 価格・エリアの文字列は1件も含まれず |
| D-07 内部情報 | DB接続エラーを実際に発生させ、配信HTMLを確認 | 画面は「物件を取得できませんでした。（お問い合わせID: 202608181108-ILZZL）」のみ。Prisma・SQL・パスの露出0件 |
| S-01 pre-commit | ダミーの鍵（`sk-…` / `ghp_…`）でコミットを試行 | 2回ともコミットが中止された。`.env.production` の混入も中止された |
| S-01 追跡ファイル | `git ls-files` grep（検品者が自ら実行） | 0件。`prisma/dev.db` は追跡から外した |
| S-11 脆弱性 | `pnpm audit --audit-level=high` | high 8件 → **0件**。next の推移的依存を上書きで引き上げた（新規パッケージの追加は0） |
| D-06 テスト | `node --test` | ローン計算に5件のテストを追加し全通過。新しい依存は足していない |
| 認可の網羅 | `src/app/actions/*.ts` の `export async function` を全列挙し、先頭の認可呼び出しを確認 | 17関数中16関数に認可あり。残る `registerUser` は公開の会員登録フォームで認可なしが正 |

### まだ「否」のまま残っている項目

| 項目 | 理由 |
|---|---|
| O-08 | リポジトリが public のまま。**人間がGitHubで private に変更する必要がある** |
| S-02 | 公開済みシークレットのローテーション未実施（**人間の作業**） |
| O-01 | 本番Supabase資格情報が作業マシンの `.env` にある。開発用DBの分離も未着手 |
| O-02 | バックアップ規定・復旧目標が未定義（CLAUDE.md に【要記入】として枠だけ用意） |
| O-06 | 失敗通知の仕組みが無い |
| S-14 | 連絡先・初報期限が【要記入】のまま |
| O-09 | データ保持期間が未定義 |


---

## 2026-08-19 メール送信の Resend 移行：合格

### この検品の限界（先に読むこと）

- **判定者が実装者と同一セッションである。**別セッションでの再検品が必要という前項の指摘は解消していない。
- **検証は本番の Supabase で行った。**開発用DBが用意できなかったため（Dockerが未起動）、
  大野の承認を得て本番DBを使った。DBは実質空（User 1件＝管理者のみ、Property 0、Inquiry 0）。
  作成した MailLog の行は3件とも削除し、User・Inquiry には一切書き込んでいない。
  **O-01（環境を分ける）は未解決のまま。**

### 実際に検証したこと（証拠のあるもの）

| 項目 | 方法 | 結果 |
|---|---|---|
| A3 機械ゲート | `pnpm gate` | 型エラー0／Lintエラー0（警告19は既存）／テスト12件全通過（+7件） |
| ビルド | `npx next build` | 成功。`/admin/mail-logs` は動的レンダリング |
| DBスキーマ | `sh migrate-supabase.sh`（大野が実行） | `20260819010000_add_maillog` 適用。8テーブルが揃った |
| S-07 画面 | 未ログインで `/admin/mail-logs` へ直接アクセス | 307 → `/api/auth/signin` |
| S-07 サーバーアクション | ビルド成果物からアクションIDを取り出し、未認証で直接POST | `{"success":false,"error":"ログインが必要です。"}`。データは返らず |
| O-05 停止スイッチ | 実DBの `SystemSetting` を読ませた | `MAIL_SENDING_ENABLED=true` を読んで送信処理に進んだ |
| 失敗の記録 | `RESEND_API_KEY` 未設定で送信 | `FAILED / RESEND_API_KEY が未設定です` を MailLog に記録 |
| 宛先未設定の記録 | `MAIL_ADMIN_ADDRESS` 未設定で管理者通知 | `SKIPPED / MAIL_ADMIN_ADDRESS が未設定です`。送信されず |
| APIエラーの記録 | 認証前ドメインの宛先へ実送信 | `FAILED / HTTP 403: You can only send testing emails to your own email address…` を記録 |
| **実送信** | Resendアカウントの登録アドレス宛に実際に送信 | **`SENT` / providerId `4864c896-…` を記録。受信を確認** |
| 後片付け | 検証で作った MailLog 3件を条件指定で削除 | MailLog 0件に復帰 |

### この検品で見つかり、その場で直したもの

| 見つかったもの | 直した内容 |
|---|---|
| `migrate-supabase.sh` が接続失敗時に何も表示せず終了していた（`set -e` により、用意してあった原因案内へ到達しない） | 判定のあいだだけ `set -e` を外した |
| 同スクリプトの完了メッセージが7テーブルのままだった | MailLog を加えて8に更新 |
| `.env.migrate` に不正な行が混入し `command not found` が出ていた | DATABASE_URL / DIRECT_URL の2行だけに整理 |
| 宛先未設定のとき、一覧の「宛先」欄が空白で壊れて見えた | `（宛先未設定）` と表示するようにした |
| メール本文のリンクが `http://localhost:3000/mypage` になった | `NEXT_PUBLIC_SITE_ORIGIN` 由来。releases.md のリリース前チェックに追記 |

### まだ「否」のまま残っている項目

| 項目 | 理由 |
|---|---|
| **送信ドメインが未認証** | `onboarding@resend.dev` のままでは、Resendアカウントの登録アドレス宛にしか届かない。**お客様には1通も届かない。** DNSへのSPF/DKIM登録が必要（人間の作業） |
| `.env` が消えたSupabaseプロジェクトを指している | ローカルで `pnpm dev` するとDBエラーになる。`.env.migrate` 側が現役 |
| O-01 環境の分離 | 開発用DBが無く、検証を本番DBで行った |
| O-08 / S-02 / O-02 / O-06 / S-14 / O-09 | 前回検品から変化なし（O-06 はメール送信に限れば MailLog で解消） |

---

## 2026-08-28 脆弱性観点の検品と是正（morishita-used-housing-site）

判定者：Claude（実装と同一セッション・**自己検品**）。別セッションでの再検品が必要。
変更レベル：L3（認証・認可・個人情報の取り扱い）。大野の「すべて厳格に修正」指示を着手承認とした。

### 見つかった問題と対応

| 重大度 | 箇所 | 内容 | 対応 |
|---|---|---|---|
| High | `submitInquiry` / `registerUser` | 未ログインで叩けて、任意の宛先へ自社ドメイン差出人のメールを回数無制限に送れる（メール増幅・スパム踏み台・Resend凍結リスク）。レート制限・CAPTCHA・オリジン検証なし | DBカウンタ方式のレート制限を導入。問い合わせ＝IP 10回/時＋宛先メール 5回/時、登録＝IP 5回/日。しきい値は `src/config/security.ts` の `RATE_LIMITS` |
| High | `src/app/(public)/mypage/edit/page.tsx` | `select` 未指定の `findFirst` を client component へ渡し、自分の `password`(bcrypt) 等が RSC ペイロードでブラウザへ配信されていた（S-01違反の再発） | `select: { name, tel, email }` に限定。`mypage/page.tsx` も同様に是正 |
| Medium | ログイン `authorize` | ①IP単位の総当たり制限なし ②存在しないユーザーは bcrypt を通らず即 null＝応答時間差でアカウント在籍を推測可能 | ①「失敗」だけを数えるIP制限（20回/時、`loginFailPerIp`）。成功はカウントしない ②当て馬ハッシュと常時 `bcrypt.compare` |
| Medium | `registerUser` | 「既に登録／退会済み／成功」を返し分け＝メールアドレス在籍の列挙が可能 | 有効・退会済みを1つの文言に統一。IP制限も併用。**完全な非列挙（常に成功扱い＋通知メール）は自動ログイン導線と両立せず未対応（TODO:未確認）** |
| Medium | `next.config.ts` | セキュリティレスポンスヘッダが1本も無い＝管理画面・ログインが iframe 化可能（クリックジャッキング） | `X-Frame-Options: DENY` ＋ CSP `frame-ancestors 'none'` / `object-src` / `base-uri` / `form-action`、`nosniff`、`Referrer-Policy`、`Permissions-Policy`、HSTS を全ページへ。`poweredByHeader: false` |
| Low | `updateUserStatus` / `updateInquiryStatus` | `status` 文字列を無検証でDB書き込み。不正値で会員が恒久ログイン不可になりうる | `USER_STATUS_VALUES` / `INQUIRY_STATUS_VALUES` のホワイトリスト検証 |
| Low | `updateMyProfile` | `name` / `tel` に長さ上限なし | 登録フォームと同じ上限（100 / 30）を追加 |
| Low | `compareCSVData` / `importProperties` | 取込配列に件数上限なし＝巨大配列で関数タイムアウト・長時間トランザクション | `MAX_IMPORT_ROWS = 2000` を超えたら着手前に中止（`src/config/property.ts`） |
| Low | `importProperties` | `disclosureLevel` を `parseInt \|\| 0` で受け、{0,1} 検証なし | 0/1 以外の行は取込中止（`updateProperty` と同じ検証） |
| Low | `logPropertyView` | `propertyTitle` を画面から受け取り無検証で `ActivityLog` へ保存（ログ偽装・実在しないIDでの量産） | 画面からタイトルを受け取らず、DBに実在する物件のときだけタイトルをDBから引いて記録 |
| Low | `mypage/page.tsx` | `getServerSession()` を `authOptions` 無しで呼び session コールバックが効いていない | `requireUser()` に統一 |

### 実際に検証したこと（証拠のあるもの）

| 項目 | 方法 | 結果 |
|---|---|---|
| 機械ゲート | `pnpm gate` を実行 | `tsc --noEmit` エラー0／`eslint .` エラー0（警告2は既存の `<img>`・**新規0**）／`node --test` **73件全通過**（+7件：`rateLimitPolicy.test.ts`） |
| マイグレーション | 開発用DB（Docker `morishita-dev-db`）へ `prisma migrate deploy` | `20260828010000_add_rate_limit` のみ適用。既存8件は適用済みのまま。エラー0 |
| レート制限の実挙動 | 開発用DBへ実 Prisma 経由で `bump("smoke:test", limit=5)` を7回 | `true×5 → false×2`。窓の勘定が想定どおり。検証行は削除して復帰 |
| レート制限の判定ロジック | `rateLimitPolicy.test.ts`（純関数）7ケース | 窓内で limit まで通す／超過は retryAfter つき拒否／拒否時はカウント据え置き・窓延長なし／窓切れで数え直し |

### まだ「否」／未対応で残っているもの

| 項目 | 理由・次にやること |
|---|---|
| 別セッションでの再検品 | 実装と同一セッションのため。チェックリスト上は不合格条件 |
| ローカル `next build` 未実施 | `.env.production.local` が本番Supabaseを指すため、静的生成が本番DBへ接続しうる。Vercel のビルドで確認する |
| 本番・開発DBへのマイグレーション適用 | `RateLimit` テーブルの追加。デプロイ手順は docs/releases.md の該当エントリ（O-03 の3点つき）。**未適用** |
| 会員登録の完全な非列挙 | 「常に成功扱い＋既存アドレスへ“登録の試みがありました”通知」に変えると自動ログイン導線（member/page.tsx）と両立しない。仕様判断待ち（TODO:未確認） |
| アカウントロックDoS の残余 | IP制限（失敗のみ）で緩和したが、多数のIPを使える攻撃者は依然、特定アカウントを5回失敗でロックできる。管理者への通知 or IPスコープのロックは follow-up |
| 本格的な CSP（script-src / style-src） | nonce 対応と画面ごとの動作確認が要る。公開前に別作業で対応 |
| 入力長上限の集約 | `name`/`tel` の上限が inquiry.ts・registerUser.ts・users.ts の3箇所にローカル定義（D-19）。共通化は follow-up（既存パターンに合わせて据え置き） |
| 画像アップロードのマジックバイト検証 | 拡張子＋Content-Type固定で実害は低いと判断し未対応 |
