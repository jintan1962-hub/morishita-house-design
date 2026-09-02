"use client";

import { signIn } from "next-auth/react";

/**
 * ログイン導線のボタン。signIn() がクライアント側APIのため切り出している。
 *
 * D-09：戻り先（callbackUrl）は必ず呼び出し側が指定する。省略できるようにすると、
 * NextAuth の既定（`?callbackUrl=` が無ければサイトのトップ）に落ちて、
 * ログインできたのに元の画面へ戻らない不具合になる。実際に一度そうなった
 * （docs/incidents.md 2026-08-31）ため、引数を必須にして型で防いでいる。
 *
 * 行き先が決まっていない導線（ヘッダーの「ログイン」など）は、押した人が
 * 管理者か会員か分からないので AFTER_LOGIN_PATH を渡すこと。
 */
export default function SignInButton({
  callbackUrl,
  children,
  className,
  style,
}: {
  /** ログイン後に開く自サイト内の絶対パス（`/admin` `/after-login` など）。 */
  callbackUrl: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button
      onClick={() => signIn(undefined, { callbackUrl })}
      className={className}
      style={style}
    >
      {children}
    </button>
  );
}
