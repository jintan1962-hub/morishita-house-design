import { test } from "node:test";
import assert from "node:assert/strict";
import { signInPath, AFTER_LOGIN_PATH } from "./authPaths.ts";

/**
 * D-06：ログイン後の戻り先が付かないと、NextAuth はトップへ戻してしまう。
 * 「?callbackUrl= が確かに付く」ことを機械で見張る。
 */

test("戻り先が callbackUrl として付く", () => {
  assert.equal(signInPath("/admin"), "/api/auth/signin?callbackUrl=%2Fadmin");
});

test("スラッシュを含むパスもそのまま復元できる形でエスケープされる", () => {
  const url = new URL(signInPath("/mypage/edit"), "https://example.invalid");
  assert.equal(url.searchParams.get("callbackUrl"), "/mypage/edit");
});

test("クエリ付きの戻り先が途中で切れない", () => {
  const url = new URL(
    signInPath("/properties?city=佐久市&page=2"),
    "https://example.invalid"
  );
  assert.equal(url.searchParams.get("callbackUrl"), "/properties?city=佐久市&page=2");
});

test("ログイン後の中継地点を戻り先にできる", () => {
  const url = new URL(signInPath(AFTER_LOGIN_PATH), "https://example.invalid");
  assert.equal(url.searchParams.get("callbackUrl"), "/after-login");
});
