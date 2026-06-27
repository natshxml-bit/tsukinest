// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 mt-auto pb-20 md:pb-0">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-4">
              TsukiNest
            </h3>
            <p className="text-gray-400 text-sm">
              Platform baca manhwa, manhua, dan manga bahasa Indonesia terlengkap dan terupdate setiap hari.
            </p>
          </div>

          {/* Navigasi */}
          <div>
            <h4 className="text-white font-semibold mb-4">Navigasi</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/" className="hover:text-white transition">Home</Link></li>
              <li><Link href="/explore" className="hover:text-white transition">Explore</Link></li>
              <li><Link href="/popular" className="hover:text-white transition">Popular</Link></li>
              <li><Link href="/latest" className="hover:text-white transition">Latest</Link></li>
              <li><Link href="/all" className="hover:text-white transition">All Series</Link></li>
              {/* ✅ TAMBAHIN INI */}
              <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
            </ul>
          </div>

          {/* Legal (WAJIB ADSENSE) */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal & Info</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><Link href="/about" className="hover:text-white transition">Tentang Kami</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Hubungi Kami</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Kebijakan Privasi</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Syarat & Ketentuan</Link></li>
              <li><Link href="/dmca" className="hover:text-white transition">DMCA</Link></li>
              <li><Link href="/disclaimer" className="hover:text-white transition">Disclaimer</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-800 mt-8 pt-6 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} TsukiNest. All rights reserved.</p>
          <p className="mt-1 text-xs">Dibuat dengan ❤️ untuk pecinta komik Indonesia.</p>
        </div>
      </div>
    </footer>
  );
}