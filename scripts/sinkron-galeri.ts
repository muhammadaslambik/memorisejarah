// PAKET-13B: menyinkronkan galeri gambar.
//  1) membuat tabel gambar_berkas (indeks galeri di database: alamat, fileId ImageKit, ukuran, hash isi gambar)
//  2) memasukkan semua gambar ImageKit di /memori-sejarah (termasuk subfolder /impor) ke tabel itu
//  3) menghitung hash isi gambar (untuk mendeteksi gambar yang sama persis)
//  4) memindahkan gambar WordPress/luar yang masih dipakai artikel ke ImageKit, lalu mengganti alamatnya di artikel
//  5) (opsional) --rapikan: menggabungkan gambar kembar menjadi satu berkas; tambah --ya untuk benar-benar menjalankannya
// Aman dijalankan ulang. Jalankan: npx tsx --env-file=.env.local scripts/sinkron-galeri.ts [--rapikan [--ya]] [--tanpa-hash] [--tanpa-wp]
import { neon } from "@neondatabase/serverless";
import { createHash } from "node:crypto";

const API = "https://api.imagekit.io/v1";
const FOLDER_IMPOR = "/memori-sejarah/impor";
const MAKS = 10 * 1024 * 1024;
const arg = (n: string) => process.argv.includes(n);

if (!process.env.DATABASE_URL || !process.env.IMAGEKIT_PRIVATE_KEY) throw new Error("DATABASE_URL dan IMAGEKIT_PRIVATE_KEY harus ada di .env.local");
const sql = neon(process.env.DATABASE_URL);
const auth = "Basic " + Buffer.from(process.env.IMAGEKIT_PRIVATE_KEY + ":").toString("base64");
const sha = (b: Buffer | Uint8Array) => createHash("sha256").update(b).digest("hex");
const kb = (n: number) => (n > 1_000_000 ? `${(n / 1_000_000).toFixed(1)} MB` : `${Math.round(n / 1000)} KB`);

type FileIK = { fileId: string; name: string; filePath: string; url: string; size?: number; width?: number; height?: number; createdAt?: string };

async function daftarIK(path?: string): Promise<FileIK[]> {
  const hasil: FileIK[] = [];
  for (let skip = 0; skip < 20000; skip += 1000) {
    const q = new URL(`${API}/files`);
    q.searchParams.set("type", "file");
    q.searchParams.set("fileType", "image");
    q.searchParams.set("limit", "1000");
    q.searchParams.set("skip", String(skip));
    if (path) q.searchParams.set("path", path);
    const r = await fetch(q, { headers: { Authorization: auth } });
    if (!r.ok) throw new Error(`ImageKit menolak daftar berkas (${r.status})`);
    const j = (await r.json()) as FileIK[];
    hasil.push(...j);
    if (j.length < 1000) break;
  }
  return hasil;
}

async function dalamBatch<T>(items: T[], paralel: number, kerja: (x: T, i: number) => Promise<void>) {
  let i = 0;
  await Promise.all(Array.from({ length: paralel }, async () => { while (i < items.length) { const k = i++; await kerja(items[k], k); } }));
}

async function unduh(url: string): Promise<{ buf: Buffer; jenis: string } | null> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: "follow" });
    if (!r.ok) return null;
    const jenis = r.headers.get("content-type") ?? "";
    if (!jenis.startsWith("image/")) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    return buf.length > 0 && buf.length <= MAKS ? { buf, jenis } : null;
  } catch { return null; }
}

async function main() {
  // 1) tabel
  await sql`CREATE TABLE IF NOT EXISTS gambar_berkas (
    id serial PRIMARY KEY, url text NOT NULL UNIQUE, file_id text, nama text NOT NULL, hash text, hash_asli text,
    ukuran integer, lebar integer, tinggi integer, dibuat timestamp NOT NULL DEFAULT now())`;
  await sql`CREATE INDEX IF NOT EXISTS gambar_berkas_hash_idx ON gambar_berkas (hash)`;
  await sql`CREATE INDEX IF NOT EXISTS gambar_berkas_hash_asli_idx ON gambar_berkas (hash_asli)`;
  console.log("1) Tabel gambar_berkas siap.");

  // 2) daftar ImageKit -> tabel
  const semua = new Map<string, FileIK>();
  for (const p of [undefined, "/memori-sejarah", FOLDER_IMPOR]) for (const f of await daftarIK(p)) if (f.filePath?.startsWith("/memori-sejarah")) semua.set(f.fileId, f);
  for (const f of semua.values()) {
    await sql`INSERT INTO gambar_berkas (url, file_id, nama, ukuran, lebar, tinggi, dibuat)
      VALUES (${f.url}, ${f.fileId}, ${f.name}, ${f.size ?? null}, ${f.width ?? null}, ${f.height ?? null}, ${(f.createdAt ? new Date(f.createdAt) : new Date()).toISOString()}::timestamp)
      ON CONFLICT (url) DO UPDATE SET file_id = EXCLUDED.file_id, nama = EXCLUDED.nama,
        ukuran = COALESCE(EXCLUDED.ukuran, gambar_berkas.ukuran), lebar = COALESCE(EXCLUDED.lebar, gambar_berkas.lebar), tinggi = COALESCE(EXCLUDED.tinggi, gambar_berkas.tinggi)`;
  }
  console.log(`2) Berkas ImageKit di /memori-sejarah (termasuk subfolder): ${semua.size}`);

  // 3) hash
  if (!arg("--tanpa-hash")) {
    const belum = await sql`SELECT id, url FROM gambar_berkas WHERE hash IS NULL ORDER BY id`;
    let ok = 0, gagal = 0;
    await dalamBatch(belum, 4, async (b, i) => {
      const u = await unduh(String(b.url));
      if (!u) { gagal++; return; }
      await sql`UPDATE gambar_berkas SET hash = ${sha(u.buf)}, ukuran = COALESCE(ukuran, ${u.buf.length}) WHERE id = ${Number(b.id)}`;
      ok++;
      if ((i + 1) % 25 === 0) console.log(`   hash ${i + 1}/${belum.length}`);
    });
    console.log(`3) Hash dihitung: ${ok}${gagal ? ` | gagal diunduh: ${gagal}` : ""}`);
  }

  // 4) gambar luar -> ImageKit
  if (!arg("--tanpa-wp")) {
    const posts = await sql`SELECT id, content, cover_url FROM posts`;
    const re = /<img\b[^>]*?\ssrc="(https?:\/\/[^"]+)"/gi;
    const luar = new Set<string>();
    const ik = (u: string) => { try { return new URL(u).hostname === "ik.imagekit.io"; } catch { return false; } };
    for (const p of posts) {
      for (const m of String(p.content ?? "").matchAll(re)) if (!ik(m[1])) luar.add(m[1]);
      if (p.cover_url && /^https?:\/\//.test(String(p.cover_url)) && !ik(String(p.cover_url))) luar.add(String(p.cover_url));
    }
    console.log(`4) Gambar luar (WordPress dll.) yang dipakai artikel: ${luar.size}`);
    const peta = new Map<string, string>();
    const bermasalah: string[] = [];
    let baru = 0, dipakaiUlang = 0;
    for (const src of luar) {
      const asal = src.replace(/&amp;/g, "&");
      const u = await unduh(asal.split("?")[0]) ?? await unduh(asal);
      if (!u) { bermasalah.push(src); continue; }
      const h = sha(u.buf);
      const [ada] = await sql`SELECT url FROM gambar_berkas WHERE hash = ${h} OR hash_asli = ${h} LIMIT 1`;
      if (ada) { peta.set(src, String(ada.url)); dipakaiUlang++; continue; }
      const dasar = decodeURIComponent(new URL(asal).pathname.split("/").pop() ?? "gambar").replace(/\.[a-z0-9]+$/i, "").replace(/[^a-zA-Z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "gambar";
      const ext = u.jenis.includes("png") ? "png" : u.jenis.includes("gif") ? "gif" : u.jenis.includes("webp") ? "webp" : "jpg";
      const fd = new FormData();
      fd.set("file", new Blob([new Uint8Array(u.buf)]), `${dasar}.${ext}`);
      fd.set("fileName", `${dasar}.${ext}`);
      fd.set("folder", FOLDER_IMPOR);
      fd.set("useUniqueFileName", "true");
      const up = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", headers: { Authorization: auth }, body: fd });
      if (!up.ok) { bermasalah.push(src); continue; }
      const j = (await up.json()) as { url?: string; fileId?: string; name?: string; width?: number; height?: number; size?: number };
      if (!j.url) { bermasalah.push(src); continue; }
      await sql`INSERT INTO gambar_berkas (url, file_id, nama, hash, hash_asli, ukuran, lebar, tinggi)
        VALUES (${j.url}, ${j.fileId ?? null}, ${j.name ?? `${dasar}.${ext}`}, ${h}, ${h}, ${j.size ?? u.buf.length}, ${j.width ?? null}, ${j.height ?? null}) ON CONFLICT (url) DO NOTHING`;
      peta.set(src, j.url);
      baru++;
    }
    for (const p of posts) {
      let isi = String(p.content ?? "");
      let sampul = p.cover_url ? String(p.cover_url) : null;
      let ubah = false;
      for (const [dari, ke] of peta) {
        if (isi.includes(`"${dari}"`)) { isi = isi.split(`"${dari}"`).join(`"${ke}"`); ubah = true; }
        if (sampul === dari) { sampul = ke; ubah = true; }
      }
      if (ubah) await sql`UPDATE posts SET content = ${isi}, cover_url = ${sampul} WHERE id = ${Number(p.id)}`;
    }
    console.log(`   Diunggah baru: ${baru} | memakai berkas yang sudah ada (sama persis): ${dipakaiUlang} | bermasalah: ${bermasalah.length}`);
    for (const b of bermasalah.slice(0, 15)) console.log("   - tidak bisa diunduh/diunggah:", b);
  }

  // 5) rapikan gambar kembar
  if (arg("--rapikan")) {
    const ya = arg("--ya");
    const grup = await sql`SELECT hash, array_agg(id ORDER BY dibuat, id) AS ids FROM gambar_berkas WHERE hash IS NOT NULL GROUP BY hash HAVING count(*) > 1`;
    let hemat = 0, berkas = 0;
    for (const g of grup) {
      const ids = (g.ids as number[]).map(Number);
      const rows = await sql`SELECT id, url, file_id, ukuran FROM gambar_berkas WHERE id = ANY(${ids}) ORDER BY array_position(${ids}::int[], id)`;
      const utama = rows[0];
      for (const dup of rows.slice(1)) {
        berkas++; hemat += Number(dup.ukuran ?? 0);
        console.log(`   ${ya ? "Gabung" : "Akan digabung"}: ${dup.url}  ->  ${utama.url}`);
        if (!ya) continue;
        const a = String(dup.url), b = String(utama.url);
        await sql`UPDATE posts SET content = replace(content, ${a}::text, ${b}::text) WHERE position(${a}::text in content) > 0`;
        await sql`UPDATE posts SET cover_url = ${b} WHERE cover_url = ${a}`;
        await sql`UPDATE images SET url = ${b} WHERE url = ${a}`;
        await sql`UPDATE redaksi SET foto_url = ${b} WHERE foto_url = ${a}`;
        await sql`UPDATE settings SET value = replace(value, ${a}::text, ${b}::text) WHERE position(${a}::text in value) > 0`;
        await sql`UPDATE site_settings SET value = replace(value, ${a}::text, ${b}::text) WHERE position(${a}::text in value) > 0`;
        if (dup.file_id) await fetch(`${API}/files/${dup.file_id}`, { method: "DELETE", headers: { Authorization: auth } });
        await sql`DELETE FROM gambar_berkas WHERE id = ${Number(dup.id)}`;
      }
    }
    console.log(`5) Gambar kembar: ${berkas} berkas${ya ? " digabung" : " (belum diubah; tambahkan --ya untuk menjalankan)"} | ruang yang dihemat: ${kb(hemat)}`);
  }

  const [t] = await sql`SELECT count(*)::int AS n, coalesce(sum(ukuran),0)::bigint AS total FROM gambar_berkas`;
  console.log(`Selesai. Galeri: ${t.n} gambar, total ${kb(Number(t.total))}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
