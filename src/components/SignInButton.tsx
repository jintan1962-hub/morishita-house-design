"use client";

import { signIn } from "next-auth/react";

/** ログイン導線のボタン。signIn() がクライアント側APIのため切り出している。 */
export default function SignInButton({
  children,
  className,
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <button onClick={() => signIn()} className={className} style={style}>
      {children}
    </button>
  );
}
