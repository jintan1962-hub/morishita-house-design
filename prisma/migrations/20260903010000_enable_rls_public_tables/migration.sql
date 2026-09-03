-- 2026-09-03 Supabase のセキュリティ警告（rls_disabled_in_public / sensitive_columns_exposed）への是正。
--
-- 【何が起きていたか】
-- Supabase は public スキーマを PostgREST（https://<ref>.supabase.co/rest/v1/）で常時公開し、
-- 新しいテーブルに anon / authenticated ロールの権限を既定で付ける。
-- このプロジェクトのテーブルは Prisma のマイグレーションで作ったため RLS が無効のままで、
-- anon キーを持つ相手は User.password などを含む全行を読み書きできる状態だった。
--
-- 【この修正でやること】2段構え。どちらか一方が破られても止まるようにする。
--   1. public の全テーブルで RLS を有効にする。ポリシーを1つも作らないので既定は全拒否。
--   2. anon / authenticated からテーブル権限そのものを取り上げる。
--      併せて既定権限も変え、今後 Prisma が作るテーブルに権限が付かないようにする。
--
-- 【アプリが壊れない理由】
-- アプリの読み書きは Prisma が DATABASE_URL（postgres ロール）で行う。
-- postgres はテーブルの所有者なので RLS を素通りする（FORCE ROW LEVEL SECURITY は付けない）。
-- anon / authenticated はこのアプリのどこからも使っていない（@supabase/supabase-js 未導入・
-- anon キーは環境変数にも配信物にも存在しない）。画像保管の Supabase Storage は
-- service_role キーでサーバーからのみ呼ぶため、ここで触る public スキーマの権限とは無関係。
--
-- 【戻し方】この修正を取り消すなら各テーブルに
--   ALTER TABLE "<名前>" DISABLE ROW LEVEL SECURITY;
-- を実行する。データは変えていない。

-- 1. RLS を有効にする（public の実テーブルすべて。_prisma_migrations を含む）
DO $$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.oid::regclass AS rel
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
  LOOP
    EXECUTE format('ALTER TABLE %s ENABLE ROW LEVEL SECURITY', t.rel);
  END LOOP;
END $$;

-- 2. 公開ロールから権限を取り上げる
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
REVOKE USAGE ON SCHEMA public FROM anon, authenticated;

-- 3. 今後 postgres が作るテーブルにも権限が付かないようにする
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;
