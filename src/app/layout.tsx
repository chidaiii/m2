import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "motion×music col.",
  description: "モーショングラフィックス特化の動画ギャラリー",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=DotGothic16&family=Inter:wght@400;700&family=Noto+Sans+JP:wght@100..900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
