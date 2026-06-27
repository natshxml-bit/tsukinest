// app/terms/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Syarat dan Ketentuan',
  description: 'Syarat dan ketentuan penggunaan layanan TsukiNest.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-black text-white pb-20">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/" className="text-blue-400 hover:text-blue-300 mb-4 inline-block">
          ← Kembali ke Beranda
        </Link>
        
        <h1 className="text-4xl font-bold mb-4">Syarat dan Ketentuan</h1>
        <p className="text-gray-400 mb-8">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div className="space-y-6">
          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-400">1. Persetujuan Terhadap Syarat</h2>
            <p className="text-gray-300">
              Dengan mengakses atau menggunakan layanan TsukiNest, Anda setuju untuk 
              terikat dengan Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan 
              bagian mana pun dari syarat, maka Anda tidak boleh mengakses layanan.
            </p>
          </section>

          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-purple-400">2. Pembatasan Umur</h2>
            <p className="text-gray-300">
              Anda harus berusia minimal 13 tahun untuk menggunakan layanan ini. 
              Dengan menggunakan layanan ini, Anda menyatakan bahwa Anda memenuhi 
              persyaratan usia minimum ini.
            </p>
          </section>

          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-400">3. Akun Pengguna</h2>
            <p className="text-gray-300 mb-4">
              Ketika Anda membuat akun dengan kami, Anda bertanggung jawab untuk 
              menjaga keamanan akun Anda dan Anda bertanggung jawab penuh atas semua 
              aktivitas yang terjadi di bawah akun tersebut.
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Anda harus memberikan informasi yang akurat dan lengkap</li>
              <li>Anda harus menjaga kerahasiaan password Anda</li>
              <li>Anda harus segera memberitahu kami tentang penggunaan tidak sah</li>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-yellow-400">4. Hak Cipta & Kekayaan Intelektual</h2>
            <p className="text-gray-300 mb-4">
              Layanan dan konten aslinya (kecuali konten yang disediakan oleh pengguna), 
              fitur, dan fungsionalitas adalah dan akan tetap menjadi milik eksklusif 
              TsukiNest dan dilindungi oleh undang-undang hak cipta.
            </p>
            <p className="text-gray-300">
              Semua konten komik (manhwa, manhua, manga) yang tersedia di platform ini 
              adalah hak cipta dari pemegang hak masing-masing. Kami tidak menyimpan 
              file di server kami.
            </p>
          </section>

          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-red-400">5. Penggunaan yang Dilarang</h2>
            <p className="text-gray-300 mb-4">
              Anda setuju untuk tidak menggunakan layanan untuk:
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-2 ml-4">
              <li>Aktivitas ilegal atau tidak sah</li>
              <li>Melecehkan, menyalahgunakan, atau membahayakan orang lain</li>
              <li>Menyebarkan malware atau kode berbahaya</li>
              <li>Mengganggu atau membebani server kami</li>
              <li>Scraping atau data mining tanpa izin</li>
              <li>Mencoba mengakses akun orang lain</li>
            </ul>
          </section>

          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-pink-400">6. Batasan Tanggung Jawab</h2>
            <p className="text-gray-300">
              Layanan disediakan &quot;sebagaimana adanya&quot; dan &quot;sebagaimana tersedia&quot; 
              tanpa jaminan apapun, baik tersurat maupun tersirat. Kami tidak bertanggung 
              jawab atas kerusakan apapun yang timbul dari penggunaan atau ketidakmampuan 
              menggunakan layanan.
            </p>
          </section>

          <section className="bg-gray-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">7. Perubahan Syarat</h2>
            <p className="text-gray-300">
              Kami berhak mengubah atau mengganti Syarat ini kapan saja. Jika perubahan 
              materi berlaku, kami akan berusaha memberikan pemberitahuan setidaknya 30 
              hari sebelum syarat baru berlaku.
            </p>
          </section>

          <section className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-xl p-6">
            <h2 className="text-2xl font-bold mb-4">Kontak</h2>
            <p className="text-gray-300">
              Untuk pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami di: 
              <a href="mailto:legal@tsukinest.my.id" className="text-blue-400 hover:underline ml-1">
                legal@tsukinest.my.id
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}