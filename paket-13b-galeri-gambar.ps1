# paket-13b-galeri-gambar.ps1  (PAKET-13B)
# Isi: galeri gambar dari database (termasuk impor WordPress), pencegah gambar kembar, konfirmasi hapus gambar, skrip sinkron-galeri. Jalankan SETELAH 13A.
# Jalankan dari folder proyek:  powershell -ExecutionPolicy Bypass -File .\paket-13b-galeri-gambar.ps1
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
$utf8 = New-Object System.Text.UTF8Encoding($false)

function P([string]$rel) {
  return [System.IO.Path]::Combine($root, $rel.Replace('/', [string][System.IO.Path]::DirectorySeparatorChar))
}
function Tulis([string]$rel, [string]$isi) {
  $p = P $rel
  $dir = [System.IO.Path]::GetDirectoryName($p)
  if (-not [System.IO.Directory]::Exists($dir)) { [void][System.IO.Directory]::CreateDirectory($dir) }
  if ([System.IO.File]::Exists($p)) {
    $lama = [System.IO.File]::ReadAllText($p)
    if (($lama -notmatch 'PAKET-') -and ($lama -notmatch 'Segera hadir')) {
      Write-Host ("DILEWATI (bukan berkas paket): " + $rel) -ForegroundColor Yellow
      return
    }
  }
  [System.IO.File]::WriteAllText($p, $isi, $utf8)
  Write-Host ("Ditulis : " + $rel) -ForegroundColor Green
}
function Ganti([string]$rel, [string]$lama, [string]$baru) {
  $p = P $rel
  if (-not [System.IO.File]::Exists($p)) { Write-Host ("TIDAK ADA: " + $rel) -ForegroundColor Red; return }
  $t = [System.IO.File]::ReadAllText($p)
  if ($t.Contains($baru)) { Write-Host ("Sudah   : " + $rel) -ForegroundColor DarkGray; return }
  $i = $t.IndexOf($lama)
  if ($i -lt 0) { Write-Host ("GAGAL (teks lama tidak ditemukan): " + $rel) -ForegroundColor Red; return }
  $t = $t.Substring(0, $i) + $baru + $t.Substring($i + $lama.Length)
  [System.IO.File]::WriteAllText($p, $t, $utf8)
  Write-Host ("Diubah  : " + $rel) -ForegroundColor Green
}
function Tambah([string]$rel, [string]$tanda, [string]$teks) {
  $p = P $rel
  if (-not [System.IO.File]::Exists($p)) { Write-Host ("TIDAK ADA: " + $rel) -ForegroundColor Red; return }
  $t = [System.IO.File]::ReadAllText($p)
  if ($t.Contains($tanda)) { Write-Host ("Sudah   : " + $rel) -ForegroundColor DarkGray; return }
  $t = $t.TrimEnd() + "`r`n`r`n" + $teks + "`r`n"
  [System.IO.File]::WriteAllText($p, $t, $utf8)
  Write-Host ("Ditambah: " + $rel) -ForegroundColor Green
}
function GantiRegex2([string]$rel, [string]$pola, [string]$baru) {
  $p = P $rel
  if (-not [System.IO.File]::Exists($p)) { Write-Host ("TIDAK ADA: " + $rel) -ForegroundColor Red; return }
  $t = [System.IO.File]::ReadAllText($p)
  if ($t.Contains($baru)) { Write-Host ("Sudah   : " + $rel) -ForegroundColor DarkGray; return }
  $re = New-Object System.Text.RegularExpressions.Regex($pola, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  if (-not $re.IsMatch($t)) { Write-Host ("GAGAL (pola tidak cocok): " + $rel) -ForegroundColor Red; return }
  $ev = [System.Text.RegularExpressions.MatchEvaluator]{ param($m) $baru }
  $t = $re.Replace($t, $ev, 1)
  [System.IO.File]::WriteAllText($p, $t, $utf8)
  Write-Host ("Diubah  : " + $rel) -ForegroundColor Green
}

Write-Host "== Paket 13B ==" -ForegroundColor Cyan
$f0 = @'
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

'@
Tulis 'scripts/sinkron-galeri.ts' $f0
$f1 = @'
// PAKET-13B: indeks galeri gambar di database (tabel gambar_berkas): daftar cepat, pencarian nama,
// pencegah gambar kembar (hash isi gambar), dan fileId ImageKit untuk penghapusan langsung.
// Semua fungsi aman dipanggil sebelum tabel dibuat: bila galat, hasilnya kosong/null dan unggah tetap berjalan.
import { desc, eq, ilike, or } from "drizzle-orm";
import { db, gambarBerkas } from "@/db";

export type BerkasGaleri = { id: string; nama: string; url: string };

export async function daftarGaleriDB(skip: number, limit: number, cari: string): Promise<{ berkas: BerkasGaleri[]; lagi: boolean } | null> {
  try {
    const q = cari.trim();
    const kondisi = q ? ilike(gambarBerkas.nama, `%${q.replace(/[%_\\]/g, "\\$&")}%`) : undefined;
    const rows = await db()
      .select({ id: gambarBerkas.id, nama: gambarBerkas.nama, url: gambarBerkas.url })
      .from(gambarBerkas)
      .where(kondisi)
      .orderBy(desc(gambarBerkas.dibuat), desc(gambarBerkas.id))
      .limit(limit + 1)
      .offset(skip);
    if (rows.length === 0 && skip === 0 && !q) return null; // tabel masih kosong: pakai daftar langsung dari ImageKit
    return { berkas: rows.slice(0, limit).map((r) => ({ id: String(r.id), nama: r.nama, url: r.url })), lagi: rows.length > limit };
  } catch {
    return null;
  }
}

// Berkas dengan isi yang sama persis (hash isi tersimpan, atau hash berkas asli sebelum dikecilkan di peramban)
export async function cariBerkasSama(hash: string, hashAsli?: string | null): Promise<{ url: string } | null> {
  try {
    const kondisi = hashAsli
      ? or(eq(gambarBerkas.hash, hash), eq(gambarBerkas.hashAsli, hashAsli), eq(gambarBerkas.hash, hashAsli))
      : eq(gambarBerkas.hash, hash);
    const [r] = await db().select({ url: gambarBerkas.url }).from(gambarBerkas).where(kondisi).limit(1);
    return r ?? null;
  } catch {
    return null;
  }
}

export async function catatBerkas(b: { url: string; fileId?: string | null; nama: string; hash?: string | null; hashAsli?: string | null; ukuran?: number | null; lebar?: number | null; tinggi?: number | null }): Promise<void> {
  try { await db().insert(gambarBerkas).values(b).onConflictDoNothing(); } catch { /* tabel belum ada */ }
}

export async function idBerkasDB(url: string): Promise<string | null> {
  try {
    const [r] = await db().select({ fileId: gambarBerkas.fileId }).from(gambarBerkas).where(eq(gambarBerkas.url, url)).limit(1);
    return r?.fileId ?? null;
  } catch {
    return null;
  }
}

export async function hapusCatatan(url: string): Promise<void> {
  try { await db().delete(gambarBerkas).where(eq(gambarBerkas.url, url)); } catch { /* abaikan */ }
}

'@
Tulis 'src/lib/galeri.ts' $f1
$f2 = @'
// PAKET-13B: unggah gambar ke ImageKit (kunci privat hanya di server) dengan pencegah gambar kembar.
// Gambar yang isinya sama persis dengan yang sudah ada tidak diunggah lagi; alamat berkas yang ada dipakai ulang.
import { cariBerkasSama, catatBerkas } from "./galeri";

const MAKS = 10 * 1024 * 1024; // 10 MB (batas gratis ImageKit: 25 MB)

const jenis = (b: Uint8Array): "jpg" | "png" | "gif" | "webp" | null => {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  return null;
};

const sha256 = async (b: Uint8Array) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", b as BufferSource))].map((x) => x.toString(16).padStart(2, "0")).join("");

export const penyimpananSiap = () => !!process.env.IMAGEKIT_PRIVATE_KEY;

export type HasilUnggah = { url: string; dipakaiUlang?: boolean } | { galat: "belum" | "berkas" | "unggah" };

// hashAsli (opsional): SHA-256 berkas asli sebelum dikecilkan di peramban, supaya unggahan ulang berkas yang sama terdeteksi
export async function unggahKeImageKit(file: File, slug: string, hashAsli?: string): Promise<HasilUnggah> {
  const kunci = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!kunci) return { galat: "belum" };
  if (file.size === 0 || file.size > MAKS) return { galat: "berkas" };
  const buf = new Uint8Array(await file.arrayBuffer());
  const ext = jenis(buf);
  if (!ext) return { galat: "berkas" }; // hanya JPG, PNG, GIF, WEBP (SVG ditolak)

  const hash = await sha256(buf);
  const asli = hashAsli && /^[a-f0-9]{64}$/.test(hashAsli) ? hashAsli : null;
  const sama = await cariBerkasSama(hash, asli);
  if (sama) return { url: sama.url, dipakaiUlang: true };

  const fd = new FormData();
  fd.set("file", new Blob([buf as BlobPart]), `x.${ext}`);
  fd.set("fileName", `${slug.slice(0, 60) || "gambar"}-${Date.now().toString(36)}.${ext}`);
  fd.set("folder", "/memori-sejarah");
  fd.set("useUniqueFileName", "true");
  try {
    const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: { Authorization: "Basic " + btoa(kunci + ":") },
      body: fd,
    });
    if (!res.ok) return { galat: "unggah" };
    const j = (await res.json()) as { url?: string; fileId?: string; name?: string; width?: number; height?: number; size?: number };
    if (!j.url || !j.url.startsWith("https://")) return { galat: "unggah" };
    await catatBerkas({ url: j.url, fileId: j.fileId ?? null, nama: j.name ?? `${slug}.${ext}`, hash, hashAsli: asli, ukuran: j.size ?? buf.length, lebar: j.width ?? null, tinggi: j.height ?? null });
    return { url: j.url, dipakaiUlang: false };
  } catch {
    return { galat: "unggah" };
  }
}

'@
Tulis 'src/lib/gambar-simpan.ts' $f2
$f3 = @'
// PAKET-13B: unggah gambar dari editor artikel (semua pengguna yang masuk), dengan pencegah gambar kembar
"use server";
import { requireUser } from "./auth";
import { unggahKeImageKit } from "./gambar-simpan";

export async function unggahGambarArtikel(fd: FormData): Promise<{ url: string; dipakaiUlang?: boolean } | { galat: string }> {
  await requireUser();
  const f = fd.get("berkas");
  if (!(f instanceof File)) return { galat: "Berkas tidak ditemukan." };
  const h = await unggahKeImageKit(f, "artikel", String(fd.get("hashAsli") ?? ""));
  if ("galat" in h) {
    return { galat: h.galat === "belum" ? "Penyimpanan ImageKit belum disiapkan." : h.galat === "berkas" ? "Berkas tidak valid (JPG, PNG, WEBP, GIF; maksimal 10 MB)." : "Unggah gagal. Coba lagi." };
  }
  return { url: h.url, dipakaiUlang: h.dipakaiUlang };
}

'@
Tulis 'src/lib/unggah-actions.ts' $f3
$f4 = @'
// PAKET-13B: daftar gambar galeri untuk pemilih gambar (dibaca dari database; cadangan: langsung dari ImageKit)
"use server";
import { requireUser } from "./auth";
import { daftarGaleriDB, type BerkasGaleri } from "./galeri";
import { daftarBerkasIK } from "./imagekit";

export async function ambilGaleri(skip: number, cari = ""): Promise<{ berkas: BerkasGaleri[]; lagi: boolean } | { galat: string }> {
  await requireUser();
  const s = Math.max(0, Math.floor(Number(skip)) || 0);
  const r = await daftarGaleriDB(s, 24, String(cari ?? "").slice(0, 80));
  if (r) return r;
  return daftarBerkasIK(s);
}

'@
Tulis 'src/lib/galeri-actions.ts' $f4
$f5 = @'
// PAKET-13B: pemeriksaan sebelum gambar dilepas dari artikel (dipakai dialog konfirmasi)
"use server";
import { requireUser } from "./auth";
import { rincianPemakaian, type Pemakaian } from "./imagekit";

export async function periksaGambarDihapus(postId: number | null, urls: string[]): Promise<Pemakaian[]> {
  await requireUser();
  const bersih = (Array.isArray(urls) ? urls : []).filter((u): u is string => typeof u === "string").slice(0, 12);
  try {
    return await rincianPemakaian(bersih, typeof postId === "number" ? postId : null);
  } catch {
    return []; // gagal memeriksa: simpan seperti biasa tanpa menghapus apa pun
  }
}

'@
Tulis 'src/lib/gambar-hapus-actions.ts' $f5
$f6 = @'
// PAKET-13B: pembantu sisi peramban untuk gambar
export async function hashBerkas(f: File): Promise<string> {
  try {
    const h = await crypto.subtle.digest("SHA-256", await f.arrayBuffer());
    return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return ""; // peramban tanpa SubtleCrypto: pencegah kembar tetap bekerja di server memakai isi hasil unggahan
  }
}

export const tanpaQuery = (u: string) => u.split("?")[0].trim();

// Alamat gambar ImageKit di dalam HTML artikel (tanpa parameter), sama dengan urlIKDalam di server
export const urlIKDi = (html: string): string[] => {
  const hasil = new Set<string>();
  for (const m of html.matchAll(/src="(https:\/\/ik\.imagekit\.io\/[^"?]+)/gi)) hasil.add(m[1]);
  return [...hasil];
};

'@
Tulis 'src/lib/gambar-klien.ts' $f6
$f7 = @'
// PAKET-13B: jendela pemilih gambar galeri (semua gambar di ImageKit, termasuk hasil impor WordPress), dengan pencarian nama
"use client";
import { useEffect, useRef, useState } from "react";
import { ambilGaleri } from "@/lib/galeri-actions";
import { kecil } from "@/lib/gambar-url";

type Berkas = { id: string; nama: string; url: string };

export function GaleriGambar({ tutup, pilih }: { tutup: () => void; pilih: (url: string) => void }) {
  const [daftar, setDaftar] = useState<Berkas[]>([]);
  const [lagi, setLagi] = useState(false);
  const [muat, setMuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [cari, setCari] = useState("");
  const versi = useRef(0);

  const ambil = async (skip: number, kata: string) => {
    const saya = ++versi.current;
    setMuat(true);
    try {
      const r = await ambilGaleri(skip, kata);
      if (saya !== versi.current) return; // hasil lama dari pencarian sebelumnya
      if ("galat" in r) setGalat(r.galat);
      else { setDaftar((d) => (skip === 0 ? r.berkas : [...d, ...r.berkas])); setLagi(r.lagi); setGalat(""); }
    } catch {
      if (saya === versi.current) setGalat("Gagal memuat galeri. Coba lagi.");
    } finally {
      if (saya === versi.current) setMuat(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { ambil(0, cari); }, cari ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cari]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") tutup(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [tutup]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Gambar galeri" onMouseDown={(e) => { if (e.target === e.currentTarget) tutup(); }}>
      <div className="a-card flex max-h-[85vh] w-full max-w-4xl flex-col p-4 shadow-2xl">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-lg font-semibold">Gambar Galeri</h2>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama berkas..."
            aria-label="Cari gambar"
            spellCheck={false}
            className="ml-auto min-w-0 flex-1 rounded border p-2 text-sm sm:max-w-xs"
          />
          <button type="button" className="a-btn-soft" onClick={tutup}>Tutup</button>
        </div>
        {galat && <p className="mb-2 rounded bg-amber-50 px-3 py-1.5 text-amber-900">{galat}</p>}
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {daftar.map((g) => (
            <button key={g.id} type="button" onClick={() => pilih(g.url)} title={g.nama} className="group overflow-hidden rounded border text-left focus-visible:outline focus-visible:outline-2">
              <img src={kecil(g.url, 320)} alt={g.nama} loading="lazy" className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
            </button>
          ))}
        </div>
        {!muat && !galat && daftar.length === 0 && <p className="py-8 text-center opacity-70">{cari ? "Tidak ada gambar yang cocok." : "Belum ada gambar di galeri."}</p>}
        <div className="mt-3 text-center">
          {muat ? <span className="opacity-70">Memuat...</span> : lagi && <button type="button" className="a-btn-soft" onClick={() => ambil(daftar.length, cari)}>Muat lebih banyak</button>}
        </div>
      </div>
    </div>
  );
}

'@
Tulis 'src/components/admin/GaleriGambar.tsx' $f7
$f8 = @'
// PAKET-13B: pilihan gambar utama artikel: Masukkan URL, Upload Gambar (membuka penjelajah berkas), atau Gambar Galeri.
"use client";
import { useRef, useState } from "react";
import { unggahGambarArtikel } from "@/lib/unggah-actions";
import { kecil } from "@/lib/gambar-url";
import { hashBerkas } from "@/lib/gambar-klien";
import { kb, perkecil } from "@/components/Editor";
import { GaleriGambar } from "./GaleriGambar";

export function PilihSampul({ defaultUrl = "" }: { defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl);
  const [mode, setMode] = useState<"" | "url">("");
  const [ketik, setKetik] = useState("");
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galeri, setGaleri] = useState(false);
  const berkas = useRef<HTMLInputElement>(null);

  const pakaiUrl = () => {
    const v = ketik.trim();
    if (!/^https:\/\//i.test(v)) { setPesan("Alamat gambar harus diawali https://"); return; }
    setUrl(v); setKetik(""); setMode(""); setPesan("");
  };

  const unggah = async (f: File) => {
    setSibuk(true);
    try {
      setPesan("Mengecilkan gambar...");
      const hashAsli = await hashBerkas(f);
      const k = await perkecil(f);
      setPesan(`Mengunggah gambar (${kb(k.size)})...`);
      const fd = new FormData();
      fd.set("berkas", k);
      if (hashAsli) fd.set("hashAsli", hashAsli);
      const r = await unggahGambarArtikel(fd);
      if ("url" in r) { setUrl(r.url); setPesan(r.dipakaiUlang ? "Gambar yang sama sudah ada di galeri; berkas yang ada dipakai ulang (hemat ruang)." : ""); } else setPesan(r.galat);
    } catch {
      setPesan("Unggah gagal. Periksa koneksi lalu coba lagi.");
    } finally {
      setSibuk(false);
    }
  };

  const tombol = "a-btn-soft";
  return (
    <div className="rounded border p-3 text-sm">
      <input type="hidden" name="coverUrl" value={url} />
      <p className="mb-2 font-medium">Gambar utama artikel</p>
      <div className="flex flex-wrap items-start gap-4">
        {url ? (
          <img src={kecil(url, 480)} alt="Pratinjau gambar utama" className="h-28 w-44 rounded object-cover" />
        ) : (
          <div className="grid h-28 w-44 place-items-center rounded border border-dashed opacity-60">Belum ada gambar</div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={tombol} onClick={() => { setMode(mode === "url" ? "" : "url"); setPesan(""); }}>Masukkan URL</button>
          <button type="button" className={tombol} disabled={sibuk} onClick={() => berkas.current?.click()}>{sibuk ? "Memproses..." : "Upload Gambar"}</button>
          <button type="button" className={tombol} onClick={() => { setGaleri(true); setPesan(""); }}>Gambar Galeri</button>
          {url && <button type="button" className={tombol} onClick={() => { setUrl(""); setPesan(""); }}>Hapus gambar utama</button>}
        </div>
      </div>
      {mode === "url" && (
        <div className="mt-3 flex gap-2">
          <input
            value={ketik}
            onChange={(e) => setKetik(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); pakaiUrl(); } }}
            placeholder="https://..."
            aria-label="Alamat gambar utama"
            spellCheck={false}
            className="min-w-0 flex-1 rounded border p-2"
            autoFocus
          />
          <button type="button" className={tombol} onClick={pakaiUrl}>Gunakan</button>
        </div>
      )}
      <input
        ref={berkas}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) unggah(f); e.target.value = ""; }}
      />
      {pesan && <p className="mt-2 rounded bg-amber-50 px-3 py-1.5 text-amber-900" role="status">{pesan}</p>}
      {galeri && <GaleriGambar tutup={() => setGaleri(false)} pilih={(u) => { setUrl(u); setGaleri(false); setPesan(""); }} />}
    </div>
  );
}

'@
Tulis 'src/components/admin/PilihSampul.tsx' $f8
$f9 = @'
// PAKET-13B: dialog konfirmasi saat gambar dilepas dari artikel.
// Pilihan: lepas dari artikel ini saja (berkas tetap di galeri/ImageKit), atau hapus juga dari ImageKit
// (hanya untuk gambar yang tidak dipakai artikel lain atau bagian situs lain).
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { periksaGambarDihapus } from "@/lib/gambar-hapus-actions";
import { tanpaQuery, urlIKDi } from "@/lib/gambar-klien";
import { kecil } from "@/lib/gambar-url";

type Rincian = { url: string; nama: string; dipakaiDi: { id: number; title: string }[]; lainnya: boolean };

export function PenjagaGambar({ postId, awal }: { postId: number | null; awal: string[] }) {
  const masuk = useRef<HTMLInputElement>(null);
  const lewat = useRef(false);
  const pengirim = useRef<HTMLElement | null>(null);
  const [daftar, setDaftar] = useState<Rincian[] | null>(null);
  const awalIK = useMemo(
    () => [...new Set(awal.map(tanpaQuery))].filter((u) => /^https:\/\/ik\.imagekit\.io\//i.test(u)),
    [awal],
  );

  useEffect(() => {
    const form = masuk.current?.form;
    if (!form || awalIK.length === 0) return;
    const kirimLagi = () => {
      lewat.current = true;
      if (pengirim.current && pengirim.current.isConnected) form.requestSubmit(pengirim.current as HTMLButtonElement);
      else form.requestSubmit();
    };
    const onSubmit = async (e: SubmitEvent) => {
      if (lewat.current) { lewat.current = false; return; }
      const isi = (form.elements.namedItem("content") as HTMLInputElement | null)?.value ?? "";
      const sampul = (form.elements.namedItem("coverUrl") as HTMLInputElement | null)?.value ?? "";
      const sekarang = new Set([...urlIKDi(isi), tanpaQuery(sampul)]);
      const hilang = awalIK.filter((u) => !sekarang.has(u));
      if (hilang.length === 0) return;
      e.preventDefault(); // tahan dulu; ditanyakan ke pengguna
      pengirim.current = e.submitter;
      const r = await periksaGambarDihapus(postId, hilang);
      if (r.length === 0) { kirimLagi(); return; }
      setDaftar(r);
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [awalIK, postId]);

  const lanjut = (hapusDariImageKit: boolean) => {
    const bisa = (daftar ?? []).filter((r) => r.dipakaiDi.length === 0 && !r.lainnya).map((r) => r.url);
    if (masuk.current) masuk.current.value = JSON.stringify(hapusDariImageKit ? bisa : []);
    setDaftar(null);
    const form = masuk.current?.form;
    if (!form) return;
    lewat.current = true;
    if (pengirim.current && pengirim.current.isConnected) form.requestSubmit(pengirim.current as HTMLButtonElement);
    else form.requestSubmit();
  };

  const bolehHapus = (daftar ?? []).filter((r) => r.dipakaiDi.length === 0 && !r.lainnya).length;
  return (
    <>
      <input ref={masuk} type="hidden" name="hapusIK" defaultValue="[]" />
      {daftar && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="alertdialog" aria-modal="true" aria-label="Konfirmasi hapus gambar">
          <div className="a-card flex max-h-[88vh] w-full max-w-xl flex-col p-5 shadow-2xl">
            <h2 className="text-lg font-semibold">Gambar dilepas dari artikel</h2>
            <p className="mt-1 text-sm opacity-80">
              {daftar.length} gambar tidak lagi ada di artikel ini. Pilih apa yang dilakukan dengan berkasnya.
            </p>
            <ul className="mt-3 flex-1 space-y-2 overflow-y-auto">
              {daftar.map((r) => {
                const dipakai = r.dipakaiDi.length > 0 || r.lainnya;
                return (
                  <li key={r.url} className="flex gap-3 rounded border p-2 text-sm">
                    <img src={kecil(r.url, 160)} alt="" className="h-14 w-20 shrink-0 rounded object-cover" />
                    <div className="min-w-0">
                      <p className="truncate font-medium" title={r.nama}>{r.nama}</p>
                      {dipakai ? (
                        <p className="text-xs opacity-80">
                          Masih dipakai di {r.dipakaiDi.length > 0 ? r.dipakaiDi.map((p) => p.title).join(", ") : "bagian situs lain"}
                          {" "}— berkas dipertahankan.
                        </p>
                      ) : (
                        <p className="text-xs opacity-80">Tidak dipakai di tempat lain.</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className="a-btn-soft" onClick={() => setDaftar(null)}>Batal, kembali menyunting</button>
              <button type="button" className="a-btn-soft" onClick={() => lanjut(false)}>Lepas dari artikel ini saja</button>
              {bolehHapus > 0 && (
                <button type="button" className="rounded-full bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800" onClick={() => lanjut(true)}>
                  Hapus juga dari ImageKit ({bolehHapus})
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

'@
Tulis 'src/components/admin/PenjagaGambar.tsx' $f9
$sk = @'
// PAKET-13B: indeks galeri gambar (alamat ImageKit, fileId, hash isi untuk mencegah gambar kembar)
export const gambarBerkas = pgTable("gambar_berkas", {
  id: serial("id").primaryKey(),
  url: text("url").notNull().unique(),
  fileId: text("file_id"),
  nama: text("nama").notNull(),
  hash: text("hash"),
  hashAsli: text("hash_asli"),
  ukuran: integer("ukuran"),
  lebar: integer("lebar"),
  tinggi: integer("tinggi"),
  dibuat: timestamp("dibuat").defaultNow().notNull(),
});
'@
Tambah 'src/db/schema.ts' 'gambarBerkas' $sk
$ik = @'
// PAKET-13B: rincian pemakaian sebuah gambar (artikel lain yang memakainya) untuk dialog konfirmasi hapus
export type Pemakaian = { url: string; nama: string; dipakaiDi: { id: number; title: string }[]; lainnya: boolean };

export async function rincianPemakaian(urls: string[], kecualiPostId: number | null): Promise<Pemakaian[]> {
  const d = db();
  const hasil: Pemakaian[] = [];
  for (const url of urls.slice(0, MAKS_HAPUS)) {
    const jalur = jalurIK(url);
    if (!jalur) continue;
    const nama = jalur.split("/").pop() ?? "";
    const pola = `%${nama.replace(/[%_\\]/g, "\\$&")}%`;
    const a = await d.execute(sql`select id, title from posts where (content ilike ${pola} or cover_url ilike ${pola}) and id <> ${kecualiPostId ?? 0} order by id limit 6`);
    const b = await d.execute(sql`select (
      exists(select 1 from images where url ilike ${pola})
      or exists(select 1 from redaksi where foto_url ilike ${pola})
      or exists(select 1 from settings where value ilike ${pola})
      or exists(select 1 from site_settings where value ilike ${pola})
    ) as lain`);
    hasil.push({
      url,
      nama,
      dipakaiDi: (a.rows as { id: number; title: string }[]).map((r) => ({ id: Number(r.id), title: String(r.title) })),
      lainnya: (b.rows[0] as { lain?: boolean } | undefined)?.lain === true,
    });
  }
  return hasil;
}
'@
Tambah 'src/lib/imagekit.ts' 'rincianPemakaian' $ik
$a0 = @'
import { db } from "@/db";
'@
$b0 = @'
import { db } from "@/db";
import { hapusCatatan, idBerkasDB } from "./galeri";
'@
Ganti 'src/lib/imagekit.ts' $a0 $b0
$a1 = @'
    const id = await cariIdBerkas(a, jalur);
'@
$b1 = @'
    const id = (await idBerkasDB(url)) ?? (await cariIdBerkas(a, jalur));
'@
Ganti 'src/lib/imagekit.ts' $a1 $b1
$a2 = @'
    return (await fetch(`${API}/files/${id}`, { method: "DELETE", headers: { Authorization: a } })).ok;
'@
$b2 = @'
    const ok = (await fetch(`${API}/files/${id}`, { method: "DELETE", headers: { Authorization: a } })).ok;
    if (ok) await hapusCatatan(url);
    return ok;
'@
Ganti 'src/lib/imagekit.ts' $a2 $b2
$a3 = @'
await bersihkanYatim([...urlIKDalam(p.content), p.coverUrl?.split("?")[0]]);
'@
$b3 = @'
// Gambar artikel yang dihapus dibiarkan di galeri/ImageKit (aman bagi artikel lain); gambar tak terpakai bisa dirapikan dengan skrip sinkron-galeri
'@
Ganti 'src/lib/actions.ts' $a3 $b3
$a4 = @'
import { unggahGambarArtikel } from "@/lib/unggah-actions";
'@
$b4 = @'
import { unggahGambarArtikel } from "@/lib/unggah-actions";
import { hashBerkas } from "@/lib/gambar-klien";
import { GaleriGambar } from "@/components/admin/GaleriGambar";
'@
Ganti 'src/components/Editor.tsx' $a4 $b4
$a5 = @'
  const aksiCatatan = useRef<() => void>(() => {});
'@
$b5 = @'
  const aksiCatatan = useRef<() => void>(() => {});
  const [galeri, setGaleri] = useState(false);
'@
Ganti 'src/components/Editor.tsx' $a5 $b5
$a6 = @'
      const kecil = await perkecil(f);
'@
$b6 = @'
      const hashAsli = await hashBerkas(f);
      const kecil = await perkecil(f);
'@
Ganti 'src/components/Editor.tsx' $a6 $b6
$a7 = @'
      fd.set("berkas", kecil);
'@
$b7 = @'
      fd.set("berkas", kecil);
      if (hashAsli) fd.set("hashAsli", hashAsli);
'@
Ganti 'src/components/Editor.tsx' $a7 $b7
$a8 = @'
      if ("url" in r) { setPesan(""); sisipGambar(r.url); } else setPesan(r.galat);
'@
$b8 = @'
      if ("url" in r) { setPesan(r.dipakaiUlang ? "Gambar yang sama sudah ada di galeri; berkas yang ada dipakai ulang (hemat ruang)." : ""); sisipGambar(r.url); } else setPesan(r.galat);
'@
Ganti 'src/components/Editor.tsx' $a8 $b8
$a9 = @'
<Tombol judul="Sisipkan gambar dari alamat https" lebar onClick={gambarUrl}>Gambar (URL)</Tombol>
'@
$b9 = @'
<Tombol judul="Sisipkan gambar dari alamat https" lebar onClick={gambarUrl}>Gambar (URL)</Tombol>
        <Tombol judul="Pilih gambar yang sudah ada di galeri" lebar onClick={() => setGaleri(true)}>Galeri</Tombol>
'@
Ganti 'src/components/Editor.tsx' $a9 $b9
$a10 = @'
      <input type="hidden" name={name} value={html} />
'@
$b10 = @'
      <input type="hidden" name={name} value={html} />
      {galeri && <GaleriGambar tutup={() => setGaleri(false)} pilih={(u) => { setGaleri(false); sisipGambar(u); }} />}
'@
Ganti 'src/components/Editor.tsx' $a10 $b10
$a11 = @'
import { PilihSampul } from "@/components/admin/PilihSampul";
'@
$b11 = @'
import { PilihSampul } from "@/components/admin/PilihSampul";
import { PenjagaGambar } from "@/components/admin/PenjagaGambar";
import { urlIKDalam } from "@/lib/imagekit";
'@
Ganti 'src/app/admin/artikel/[id]/page.tsx' $a11 $b11
$a12 = @'
{p && <input type="hidden" name="id" value={p.id} />}
'@
$b12 = @'
{p && <input type="hidden" name="id" value={p.id} />}
      {p && <PenjagaGambar postId={p.id} awal={[...urlIKDalam(p.content), p.coverUrl?.split("?")[0]].filter((u): u is string => !!u)} />}
'@
Ganti 'src/app/admin/artikel/[id]/page.tsx' $a12 $b12
$rp = @'
// Gambar yang dibuang dari artikel/sampul dihapus dari ImageKit bila tidak dipakai di tempat lain\s*if \(old\) \{[\s\S]*?\.filter\(\(u\) => u && !dipakai\.has\(u\)\)\);\s*\}
'@
$rb = @'
// Penghapusan permanen di ImageKit hanya atas pilihan eksplisit pengguna (dialog konfirmasi), dan hanya bila gambar tak dipakai di tempat lain
    if (old) {
      const dipilih = ((): string[] => {
        try {
          const a = JSON.parse(String(fd.get("hapusIK") ?? "[]"));
          return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string").slice(0, 12) : [];
        } catch { return []; }
      })();
      if (dipilih.length) {
        const lama = new Set([...urlIKDalam(old.content), old.coverUrl?.split("?")[0]]);
        const sekarang = new Set([...urlIKDalam(data.content), data.coverUrl?.split("?")[0]]);
        await bersihkanYatim(dipilih.filter((u) => lama.has(u) && !sekarang.has(u)));
      }
    }
'@
GantiRegex2 'src/lib/actions.ts' $rp $rb

Write-Host ""
Write-Host "== Sinkron galeri (tabel, daftar ImageKit, hash, pindah gambar WordPress). Butuh .env.local dan internet ==" -ForegroundColor Cyan
$ErrorActionPreference = 'Continue'
npx tsx --env-file=.env.local scripts/sinkron-galeri.ts
Write-Host ""
Write-Host "Selesai. Jalankan: npm run dev. Buka Edit Artikel > Gambar Galeri." -ForegroundColor Cyan
Write-Host "Merapikan gambar kembar (opsional): npx tsx --env-file=.env.local scripts/sinkron-galeri.ts --rapikan  (lihat dulu daftarnya; tambah --ya untuk menjalankan)" -ForegroundColor Cyan
