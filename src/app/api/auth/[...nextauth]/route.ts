import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// 設定の実体は src/lib/auth.ts にある。
// D-20：認証の設定を複数箇所に持たせない。ルートは NextAuth に渡すだけ。
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
