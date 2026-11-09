// PAKET-19: membuat tabel info_items (Informasi Terbaru). Aman dijalankan ulang.
// Jalankan: npx tsx --env-file=.env.local scripts\tambah-informasi.ts
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  await sql`CREATE TABLE IF NOT EXISTS info_items (
    id serial PRIMARY KEY,
    title text NOT NULL,
    summary text NOT NULL DEFAULT '',
    image_url text NOT NULL DEFAULT '',
    link_url text NOT NULL DEFAULT '',
    label text NOT NULL DEFAULT '',
    status text NOT NULL DEFAULT 'draft',
    published_at timestamp,
    updated_at timestamp NOT NULL DEFAULT now()
  )`;
  console.log("Tabel info_items siap.");
}
main().catch((e) => { console.error(e); process.exit(1); });
