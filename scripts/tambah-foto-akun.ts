// PAKET-15C: menambah kolom users.photo_url (foto akun). Aman dijalankan ulang.
// Jalankan: npx tsx --env-file=.env.local scripts\\tambah-foto-akun.ts
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS photo_url text`;
  console.log("Kolom users.photo_url siap.");
}
main().catch((e) => { console.error(e); process.exit(1); });
