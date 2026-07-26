import type { Metadata } from "next";
import { Inter, DotGothic16 } from "next/font/google";
import "@/app/globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-inter",
});

const dotGothic16 = DotGothic16({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dotgothic16",
});

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
    <html lang="ja" className={`${inter.variable} ${dotGothic16.variable}`}>
      <body>{children}</body>
    </html>
  );
}
