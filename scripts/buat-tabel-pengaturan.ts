// PAKET-3C2: membuat tabel site_settings (pengaturan tampilan situs yang diubah lewat CMS). Aman dijalankan ulang.
// Jalankan: npx tsx --env-file=.env.local scripts\buat-tabel-pengaturan.ts
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    CREATE TABLE IF NOT EXISTS site_settings (
      key text PRIMARY KEY,
      value text NOT NULL,
      updated_at timestamp NOT NULL DEFAULT now()
    )`;
  console.log("Tabel site_settings siap.");
}
main().catch((e) => { console.error(e); process.exit(1); });