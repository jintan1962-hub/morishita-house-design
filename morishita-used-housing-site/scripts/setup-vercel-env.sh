#!/usr/bin/env bash
#
# Vercel の環境変数を作り直す（2026-08-25）
#
# 【なぜ必要か】
# .env.example をそのまま Vercel の一括インポートに貼ったため、17キーが
# 「キーだけ・値は空」で登録された。NEXTAUTH_SECRET が空のためビルドが落ちる。
#   Error: NEXTAUTH_SECRET が設定されていません。
#
# 【このスクリプトがすること】
#   1. 空で作られたキーを削除する（値が空なので失う情報は無い）
#   2. .env.production.local の実値を Vercel へ流し込む（画面に値を出さない）
#   3. NEXTAUTH_SECRET をこの場で生成して登録する（生成値は表示しない）
#   4. NEXTAUTH_URL / NEXT_PUBLIC_SITE_ORIGIN を本番URLで登録する
#
# 【S-01】値は一切標準出力に出さない。AIに値が渡らないよう、実行は大野が行う。
#
# 【Production のみに入れる理由】
# 手順書は Production/Preview 両方としているが、Preview に本番DBの接続情報を
# 入れるとブランチのプレビューが本番DBに書き込める。本番DBは実データが入る前提なので
# Production だけにする。Preview が必要になったら、別のSupabaseプロジェクトを
# 用意してから入れること。
#
# 使い方:  bash scripts/setup-vercel-env.sh
#
set -u

cd "$(dirname "$0")/.." || exit 1
ENVFILE=".env.production.local"
SITE_URL="https://morishita-used-housing-site-o-dec4.vercel.app"

if [ ! -f "$ENVFILE" ]; then
  echo "中止: $ENVFILE が見つからない" >&2
  exit 1
fi

# ---- 1. 空で作られたキーを削除 ----------------------------------------
echo "== 空キーの削除 =="
for k in \
  DATABASE_URL DIRECT_URL \
  SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_STORAGE_BUCKET \
  NEXTAUTH_SECRET NEXTAUTH_URL NEXT_PUBLIC_SITE_ORIGIN \
  RESEND_API_KEY MAIL_FROM_ADDRESS MAIL_ADMIN_ADDRESS MAIL_SENDING_DISABLED \
  NEXT_PUBLIC_GA4_ID NEXT_PUBLIC_GOOGLE_ADS_ID NEXT_PUBLIC_CLARITY_ID NEXT_PUBLIC_META_PIXEL_ID \
  SEED_PASSWORD
do
  if vercel env rm "$k" --yes >/dev/null 2>&1; then
    printf '  %-28s 削除\n' "$k"
  else
    printf '  %-28s （無し／削除不要）\n' "$k"
  fi
done

# ---- 2. 接続情報を流し込む --------------------------------------------
# 値は変数に入れるだけで、決して echo しない。
echo
echo "== 接続情報の登録（Production） =="
for k in DATABASE_URL DIRECT_URL SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY SUPABASE_STORAGE_BUCKET; do
  val=$(sed -n "s/^${k}=//p" "$ENVFILE" | head -1 | tr -d '\r')
  val=${val#\"}; val=${val%\"}
  if [ -z "$val" ]; then
    printf '  %-28s ★中止: %s に値が無い\n' "$k" "$ENVFILE"
    exit 1
  fi
  if printf '%s' "$val" | vercel env add "$k" production >/dev/null 2>&1; then
    printf '  %-28s 登録（%s文字）\n' "$k" "${#val}"
  else
    printf '  %-28s ★失敗\n' "$k"
  fi
  unset val
done

# ---- 3. NEXTAUTH_SECRET を生成して登録 --------------------------------
# openssl が生成した値をパイプで直接渡す。画面にもログにも出さない。
echo
echo "== NEXTAUTH_SECRET の生成と登録（Production） =="
if openssl rand -base64 32 | tr -d '\n' | vercel env add NEXTAUTH_SECRET production >/dev/null 2>&1; then
  echo "  NEXTAUTH_SECRET              生成して登録（値は表示していない）"
else
  echo "  NEXTAUTH_SECRET              ★失敗"
fi

# ---- 4. URL（秘密ではない） -------------------------------------------
echo
echo "== サイトURLの登録（Production） =="
for k in NEXTAUTH_URL NEXT_PUBLIC_SITE_ORIGIN; do
  if printf '%s' "$SITE_URL" | vercel env add "$k" production >/dev/null 2>&1; then
    printf '  %-28s %s\n' "$k" "$SITE_URL"
  else
    printf '  %-28s ★失敗\n' "$k"
  fi
done

echo
echo "== 結果 =="
vercel env ls production 2>/dev/null | sed -n '4,30p'
echo
echo "終わったら Claude に「環境変数を入れ直した」と伝えてください。"
echo "メール（RESEND_API_KEY / MAIL_FROM_ADDRESS / MAIL_ADMIN_ADDRESS）と"
echo "計測タグは未登録のままです。未設定でもサイトは動きます。"
