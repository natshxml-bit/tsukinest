import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TsukiNest - Baca Manhwa Bahasa Indonesia",
  description: "Platform baca manhwa terupdate dan terlengkap",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6496949565578713"
          crossOrigin="anonymous"
        ></script>
      </head>
      <body className={`${inter.className} bg-gray-950`}>
        <div className="max-w-md mx-auto min-h-screen bg-gray-950 shadow-xl shadow-black/40">
          {children}
        </div>
        <BottomNav />
      </body>
    </html>
  );
}
