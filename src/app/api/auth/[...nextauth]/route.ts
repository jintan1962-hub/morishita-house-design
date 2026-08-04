import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Mock Credentials",
      credentials: {
        email: { label: "Email", type: "text", placeholder: "user@example.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials, req) {
        // デモ用のため、特定のメールとパスワードでログインを許可する
        if (credentials?.email === "user@example.com" && credentials?.password === "password") {
          return { id: "1", name: "テスト会員", email: "user@example.com" };
        }
        return null;
      }
    })
  ],
  pages: {
    // カスタムログインページを指定する場合はここに設定 (今回はNextAuthデフォルトを使用)
    // signIn: '/login', 
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-demo-only",
});

export { handler as GET, handler as POST };
