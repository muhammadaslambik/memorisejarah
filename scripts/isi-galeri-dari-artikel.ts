// PAKET-15J: mengisi Galeri Gambar (CMS > Gambar) dengan semua gambar yang dipakai artikel (sampul + gambar di isi), tanpa file ganda.
//  - 1 file gambar = 1 alamat ImageKit. Gambar yang sama persis (isi berkas sama) dipakai bersama; tidak ada file baru yang diunggah.
//  - Setiap artikel mendapat entri galeri sendiri dengan judul sendiri (judul artikel; gambar di isi memakai teks alt bila ada),
//    sehingga satu file dapat menaungi beberapa judul. Menghapus satu artikel tidak menghapus file yang masih dipakai entri lain.
//  - Tanpa opsi: SIMULASI (tidak mengubah apa pun). --terapkan: menyimpan entri ke database. Aman dijalankan ulang (entri yang sudah ada dilewati).
//  - Hanya gambar di ik.imagekit.io yang diproses; tambahkan --semua-host untuk menyertakan alamat lain.
// Jalankan: npx tsx --env-file=.env.local scripts\isi-galeri-dari-artikel.ts [--terapkan] [--semua-host]
import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";

const arg = (n: string) => process.argv.includes(n);
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL belum terisi di .env.local");
const sql = neon(process.env.DATABASE_URL);

type Post = { id: number; title: string; content: string; cover_url: string | null; category_id: number | null; status: string; published_at: string | null };
type Pakai = { post: Post; url: string; alt: string; sampul: boolean };

const basis = (u: string) => u.split("?")[0].trim();
const hostOk = (u: string) => { try { const h = new URL(u).hostname; return arg("--semua-host") ? /^https?:/.test(u) : h === "ik.imagekit.io"; } catch { return false; } };
const buang = (t: string) => t.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80) || "gambar";
const namaBerkas = (u: string) => decodeURIComponent((basis(u).split("/").pop() ?? "")).toLowerCase();
const altBermakna = (alt: string, url: string) => {
  const a = alt.trim();
  if (a.length < 4) return false;
  const n = namaBerkas(url).replace(/\.[a-z0-9]{2,5}$/, "");
  if (a.toLowerCase().replace(/\.[a-z0-9]{2,5}$/, "") === n) return false; // alt hanya nama berkas
  if (/^(image|img|gambar|foto|photo|picture)[\s_-]*\d*$/i.test(a)) return false;
  return true;
};

function kumpulkan(p: Post): Pakai[] {
  const hasil: Pakai[] = [];
  if (p.cover_url && hostOk(p.cover_url)) hasil.push({ post: p, url: basis(p.cover_url), alt: "", sampul: true });
  const re = /<img\b[^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(p.content))) {
    const src = /\ssrc="([^"]+)"/i.exec(m[0])?.[1];
    if (!src || !hostOk(src)) continue;
    const alt = buang(/\salt="([^"]*)"/i.exec(m[0])?.[1] ?? "");
    hasil.push({ post: p, url: basis(buang(src)), alt, sampul: false });
  }
  return hasil;
}

async function hashBerkas(u: string): Promise<string | null> {
  try {
    const dipakai = new URL(u).hostname === "ik.imagekit.io" ? `${u}?tr=w-320,h-320,c-at_max,q-60,f-jpg` : u; // versi kecil: hemat kuota bandwidth
    const res = await fetch(dipakai, { redirect: "follow" });
    if (!res.ok) return null;
    return createHash("sha256").update(Buffer.from(await res.arrayBuffer())).digest("hex");
  } catch { return null; }
}

async function main() {
  const terapkan = arg("--terapkan");
  console.log(terapkan ? "TERAPKAN: mengisi galeri dari artikel...\n" : "SIMULASI: tidak ada yang diubah.\n");
  const posts = (await sql`SELECT id, title, content, cover_url, category_id, status, published_at FROM posts ORDER BY id`) as Post[];
  const semua: Pakai[] = posts.flatMap(kumpulkan);
  const urlUnik = [...new Set(semua.map((x) => x.url))];
  console.log(`${posts.length} artikel, ${semua.length} pemakaian gambar, ${urlUnik.length} alamat gambar unik.`);

  // 1) cari berkas yang isinya sama persis (diunggah dua kali di alamat berbeda)
  const hash = new Map<string, string | null>();
  let i = 0;
  const kerja = async () => { while (i < urlUnik.length) { const u = urlUnik[i++]; hash.set(u, await hashBerkas(u)); } };
  await Promise.all([kerja(), kerja(), kerja(), kerja()]);
  const rusak = urlUnik.filter((u) => !hash.get(u));
  const kanon = new Map<string, string>(); // alamat -> alamat kanonik
  const grupHash = new Map<string, string>(); // hash -> alamat kanonik
  for (const u of urlUnik) {
    const h = hash.get(u);
    if (!h) { kanon.set(u, u); continue; }
    if (!grupHash.has(h)) grupHash.set(h, u);
    kanon.set(u, grupHash.get(h)!);
  }
  const ganda = urlUnik.filter((u) => kanon.get(u) !== u);
  console.log(`Berkas ganda (isi sama persis, dipakai bersama): ${ganda.length}`);
  for (const u of ganda) console.log(`   ${namaBerkas(u)}  ->  ${namaBerkas(kanon.get(u)!)}`);
  if (rusak.length) { console.log(`Tidak bisa dibuka (dilewati pemeriksaan isi): ${rusak.length}`); for (const u of rusak.slice(0, 10)) console.log(`   ${namaBerkas(u)}`); }

  // peringatan nama mirip (mungkin versi ukuran lain dari foto yang sama)
  const inti = (u: string) => namaBerkas(u).replace(/\.[a-z0-9]{2,5}$/, "").replace(/-\d+x\d+$/, "").replace(/_(?=[a-z0-9]{6,8}$)(?=[a-z]*\d)[a-z0-9]+$/, "");
  const peta = new Map<string, Set<string>>();
  for (const u of new Set(urlUnik.map((x) => kanon.get(x)!))) { const k = inti(u); if (k.length >= 6) (peta.get(k) ?? peta.set(k, new Set()).get(k)!).add(u); }
  const mirip = [...peta.values()].filter((s) => s.size > 1);
  if (mirip.length) { console.log(`\nNama berkas mirip (mungkin foto yang sama dalam ukuran berbeda; periksa manual): ${mirip.length}`); for (const s of mirip.slice(0, 10)) console.log("   " + [...s].map(namaBerkas).join("  |  ")); }

  // 2) susun entri galeri per (artikel, berkas)
  const sudah = (await sql`SELECT url, title, slug FROM images`) as { url: string; title: string; slug: string }[];
  const kunciAda = new Set(sudah.map((r) => `${basis(r.url)}\u0000${r.title}`));
  const slugPakai = new Set(sudah.map((r) => r.slug));
  const entri: { title: string; url: string; caption: string; post: Post }[] = [];
  const kunciBaru = new Set<string>();
  for (const p of posts) {
    let n = 0;
    const dalam = new Set<string>();
    for (const x of semua.filter((s) => s.post.id === p.id)) {
      const url = kanon.get(x.url)!;
      if (dalam.has(url)) continue;
      dalam.add(url);
      n++;
      const judul = x.sampul ? p.title : altBermakna(x.alt, x.url) ? x.alt.slice(0, 180) : `${p.title} (gambar ${n})`;
      const k = `${url}\u0000${judul}`;
      if (kunciAda.has(k) || kunciBaru.has(k)) continue;
      kunciBaru.add(k);
      entri.push({ title: judul, url, caption: !x.sampul && altBermakna(x.alt, x.url) ? x.alt : "", post: p });
    }
  }
  const berkasDipakai = new Set(entri.map((e) => e.url));
  console.log(`\nEntri galeri baru: ${entri.length} (memakai ${berkasDipakai.size} file; sudah ada sebelumnya: ${sudah.length} entri).`);
  if (!terapkan) { for (const e of entri.slice(0, 12)) console.log(`   + ${e.title}`); if (entri.length > 12) console.log(`   ... dan ${entri.length - 12} lagi`); console.log("\nUntuk menyimpan: tambahkan --terapkan"); return; }

  let simpan = 0;
  for (const e of entri) {
    const dasar = slugify(e.title);
    let slug = dasar, k = 2;
    while (slugPakai.has(slug)) slug = `${dasar}-${k++}`;
    slugPakai.add(slug);
    const status = e.post.status === "published" ? "published" : "draft";
    await sql`INSERT INTO images (title, slug, url, caption, credit, status, category_id, published_at, updated_at)
              VALUES (${e.title}, ${slug}, ${e.url}, ${e.caption}, '', ${status}, ${e.post.category_id}, ${e.post.published_at}, now())`;
    simpan++;
    if (simpan % 25 === 0) console.log(`   ${simpan}/${entri.length}...`);
  }
  console.log(`\nSelesai: ${simpan} entri galeri disimpan.`);
}
main().catch((e) => { console.error(e); process.exit(1); });
