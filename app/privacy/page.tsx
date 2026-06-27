// app/privacy/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi',
  description: 'Kebijakan privasi TsukiNest mengenai pengumpulan dan penggunaan data pengguna.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Kembali ke Beranda
        </Link>
        
        <h1 className="text-4xl font-bold mb-4">Kebijakan Privasi</h1>
        <p className="text-gray-400 mb-8">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="prose prose-invert max-w-none space-y-6">
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">1. Informasi Yang Kami Kumpulkan</h2>
            <p className="text-gray-300 mb-4">
              Kami mengumpulkan beberapa jenis informasi untuk berbagai tujuan untuk 
              menyediakan dan meningkatkan layanan kami kepada Anda:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Informasi akun (email, username, password)</li>
              <li>Data penggunaan (riwayat baca, favorit, library)</li>
              <li>Informasi perangkat (browser, OS, IP address)</li>
              <li>Cookies dan teknologi pelacakan serupa</li>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">2. Bagaimana Kami Menggunakan Informasi</h2>
            <p className="text-gray-300 mb-4">
              Informasi yang kami kumpulkan digunakan untuk berbagai tujuan:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Untuk menyediakan dan memelihara layanan kami</li>
              <li>Untuk memberitahu Anda tentang perubahan layanan</li>
              <li>Untuk memberikan dukungan pelanggan</li>
              <li>Untuk memberikan analisis atau informasi berharga</li>
              <li>Untuk memantau penggunaan layanan</li>
              <li>Untuk mendeteksi, mencegah dan mengatasi masalah teknis</li>
              <li>Untuk mempersonalisasi pengalaman membaca Anda</li>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-400">3. Cookies</h2>
            <p className="text-gray-300 mb-4">
              Kami menggunakan cookies dan teknologi pelacakan serupa untuk melacak 
              aktivitas di layanan kami dan menyimpan informasi tertentu.
            </p>
            <p className="text-gray-300">
              Cookies adalah file dengan jumlah data kecil yang mungkin mencakup 
              pengidentifikasi unik anonim. Anda dapat menginstruksikan browser Anda 
              untuk menolak semua cookies atau untuk menunjukkan kapan cookie dikirim.
            </p>
          </section>

          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">4. Keamanan Data</h2>
            <p className="text-gray-300 mb-4">
              Keamanan data Anda penting bagi kami, tapi ingat bahwa tidak ada metode 
              transmisi melalui internet, atau metode penyimpanan elektronik yang 100% aman. 
              Meskipun kami berusaha menggunakan cara yang dapat diterima secara komersial 
              untuk melindungi Data Pribadi Anda, kami tidak dapat menjamin keamanan absolutnya.
            </p>
          </section>

          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-400">5. Hak Anda</h2>
            <p className="text-gray-300 mb-4">
              Anda memiliki hak-hak berikut terkait data pribadi Anda:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Hak untuk mengakses data pribadi Anda</li>
              <li>Hak untuk memperbaiki data yang tidak akurat</li>
              <li>Hak untuk menghapus data pribadi Anda</li>
              <li>Hak untuk membatasi pemrosesan data</li>
              <li>Hak untuk menarik persetujuan</li>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-pink-400">6. Perubahan Kebijakan Privasi</h2>
            <p className="text-gray-300">
              Kami dapat memperbarui Kebijakan Privasi kami dari waktu ke waktu. 
              Kami akan memberitahu Anda tentang perubahan apa pun dengan memposting 
              Kebijakan Privasi baru di halaman ini dan memperbarui tanggal 
              &quot;Terakhir diperbarui&quot;.
            </p>
          </section>

          <section className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Hubungi Kami</h2>
            <p className="text-gray-300">
              Jika Anda memiliki pertanyaan tentang Kebijakan Privasi ini, silakan 
              hubungi kami di: <a href="mailto:privacy@tsukinest.my.id" className="text-blue-400 hover:underline">privacy@tsukinest.my.id</a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}