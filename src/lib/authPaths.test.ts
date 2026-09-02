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

/**
 * D-06：`signInPath()` を通さず素の `/api/auth/signin` へリンクすると、
 * `?callbackUrl=` が付かず NextAuth がサイトのトップへ戻してしまう。
 * 型では防げない書き方なので、ソースを走査して見張る
 * （docs/incidents.md 2026-08-31 の再発防止）。
 */
test("素の /api/auth/signin へのリンクがソースに無い", async () => {
  const { readdirSync, readFileSync } = await import("node:fs");
  const { join } = await import("node:path");

  const offenders: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(path);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      // 行き先を組み立てる本体と、この試験自身は対象外。
      if (path.endsWith("authPaths.ts") || path.endsWith("authPaths.test.ts")) continue;
      for (const [i, line] of readFileSync(path, "utf8").split("\n").entries()) {
        // callbackUrl を伴わない `/api/auth/signin` の直書きだけを咎める。
        if (/["'`]\/api\/auth\/signin(?!\?)/.test(line)) {
          offenders.push(`${path}:${i + 1}`);
        }
      }
    }
  };
  walk("src");

  assert.deepEqual(offenders, []);
});
