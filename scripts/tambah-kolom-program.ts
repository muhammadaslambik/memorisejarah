// PAKET-3A: menambah kolom videos.programs (daftar program: diskusi-ramadhan, podcast, jejak, film-dokumenter)
// dan mengisi program untuk video hasil seed. Aman dijalankan ulang.
// Jalankan: npx tsx --env-file=.env.local scripts\tambah-kolom-program.ts
import { neon } from "@neondatabase/serverless";

const PETA: Record<string, string> = {
  "misi-diplomasi-ri-ke-timur-tengah-1947-1948": "{jejak,film-dokumenter}",
  "tour-guide-masjid-agung-demak": "{jejak,film-dokumenter}",
  "menelusuri-sejarah-masjid-jami-waru-baki": "{jejak,film-dokumenter}",
  "membaca-teori-siklus-ibnu-khaldun": "{diskusi-ramadhan}",
  "indie-weerbaar-wajib-milisi-hindia-belanda": "{diskusi-ramadhan}",
  "kiprah-nyai-hasyimah-al-munawwir": "{diskusi-ramadhan}",
  "profetik-dalam-surat-kabar-medan-moeslimin": "{diskusi-ramadhan}",
  "relasi-intelektual-kasunanan-surakarta-gebang-tinatar": "{diskusi-ramadhan}",
};

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  await sql`ALTER TABLE videos ADD COLUMN IF NOT EXISTS programs text[] NOT NULL DEFAULT '{}'`;
  console.log("Kolom programs siap.");
  for (const [slug, arr] of Object.entries(PETA)) {
    const r = await sql`UPDATE videos SET programs = ${arr}::text[] WHERE slug = ${slug} AND cardinality(programs) = 0 RETURNING id`;
    console.log((r.length ? "Program diisi: " : "Dilewati: ") + slug);
  }
}
main().catch((e) => { console.error(e); process.exit(1); });