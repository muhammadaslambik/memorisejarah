// PAKET-10A: isi halaman Tentang (HTML dari editor). Bawaan di bawah (teks berformat sederhana, diubah otomatis ke HTML); CMS dapat menimpanya.
import { getSetting } from "./pengaturan";
import { jadiHtml } from "./teks-ke-html";

export type BagianTentang = { kunci: string; judul: string; isi: string };

export const TENTANG_DEFAULT: BagianTentang[] = [
  {
    kunci: "",
    judul: "Tentang",
    isi:
      "**Memori Sejarah** merupakan Lembaga Riset Sejarah dan Komunitas Sejarah yang bertujuan untuk Merawat, Menjaga, dan Melestarikan Sejarah. Memori Sejarah berdiri pertama kali pada tanggal 2 November 2023, digagas oleh seorang sejarawan muda alumni Program Studi Sejarah Peradaban Islam, UIN Raden Mas Said Surakarta bernama Muhammad Aslambik.\n\n" +
      "Nama \u201CMemori Sejarah\u201D terdiri dari kata \u2018Memori\u2019 dan \u2018Sejarah\u2019. Kata \u2018Memori\u2019 bermakna \u2018Tempat Mengingat\u2019. Adapun kata \u2018Sejarah\u2019 bermakna suatu kisah nyata yang pernah terjadi di masa lampau.\n\n" +
      "Dalam proses perjalanannya, Memori Sejarah mengalami perkembangan dengan bertambahnya anggota pengelola, muncul nama-nama pengurus baru lainnya seperti Rifky Arya Pramadana, Sigid Nugrohowati, Dewa Alfaquin Faturangga, Iqbal Al Irfan, Fajri Ana Zahrotul Jannah, Amin Nur Huda, Rina Mutoharoh, dan Arya Bagus Nur Ajiyanto.\n\n" +
      "Dengan bertambahnya jumlah anggota pengelola, harapannya ke depan Memori Sejarah dapat berkembang menjadi lebih baik lagi, sehingga dapat mewujudkan nilai-nilai dasar berdirinya, yaitu untuk Merawat, Menjaga, dan Melestarikan Sejarah, khususnya Sejarah Bangsa Indonesia.\n\n" +
      "Memori Sejarah terus berkembang agar menjadi Lembaga Riset Sejarah dan Komunitas Sejarah yang lebih baik dan profesional, serta membuka kesempatan bagi sejarawan-sejarawan lainnya untuk turut bergabung dalam rangka Merawat, Menjaga, dan Melestarikan Sejarah, khususnya Sejarah Bangsa Indonesia.",
  },
  {
    kunci: "",
    judul: "Motivasi",
    isi:
      "Motivasi awal berdirinya Memori Sejarah dilandasi kegelisahan akan potensi musnahnya naskah-naskah kuno sumber primer sejarah, yang terkadang lenyap dimakan rayap, musnah karena usia, atau berbagai sebab lainnya. Naskah-naskah tersebut adalah hal paling mendasar sebagai rujukan utama dalam merawat sejarah itu sendiri.\n\n" +
      "Selain itu, kisah sejarah yang begitu banyak dan luas kerap kali detail kejadiannya luput dari jangkauan historiografi para sejarawan, sehingga suatu tema tertentu terkadang sulit ditafsirkan secara lengkap dan mendalam karena minimnya sumber, baik primer maupun sekunder.\n\n" +
      "Sadar akan hal itu, merawat sejarah memerlukan uluran tangan banyak pihak, khususnya para pemerhati sejarah yang dapat menjelaskan potongan demi potongan suatu kisah sejarah dan mengaitkannya satu sama lain sesuai konteks zamannya.\n\n" +
      "Maka, hasil historiografi dari seorang sejarawan dengan sejarawan lainnya dapat saling melengkapi. Harapannya, sejarah yang begitu luas dapat dijaga dan dirawat dengan baik, mengingat sejarah adalah suatu identitas, termasuk identitas kita sebagai anak bangsa Indonesia.",
  },
  {
    kunci: "",
    judul: "Visi dan Misi",
    isi:
      "## Visi\n\n> \u201CMewujudkan Memori Sejarah menjadi Tempat Mengingat Sejarah dan Wadah untuk Berkarya\u201D\n\n## Misi\n\n" +
      "1. Merawat dan Mendigitalisasikan Sumber Primer Sejarah\n2. Membuat Tulisan dan Video Bertema Sejarah.\n3. Mengadakan Diskusi Bertema Sejarah.\n4. Membangun Komunitas dan Mewadahi Sejarawan untuk Berkarya.",
  },
  {
    kunci: "",
    judul: "Agenda Realisasi",
    isi:
      "Dalam proses realisasinya, Memori Sejarah melakukan berbagai kegiatan untuk merawat sejarah, antara lain:\n\n" +
      "1. Merawat dan Mendigitalisasikan Sumber Primer Sejarah\n2. Membuat Tulisan dan Video Bertema Sejarah.\n3. Mengadakan Diskusi Bertema Sejarah.\n4. Membangun Komunitas dan Mewadahi Sejarawan untuk Berkarya.\n\n" +
      "[Lihat Agenda Kegiatan \u2192](/agenda)",
  },
  {
    kunci: "logo",
    judul: "Makna Logo",
    isi:
      "- **Berbentuk Otak Manusia:** bermakna \u201CTempat Pusat Ingatan\u201D, karena pusat daya ingat manusia ada di dalam otak. Memori Sejarah hadir sebagai Tempat Mengingat Sejarah, sehingga logo otak manusia sangat relevan digunakan sebagai simbol.\n" +
      "- **Warna Hitam:** melambangkan kedalaman dan kebebasan menjelajahi misteri. Warna ini dipilih di luar logo otak untuk menyimbolkan bahwa tempat mengingat harus diletakkan pada pemikiran mendalam yang berfokus pada eksplorasi misteri sejarah masa lampau, sampai ke titik terdalam sekalipun.\n" +
      "- **Warna Merah, Kuning, Hijau, dan Biru:** digunakan pada logo otak sebagai simbol bahwa ingatan tersebut berisi kreativitas dan keluasan ide pembahasan, karena Memori Sejarah membahas berbagai tema sejarah secara luas dan beragam.\n" +
      "- **Warna Putih:** digunakan pada corak berbentuk jaringan, bermakna bahwa Memori Sejarah berusaha terus berkembang dan membangun silaturahmi serta jaringan relasi yang luas dengan cara yang baik, sebagaimana putih yang identik dengan kebaikan.",
  },
];

const valid = (x: unknown): x is BagianTentang =>
  !!x && typeof x === "object" && typeof (x as BagianTentang).judul === "string" && typeof (x as BagianTentang).isi === "string";

export async function getTentang(): Promise<BagianTentang[]> {
  const v = await getSetting<unknown>("tentang", null);
  if (Array.isArray(v)) {
    const b = v.filter(valid).map((x) => ({ kunci: x.kunci === "logo" ? "logo" : "", judul: x.judul, isi: jadiHtml(x.isi) }));
    if (b.length) return b;
  }
  return TENTANG_DEFAULT.map((x) => ({ ...x, isi: jadiHtml(x.isi) }));
}