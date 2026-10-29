// PAKET-3B: teks dari halaman "Memori Sejarah" di blog WordPress lama
import Link from "next/link";

export const metadata = { title: "Tentang Memori Sejarah" };

const kartu = "rounded-2xl border border-ms-line bg-ms-surface p-6 md:p-8";
const judul = "font-serif text-2xl font-bold text-ms-gold";
const teks = "mt-4 space-y-4 leading-relaxed text-ms-cream/80";
const misi = [
  "Merawat dan Mendigitalisasikan Sumber Primer Sejarah",
  "Membuat Tulisan dan Video Bertema Sejarah.",
  "Mengadakan Diskusi Bertema Sejarah.",
  "Membangun Komunitas dan Mewadahi Sejarawan untuk Berkarya.",
];

export default function Tentang() {
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <img src="/brand/logo-memori-sejarah-kecil.png" alt="Logo Memori Sejarah" className="h-24 w-24 rounded-full" />
          <div>
            <h1 className="font-serif text-4xl font-bold md:text-5xl">Tentang Memori Sejarah</h1>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-ms-gold">Tempat Mengingat Sejarah</p>
          </div>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className={kartu}>
            <h2 className={judul}>Tentang</h2>
            <div className={teks}>
              <p><strong>Memori Sejarah</strong> merupakan Lembaga Riset Sejarah dan Komunitas Sejarah yang bertujuan untuk Merawat, Menjaga, dan Melestarikan Sejarah. Memori Sejarah berdiri pertama kali pada tanggal 2 November 2023, digagas oleh seorang sejarawan muda alumni Program Studi Sejarah Peradaban Islam, UIN Raden Mas Said Surakarta bernama Muhammad Aslambik.</p>
              <p>Nama &ldquo;Memori Sejarah&rdquo; terdiri dari kata &lsquo;Memori&rsquo; dan &lsquo;Sejarah&rsquo;. Kata &lsquo;Memori&rsquo; bermakna &lsquo;Tempat Mengingat&rsquo;. Adapun kata &lsquo;Sejarah&rsquo; bermakna suatu kisah nyata yang pernah terjadi di masa lampau.</p>
              <p>Dalam proses perjalanannya, Memori Sejarah mengalami perkembangan dengan bertambahnya anggota pengelola, muncul nama-nama pengurus baru lainnya seperti Rifky Arya Pramadana, Sigid Nugrohowati, Dewa Alfaquin Faturangga, Iqbal Al Irfan, Fajri Ana Zahrotul Jannah, Amin Nur Huda, Rina Mutoharoh, dan Arya Bagus Nur Ajiyanto.</p>
              <p>Dengan bertambahnya jumlah anggota pengelola, harapannya ke depan Memori Sejarah dapat berkembang menjadi lebih baik lagi, sehingga dapat mewujudkan nilai-nilai dasar berdirinya, yaitu untuk Merawat, Menjaga, dan Melestarikan Sejarah, khususnya Sejarah Bangsa Indonesia.</p>
              <p>Memori Sejarah terus berkembang agar menjadi Lembaga Riset Sejarah dan Komunitas Sejarah yang lebih baik dan profesional, serta membuka kesempatan bagi sejarawan-sejarawan lainnya untuk turut bergabung dalam rangka Merawat, Menjaga, dan Melestarikan Sejarah, khususnya Sejarah Bangsa Indonesia.</p>
            </div>
          </div>
          <div className={kartu}>
            <h2 className={judul}>Motivasi</h2>
            <div className={teks}>
              <p>Motivasi awal berdirinya Memori Sejarah dilandasi kegelisahan akan potensi musnahnya naskah-naskah kuno sumber primer sejarah, yang terkadang lenyap dimakan rayap, musnah karena usia, atau berbagai sebab lainnya. Naskah-naskah tersebut adalah hal paling mendasar sebagai rujukan utama dalam merawat sejarah itu sendiri.</p>
              <p>Selain itu, kisah sejarah yang begitu banyak dan luas kerap kali detail kejadiannya luput dari jangkauan historiografi para sejarawan, sehingga suatu tema tertentu terkadang sulit ditafsirkan secara lengkap dan mendalam karena minimnya sumber, baik primer maupun sekunder.</p>
              <p>Sadar akan hal itu, merawat sejarah memerlukan uluran tangan banyak pihak, khususnya para pemerhati sejarah yang dapat menjelaskan potongan demi potongan suatu kisah sejarah dan mengaitkannya satu sama lain sesuai konteks zamannya.</p>
              <p>Maka, hasil historiografi dari seorang sejarawan dengan sejarawan lainnya dapat saling melengkapi. Harapannya, sejarah yang begitu luas dapat dijaga dan dirawat dengan baik, mengingat sejarah adalah suatu identitas, termasuk identitas kita sebagai anak bangsa Indonesia.</p>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className={kartu}>
            <h2 className={judul}>Visi</h2>
            <p className="mt-4 font-serif text-xl leading-snug">&ldquo;Mewujudkan Memori Sejarah menjadi Tempat Mengingat Sejarah dan Wadah untuk Berkarya&rdquo;</p>
            <h2 className={`${judul} mt-8`}>Misi</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-ms-cream/80">
              {misi.map((m) => <li key={m}>{m}</li>)}
            </ol>
          </div>
          <div className={kartu}>
            <h2 className={judul}>Agenda Realisasi</h2>
            <p className="mt-4 text-ms-cream/80">Dalam proses realisasinya, Memori Sejarah melakukan berbagai kegiatan untuk merawat sejarah, antara lain:</p>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-ms-cream/80">
              {misi.map((m) => <li key={m}>{m}</li>)}
            </ol>
            <Link href="/agenda" className="mt-6 inline-block text-sm text-ms-gold">Lihat Agenda Kegiatan &rarr;</Link>
          </div>
        </div>

        <div className={`${kartu} mt-6`}>
          <h2 className={judul}>Makna Logo</h2>
          <div className="mt-4 grid items-center gap-8 lg:grid-cols-[1.6fr_1fr]">
            <ul className="space-y-4 leading-relaxed text-ms-cream/80">
              <li><strong className="text-ms-cream">Berbentuk Otak Manusia:</strong> bermakna &ldquo;Tempat Pusat Ingatan&rdquo;, karena pusat daya ingat manusia ada di dalam otak. Memori Sejarah hadir sebagai Tempat Mengingat Sejarah, sehingga logo otak manusia sangat relevan digunakan sebagai simbol.</li>
              <li><strong className="text-ms-cream">Warna Hitam:</strong> melambangkan kedalaman dan kebebasan menjelajahi misteri. Warna ini dipilih di luar logo otak untuk menyimbolkan bahwa tempat mengingat harus diletakkan pada pemikiran mendalam yang berfokus pada eksplorasi misteri sejarah masa lampau, sampai ke titik terdalam sekalipun.</li>
              <li><strong className="text-ms-cream">Warna Merah, Kuning, Hijau, dan Biru:</strong> digunakan pada logo otak sebagai simbol bahwa ingatan tersebut berisi kreativitas dan keluasan ide pembahasan, karena Memori Sejarah membahas berbagai tema sejarah secara luas dan beragam.</li>
              <li><strong className="text-ms-cream">Warna Putih:</strong> digunakan pada corak berbentuk jaringan, bermakna bahwa Memori Sejarah berusaha terus berkembang dan membangun silaturahmi serta jaringan relasi yang luas dengan cara yang baik, sebagaimana putih yang identik dengan kebaikan.</li>
            </ul>
            <div className="text-center">
              <img src="/brand/logo-memori-sejarah.png" alt="Logo Memori Sejarah" className="mx-auto w-56 max-w-full rounded-full" />
              <p className="mt-3 font-serif text-lg font-bold">Memori Sejarah</p>
              <p className="text-xs uppercase tracking-[0.2em] text-ms-gold">Tempat Mengingat Sejarah</p>
            </div>
          </div>
        </div>

        <p className="mt-10 text-sm text-ms-cream/70">
          Ingin tahu siapa di balik Memori Sejarah? <Link href="/tentang/redaksi" className="text-ms-gold">Lihat Susunan Redaksi &rarr;</Link>
        </p>
      </section>
    </div>
  );
}