// Membuat tabel videos dan images di Neon dengan SQL langsung.
// Hanya menambah (IF NOT EXISTS); tidak mengubah atau menghapus tabel yang ada.
// Jalankan: npx tsx --env-file=.env.local scripts/buat-tabel-video-gambar.ts
import { neon } from "@neondatabase/serverless";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);

  await sql`
    CREATE TABLE IF NOT EXISTS videos (
      id serial NOT NULL,
      title text NOT NULL,
      slug text NOT NULL,
      youtube_id text NOT NULL,
      description text NOT NULL DEFAULT '',
      featured boolean NOT NULL DEFAULT false,
      status text NOT NULL DEFAULT 'draft',
      category_id integer,
      published_at timestamp,
      updated_at timestamp NOT NULL DEFAULT now(),
      CONSTRAINT videos_pkey PRIMARY KEY (id),
      CONSTRAINT videos_slug_unique UNIQUE (slug),
      CONSTRAINT videos_category_id_categories_id_fk FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE SET NULL
    )`;

  await sql`
    CREATE TABLE IF NOT EXISTS images (
      id serial NOT NULL,
      title text NOT NULL,
      slug text NOT NULL,
      url text NOT NULL,
      caption text NOT NULL DEFAULT '',
      credit text NOT NULL DEFAULT '',
      status text NOT NULL DEFAULT 'draft',
      category_id integer,
      published_at timestamp,
      updated_at timestamp NOT NULL DEFAULT now(),
      CONSTRAINT images_pkey PRIMARY KEY (id),
      CONSTRAINT images_slug_unique UNIQUE (slug),
      CONSTRAINT images_category_id_categories_id_fk FOREIGN KEY (category_id)
        REFERENCES categories (id) ON DELETE SET NULL
    )`;

  const rows = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name`;
  console.log("Tabel di database:", rows.map((r) => r.table_name).join(", "));
}

main().catch((e) => {
  console.error("Gagal:", e.message);
  process.exit(1);
});
