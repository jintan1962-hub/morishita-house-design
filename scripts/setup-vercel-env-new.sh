#!/usr/bin/env bash
#
# 新 Vercel（jintan1962-hub/morishita-house-design）へ環境変数を入れる（2026-09-28）
#
# 前提: vercel login 済みで、このディレクトリが morishita-house-design に link 済み。
#       .env.new-supabase は scripts/copy-to-new-supabase.sh を通したもの（DIRECT_URL 補完済み）。
#
# 【S-01】値は標準出力に出さない。実行は大野が行う。
# 【Production のみ】Preview に本番DBを向けないため（旧プロジェクトと同じ方針）。
#
# 使い方:  bash scripts/setup-vercel-env-new.sh https://<本番URL>
#
set -u
cd "$(dirname "$0")/.." || exit 1
ENVFILE=".env.new-supabase"
SITE_URL="${1:-}"

[ -f "$ENVFILE" ] || { echo "中止: $ENVFILE が無い" >&2; exit 1; }
case "$SITE_URL" in https://*) ;; *) echo "中止: 引数に本番URL（https://…）を渡す" >&2; exit 1;; esac
grep -q '"projectName":"morishita-house-design"' .vercel/project.json 2>/dev/null \
  || { echo "中止: .vercel が morishita-house-design に link されていない" >&2; exit 1; }

add() { # add KEY [--no-sensitive]  値は stdin
  if vercel env add "$1" production --force ${2:-} >/dev/null 2>&1; then printf '  %-28s 登録\n' "$1"
  else printf '  %-28s ★失敗\n' "$1"; fi
}

echo "== 接続情報（Production・Sensitive） =="
for k in DATABASE_URL DIRECT_URL SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_STORAGE_BUCKET; do
  val=$(sed -n "s/^${k}=//p" "$ENVFILE" | head -1 | tr -d '\r'); val=${val#\"}; val=${val%\"}
  [ -n "$val" ] || { printf '  %-28s ★中止: 値が無い\n' "$k"; exit 1; }
  printf '%s' "$val" | add "$k" --sensitive
  unset val
done

echo; echo "== NEXTAUTH_SECRET（新規生成・値は表示しない） =="
openssl rand -base64 32 | tr -d '\n' | add NEXTAUTH_SECRET --sensitive

echo; echo "== サイトURL =="
printf '%s' "$SITE_URL" | add NEXTAUTH_URL --sensitive
# NEXT_PUBLIC_* は Sensitive にできない（invalid_visibility で弾かれる）
printf '%s' "$SITE_URL" | add NEXT_PUBLIC_SITE_ORIGIN --no-sensitive

echo; echo "== 結果 =="
vercel env ls production 2>/dev/null | sed -n '4,30p'
echo; echo "終わったら Claude に「環境変数を入れた」と伝えてください。"
