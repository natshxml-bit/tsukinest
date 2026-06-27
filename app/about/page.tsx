// app/about/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Tentang TsukiNest',
  description: 'Pelajari lebih lanjut tentang TsukiNest, platform baca manhwa, manhua, dan manga bahasa Indonesia terbaik dan terlengkap.',
  openGraph: {
    title: 'Tentang TsukiNest',
    description: 'Platform baca manhwa, manhua, dan manga bahasa Indonesia terbaik dan terlengkap.',
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
            ← Kembali ke Beranda
          </Link>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
            Tentang TsukiNest
          </h1>
          <p className="text-gray-400 text-lg">
            Platform baca komik Asia terbaik di Indonesia
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {/* Section 1 */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <span className="text-blue-400 text-2xl">📖</span>
              Siapa Kami?
            </h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              TsukiNest adalah platform baca komik Asia (manhwa, manhua, dan manga) 
              berbahasa Indonesia yang didirikan dengan passion untuk memberikan 
              pengalaman membaca terbaik bagi para penggemar komik di Indonesia.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Kami menyediakan ribuan judul komik dari berbagai genre dengan update 
              chapter yang rutin setiap hari. Dari action, romance, fantasy, hingga 
              slice of life - semua ada di TsukiNest!
            </p>
          </section>

          {/* Section 2 */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Visi & Misi</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold text-blue-400 mb-2">Visi</h3>
                <p className="text-gray-300">
                  Menjadi platform baca komik Asia nomor 1 di Indonesia yang 
                  menyediakan konten berkualitas, terupdate, dan mudah diakses 
                  oleh semua penggemar komik.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-purple-400 mb-2">Misi</h3>
                <ul className="text-gray-300 space-y-2 list-disc list-inside">
                  <li>Menyediakan ribuan judul manhwa, manhua, dan manga terlengkap</li>
                  <li>Update chapter setiap hari dengan kualitas terjemahan terbaik</li>
                  <li>Memberikan pengalaman membaca yang nyaman dan user-friendly</li>
                  <li>Membangun komunitas pembaca komik yang solid di Indonesia</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Kenapa Memilih TsukiNest?</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-blue-400 mb-2">📚 Koleksi Lengkap</h3>
                <p className="text-gray-300 text-sm">
                  Ribuan judul manhwa, manhua, dan manga dari berbagai genre
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-purple-400 mb-2">⚡ Update Cepat</h3>
                <p className="text-gray-300 text-sm">
                  Chapter baru update setiap hari dengan kecepatan tinggi
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-green-400 mb-2">📱 Mobile Friendly</h3>
                <p className="text-gray-300 text-sm">
                  Interface yang responsif dan nyaman di semua perangkat
                </p>
              </div>
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-400 mb-2">💯 Gratis</h3>
                <p className="text-gray-300 text-sm">
                  Akses semua konten secara gratis tanpa batasan
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Hubungi Kami</h2>
            <p className="text-gray-300 mb-6">
              Punya pertanyaan, saran, atau ingin berkolaborasi? Jangan ragu untuk 
              menghubungi kami!
            </p>
            <div className="flex flex-wrap gap-4">
              <a 
                href="mailto:contact@tsukinest.my.id"
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
              >
                <span className="text-lg">📧</span>
                contact@tsukinest.my.id
              </a>
              <a 
                href="https://twitter.com/tsukinest"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
              >
                <span className="text-lg">🐦</span>
                @tsukinest
              </a>
              <a 
                href="https://github.com/natshxml-bit/tsukinest"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition"
              >
                <span className="text-lg">💻</span>
                GitHub
              </a>
            </div>
          </section>
        </div>

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>© {new Date().getFullYear()} TsukiNest. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-white">Terms of Service</Link>
            <Link href="/dmca" className="hover:text-white">DMCA</Link>
          </div>
        </div>
      </div>
    </main>
  );
}