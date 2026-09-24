-- 物件管理番号を integer から bigint へ広げる。
--
-- athome / ATBB の物件番号は10桁（例: 6991580385）で、
-- PostgreSQL の integer の上限 2,147,483,647 を超えるため格納できなかった。
-- 取込時にトランザクションの中で失敗し、1件も入らない状態になる。
--
-- bigint への拡大は既存の値を保ったまま行える（縮小と違いデータ損失がない）。
-- 一意制約とインデックスは列の型変更に追従するため、張り直しは不要。

ALTER TABLE "Property" ALTER COLUMN "objMngNo" TYPE BIGINT;
