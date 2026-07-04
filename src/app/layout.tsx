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
      <body>{children}</body>
    </html>
  );
}
