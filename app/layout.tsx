import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav"; // 👈 Import komponen navbar baru

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
      <body className={`${inter.className} bg-gray-950`}>
        {/* Wrapper max-width agar tampilan konsisten mobile-first */}
        <div className="max-w-md mx-auto min-h-screen bg-gray-950 shadow-xl shadow-black/40">
          {children}
        </div>
        
        {/* 🔥 Masukin BottomNav di sini agar selalu stand-by melayang di bawah */}
        <BottomNav />
      </body>
    </html>
  );
}
