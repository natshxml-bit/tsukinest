// components/Footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/[0.05] mt-auto pb-24 md:pb-8">
      <div className="container mx-auto px-4 py-8 max-w-md">
        <div className="grid grid-cols-1 gap-6">
          {/* Brand */}
          <div>
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent mb-2">
              TsukiNest
            </h3>
            <p className="text-gray-400 text-xs leading-relaxed">
              Platform baca manhwa, manhua, dan manga bahasa Indonesia terlengkap dan terupdate setiap hari.
            </p>
          </div>

          {/* 2 Kolom */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Navigasi</h4>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li><Link href="/" className="hover:text-white transition">Home</Link></li>
                <li><Link href="/explore" className="hover:text-white transition">Explore</Link></li>
                <li><Link href="/popular" className="hover:text-white transition">Popular</Link></li>
                <li><Link href="/latest" className="hover:text-white transition">Latest</Link></li>
                <li><Link href="/all" className="hover:text-white transition">All Series</Link></li>
                <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold text-sm mb-3">Legal & Info</h4>
              <ul className="space-y-1.5 text-xs text-gray-400">
                <li><Link href="/about" className="hover:text-white transition">Tentang Kami</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Hubungi Kami</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy</Link></li>
                <li><Link href="/terms" className="hover:text-white transition">Terms</Link></li>
                <li><Link href="/dmca" className="hover:text-white transition">DMCA</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/[0.05] mt-6 pt-6 text-center">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} TsukiNest. All rights reserved.
          </p>
          <p className="text-[10px] text-gray-600 mt-1">
            Dibuat dengan ❤️ untuk pecinta komik Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}