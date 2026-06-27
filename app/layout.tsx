// app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Toaster } from "react-hot-toast";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://tsukinest.my.id'),
  title: {
    default: 'TsukiNest - Baca Manhwa, Manhua & Manga Bahasa Indonesia',
    template: '%s | TsukiNest',
  },
  description: 'Platform baca manhwa, manhua, dan manga bahasa Indonesia terlengkap dan terupdate setiap hari.',
  keywords: [
    'baca manhwa',
    'baca manhua',
    'baca manga',
    'manhwa indonesia',
    'manhua indonesia',
    'manga indonesia',
    'komik asia',
    'webtoon indonesia',
    'tsukinest',
  ],
  authors: [
    { name: 'TsukiNest', url: 'https://tsukinest.my.id' }
  ],
  creator: 'TsukiNest',
  publisher: 'TsukiNest',
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    url: 'https://tsukinest.my.id',
    siteName: 'TsukiNest',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TsukiNest',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TsukiNest',
    description: 'Baca Manhwa, Manhua & Manga Bahasa Indonesia',
    images: ['/og-image.jpg'],
    creator: '@tsukinest',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  alternates: {
    canonical: 'https://tsukinest.my.id',
  },
  category: 'entertainment',
  verification: {
    google: 'tgMxzJ5YEIOEHIEK_BtXsx_R6W99nM0zljfxszvBh5w',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="google-site-verification" content="tgMxzJ5YEIOEHIEK_BtXsx_R6W99nM0zljfxszvBh5w" />
      </head>
      <body className={`${inter.className} bg-black text-white antialiased flex flex-col min-h-screen`}>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              borderRadius: '8px',
            },
          }}
        />
        
        {/* Navbar buat Desktop */}
        <Navbar />
        
        {/* Konten Utama */}
        <main className="flex-grow">
          {children}
        </main>

        {/* Footer - Akan di-render conditional di client component */}
        <FooterWrapper />

        {/* BottomNav buat Mobile */}
        <BottomNav />
      </body>
    </html>
  );
}

// Wrapper component buat conditional Footer
function FooterWrapper() {
  'use client';
  
  import { usePathname } from 'next/navigation';
  
  const pathname = usePathname();
  const showFooter = pathname === '/';
  
  if (!showFooter) return null;
  
  return <Footer />;
}