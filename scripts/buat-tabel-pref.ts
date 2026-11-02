// PAKET-11A: membuat tabel preferensi per akun. Aman dijalankan ulang.
// Jalankan: npx tsx --env-file=.env.local scripts\buat-tabel-pref.ts
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    CREATE TABLE IF NOT EXISTS user_prefs (
      user_id integer PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      per_halaman integer NOT NULL DEFAULT 20
    )`;
  console.log("Tabel user_prefs siap.");
}
main().catch((e) => { console.error(e); process.exit(1); });