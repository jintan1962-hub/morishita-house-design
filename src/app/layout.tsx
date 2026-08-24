import type { Metadata } from "next";
import AuthProvider from "@/components/AuthProvider";
import { COMPANY } from "@/config/company";

export const metadata: Metadata = {
  title: {
    default: `中古住宅専門店 ${COMPANY.shortName}｜${COMPANY.areaLabel}`,
    template: `%s｜${COMPANY.shortName}`,
  },
  description:
    `${COMPANY.areaLabel}の中古住宅・中古マンション・土地を扱う中古住宅専門店。` +
    "会員登録で、一般に公開していない物件情報までご覧いただけます。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // 書体は globals.css の --serif / --sans（游明朝体・游ゴシック体）で指定する。
    // 以前はここで Geist（欧文フォント）を読み込んでいたが、日本語には効かず
    // 読み込み分だけ遅くなっていたため外した。
    <html lang="ja">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
