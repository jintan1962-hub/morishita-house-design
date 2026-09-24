#!/bin/sh
# Supabase へのマイグレーション適用。
#
# O-04：本番への適用は人間が実行する。このスクリプトは「人が実行する道具」であって、
#       AIが代わりに走らせるものではない。
# S-03：接続情報は .env.migrate から読み、画面には一切表示しない。
#
# 使い方:
#   1. .env.migrate を作り、Supabase の接続文字列2行を書く
#   2. sh migrate-supabase.sh
#   3. 終わったら rm .env.migrate

set -e
cd "$(dirname "$0")"

if [ ! -f .env.migrate ]; then
  echo "❌ .env.migrate がありません。"
  echo ""
  echo "   Supabase の Connect → ORMs → Prisma に出ている2行をそのまま貼り、"
  echo "   [YOUR-PASSWORD] だけを実際のパスワードに置き換えて保存してください。"
  echo ""
  echo "   例（値は各自のもの）:"
  echo '   DATABASE_URL="postgresql://postgres.<プロジェクトID>:<パスワード>@<ホスト>/postgres?pgbouncer=true"'
  echo '   DIRECT_URL="postgresql://postgres.<プロジェクトID>:<パスワード>@<ホスト>/postgres"'
  exit 1
fi

# .env.migrate を読み込む（このシェル内だけ。画面には出さない）
set -a
. ./.env.migrate
set +a

if [ -z "$DIRECT_URL" ] || [ -z "$DATABASE_URL" ]; then
  echo "❌ .env.migrate に DATABASE_URL と DIRECT_URL の両方が必要です。"
  exit 1
fi

# パスワードを伏せた形で接続先を表示
SAFE=$(printf '%s' "$DIRECT_URL" | sed -E 's#://([^:]*):[^@]*@#://\1:********@#')
echo "接続先: $SAFE"
echo ""

echo "── 1. 接続確認 ──────────────────────────"
# D-07：エラーを握り潰さない。実際のメッセージをそのまま出す。
#       パスワードは含まれない（Prismaはホスト名までしか出さない）。
# set -e が効いているため、失敗した時点でここを抜けてしまい、
# 下の原因案内が表示されなかった。判定するあいだだけ一時的に外す。
set +e
ERR=$(npx --yes prisma db execute --url "$DIRECT_URL" --stdin <<'SQL' 2>&1
SELECT 1;
SQL
)
RC=$?
set -e
if [ $RC -eq 0 ]; then
  echo "✅ 接続できました"
else
  echo "❌ 接続できませんでした。実際のエラー:"
  echo "----------------------------------------"
  echo "$ERR" | sed -E 's#://([^:]*):[^@]*@#://\1:********@#'
  echo "----------------------------------------"
  echo ""
  echo "   よくある原因:"
  echo "   ・パスワードを再発行した後、古いパスワードのまま実行している"
  echo "   ・再発行直後（反映まで10〜30秒かかることがあります）"
  echo "   ・[YOUR-PASSWORD] を置き換え忘れている"
  echo ""
  echo "   Supabase → Project Settings → Database → Reset database password で"
  echo "   英数字だけのパスワードを再発行し、その場で .env.migrate に書いてください。"
  exit 1
fi

echo ""
echo "── 2. マイグレーション適用 ──────────────"
npx prisma migrate deploy

echo ""
echo "── 3. できたテーブルの確認 ──────────────"
npx --yes prisma db execute --url "$DIRECT_URL" --stdin <<'SQL' || true
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
SQL

echo ""
echo "✅ 完了しました。"
echo "   Supabase の Table Editor に次の8つが並んでいれば成功です:"
echo "   ActivityLog / Inquiry / MailLog / Property / PropertyImage /"
echo "   PropertyImportBackup / SystemSetting / User"
echo ""
echo "⚠️  終わったら接続情報を消してください:  rm .env.migrate"
