export const metadata = {
  title: "Kebijakan Privasi",
  description: "Data apa yang dikumpulkan Memori Sejarah dan bagaimana data itu digunakan.",
};

export default function Privasi() {
  return (
    <article className="mx-auto max-w-3xl px-5 pt-12">
      <h1 className="font-serif text-4xl leading-tight md:text-5xl">Kebijakan Privasi</h1>
      <p className="mt-3 text-sm text-gold-dark">Diperbarui 26 Oktober 2026</p>
      <div className="prose prose-lg prose-stone mt-8 max-w-none prose-headings:font-serif prose-a:text-gold-dark">
        <p>
          Memori Sejarah (memorisejarah.eu.org) adalah situs artikel sejarah. Halaman ini menjelaskan data apa yang
          dikumpulkan dan untuk apa data itu dipakai.
        </p>

        <h2>Pembaca</h2>
        <p>
          Anda bisa membaca semua artikel tanpa membuat akun. Situs ini tidak menampilkan iklan dan tidak menjual data
          pengunjung.
        </p>

        <h2>Penulis, editor, dan admin</h2>
        <p>Jika Anda mendaftar atau diberi akun untuk menulis dan mengelola artikel, kami menyimpan:</p>
        <ul>
          <li>nama dan alamat email Anda;</li>
          <li>kata sandi dalam bentuk terenkripsi satu arah (kami tidak bisa membaca kata sandi asli Anda);</li>
          <li>artikel yang Anda tulis dan status persetujuannya;</li>
          <li>alamat IP dan waktu percobaan masuk atau pendaftaran, hanya untuk membatasi percobaan berulang dan mencegah penyalahgunaan.</li>
        </ul>
        <p>Data ini dipakai untuk mengelola akun dan keamanan situs, bukan untuk tujuan lain.</p>

        <h2>Masuk dengan Google</h2>
        <p>
          Jika Anda memilih &quot;Masuk dengan Google&quot;, kami hanya menerima alamat email Anda dan keterangan
          bahwa email itu sudah diverifikasi Google. Data itu dipakai untuk mencocokkan Anda dengan akun yang sudah
          terdaftar. Kami tidak meminta akses ke Gmail, kontak, atau data Google lainnya, dan tidak membuat akun baru
          secara otomatis.
        </p>

        <h2>Cookie</h2>
        <p>
          Kami memakai satu cookie sesi untuk menjaga Anda tetap masuk di halaman admin. Cookie ini tidak dipakai untuk
          melacak pengunjung.
        </p>

        <h2>Layanan pihak ketiga</h2>
        <p>
          Situs berjalan di Cloudflare, data disimpan di Neon (basis data PostgreSQL), dan formulir pendaftaran dapat
          dilindungi Cloudflare Turnstile. Layanan-layanan ini memproses data sesuai kebijakan masing-masing.
        </p>

        <h2>Hak Anda</h2>
        <p>
          Anda bisa meminta untuk melihat, memperbaiki, atau menghapus data akun Anda dengan menghubungi kami di{" "}
          <a href="mailto:admin@memorisejarah.eu.org">admin@memorisejarah.eu.org</a>.
        </p>
      </div>
    </article>
  );
}
