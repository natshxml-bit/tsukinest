// app/contact/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Hubungi Kami',
  description: 'Hubungi tim TsukiNest untuk pertanyaan, saran, atau kolaborasi.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Kembali ke Beranda
        </Link>
        
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
          Hubungi Kami
        </h1>
        <p className="text-gray-400 mb-8">
          Punya pertanyaan, saran, atau ingin berkolaborasi? Kami siap mendengar dari Anda!
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Email */}
          <a 
            href="mailto:contact@tsukinest.my.id"
            className="bg-gray-900 hover:bg-gray-800 rounded-xl p-6 transition group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-600 text-2xl p-3 rounded-lg group-hover:scale-110 transition">
                📧
              </div>
              <h3 className="text-xl font-bold">Email</h3>
            </div>
            <p className="text-gray-400 mb-2">Kirim email kepada kami</p>
            <p className="text-blue-400 font-mono">contact@tsukinest.my.id</p>
          </a>

          {/* DMCA */}
          <a 
            href="mailto:dmca@tsukinest.my.id"
            className="bg-gray-900 hover:bg-gray-800 rounded-xl p-6 transition group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-red-600 text-2xl p-3 rounded-lg group-hover:scale-110 transition">
                🛡️
              </div>
              <h3 className="text-xl font-bold">DMCA & Copyright</h3>
            </div>
            <p className="text-gray-400 mb-2">Laporan hak cipta</p>
            <p className="text-red-400 font-mono">dmca@tsukinest.my.id</p>
          </a>

          {/* Legal */}
          <a 
            href="mailto:legal@tsukinest.my.id"
            className="bg-gray-900 hover:bg-gray-800 rounded-xl p-6 transition group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-purple-600 text-2xl p-3 rounded-lg group-hover:scale-110 transition">
                ⚖️
              </div>
              <h3 className="text-xl font-bold">Legal</h3>
            </div>
            <p className="text-gray-400 mb-2">Urusan hukum & bisnis</p>
            <p className="text-purple-400 font-mono">legal@tsukinest.my.id</p>
          </a>

          {/* Support */}
          <a 
            href="mailto:support@tsukinest.my.id"
            className="bg-gray-900 hover:bg-gray-800 rounded-xl p-6 transition group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-green-600 text-2xl p-3 rounded-lg group-hover:scale-110 transition">
                💬
              </div>
              <h3 className="text-xl font-bold">Support</h3>
            </div>
            <p className="text-gray-400 mb-2">Bantuan & teknis</p>
            <p className="text-green-400 font-mono">support@tsukinest.my.id</p>
          </a>
        </div>

        {/* Social Media */}
        <section className="bg-gray-900 rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Media Sosial</h2>
          <p className="text-gray-400 mb-6">
            Follow kami untuk update terbaru dan berita menarik:
          </p>
          
          <div className="flex flex-wrap gap-4">
            <a 
              href="https://twitter.com/tsukinest"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-gray-800 hover:bg-blue-600 px-6 py-3 rounded-lg transition"
            >
              <span className="text-xl">🐦</span>
              <span>X / Twitter</span>
            </a>
            
            <a 
              href="https://instagram.com/tsukinest"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-gray-800 hover:bg-pink-600 px-6 py-3 rounded-lg transition"
            >
              <span className="text-xl">📸</span>
              <span>Instagram</span>
            </a>
            
            <a 
              href="https://github.com/natshxml-bit/tsukinest"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 bg-gray-800 hover:bg-gray-600 px-6 py-3 rounded-lg transition"
            >
              <span className="text-xl">💻</span>
              <span>GitHub</span>
            </a>
          </div>
        </section>

        {/* FAQ Link */}
        <section className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Sering Bertanya?</h2>
          <p className="text-gray-300 mb-4">
            Cek halaman FAQ kami untuk jawaban atas pertanyaan yang sering diajukan:
          </p>
          <Link 
            href="/faq"
            className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
          >
            <span className="text-xl">📤</span>
            Lihat FAQ
          </Link>
        </section>

        {/* Response Time */}
        <div className="mt-8 text-center text-gray-500">
          <p>Waktu respons rata-rata: 24-48 jam</p>
          <p className="text-sm mt-2">Kami akan membalas secepat mungkin!</p>
        </div>
      </div>
    </main>
  );
}