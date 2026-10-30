// PAKET-5A: tambah kolom parent_id dan terapkan hierarki kategori WordPress. Aman dijalankan ulang.
// Jalankan: npx tsx --env-file=.env.local scripts\kategori-wordpress.ts
import { neon } from "@neondatabase/serverless";

// [slug baru, nama, slug lama dari seed (bila ada, dipakai ulang agar artikel/gambar tetap terkait)]
const ANAK: [string, string, string | null][] = [
  ["sejarah-indonesia", "Sejarah Indonesia", "nusantara"],
  ["sejarah-dunia", "Sejarah Dunia", "dunia"],
  ["sejarah-tokoh", "Sejarah Tokoh", "tokoh"],
  ["sejarah-islam", "Sejarah Islam", null],
  ["sejarah-lokal", "Sejarah Lokal", null],
  ["sejarah-pemikiran", "Sejarah Pemikiran", null],
  ["sejarah-tradisi-budaya", "Sejarah Tradisi & Budaya", null],
  ["filologi-kajian-manuskrip", "Filologi (Kajian Manuskrip)", null],
];

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  await sql`ALTER TABLE categories ADD COLUMN IF NOT EXISTS parent_id integer REFERENCES categories(id) ON DELETE SET NULL`;

  let [induk] = await sql`SELECT id FROM categories WHERE slug = 'sejarah'`;
  if (!induk) [induk] = await sql`INSERT INTO categories (name, slug) VALUES ('Sejarah', 'sejarah') RETURNING id`;
  await sql`UPDATE categories SET parent_id = NULL WHERE id = ${induk.id}`;

  for (const [slug, nama, lama] of ANAK) {
    const [ada] = await sql`SELECT id FROM categories WHERE slug = ${slug}`;
    if (ada) { await sql`UPDATE categories SET name = ${nama}, parent_id = ${induk.id} WHERE id = ${ada.id}`; continue; }
    const [lm] = lama ? await sql`SELECT id FROM categories WHERE slug = ${lama}` : [];
    if (lm) { await sql`UPDATE categories SET name = ${nama}, slug = ${slug}, parent_id = ${induk.id} WHERE id = ${lm.id}`; continue; }
    await sql`INSERT INTO categories (name, slug, parent_id) VALUES (${nama}, ${slug}, ${induk.id})`;
  }
  const hasil = await sql`SELECT c.id, c.name, c.slug, p.name AS induk FROM categories c LEFT JOIN categories p ON p.id = c.parent_id ORDER BY p.name NULLS FIRST, c.name`;
  console.table(hasil);
}
main().catch((e) => { console.error(e); process.exit(1); });