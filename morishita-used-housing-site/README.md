# 中古住宅×リノベーション RENOEL

## 1. システム概要
本システムは「中古住宅×リノベーション RENOEL」の物件掲載、会員管理、および問い合わせ管理を行うための Next.js 製サイトです。
詳細な仕様については、[SYSTEM_SPEC.md](SYSTEM_SPEC.md) を参照してください。

## 2. インフラ構成
- **フロントエンド / バックエンド**: Vercel
- **データベース**: Supabase (PostgreSQL)
- **メール送信**: Resend（REST API を fetch で直接呼ぶ。SDKは使わない）

## 3. 緊急連絡先
システム停止等の緊急時には、以下の窓口へ連絡してください。

【要記入】
- 一次連絡先：
- 二次連絡先：
- 初報の期限：

## 4. 復旧手順
【要記入】

## 5. 開発の始め方

ローカル開発は**本番のSupabaseを使わず、手元のPostgresで動かす**（O-01：環境を分ける）。

```bash
# 1. 依存の取得
pnpm install

# 2. 開発用DBを起動（Docker）
#    初回のみ：このプロジェクト専用のコンテナを作成する。
#    パスワードは手元だけで使う適当な文字列にし、.env.local にだけ書く（S-01）。
#    ポート5434・ボリューム morishita-dev-db-data は、RENOEL版（renoel-dev-db／5433）と
#    ぶつからないように分けてある。同じDBを2つのサイトで共有しない。
#    手元だけで使うランダムな文字列を作り、シェル変数に入れる（画面にも履歴にも残さない）
read -rs DBPW && export DBPW
docker run -d --name morishita-dev-db \
  -e POSTGRES_USER=morishita -e POSTGRES_DB=morishita_dev \
  -e POSTGRES_PASSWORD="$DBPW" \
  -p 5434:5432 -v morishita-dev-db-data:/var/lib/postgresql/data postgres:16-alpine
#    2回目以降： pnpm db:up  （停止は pnpm db:down）

# 3. .env.local を用意（本番の値は絶対に書かない。コミットもされない）
#    DATABASE_URL / DIRECT_URL は上のコンテナを指す
#      ユーザー morishita / ホスト localhost / ポート 5434 / DB名 morishita_dev
#      認証部分には上で決めた文字列を入れる
#    NEXTAUTH_SECRET はローカル専用の適当な文字列でよい

# 4. スキーマを流し、動作確認用データを入れる
pnpm exec prisma migrate deploy
pnpm seed:dev

# 5. 起動
pnpm dev          # http://localhost:3000
```

### 動作確認用のログイン（開発用DBにのみ存在する架空アカウント）

| 権限 | メールアドレス | パスワード |
|---|---|---|
| 管理者 | `admin@example.invalid` | `devpassword123` |
| 一般会員 | `member@example.invalid` | `devpassword123` |

管理画面 `/admin` は**管理者のみ**。一般会員でアクセスするとトップへ戻される。
ログインを5回続けて失敗するとそのアカウントは15分ロックされる（S-12）。解除は
`UPDATE "User" SET "failedLoginCount"=0, "lockedUntil"=NULL WHERE email='...';`

### メール送信について

送信基盤は [Resend](https://resend.com)。`src/lib/mail.ts` が REST API を fetch で呼ぶ。

**ローカルでは `RESEND_API_KEY` を設定しない。** 未設定のとき、送信は行わず
本文がサーバーのコンソールに出る。ただし結果は「失敗」として `MailLog` に記録される
（`/admin/mail-logs` で確認できる）。これは意図した挙動で、
**本番で設定を入れ忘れたときに黙って届かなくなるのを防ぐため**にこうしている。

実際に届かせるには次の3つが揃っている必要がある。1つでも欠けると `/admin/mail-logs` に理由が残る。

| 環境変数 | 役割 | 欠けたときの記録 |
|---|---|---|
| `RESEND_API_KEY` | Resend の APIキー | 「RESEND_API_KEY が未設定です」 |
| `MAIL_FROM_ADDRESS` | 差出人。**Resendで認証済みのドメイン**であること | Resend が from を拒否し `HTTP 403` 系 |
| `MAIL_ADMIN_ADDRESS` | 管理者への通知先 | 「MAIL_ADMIN_ADDRESS が未設定です」（本人宛は届く） |

メールを止めたいときは `SystemSetting` の `MAIL_SENDING_ENABLED` を `false` にする（O-05）。
止めた分も「未送信」として記録されるので、止めていたこと自体が後から分かる。

メールの文面を直す場所は `src/lib/mailPayload.ts` の1箇所。直したら `pnpm test` を通すこと。

### コミット前に通すもの（D-05）

```bash
pnpm gate         # typecheck && lint && test
```

初回のみ、秘密情報スキャンのフックを有効にする：

```bash
git config core.hooksPath .githooks
```

## 6. 環境変数
`.env` ファイルに以下のキーを設定してください。値については管理者に確認してください。

- `DATABASE_URL`
- `DIRECT_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`

## 7. 開発ルール
- `~/Desktop/システム開発マスタールール/v2/` に規定されている各ルールを遵守してください。
- 開発作業を開始する前に、必ず `CLAUDE.md` を一読してください。
