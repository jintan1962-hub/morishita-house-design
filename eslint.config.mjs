import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  {
    ignores: [
      // Prisma が自動生成するコード。人が書いたものではないので対象外。
      "src/generated/**",
      ".next/**",
      "node_modules/**",
      "next-env.d.ts",

      // 本番DBへ直接つなぐ使い捨てスクリプト群は 2026-08-18 に削除済み
      // （verify-users.js / test-user-db.js / check-lib.js / update_layout.js /
      //   generate_member.js / prisma/seed.js。docs/debt.md 参照）。

      // 静的HTMLに同梱されている配布用スクリプト（外部制作物）。
      "public/assets/js/**",
    ],
  },
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
