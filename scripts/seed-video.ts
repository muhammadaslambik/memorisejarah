// PAKET-2D: mengisi tabel videos dengan video dari blog lama (aman dijalankan ulang; slug yang sudah ada dilewati).
// Jalankan: npx tsx --env-file=.env.local scripts\seed-video.ts
import { neon } from "@neondatabase/serverless";

const VIDEO = [
  { slug: "misi-diplomasi-ri-ke-timur-tengah-1947-1948", id: "sl2_m2DJ6bE", feat: true, menit: 1, tgl: null as string | null,
    judul: "Misi Diplomasi RI ke Timur Tengah 1947-1948, Perjuangan Mencari Pengakuan Kemerdekaan Indonesia", ket: "Jejak Memori Sejarah." },
  { slug: "tour-guide-masjid-agung-demak", id: "W-byOVAjwDk", feat: true, menit: 2, tgl: null,
    judul: "Tour Guide Masjid Agung Demak, Menengok Khazanah Peninggalan Wali Songo di Museum Masjid Agung Demak", ket: "Jejak Memori Sejarah." },
  { slug: "menelusuri-sejarah-masjid-jami-waru-baki", id: "rlPevdRg1TY", feat: true, menit: 3, tgl: null,
    judul: "Menelusuri Sejarah Masjid Jami Waru Baki, Masjid Tua di Sukoharjo yang Jarang Diketahui Sejarahnya!", ket: "Jejak Memori Sejarah." },
  { slug: "membaca-teori-siklus-ibnu-khaldun", id: "Kg-VanyuljQ", feat: false, menit: 0, tgl: "2025-03-14 16:30",
    judul: "Membaca Teori Siklus Ibnu Khaldun", ket: "Diskusi Sejarah (Spesial Ramadhan). Pemateri: Amin Nur Huda, S.Hum." },
  { slug: "indie-weerbaar-wajib-milisi-hindia-belanda", id: "eftZI6Y2Mjc", feat: false, menit: 0, tgl: "2025-03-16 16:30",
    judul: "Indie Weerbaar, Beragam Sikap Umat Islam terhadap Wajib Milisi di Hindia Belanda (1917-1918)", ket: "Diskusi Sejarah (Spesial Ramadhan). Pemateri: Rina Mutoharoh, S.Hum." },
  { slug: "kiprah-nyai-hasyimah-al-munawwir", id: "f2MDpWy1hhI", feat: false, menit: 0, tgl: "2025-03-17 16:30",
    judul: "Perjalanan Kiprah Nyai Hasyimah Al Munawwir, Yogyakarta (1951-1997)", ket: "Diskusi Sejarah (Spesial Ramadhan). Pemateri: Fajri Ana Zahrotul Jannah, S.Hum." },
  { slug: "profetik-dalam-surat-kabar-medan-moeslimin", id: "IdfJb2FIIlE", feat: false, menit: 0, tgl: "2025-03-18 16:30",
    judul: "Profetik dalam Surat Kabar Medan Moeslimin", ket: "Diskusi Sejarah (Spesial Ramadhan). Pemateri: Rifky Arya Pramadana." },
  { slug: "relasi-intelektual-kasunanan-surakarta-gebang-tinatar", id: "fSNft4FSnkY", feat: false, menit: 0, tgl: "2025-03-19 16:30",
    judul: "Relasi Intelektual Kasunanan Surakarta dengan Pondok Pesantren Gebang Tinatar Tegalsari, Jetis, Ponorogo (1800-1862)", ket: "Diskusi Sejarah (Spesial Ramadhan). Pemateri: Dewa Alfaquin Faturangga, S.Hum." },
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  for (const v of VIDEO) {
    const hasil = await sql`
      INSERT INTO videos (title, slug, youtube_id, description, featured, status, published_at, updated_at)
      VALUES (${v.judul}, ${v.slug}, ${v.id}, ${v.ket}, ${v.feat}, 'published',
              COALESCE(${v.tgl}::timestamp, now() - (${v.menit} * interval '1 minute')), now())
      ON CONFLICT (slug) DO NOTHING
      RETURNING id`;
    console.log((hasil.length ? "Ditambah: " : "Sudah ada: ") + v.slug);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });