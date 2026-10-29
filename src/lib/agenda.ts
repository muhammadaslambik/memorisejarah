// PAKET-2B: data tetap untuk Agenda Kegiatan (sumber: halaman WordPress lama)
export type Episode = { judul: string; pembicara?: string; tanggal?: string; youtubeId: string };
export type Program = {
  slug: string; nama: string; sub: string; ikon: number; kelas: string;
  deskripsi: string; jadwal?: string; episode: Episode[]; segera?: boolean;
};

export const AGENDA: Program[] = [
  {
    slug: "diskusi-ramadhan", nama: "Diskusi Sejarah (Spesial Ramadhan)", sub: "Masjid & Bulan", ikon: 0x1f319,
    kelas: "from-emerald-950 via-emerald-950/70 to-ms-surface border-emerald-800/50",
    deskripsi: "Seminar rutin setiap bulan suci Ramadhan untuk menghidupkan tradisi diskusi intelektual di bidang ilmu sejarah, sekaligus wujud menjaga produktivitas di bulan puasa.",
    jadwal: "14, 16, 17, 18, dan 19 Maret 2025, pukul 16.30 - 17.15",
    episode: [
      { judul: "Membaca Teori Siklus Ibnu Khaldun", pembicara: "Amin Nur Huda, S.Hum.", tanggal: "Jumat, 14 Maret 2025", youtubeId: "Kg-VanyuljQ" },
      { judul: "Indie Weerbaar, Beragam Sikap Umat Islam terhadap Wajib Milisi di Hindia Belanda (1917-1918)", pembicara: "Rina Mutoharoh, S.Hum.", tanggal: "Minggu, 16 Maret 2025", youtubeId: "eftZI6Y2Mjc" },
      { judul: "Perjalanan Kiprah Nyai Hasyimah Al Munawwir, Yogyakarta (1951-1997)", pembicara: "Fajri Ana Zahrotul Jannah, S.Hum.", tanggal: "Senin, 17 Maret 2025", youtubeId: "f2MDpWy1hhI" },
      { judul: "Profetik dalam Surat Kabar Medan Moeslimin", pembicara: "Rifky Arya Pramadana", tanggal: "Selasa, 18 Maret 2025", youtubeId: "IdfJb2FIIlE" },
      { judul: "Relasi Intelektual Kasunanan Surakarta dengan Pondok Pesantren Gebang Tinatar Tegalsari, Jetis, Ponorogo (1800-1862)", pembicara: "Dewa Alfaquin Faturangga, S.Hum.", tanggal: "Rabu, 19 Maret 2025", youtubeId: "fSNft4FSnkY" },
    ],
  },
  {
    slug: "podcast", nama: "Podcast Memori Sejarah", sub: "Wawancara & Narasi", ikon: 0x1f399,
    kelas: "from-purple-950 via-purple-950/70 to-ms-surface border-purple-800/50",
    deskripsi: "Program dari Memori Sejarah yang menyajikan diskusi-diskusi menarik dalam berbagai tema sejarah.",
    episode: [], segera: true,
  },
  {
    slug: "jejak", nama: "Jejak Memori Sejarah", sub: "Napak Tilas Lapangan", ikon: 0x1f463,
    kelas: "from-amber-950 via-amber-950/70 to-ms-surface border-amber-800/50",
    deskripsi: "Program yang menyajikan hasil penelitian lapangan menyusuri berbagai tempat dan kejadian bersejarah yang menarik untuk diteliti lebih mendalam.",
    episode: [
      { judul: "Misi Diplomasi RI ke Timur Tengah 1947-1948, Perjuangan Mencari Pengakuan Kemerdekaan Indonesia", youtubeId: "sl2_m2DJ6bE" },
      { judul: "Tour Guide Masjid Agung Demak, Menengok Khazanah Peninggalan Wali Songo di Museum Masjid Agung Demak", youtubeId: "W-byOVAjwDk" },
      { judul: "Menelusuri Sejarah Masjid Jami Waru Baki, Masjid Tua di Sukoharjo yang Jarang Diketahui Sejarahnya!", youtubeId: "rlPevdRg1TY" },
    ],
  },
  {
    slug: "film-dokumenter", nama: "Film Dokumenter", sub: "Visual Historiografi", ikon: 0x1f3ac,
    kelas: "from-sky-950 via-sky-950/70 to-ms-surface border-sky-800/50",
    deskripsi: "Film yang mendokumentasikan fakta dan realita kehidupan, untuk memberi pendidikan, memelihara catatan sejarah, serta meningkatkan kesadaran akan realitas masa lampau yang terabaikan.",
    episode: [
      { judul: "Misi Diplomasi RI ke Timur Tengah 1947-1948, Perjuangan Mencari Pengakuan Kemerdekaan Indonesia", youtubeId: "sl2_m2DJ6bE" },
      { judul: "Tour Guide Masjid Agung Demak, Menengok Khazanah Peninggalan Wali Songo di Museum Masjid Agung Demak", youtubeId: "W-byOVAjwDk" },
      { judul: "Menelusuri Sejarah Masjid Jami Waru Baki, Masjid Tua di Sukoharjo yang Jarang Diketahui Sejarahnya!", youtubeId: "rlPevdRg1TY" },
    ],
  },
];

export const ikon = (kode: number) => String.fromCodePoint(kode);