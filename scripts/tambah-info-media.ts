// PAKET-21: kolom video dan animasi untuk Informasi Terbaru. Aman dijalankan ulang.
// Jalankan: npx tsx --env-file=.env.local scripts\tambah-info-media.ts
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  await sql`ALTER TABLE info_items ADD COLUMN IF NOT EXISTS video_url text NOT NULL DEFAULT ''`;
  await sql`ALTER TABLE info_items ADD COLUMN IF NOT EXISTS animation text NOT NULL DEFAULT ''`;
  console.log("Kolom video_url dan animation siap.");
}
main().catch((e) => { console.error(e); process.exit(1); });
