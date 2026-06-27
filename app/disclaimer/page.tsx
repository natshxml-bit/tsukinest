// app/disclaimer/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';
import { AlertCircle, Info, Shield } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'Disclaimer dan penafian TsukiNest.',
};

export default function DisclaimerPage() {
  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Kembali ke Beranda
        </Link>
        
        <div className="flex items-center gap-3 mb-6">
          <Info className="w-10 h-10 text-blue-400" />
          <h1 className="text-4xl font-bold">Disclaimer</h1>
        </div>
        
        <p className="text-gray-400 mb-8">
          Penafian dan batasan tanggung jawab TsukiNest
        </p>

        <div className="space-y-6">
          {/* Warning Box */}
          <section className="bg-red-900/30 border border-red-600 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-xl font-bold text-red-400 mb-2">Peringatan Penting</h3>
                <p className="text-gray-300">
                  Harap baca disclaimer ini dengan seksama sebelum menggunakan layanan TsukiNest. 
                  Dengan menggunakan website ini, Anda menyetujui semua ketentuan yang tercantum 
                  di bawah ini.
                </p>
              </div>
            </div>
          </section>

          {/* 1. Konten */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">1. Konten dan Hak Cipta</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Semua konten (manhwa, manhua, manga) yang tersedia di TsukiNest adalah 
                <strong> hak cipta dari masing-masing pemegang hak</strong> (penerbit, penulis, 
                illustrator, atau pihak berwenang lainnya).
              </p>
              <p>
                <strong>TsukiNest tidak meng-host file apapun di server kami.</strong> Semua 
                konten disediakan oleh pihak ketiga dan kami hanya berfungsi sebagai platform 
                agregator.
              </p>
              <p>
                Kami tidak bertanggung jawab atas keakuratan, kelengkapan, atau legalitas 
                konten yang tersedia di platform ini.
              </p>
            </div>
          </section>

          {/* 2. Penggunaan */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">2. Penggunaan Layanan</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Layanan TsukiNest disediakan <strong>&quot;sebagaimana adanya&quot;</strong> dan 
                <strong> &quot;sebagaimana tersedia&quot;</strong> tanpa jaminan apapun, baik 
                tersurat maupun tersirat.
              </p>
              <p>
                Penggunaan layanan ini adalah <strong>risiko Anda sendiri</strong>. Kami tidak 
                menjamin bahwa:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Layanan akan tersedia tanpa gangguan atau kesalahan</li>
                <li>Konten akan akurat, lengkap, atau terkini</li>
                <li>Kualitas layanan akan memenuhi harapan Anda</li>
                <li>Setiap kesalahan dalam layanan akan diperbaiki</li>
              </ul>
            </div>
          </section>

          {/* 3. Tanggung Jawab */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">3. Batasan Tanggung Jawab</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                <strong>TsukiNest tidak bertanggung jawab atas:</strong>
              </p>
              <ul className="list-disc list-inside ml-4 space-y-2">
                <li>Ketidakakuratan, kesalahan, atau kelalaian dalam konten</li>
                <li>Kerusakan atau kehilangan data akibat penggunaan layanan</li>
                <li>Tindakan ilegal yang dilakukan pengguna</li>
                <li>Konten yang melanggar hak cipta pihak ketiga</li>
                <li>Kerugian langsung, tidak langsung, insidental, atau konsekuensial</li>
                <li>Hilangnya keuntungan atau data bisnis</li>
              </ul>
            </div>
          </section>

          {/* 4. Tautan Eksternal */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-400">4. Tautan Eksternal</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Website kami mungkin mengandung tautan ke website pihak ketiga. Kami tidak 
                memiliki kendali atas konten, kebijakan privasi, atau praktik website tersebut.
              </p>
              <p>
                Anda mengakses tautan eksternal atas <strong>risiko Anda sendiri</strong>. 
                Kami sangat menyarankan untuk membaca kebijakan privasi dan syarat layanan 
                setiap website yang Anda kunjungi.
              </p>
            </div>
          </section>

          {/* 5. Iklan */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-pink-400">5. Iklan dan Pihak Ketiga</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Kami menggunakan layanan iklan dari pihak ketiga (seperti Google AdSense) untuk 
                mendukung operasional website.
              </p>
              <p>
                Kami <strong>tidak bertanggung jawab</strong> atas:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Konten iklan yang ditampilkan</li>
                <li>Praktik privasi pengiklan</li>
                <li>Produk atau layanan yang diiklankan</li>
                <li>Transaksi antara Anda dan pengiklan</li>
              </ul>
            </div>
          </section>

          {/* 6. Perubahan Layanan */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">6. Perubahan Layanan</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Kami berhak untuk mengubah, menangguhkan, atau menghentikan layanan (atau 
                bagian mana pun) kapan saja tanpa pemberitahuan sebelumnya.
              </p>
              <p>
                Kami tidak akan bertanggung jawab kepada Anda atau pihak ketiga atas perubahan, 
                penangguhan, atau penghentian layanan.
              </p>
            </div>
          </section>

          {/* 7. Hukum yang Berlaku */}
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-orange-400">7. Hukum yang Berlaku</h2>
            <div className="text-gray-300 space-y-3">
              <p>
                Disclaimer ini diatur dan ditafsirkan sesuai dengan hukum Indonesia. Setiap 
                sengketa yang timbul dari atau terkait dengan disclaimer ini akan diselesaikan 
                melalui pengadilan yang berwenang di Indonesia.
              </p>
            </div>
          </section>

          {/* 8. Kontak */}
          <section className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Pertanyaan?</h2>
            </div>
            <p className="text-gray-300 mb-4">
              Jika Anda memiliki pertanyaan tentang disclaimer ini, silakan hubungi kami:
            </p>
            <a 
              href="mailto:legal@tsukinest.my.id"
              className="text-blue-400 hover:underline"
            >
              legal@tsukinest.my.id
            </a>
          </section>

          {/* Update Info */}
          <div className="text-center text-gray-500 text-sm">
            <p>Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
        </div>
      </div>
    </main>
  );
}