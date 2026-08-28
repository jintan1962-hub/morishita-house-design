import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getServerSession } from "next-auth/next";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import {
  ROLE,
  USER_STATUS,
  MAX_FAILED_LOGIN_ATTEMPTS,
  LOGIN_LOCK_MINUTES,
  SESSION_MAX_AGE_SECONDS,
  RATE_LIMITS,
} from "@/config/security";
import { checkRateLimit, isRateLimited, ipBucket } from "@/lib/rateLimit";

/**
 * S-12：アカウント列挙（タイミング差）対策の当て馬ハッシュ。
 * 該当ユーザーが居ない／パスワード未設定でも、実在ユーザーと同じだけ bcrypt.compare を回す。
 * これは「存在しないユーザーの認証は必ず失敗する」ための固定値で、平文の中身に意味は無い。
 */
const DUMMY_PASSWORD_HASH =
  "$2b$10$yL2gd2rvLGJd5zOdUJ9WRue7d0i2sxaqn018k5lmTTNl3z6tFNTKi";

/**
 * S-01：シークレットにフォールバック値を置かない。
 * 以前は `process.env.NEXTAUTH_SECRET || "fallback-secret-for-demo-only"` となっており、
 * その固定値が public リポジトリに公開されていた（=誰でもセッションを偽造できる）。
 * 未設定なら起動を失敗させる。黙って弱い鍵で動くほうが危険。
 */
const secret = process.env.NEXTAUTH_SECRET;
if (!secret) {
  throw new Error(
    "NEXTAUTH_SECRET が設定されていません。.env（本番はホスティングの環境変数）に設定してください。"
  );
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    // S-12：セッションに有効期限を設ける
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        // S-12：アカウントロック（1アカウント狙い）とは別に、1つのIPからの
        // 総当たり・パスワードスプレーを止める。「失敗」だけを数えるので、
        // 共有回線（社内など）から正規の利用者が続けてログインしても影響しない。
        const failBucket = await ipBucket("loginfail");
        if (failBucket && (await isRateLimited(failBucket, RATE_LIMITS.loginFailPerIp))) {
          return null;
        }
        // このIPからの認証失敗を1つ記録して null を返す。
        const failAndReject = async (): Promise<null> => {
          if (failBucket) {
            await checkRateLimit(failBucket, RATE_LIMITS.loginFailPerIp);
          }
          return null;
        };

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        // 退会済み・停止中・パスワード未設定は認証しない。
        // どの理由で失敗したかは呼び出し元に伝えない（アカウントの存在を推測させないため）。
        // S-12：該当ユーザーが無い場合も、実在ユーザーと同じだけ bcrypt.compare を回して
        //       応答時間の差からアカウントの有無を推測されないようにする。
        if (
          !user ||
          !user.password ||
          user.deletedAt !== null ||
          user.status !== USER_STATUS.ACTIVE
        ) {
          await bcrypt.compare(credentials.password, DUMMY_PASSWORD_HASH);
          return failAndReject();
        }

        // S-12：ロック中は照合すらしない（が、当て馬の compare で時間だけ合わせる）
        if (user.lockedUntil && user.lockedUntil > new Date()) {
          await bcrypt.compare(credentials.password, DUMMY_PASSWORD_HASH);
          return failAndReject();
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          await failAndReject();
          // S-12：失敗回数を数え、上限に達したら一定時間ロックする
          const failedCount = user.failedLoginCount + 1;
          const shouldLock = failedCount >= MAX_FAILED_LOGIN_ATTEMPTS;
          await prisma.user.update({
            where: { id: user.id },
            data: {
              failedLoginCount: shouldLock ? 0 : failedCount,
              lockedUntil: shouldLock
                ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000)
                : user.lockedUntil,
            },
          });
          return null;
        }

        // 成功したらカウンタを戻す
        if (user.failedLoginCount !== 0 || user.lockedUntil !== null) {
          await prisma.user.update({
            where: { id: user.id },
            data: { failedLoginCount: 0, lockedUntil: null },
          });
        }

        return {
          id: user.id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  events: {
    async signIn(message) {
      try {
        const userId = parseInt(message.user.id);
        if (!isNaN(userId) && userId > 0) {
          await prisma.activityLog.create({
            data: {
              userId,
              action: "LOGIN",
              // S-09：ログインした事実だけ。個人情報は入れない
              details: "ログインしました",
            },
          });
        }
      } catch (e) {
        console.error("Failed to log activity:", e);
      }
    },
  },
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role ?? ROLE.USER;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        (session.user as SessionUser).id = token.id as string;
        (session.user as SessionUser).role = (token.role as string) ?? ROLE.USER;
      }
      return session;
    },
  },
  secret,
};

export type SessionUser = {
  id: string;
  role: string;
  name?: string | null;
  email?: string | null;
};

/** 認可の判定結果。呼び出し元は必ず ok を見てから処理する。 */
export type AuthResult =
  | { ok: true; userId: number; role: string; email: string }
  | { ok: false; reason: "UNAUTHENTICATED" | "FORBIDDEN" };

/**
 * S-07：ログイン済みであることをサーバー側で確認する。
 * セッションのIDを信用しきらず、DBの現在の状態（退会・停止）も見る。
 */
export async function requireUser(): Promise<AuthResult> {
  const session = await getServerSession(authOptions);
  const rawId = (session?.user as SessionUser | undefined)?.id;
  if (!rawId) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  const userId = parseInt(rawId);
  if (isNaN(userId) || userId <= 0) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  // 権限やアカウント状態はセッション発行後に変わりうるので、毎回DBで確認する。
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, email: true, status: true, deletedAt: true },
  });

  if (!user || user.deletedAt !== null || user.status !== USER_STATUS.ACTIVE) {
    return { ok: false, reason: "UNAUTHENTICATED" };
  }

  return { ok: true, userId: user.id, role: user.role, email: user.email };
}

/**
 * S-07：管理者であることをサーバー側で確認する。
 * 画面にメニューを出さないことは権限制御ではない。データを返す側で毎回これを呼ぶ。
 */
export async function requireAdmin(): Promise<AuthResult> {
  const result = await requireUser();
  if (!result.ok) {
    return result;
  }
  if (result.role !== ROLE.ADMIN) {
    return { ok: false, reason: "FORBIDDEN" };
  }
  return result;
}

/** 画面に出してよい、当たり障りのないメッセージ（D-07：内部情報を見せない）。 */
export function authErrorMessage(reason: "UNAUTHENTICATED" | "FORBIDDEN"): string {
  return reason === "UNAUTHENTICATED"
    ? "ログインが必要です。"
    : "この操作を行う権限がありません。";
}

