import type { Metadata } from "next";
import { Noto_Sans_JP, Outfit } from "next/font/google";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-jp",
});

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Studio AI — スマホ写真1枚で証明写真からコンセプト写真まで",
  description:
    "スタジオ予約不要で30秒で完成！履歴書用証明写真、パスポート、ビジネスプロフィール、サロンモデル風写真、カスタムコンセプト写真までスマホ写真1枚で完成し、印刷用シートでそのまま印刷できます。",
  manifest: "/manifest.json",
};

import { Analytics } from "@vercel/analytics/next";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${notoSansJp.variable} ${outfit.variable} font-sans antialiased`}
      >
        {children}
        <Analytics />
      </body>
    </html>
  );
}
