# 中古住宅×リノベーション RENOEL

## 1. システム概要
本システムは「中古住宅×リノベーション RENOEL」の物件掲載、会員管理、および問い合わせ管理を行うための Next.js 製サイトです。
詳細な仕様については、[SYSTEM_SPEC.md](SYSTEM_SPEC.md) を参照してください。

## 2. インフラ構成
- **フロントエンド / バックエンド**: Vercel
- **データベース**: Supabase (PostgreSQL)
- **メール送信**: SMTP (nodemailer)

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
#    初回のみ：コンテナを作成する
docker run -d --name renoel-dev-db \
  -e POSTGRES_PASSWORD=localdevonly -e POSTGRES_USER=renoel -e POSTGRES_DB=renoel_dev \
  -p 5433:5432 postgres:16-alpine
#    2回目以降： pnpm db:up  （停止は pnpm db:down）

# 3. .env.local を用意（本番の値は絶対に書かない。コミットもされない）
#    DATABASE_URL / DIRECT_URL は上のコンテナを指す
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

`.env.local` に `SMTP_*` を書かない限り、nodemailer の ethereal テスト送信になり、
**実在の宛先へは飛ばない**。送信内容はサーバーログのプレビューURLで確認できる。

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
