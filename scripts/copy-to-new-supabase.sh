#!/usr/bin/env bash
#
# 旧 Supabase（.env.production.local）→ 新 Supabase（.env.new-supabase）へ移す（2026-09-28）
#
# 【このスクリプトがすること】
#   1. 新DBへの接続確認と、新DBが空であることの確認（空でなければ中止）
#   2. 新DBへマイグレーションを適用（prisma migrate deploy）
#   3. 旧DBのデータを新DBへ複製（1トランザクション。失敗したら何も入らない）
#      _prisma_migrations は 2 で作られるので除外。RateLimit は一時データなので除外。
#   4. 旧新の行数を突き合わせる
#   5. Storage バケット property-images を作る（公開・5MB・jpeg/png/webp。旧と同じ設定）
#
# 【O-04／S-01】本番DBへの書き込みなので実行は大野が行う。接続情報は画面に出さない。
#
# 使い方:
#   1. .env.new-supabase を作り、新プロジェクトの値を3行書く
#        DATABASE_URL="…pooler.supabase.com:6543/postgres?pgbouncer=true"  （Connect → ORMs → Prisma）
#        SUPABASE_URL="https://ytdbblwptmhqdxtvaynr.supabase.co"
#        SUPABASE_SERVICE_ROLE_KEY="…"                                        （Project Settings → API Keys）
#   2. bash scripts/copy-to-new-supabase.sh
#
set -euo pipefail
cd "$(dirname "$0")/.."

OLD=.env.production.local
NEW=.env.new-supabase
PGBIN=/usr/local/opt/libpq/bin

for f in "$OLD" "$NEW"; do
  [ -f "$f" ] || { echo "中止: $f が無い" >&2; exit 1; }
done
[ -x "$PGBIN/pg_dump" ] || { echo "中止: pg_dump が無い（brew install libpq）" >&2; exit 1; }

get() { sed -n "s/^$2=//p" "$1" | head -1 | tr -d '\r' | sed -E 's/^"//; s/"$//'; }
# トランザクションプーラー(6543) → セッションプーラー(5432)。直結ホストは IPv6 のみのため使わない。
session() { printf '%s' "$1" | sed -E 's/:6543/:5432/; s/[?&]pgbouncer=true//'; }
mask() { sed -E 's#://([^:]*):[^@]*@#://\1:****@#g'; }

OLD_URL=$(session "$(get "$OLD" DATABASE_URL)")
NEW_POOL=$(get "$NEW" DATABASE_URL)
NEW_URL=$(session "$NEW_POOL")
NEW_API=$(get "$NEW" SUPABASE_URL)
NEW_KEY=$(get "$NEW" SUPABASE_SERVICE_ROLE_KEY)

for v in NEW_POOL NEW_API NEW_KEY; do
  [ -n "${!v}" ] || { echo "中止: $NEW の値が足りない（DATABASE_URL / SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY）" >&2; exit 1; }
  case "${!v}" in *"<"*|*YOUR-PASSWORD*) echo "中止: $NEW に書き換えていない箇所が残っている" >&2; exit 1;; esac
done
case "$NEW_POOL" in *ytdbblwptmhqdxtvaynr*) ;; *) echo "中止: $NEW の DATABASE_URL が新プロジェクト(ytdbblwptmhqdxtvaynr)ではない" >&2; exit 1;; esac
case "$NEW_API"  in *ytdbblwptmhqdxtvaynr*) ;; *) echo "中止: $NEW の SUPABASE_URL が新プロジェクトではない" >&2; exit 1;; esac

# DIRECT_URL と バケット名を補う（Vercel 登録と検品スクリプトが読む）
grep -q '^DIRECT_URL=' "$NEW" || printf 'DIRECT_URL="%s"\n' "$NEW_URL" >> "$NEW"
grep -q '^SUPABASE_STORAGE_BUCKET=' "$NEW" || printf 'SUPABASE_STORAGE_BUCKET="property-images"\n' >> "$NEW"

echo "旧: $(printf '%s' "$OLD_URL" | mask)"
echo "新: $(printf '%s' "$NEW_URL" | mask)"

echo; echo "== 1. 接続確認と空であることの確認 =="
N=$("$PGBIN/psql" "$NEW_URL" -XAtq -c "SELECT count(*) FROM pg_tables WHERE schemaname='public'" 2>&1 | mask) \
  || { echo "接続失敗: $N"; exit 1; }
if [ "$N" != "0" ]; then
  # 再開：マイグレーション済みでも、データ行が無い（初期値の SystemSetting 1行のみ）なら続行する
  ROWS=$("$PGBIN/psql" "$NEW_URL" -XAtq -c 'SELECT (SELECT count(*) FROM "User")+(SELECT count(*) FROM "Property")+(SELECT count(*) FROM "ActivityLog")+(SELECT count(*) FROM "MailLog")+(SELECT count(*) FROM "PropertyImportBackup")' 2>&1) \
    || { echo "中止: 新DBの public に既にテーブルが $N 個あり、中身を確認できない。"; exit 1; }
  [ "$ROWS" = "0" ] || { echo "中止: 新DBに既にデータが $ROWS 行ある。二重投入を防ぐため止める。"; exit 1; }
  echo "  接続OK・テーブルはあるがデータは空（前回の続きから再開）"
else
  echo "  接続OK・public は空"
fi

echo; echo "== 2. マイグレーション適用 =="
DATABASE_URL="$NEW_URL" DIRECT_URL="$NEW_URL" npx prisma migrate deploy 2>&1 | mask | tail -6

echo; echo "== 3. データ複製 =="
# マイグレーション 20260818020000 が SystemSetting に初期値を1行入れるため、旧DBの値と衝突する。
# 旧DBの値を正とし、同じトランザクション内でその1行だけ消してから流し込む。
{ echo "DELETE FROM public.\"SystemSetting\" WHERE key = 'MAIL_SENDING_ENABLED';"
  "$PGBIN/pg_dump" "$OLD_URL" --data-only --schema=public \
  --exclude-table='public._prisma_migrations' --exclude-table-data='public."RateLimit"' \
  --no-owner --no-privileges; } \
| "$PGBIN/psql" "$NEW_URL" -Xq --single-transaction -v ON_ERROR_STOP=1 >/dev/null
echo "  完了"

echo; echo "== 4. 行数の突き合わせ =="
Q="SELECT string_agg(t, ' ' ORDER BY t) FROM (SELECT format('%s=%s', c.relname,
   (xpath('/row/n/text()', query_to_xml(format('SELECT count(*) n FROM public.%I', c.relname), false, true, '')))[1]::text) t
   FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
   WHERE n.nspname='public' AND c.relkind='r' AND c.relname NOT IN ('_prisma_migrations','RateLimit')) s"
A=$("$PGBIN/psql" "$OLD_URL" -XAtq -c "$Q"); B=$("$PGBIN/psql" "$NEW_URL" -XAtq -c "$Q")
printf '  %-24s %6s %6s\n' テーブル 旧 新
paste <(tr ' ' '\n' <<<"$A") <(tr ' ' '\n' <<<"$B") | while IFS=$'\t' read -r a b; do
  mark=$([ "${a#*=}" = "${b#*=}" ] && [ "${a%%=*}" = "${b%%=*}" ] && echo 一致 || echo ★不一致)
  printf '  %-24s %6s %6s  %s\n' "${a%%=*}" "${a#*=}" "${b#*=}" "$mark"
done

echo; echo "== 5. Storage バケット作成 =="
CODE=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$NEW_API/storage/v1/bucket" \
  -H "Authorization: Bearer $NEW_KEY" -H "apikey: $NEW_KEY" -H 'Content-Type: application/json' \
  -d '{"id":"property-images","name":"property-images","public":true,"file_size_limit":5242880,"allowed_mime_types":["image/jpeg","image/png","image/webp"]}')
echo "  HTTP ${CODE}（200=作成 / 400・409=既に有る）"

unset OLD_URL NEW_POOL NEW_URL NEW_KEY
echo; echo "終わったら Claude に「コピーした」と伝えてください。"
