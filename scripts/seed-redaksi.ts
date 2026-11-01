// PAKET-9C: membuat tabel redaksi dan mengisi susunan awal (hanya nama dan tim; TANPA data pribadi). Aman dijalankan ulang.
// Jalankan: npx tsx --env-file=.env.local scripts\seed-redaksi.ts
import { neon } from "@neondatabase/serverless";

type Anggota = { slug: string; name: string; peran: string; pemimpin: boolean; urutan: number; tim: [string, string][] };
const AWAL: Anggota[] = [
  { slug: "muhammad-aslambik", name: "Muhammad Aslambik, S.Hum.", peran: "Pendiri & Pemimpin Redaksi", pemimpin: true, urutan: 1, tim: [["editor", ""], ["humas", ""], ["it", ""], ["riset", ""]] },
  { slug: "sigid-nugrohowati", name: "Sigid Nugrohowati", peran: "", pemimpin: false, urutan: 2, tim: [["editor", ""], ["sosmed", "Grup WA & Saluran WA"], ["riset", ""]] },
  { slug: "rifky-arya-pramadana", name: "Rifky Arya Pramadana", peran: "", pemimpin: false, urutan: 3, tim: [["editor", ""], ["humas", ""], ["sosmed", "YouTube"], ["riset", ""]] },
  { slug: "dewa-alfaquin-faturangga", name: "Dewa Alfaquin Faturangga, S.Hum.", peran: "", pemimpin: false, urutan: 4, tim: [["humas", ""], ["riset", ""]] },
  { slug: "iqbal-al-irfan", name: "Iqbal Al Irfan, S.Hum.", peran: "", pemimpin: false, urutan: 5, tim: [["editor", ""], ["riset", ""]] },
  { slug: "fajri-ana-zahrotul-jannah", name: "Fajri Ana Zahrotul Jannah, S.Hum.", peran: "", pemimpin: false, urutan: 6, tim: [["editor", ""], ["sosmed", "Instagram"], ["riset", ""]] },
  { slug: "amin-nur-huda", name: "Amin Nur Huda, S.Hum.", peran: "", pemimpin: false, urutan: 7, tim: [["riset", ""]] },
  { slug: "rina-mutoharoh", name: "Rina Mutoharoh, S.Hum.", peran: "", pemimpin: false, urutan: 8, tim: [["riset", ""]] },
  { slug: "arya-bagus-nur-ajiyanto", name: "Arya Bagus Nur Ajiyanto, S.Hum.", peran: "", pemimpin: false, urutan: 9, tim: [["riset", ""]] },
];

const norm = (s: string) => s.split(",")[0].toLowerCase().replace(/[^a-z]/g, "");

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
  const sql = neon(process.env.DATABASE_URL);
  await sql`
    CREATE TABLE IF NOT EXISTS redaksi (
      id serial PRIMARY KEY,
      slug text NOT NULL UNIQUE,
      name text NOT NULL,
      peran text NOT NULL DEFAULT '',
      pemimpin boolean NOT NULL DEFAULT false,
      urutan integer NOT NULL DEFAULT 0,
      bidang text NOT NULL DEFAULT '',
      bio text NOT NULL DEFAULT '',
      foto_url text,
      domisili text NOT NULL DEFAULT '',
      email text NOT NULL DEFAULT '',
      whatsapp text NOT NULL DEFAULT '',
      instagram text NOT NULL DEFAULT '',
      linkedin text NOT NULL DEFAULT '',
      facebook text NOT NULL DEFAULT '',
      website text NOT NULL DEFAULT '',
      user_id integer REFERENCES users(id) ON DELETE SET NULL,
      aktif boolean NOT NULL DEFAULT true,
      updated_at timestamp NOT NULL DEFAULT now()
    )`;
  await sql`
    CREATE TABLE IF NOT EXISTS redaksi_tim (
      member_id integer NOT NULL REFERENCES redaksi(id) ON DELETE CASCADE,
      tim text NOT NULL,
      catatan text NOT NULL DEFAULT '',
      CONSTRAINT redaksi_tim_member_id_tim_pk PRIMARY KEY (member_id, tim)
    )`;

  const pengguna = await sql`SELECT id, name, email FROM users`;
  const admin = (process.env.ADMIN_EMAIL ?? "").toLowerCase();
  let baru = 0;
  for (const a of AWAL) {
    const [ada] = await sql`SELECT id FROM redaksi WHERE slug = ${a.slug}`;
    if (ada) continue;
    const cocok = a.pemimpin
      ? pengguna.find((u) => String(u.email).toLowerCase() === admin)
      : pengguna.find((u) => norm(String(u.name)) === norm(a.name));
    const [r] = await sql`INSERT INTO redaksi (slug, name, peran, pemimpin, urutan, user_id) VALUES (${a.slug}, ${a.name}, ${a.peran}, ${a.pemimpin}, ${a.urutan}, ${cocok ? Number(cocok.id) : null}) RETURNING id`;
    for (const [tim, catatan] of a.tim) await sql`INSERT INTO redaksi_tim (member_id, tim, catatan) VALUES (${Number(r.id)}, ${tim}, ${catatan}) ON CONFLICT DO NOTHING`;
    baru++;
  }
  const hasil = await sql`SELECT r.name, r.urutan, (SELECT count(*)::int FROM redaksi_tim t WHERE t.member_id = r.id) AS tim, (r.user_id IS NOT NULL) AS terhubung FROM redaksi r ORDER BY r.urutan`;
  console.log(`Selesai. Anggota baru: ${baru}`);
  console.table(hasil);
}
main().catch((e) => { console.error(e); process.exit(1); });