// PAKET-15L: menambah kolom posts.cover_caption (keterangan gambar utama artikel). Aman dijalankan ulang.
// Jalankan: npx tsx --env-file=.env.local scripts\tambah-keterangan-sampul.ts
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  await sql`ALTER TABLE posts ADD COLUMN IF NOT EXISTS cover_caption text`;
  console.log("Kolom posts.cover_caption siap.");
}
main().catch((e) => { console.error(e); process.exit(1); });
