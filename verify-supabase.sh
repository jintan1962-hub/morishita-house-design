#!/bin/sh
# Supabase の状態確認（読み取り専用。何も変更しない）。
# 接続情報は .env.migrate から読み、画面には伏せ字でしか出さない。
set -e
cd "$(dirname "$0")"

[ -f .env.migrate ] || { echo "❌ .env.migrate がありません"; exit 1; }
set -a; . ./.env.migrate; set +a

MASK='s#://([^:]*):[^@]*@#://\1:********@#'
echo "接続先: $(printf '%s' "$DIRECT_URL" | sed -E "$MASK")"
echo ""

echo "── 現在のテーブル ────────────────────────"
npx --yes prisma db execute --url "$DIRECT_URL" --stdin 2>&1 <<'SQL' | sed -E "$MASK"
SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY tablename;
SQL

echo ""
echo "── Prismaが記録しているマイグレーション ──"
npx prisma migrate status 2>&1 | sed -E "$MASK" || true

echo ""
echo "── 接続先のデータベース名 ────────────────"
npx --yes prisma db execute --url "$DIRECT_URL" --stdin 2>&1 <<'SQL' | sed -E "$MASK"
SELECT current_database(), current_user, current_schema();
SQL
