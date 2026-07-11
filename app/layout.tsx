import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import BottomNav from "@/components/layout/BottomNav";
import InstallPrompt from "@/components/layout/InstallPrompt";
import Navbar from "@/components/layout/Navbar";
import FooterWrapper from "@/components/layout/FooterWrapper";
import { Toaster } from "react-hot-toast";
import { AppProvider } from "@/providers/AppProvider";
import BackButtonHandler from "@/components/BackButtonHandler";
import SplashScreenHandler from "@/components/SplashScreenHandler";
import PresenceTracker from "@/components/PresenceTracker";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://tsukinest.my.id"),

  title: {
    default: "TsukiNest - Baca Manhwa, Manhua & Manga Bahasa Indonesia",
    template: "%s | TsukiNest",
  },

  description:
    "Platform baca manhwa, manhua, dan manga bahasa Indonesia terlengkap dan terupdate setiap hari.",

  keywords: [
    "baca manhwa",
    "baca manhua",
    "baca manga",
    "manhwa indonesia",
    "manhua indonesia",
    "manga indonesia",
    "komik asia",
    "webtoon indonesia",
    "tsukinest",
  ],

  authors: [{ name: "TsukiNest", url: "https://tsukinest.my.id" }],
  creator: "TsukiNest",
  publisher: "TsukiNest",

  manifest: "/manifest.json",

  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },

  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TsukiNest",
  },

  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://tsukinest.my.id",
    siteName: "TsukiNest",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "TsukiNest",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",
    title: "TsukiNest",
    description: "Baca Manhwa, Manhua & Manga Bahasa Indonesia",
    images: ["/og-image.jpg"],
    creator: "@tsukinest",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      maxVideoPreview: -1,
      maxImagePreview: "large",
      maxSnippet: -1,
    },
  },

  alternates: {
    canonical: "https://tsukinest.my.id",
  },

  category: "entertainment",

  verification: {
    google: "tgMxzJ5YEIOEHIEK_BtXsx_R6W99nM0zljfxszvBh5w",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${inter.variable}`}>
      <body
        className={`${inter.className} bg-zinc-950 text-white antialiased flex flex-col min-h-screen items-center`}
      >
        <AppProvider>
          <div className="w-full max-w-md min-h-screen bg-black relative shadow-2xl flex flex-col overflow-x-hidden border-x border-zinc-900">

            {/* Sync data user + heartbeat online status (gak render apa-apa) */}
            <PresenceTracker />

            {/* Capacitor Android Back Button */}
            <BackButtonHandler />

            {/* Capacitor Android Splash Screen */}
            <SplashScreenHandler />

            {/* Toast System */}
            <Toaster
              position="top-center"
              toastOptions={{
                duration: 3000,
                style: {
                  background: "#1a1a1a",
                  color: "#fff",
                  borderRadius: "8px",
                },
              }}
            />

            {/* Navbar Desktop / Mobile */}
            <Navbar />

            {/* Main Content */}
            <main className="flex-grow">
              {children}
            </main>

            {/* Footer */}
            <FooterWrapper />

            {/* Bottom Nav Mobile */}
            <BottomNav />

            {/* PWA Install Popup */}
            <InstallPrompt />

          </div>
        </AppProvider>
      </body>
    </html>
  );
}