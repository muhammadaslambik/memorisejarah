// PAKET-8A: impor artikel dari ekspor WordPress (XML). Aman dijalankan ulang.
//
//   npx tsx --env-file=.env.local scripts\import-wordpress.ts --dry-run     (hanya laporan, tidak mengubah apa pun)
//   npx tsx --env-file=.env.local scripts\import-wordpress.ts --batas 1     (impor satu artikel untuk uji)
//   npx tsx --env-file=.env.local scripts\import-wordpress.ts               (impor semua)
//
// Pilihan: --file <xml>  --timpa (perbarui artikel yang slug-nya sudah ada)  --tanpa-gambar (jangan unggah/cek gambar)
//          --map login=email (petakan penulis WordPress ke pengguna yang sudah ada)
import { readFileSync, existsSync, writeFileSync, readdirSync } from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { neon } from "@neondatabase/serverless";
import { sanitizeHtml } from "../src/lib/sanitize";
import { hashPassword } from "../src/lib/password";

const arg = process.argv.slice(2);
const DRY = arg.includes("--dry-run");
const TIMPA = arg.includes("--timpa");
const TANPA_GAMBAR = arg.includes("--tanpa-gambar");
const nilai = (k: string) => { const i = arg.indexOf(k); return i >= 0 ? arg[i + 1] : undefined; };
const BATAS = Number(nilai("--batas")) || Infinity;
const FILE = nilai("--file") ?? readdirSync(".").find((f) => /^memorisejarah_WordPress_.*\.xml$/.test(f));
const PETA = new Map<string, string>([["aslambik007", (process.env.ADMIN_EMAIL ?? "").toLowerCase()]]);
arg.forEach((a, i) => { if (a === "--map" && arg[i + 1]?.includes("=")) { const [l, e] = arg[i + 1].split("="); PETA.set(l, e.toLowerCase()); } });

const MAKS_GAMBAR = 10 * 1024 * 1024;
const CACHE = ".impor-gambar.json";

// ---------- util ----------
const ent = (s: string) => s
  .replace(/&#(\d+);/g, (_m, n: string) => String.fromCodePoint(Number(n)))
  .replace(/&#x([0-9a-f]+);/gi, (_m, n: string) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const ambil = (b: string, t: string) => {
  const m = b.match(new RegExp(`<${t}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${t}>`));
  return m ? m[1] : "";
};
const teks = (html: string) => ent(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
const tglGmt = (gmt: string, lokal: string) => {
  const s = gmt && !gmt.startsWith("0000") ? gmt : lokal;
  return new Date(s.replace(" ", "T") + "Z");
};
const ringkas = (s: string, n: number) => (s.length > n ? s.slice(0, n).replace(/\s+\S*$/, "") + "..." : s);

// ---------- baca XML ----------
type Penulis = { login: string; nama: string; email: string };
type Artikel = { title: string; slug: string; content: string; excerpt: string; login: string; terbit: Date; ubah: Date; kategori: string[]; cover: string | null };

function bacaXml(path: string) {
  const xml = readFileSync(path, "utf8");
  const penulis: Penulis[] = (xml.match(/<wp:author>[\s\S]*?<\/wp:author>/g) ?? []).map((b) => ({
    login: ambil(b, "wp:author_login"), nama: ent(ambil(b, "wp:author_display_name")), email: ambil(b, "wp:author_email").trim().toLowerCase(),
  }));
  const items = xml.match(/<item>[\s\S]*?<\/item>/g) ?? [];
  const lampiran = new Map<string, string>();
  for (const it of items) if (ambil(it, "wp:post_type") === "attachment") lampiran.set(ambil(it, "wp:post_id"), ambil(it, "wp:attachment_url"));
  const artikel: Artikel[] = [];
  for (const it of items) {
    if (ambil(it, "wp:post_type") !== "post" || ambil(it, "wp:status") !== "publish") continue;
    const thumb = it.match(/<wp:meta_key><!\[CDATA\[_thumbnail_id\]\]><\/wp:meta_key>\s*<wp:meta_value><!\[CDATA\[(\d+)\]\]>/);
    let slug = ambil(it, "wp:post_name");
    try { slug = decodeURIComponent(slug); } catch { /* biarkan apa adanya */ }
    artikel.push({
      title: ent(ambil(it, "title")).trim(),
      slug,
      content: ambil(it, "content:encoded"),
      excerpt: ambil(it, "excerpt:encoded"),
      login: ambil(it, "dc:creator"),
      terbit: tglGmt(ambil(it, "wp:post_date_gmt"), ambil(it, "wp:post_date")),
      ubah: tglGmt(ambil(it, "wp:post_modified_gmt"), ambil(it, "wp:post_modified")),
      kategori: (it.match(/<category domain="category" nicename="[^"]+"/g) ?? []).map((c) => c.replace(/.*nicename="/, "").replace(/"$/, "")),
      cover: thumb ? lampiran.get(thumb[1]) ?? null : null,
    });
  }
  return { penulis, artikel };
}

// ---------- gambar ----------
const normal = (u: string) => ent(u).split("?")[0];
const dariWP = (u: string) => /^https?:\/\/[^/]*(wordpress\.com|wp\.com)\//i.test(u);
const gambarDalam = (html: string) => (html.match(/<img\b[^>]*?\ssrc="([^"]+)"/g) ?? []).map((m) => normal(m.replace(/.*\ssrc="/, "").replace(/"$/, ""))).filter(dariWP);

type Hasil = { url?: string; galat?: string; bytes?: number };
const cache: Record<string, string> = existsSync(CACHE) ? JSON.parse(readFileSync(CACHE, "utf8")) : {};
const simpanCache = () => writeFileSync(CACHE, JSON.stringify(cache, null, 1));

async function unggahKeImageKit(sumber: string): Promise<Hasil> {
  if (cache[sumber]) return { url: cache[sumber] };
  const res = await fetch(sumber, { redirect: "follow" });
  if (!res.ok) return { galat: `unduh gagal (${res.status})` };
  const buf = new Uint8Array(await res.arrayBuffer());
  if (buf.length > MAKS_GAMBAR) return { galat: "lebih dari 10 MB", bytes: buf.length };
  const tipe = res.headers.get("content-type") ?? "";
  if (!tipe.startsWith("image/")) return { galat: `bukan gambar (${tipe})` };
  const dasar = decodeURIComponent(new URL(sumber).pathname.split("/").pop() ?? "gambar").replace(/[^\w.-]+/g, "-").slice(-60);
  const nama = `wp-${createHash("sha1").update(sumber).digest("hex").slice(0, 10)}-${dasar}`;
  const fd = new FormData();
  fd.set("file", new Blob([buf], { type: tipe }), nama);
  fd.set("fileName", nama);
  fd.set("folder", "/memori-sejarah/impor");
  fd.set("useUniqueFileName", "false");
  fd.set("overwriteFile", "true");
  const up = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
    method: "POST", headers: { Authorization: "Basic " + Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ":").toString("base64") }, body: fd,
  });
  if (!up.ok) return { galat: `ImageKit menolak (${up.status})` };
  const j = (await up.json()) as { url?: string };
  if (!j.url) return { galat: "ImageKit tidak mengembalikan alamat" };
  cache[sumber] = j.url;
  simpanCache();
  return { url: j.url, bytes: buf.length };
}

async function cekGambar(sumber: string): Promise<Hasil> {
  const res = await fetch(sumber, { method: "HEAD", redirect: "follow" });
  if (!res.ok) return { galat: `tidak bisa diunduh (${res.status})` };
  const b = Number(res.headers.get("content-length") ?? 0);
  return b > MAKS_GAMBAR ? { galat: "lebih dari 10 MB", bytes: b } : { bytes: b };
}

async function prosesGambar(urls: string[]) {
  const hasil = new Map<string, Hasil>();
  const antre = [...urls];
  const pekerja = async () => {
    for (let u = antre.shift(); u; u = antre.shift()) {
      try { hasil.set(u, DRY ? await cekGambar(u) : await unggahKeImageKit(u)); }
      catch (e) { hasil.set(u, { galat: String(e) }); }
    }
  };
  await Promise.all([pekerja(), pekerja(), pekerja()]);
  return hasil;
}

// ---------- isi artikel ----------
const POLA_LAMA = /^https?:\/\/memorisejarah\.wordpress\.com\/\d{4}\/\d{2}\/\d{2}\/([^/?#]+)\/?/i;
const SAFE = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;

function olahIsi(html: string, peta: Map<string, Hasil>, masalah: string[], slug: string) {
  let h = html.replace(/<!--[\s\S]*?-->/g, "");
  h = h.replace(/(<img\b[^>]*?\ssrc=")([^"]+)(")/g, (m, a: string, src: string, c: string) => {
    const baru = peta.get(normal(src))?.url;
    return baru ? a + baru + c : m;
  });
  h = h.replace(/(<a\b[^>]*?\shref=")([^"]*)("[^>]*>)([\s\S]*?)(<\/a>)/g, (_m, a: string, href: string, c: string, isi: string, e: string) => {
    let u = href.trim();
    if (u.startsWith("#")) return a + u + c + isi + e;
    const lama = u.match(POLA_LAMA);
    if (lama) u = `/artikel/${lama[1]}`;
    else {
      u = u.replace(/^(https?):\/(?!\/)/i, "$1://").replace(/^www\./i, "https://www.");
      if (/^10\.\d{4,9}\//.test(u)) u = "https://doi.org/" + u;
      if (/^https?:\/\//i.test(u)) u = u.replace(/\.+$/, "").replace(/ /g, "%20");
    }
    if (!SAFE.test(ent(u))) masalah.push(`${slug}: tautan tidak valid "${teks(isi).slice(0, 40)}" -> ${href.slice(0, 60)}`);
    return a + u + c + isi + e;
  });
  return sanitizeHtml(h);
}

// ---------- utama ----------
async function main() {
  if (!FILE || !existsSync(FILE)) throw new Error("Berkas XML tidak ditemukan. Taruh di folder proyek atau pakai --file <jalur>.");
  const adaDb = !!process.env.DATABASE_URL;
  if (!adaDb && !DRY) throw new Error("DATABASE_URL belum terisi di .env.local");
  if (!DRY && !TANPA_GAMBAR && !process.env.IMAGEKIT_PRIVATE_KEY) throw new Error("IMAGEKIT_PRIVATE_KEY belum terisi di .env.local (atau pakai --tanpa-gambar)");

  console.log(`${DRY ? "[DRY-RUN] " : ""}Membaca ${FILE}`);
  const { penulis, artikel: semua } = bacaXml(FILE);
  const artikel = semua.slice(0, BATAS);
  console.log(`Artikel terbit: ${semua.length}${artikel.length < semua.length ? ` (diproses ${artikel.length})` : ""} | penulis di XML: ${penulis.length}`);

  const sql = adaDb ? neon(process.env.DATABASE_URL!) : null;

  // --- gambar ---
  const urls = [...new Set(artikel.flatMap((a) => [...gambarDalam(a.content), ...(a.cover && dariWP(a.cover) ? [normal(a.cover)] : [])]))];
  console.log(`Gambar unik: ${urls.length}`);
  const peta = TANPA_GAMBAR ? new Map<string, Hasil>() : await prosesGambar(urls);
  const gagal = [...peta].filter(([, h]) => h.galat);
  if (!TANPA_GAMBAR) console.log(`Gambar ${DRY ? "terjangkau" : "terunggah"}: ${peta.size - gagal.length} | bermasalah: ${gagal.length}`);
  gagal.forEach(([u, h]) => console.log(`  GAMBAR: ${u.split("/").pop()} -> ${h.galat}`));

  // --- kategori (dari DB) ---
  const kats = sql ? await sql`SELECT id, slug, parent_id FROM categories` : [];
  const idKat = new Map<string, { id: number; daun: boolean }>(kats.map((k) => [String(k.slug), { id: Number(k.id), daun: k.parent_id !== null }]));

  // --- penulis ---
  const idPenulis = new Map<string, number | null>();
  console.log("\nPenulis:");
  for (const p of penulis) {
    const jml = semua.filter((a) => a.login === p.login).length;
    const emailPakai = PETA.get(p.login) || p.email;
    let [u]: { id: number; name: string }[] = sql && emailPakai ? ((await sql`SELECT id, name FROM users WHERE lower(email) = ${emailPakai}`) as { id: number; name: string }[]) : [];
    if (!u && sql && p.email && emailPakai !== p.email) [u] = (await sql`SELECT id, name FROM users WHERE lower(email) = ${p.email}`) as { id: number; name: string }[];
    if (u) { idPenulis.set(p.login, u.id); console.log(`  ${p.login} (${p.nama}, ${jml} artikel): pakai pengguna yang sudah ada "${u.name}"`); continue; }
    if (DRY || !sql) { idPenulis.set(p.login, null); console.log(`  ${p.login} (${p.nama}, ${jml} artikel): AKAN DIBUAT akun penulis (email ${p.email ? "ada" : "tidak ada"})`); continue; }
    const aktif = !!p.email;
    const email = p.email || `${p.login}@arsip.memorisejarah.invalid`;
    const hash = await hashPassword(randomUUID() + randomUUID()); // kata sandi acak: masuk lewat Google atau minta admin mengatur ulang
    const [baru] = await sql`INSERT INTO users (email, name, password_hash, role, active, trusted) VALUES (${email}, ${p.nama}, ${hash}, 'penulis', ${aktif}, false) RETURNING id`;
    idPenulis.set(p.login, Number(baru.id));
    console.log(`  ${p.login} (${p.nama}, ${jml} artikel): akun penulis dibuat${aktif ? "" : " (NONAKTIF: tidak ada email)"}`);
  }

  // --- artikel ---
  console.log("\nArtikel:");
  const masalahTautan: string[] = [];
  let baru = 0, diperbarui = 0, dilewati = 0, catatanKaki = 0;
  for (const a of artikel) {
    const isi = olahIsi(a.content, peta, masalahTautan, a.slug);
    catatanKaki += (isi.match(/id="_ftnref\d+"/g) ?? []).length;
    const sisaWP = (isi.match(/<img\b[^>]*src="https?:\/\/[^"]*(wordpress|wp)\.com/g) ?? []).length;
    const ringkasan = teks(a.excerpt) || ringkas(teks(a.content), 220);
    const cover = a.cover ? (peta.get(normal(a.cover))?.url ?? a.cover) : null;
    const wpKat = a.kategori.filter((s) => idKat.has(s) || !sql);
    const tujuan = a.kategori.map((s) => idKat.get(s)).filter((x): x is { id: number; daun: boolean } => !!x);
    const utama = (tujuan.find((k) => k.daun) ?? tujuan[0])?.id ?? null;
    const penulisId = idPenulis.get(a.login) ?? null;
    const label = `${a.terbit.toISOString().slice(0, 10)}  ${a.slug.slice(0, 55)}`;

    if (DRY || !sql) { console.log(`  [uji] ${label}  | kategori ${wpKat.length} | gambar WP tersisa ${sisaWP}`); continue; }
    const [ada] = await sql`SELECT id FROM posts WHERE slug = ${a.slug}`;
    if (ada && !TIMPA) { console.log(`  [lewat, sudah ada] ${label}`); dilewati++; continue; }
    let id: number;
    if (ada) {
      id = Number(ada.id);
      await sql`UPDATE posts SET title = ${a.title}, excerpt = ${ringkasan}, content = ${isi}, cover_url = ${cover}, category_id = ${utama}, published_at = ${a.terbit.toISOString()}, updated_at = ${a.ubah.toISOString()} WHERE id = ${id}`;
      diperbarui++;
    } else {
      const [r] = await sql`INSERT INTO posts (title, slug, excerpt, content, cover_url, featured, status, category_id, author_id, published_at, updated_at) VALUES (${a.title}, ${a.slug}, ${ringkasan}, ${isi}, ${cover}, false, 'published', ${utama}, ${penulisId}, ${a.terbit.toISOString()}, ${a.ubah.toISOString()}) RETURNING id`;
      id = Number(r.id);
      baru++;
    }
    await sql`DELETE FROM post_categories WHERE post_id = ${id}`;
    for (const k of tujuan) await sql`INSERT INTO post_categories (post_id, category_id) VALUES (${id}, ${k.id}) ON CONFLICT DO NOTHING`;
    console.log(`  [${ada ? "diperbarui" : "baru"}] ${label}  | kategori ${tujuan.length} | gambar WP tersisa ${sisaWP}`);
  }

  console.log("\n===== RINGKASAN =====");
  console.log(DRY ? "Mode uji: tidak ada data yang diubah." : `Baru: ${baru} | diperbarui: ${diperbarui} | dilewati: ${dilewati}`);
  console.log(`Catatan kaki terdeteksi: ${catatanKaki} | tautan bermasalah: ${masalahTautan.length} | gambar bermasalah: ${gagal.length}`);
  masalahTautan.forEach((m) => console.log("  TAUTAN: " + m));
  if (!sql) console.log("(DATABASE_URL tidak ada: pemetaan penulis dan kategori dilewati)");
}
main().catch((e) => { console.error(e); process.exit(1); });