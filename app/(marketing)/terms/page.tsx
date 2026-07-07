import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FileText, User, Lock, Ban, Scale, RefreshCw, Mail } from "lucide-react";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan",
  description: "Syarat dan ketentuan penggunaan layanan TsukiNest.",
};

export default function TermsPage() {
  const sections = [
    {
      num: "1",
      title: "Persetujuan Terhadap Syarat",
      icon: FileText,
      body: (
        <p>
          Dengan mengakses atau menggunakan layanan TsukiNest, Anda setuju untuk terikat dengan Syarat dan Ketentuan ini. Jika Anda tidak setuju dengan bagian mana pun dari syarat, maka Anda tidak boleh mengakses layanan.
        </p>
      ),
    },
    {
      num: "2",
      title: "Pembatasan Umur",
      icon: User,
      body: (
        <p>
          Anda harus berusia minimal 13 tahun untuk menggunakan layanan ini. Dengan menggunakan layanan ini, Anda menyatakan bahwa Anda memenuhi persyaratan usia minimum ini.
        </p>
      ),
    },
    {
      num: "3",
      title: "Akun Pengguna",
      icon: Lock,
      body: (
        <>
          <p className="mb-2">Ketika Anda membuat akun dengan kami, Anda bertanggung jawab untuk menjaga keamanan akun Anda dan Anda bertanggung jawab penuh atas semua aktivitas yang terjadi di bawah akun tersebut.</p>
          <ul className="list-disc list-inside ml-3 space-y-1">
            <li>Anda harus memberikan informasi yang akurat dan lengkap</li>
            <li>Anda harus menjaga kerahasiaan password Anda</li>
            <li>Anda harus segera memberitahu kami tentang penggunaan tidak sah</li>
          </ul>
        </>
      ),
    },
    {
      num: "4",
      title: "Hak Cipta & Kekayaan Intelektual",
      icon: FileText,
      body: (
        <>
          <p className="mb-2">
            Layanan dan konten aslinya (kecuali konten yang disediakan oleh pengguna), fitur, dan fungsionalitas adalah dan akan tetap menjadi milik eksklusif TsukiNest dan dilindungi oleh undang-undang hak cipta.
          </p>
          <p>Semua konten komik (manhwa, manhua, manga) yang tersedia di platform ini adalah hak cipta dari pemegang hak masing-masing. Kami tidak menyimpan file di server kami.</p>
        </>
      ),
    },
    {
      num: "5",
      title: "Penggunaan yang Dilarang",
      icon: Ban,
      body: (
        <>
          <p className="mb-2">Anda setuju untuk tidak menggunakan layanan untuk:</p>
          <ul className="list-disc list-inside ml-3 space-y-1">
            <li>Aktivitas ilegal atau tidak sah</li>
            <li>Melecehkan, menyalahgunakan, atau membahayakan orang lain</li>
            <li>Menyebarkan malware atau kode berbahaya</li>
            <li>Mengganggu atau membebani server kami</li>
            <li>Scraping atau data mining tanpa izin</li>
            <li>Mencoba mengakses akun orang lain</li>
          </ul>
        </>
      ),
    },
    {
      num: "6",
      title: "Batasan Tanggung Jawab",
      icon: Scale,
      body: (
        <p>
          Layanan disediakan &quot;sebagaimana adanya&quot; dan &quot;sebagaimana tersedia&quot; tanpa jaminan apapun, baik tersurat maupun tersirat. Kami tidak bertanggung jawab atas kerusakan apapun yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan.
        </p>
      ),
    },
    {
      num: "7",
      title: "Perubahan Syarat",
      icon: RefreshCw,
      body: (
        <p>
          Kami berhak mengubah atau mengganti Syarat ini kapan saja. Jika perubahan materi berlaku, kami akan berusaha memberikan pemberitahuan setidaknya 30 hari sebelum syarat baru berlaku.
        </p>
      ),
    },
  ];

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white pb-24">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-sm mb-6 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </Link>

        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-xl bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
            <FileText className="w-4 h-4 text-neutral-400" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Syarat dan Ketentuan</h1>
        </div>
        <p className="text-neutral-500 text-sm mb-6">
          Terakhir diperbarui: {new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="space-y-4">
          {sections.map((s) => (
            <section key={s.num} className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-6 h-6 rounded-md bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
                  <s.icon className="w-3 h-3 text-neutral-400" />
                </div>
                <h2 className="text-sm font-semibold tracking-tight">
                  {s.num}. {s.title}
                </h2>
              </div>
              <div className="text-neutral-400 text-xs leading-relaxed">{s.body}</div>
            </section>
          ))}

          {/* Kontak */}
          <section className="bg-[#141414] border border-white/[0.05] rounded-xl p-5">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-md bg-[#1c1c1c] border border-white/[0.06] flex items-center justify-center">
                <Mail className="w-3 h-3 text-neutral-400" />
              </div>
              <h2 className="text-sm font-semibold tracking-tight">Kontak</h2>
            </div>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Untuk pertanyaan tentang Syarat dan Ketentuan ini, silakan hubungi kami di:{" "}
              <a href="mailto:legal@tsukinest.my.id" className="text-neutral-300 hover:text-white transition-colors">
                legal@tsukinest.my.id
              </a>
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
