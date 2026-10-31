// PAKET-5B: membuat tabel post_categories dan memindahkan kategori lama (posts.category_id). Aman dijalankan ulang.
// Jalankan: npx tsx --env-file=.env.local scripts\buat-tabel-post-kategori.ts
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    CREATE TABLE IF NOT EXISTS post_categories (
      post_id integer NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
      category_id integer NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
      CONSTRAINT post_categories_post_id_category_id_pk PRIMARY KEY (post_id, category_id)
    )`;
  await sql`
    INSERT INTO post_categories (post_id, category_id)
    SELECT id, category_id FROM posts WHERE category_id IS NOT NULL
    ON CONFLICT DO NOTHING`;
  const [r] = await sql`SELECT count(*)::int AS n FROM post_categories`;
  console.log(`Tabel post_categories siap. Jumlah baris: ${r.n}`);
}
main().catch((e) => { console.error(e); process.exit(1); });