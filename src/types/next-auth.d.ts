import "next-auth";
import "next-auth/jwt";

// NextAuth の User / Session に role を持たせるための型拡張。
// これが無いと authOptions のコールバックで role が型エラーになる。
declare module "next-auth" {
  interface User {
    role?: string;
  }

  interface Session {
    user?: {
      id?: string;
      role?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: string;
  }
}
