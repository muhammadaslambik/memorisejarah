# paket-12b-editor-gambar-catatan.ps1  (PAKET-12B)
# Isi: Ctrl+Alt+F + penomoran catatan kaki otomatis, pilihan gambar utama (URL/Upload/Galeri), sinkron ImageKit (unggah, ganti, hapus).
# Jalankan dari folder proyek:  powershell -ExecutionPolicy Bypass -File .\paket-12b-editor-gambar-catatan.ps1
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

Write-Host "== Paket 12B ==" -ForegroundColor Cyan
$f0 = @'
// PAKET-12B: catatan kaki bernomor otomatis. Nomor selalu mengikuti urutan kemunculan dari atas ke bawah:
// menyisipkan catatan baru di antara [6] dan [7] membuatnya menjadi [7], dan catatan lama [7] menjadi [8], dst.
// Bentuk di dalam artikel sama dengan WordPress: rujukan <a id="_ftnref7" href="#_ftn7">[7]</a>
// dan catatan di akhir <p><a id="_ftn7" href="#_ftnref7">[7]</a> teks catatan</p>.
import { TextSelection } from "@tiptap/pm/state";
import type { EditorState, Transaction } from "@tiptap/pm/state";
import type { Node as PMNode } from "@tiptap/pm/model";

const REF = /^(_ftnref|fnref)(\d+)$/;
const NOTE = /^(_ftn|fn)(\d+)$/;
const PASANGAN: Record<string, string> = { _ftnref: "_ftn", fnref: "fn", _ftn: "_ftnref", fn: "fnref" };

type Temu = { pos: number; node: PMNode; jenis: "ref" | "catatan"; prefix: string; nomor: number };

function kumpulkan(doc: PMNode): Temu[] {
  const out: Temu[] = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    const id = node.marks.find((m) => m.type.name === "link")?.attrs.id as string | null | undefined;
    if (!id) return;
    const r = REF.exec(id);
    if (r) { out.push({ pos, node, jenis: "ref", prefix: r[1], nomor: Number(r[2]) }); return; }
    const n = NOTE.exec(id);
    if (n) out.push({ pos, node, jenis: "catatan", prefix: n[1], nomor: Number(n[2]) });
  });
  return out;
}

// Menyusun ulang nomor (dan urutan paragraf catatan di akhir) pada transaksi yang diberikan.
export function susunCatatanKaki(tr: Transaction): { berubah: boolean; peta: Map<number, number> } {
  const peta = new Map<number, number>();
  const awal = kumpulkan(tr.doc);
  let n = 0;
  for (const i of awal) if (i.jenis === "ref" && !peta.has(i.nomor)) peta.set(i.nomor, ++n);
  for (const i of awal) if (i.jenis === "catatan" && !peta.has(i.nomor)) peta.set(i.nomor, ++n); // catatan yatim: di belakang
  let berubah = false;

  // 1) ganti nomor (dari posisi paling belakang agar posisi di depan tetap benar)
  for (const i of [...awal].reverse()) {
    const baru = peta.get(i.nomor)!;
    const teks = i.node.text!.replace(/\d+/, String(baru));
    const id = `${i.prefix}${baru}`;
    const href = `#${PASANGAN[i.prefix]}${baru}`;
    const link = i.node.marks.find((m) => m.type.name === "link")!;
    if (teks === i.node.text && link.attrs.id === id && link.attrs.href === href) continue;
    const marks = i.node.marks.map((m) => (m === link ? m.type.create({ ...m.attrs, id, href }) : m));
    tr.replaceWith(i.pos, i.pos + i.node.nodeSize, tr.doc.type.schema.text(teks, marks));
    berubah = true;
  }

  // 2) urutkan paragraf catatan di akhir (hanya bila semuanya paragraf tingkat atas dan satu catatan per paragraf)
  const doc = tr.doc;
  const catatan = kumpulkan(doc).filter((i) => i.jenis === "catatan");
  const slot = catatan.map((i) => ({ index: doc.resolve(i.pos).index(0), dalam: doc.resolve(i.pos).depth, nomor: i.nomor }));
  const indeks = slot.map((s) => s.index);
  if (slot.length > 1 && slot.every((s) => s.dalam === 1) && new Set(indeks).size === indeks.length) {
    const urut = [...slot].sort((a, b) => a.nomor - b.nomor);
    if (urut.some((s, k) => s.index !== slot[k].index)) {
      const offset: number[] = [];
      doc.forEach((_c, o) => offset.push(o));
      for (let k = slot.length - 1; k >= 0; k--) {
        const lama = doc.child(slot[k].index);
        const baru = doc.child(urut[k].index);
        const dari = offset[slot[k].index];
        tr.replaceWith(dari, dari + lama.nodeSize, baru);
      }
      berubah = true;
    }
  }
  return { berubah, peta };
}

// Menyisipkan rujukan di kursor + paragraf catatan di akhir artikel, lalu menomori ulang semuanya.
export function sisipCatatanKaki(state: EditorState): { tr: Transaction; nomor: number } | null {
  const link = state.schema.marks.link;
  const para = state.schema.nodes.paragraph;
  if (!link || !para || !state.selection.$to.parent.inlineContent) return null;
  const sementara = kumpulkan(state.doc).reduce((a, i) => Math.max(a, i.nomor), 0) + 1;
  const ref = state.schema.text(`[${sementara}]`, [link.create({ href: `#_ftn${sementara}`, id: `_ftnref${sementara}` })]);
  const catatan = para.create(null, [
    state.schema.text(`[${sementara}]`, [link.create({ href: `#_ftnref${sementara}`, id: `_ftn${sementara}` })]),
    state.schema.text(" "),
  ]);
  const tr = state.tr;
  const posRef = state.selection.to;
  tr.insert(tr.doc.content.size, catatan); // di akhir dulu, supaya posisi kursor tidak bergeser
  tr.insert(posRef, ref);
  const sesudahRef = posRef + ref.nodeSize;
  const langkah = tr.steps.length;
  const { peta } = susunCatatanKaki(tr);
  const pos = tr.mapping.slice(langkah).map(sesudahRef, 1);
  tr.setSelection(TextSelection.near(tr.doc.resolve(Math.min(pos, tr.doc.content.size)), 1)).scrollIntoView();
  return { tr, nomor: peta.get(sementara) ?? sementara };
}

// Posisi akhir baris catatan bernomor tertentu (untuk melompat ke sana dan mulai mengetik)
export function posisiCatatan(state: EditorState, nomor: number): number | null {
  const t = kumpulkan(state.doc).find((i) => i.jenis === "catatan" && i.nomor === nomor);
  return t ? state.doc.resolve(t.pos).end() : null;
}

'@
Tulis 'src/lib/catatan-kaki.ts' $f0
$f1 = @'
// PAKET-12B: sambungan server ke ImageKit (daftar berkas, hapus berkas). Kunci privat hanya dibaca di server.
// Hanya berkas di folder /memori-sejarah yang pernah disentuh; alamat gambar lain dibiarkan.
import { sql } from "drizzle-orm";
import { db } from "@/db";

const API = "https://api.imagekit.io/v1";
const FOLDER = "/memori-sejarah";
const MAKS_HAPUS = 12; // batas berkas yang dibersihkan sekali jalan (membatasi jumlah panggilan jaringan)

const auth = () => {
  const k = process.env.IMAGEKIT_PRIVATE_KEY;
  return k ? "Basic " + btoa(k + ":") : null;
};

// Alamat ImageKit milik situs -> jalur berkas (/memori-sejarah/nama.jpg); selain itu null
export const jalurIK = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname !== "ik.imagekit.io") return null;
    const seg = decodeURIComponent(u.pathname).split("/").filter(Boolean); // [idImageKit, memori-sejarah, nama]
    return seg.length >= 3 && seg[1] === "memori-sejarah" ? "/" + seg.slice(1).join("/") : null;
  } catch {
    return null;
  }
};

export const urlIKDalam = (html: string): string[] => {
  const hasil = new Set<string>();
  for (const m of html.matchAll(/src="(https:\/\/ik\.imagekit\.io\/[^"?]+)/gi)) hasil.add(m[1]);
  return [...hasil];
};

export type BerkasIK = { id: string; nama: string; url: string };

export async function daftarBerkasIK(skip: number, limit = 24): Promise<{ berkas: BerkasIK[]; lagi: boolean } | { galat: string }> {
  const a = auth();
  if (!a) return { galat: "Penyimpanan ImageKit belum disiapkan (IMAGEKIT_PRIVATE_KEY kosong)." };
  try {
    const q = new URL(`${API}/files`);
    q.searchParams.set("path", FOLDER);
    q.searchParams.set("type", "file");
    q.searchParams.set("fileType", "image");
    q.searchParams.set("sort", "DESC_CREATED");
    q.searchParams.set("skip", String(skip));
    q.searchParams.set("limit", String(limit + 1));
    const r = await fetch(q, { headers: { Authorization: a } });
    if (!r.ok) return { galat: "ImageKit menolak permintaan daftar gambar." };
    const j = (await r.json()) as { fileId: string; name: string; url: string }[];
    return { berkas: j.slice(0, limit).map((f) => ({ id: f.fileId, nama: f.name, url: f.url })), lagi: j.length > limit };
  } catch {
    return { galat: "Tidak dapat menghubungi ImageKit." };
  }
}

type Berkas = { fileId: string; filePath: string };

async function cariIdBerkas(a: string, jalur: string): Promise<string | null> {
  const nama = jalur.split("/").pop() ?? "";
  const q = new URL(`${API}/files`);
  q.searchParams.set("path", FOLDER);
  q.searchParams.set("searchQuery", `name = "${nama.replace(/"/g, "")}"`);
  q.searchParams.set("limit", "10");
  const r = await fetch(q, { headers: { Authorization: a } });
  if (r.ok) return ((await r.json()) as Berkas[]).find((f) => f.filePath === jalur)?.fileId ?? null;
  // Cadangan bila pencarian ditolak: pindai daftar folder
  for (let skip = 0; skip < 3000; skip += 1000) {
    const p = new URL(`${API}/files`);
    p.searchParams.set("path", FOLDER);
    p.searchParams.set("skip", String(skip));
    p.searchParams.set("limit", "1000");
    const rr = await fetch(p, { headers: { Authorization: a } });
    if (!rr.ok) return null;
    const j = (await rr.json()) as Berkas[];
    const ketemu = j.find((f) => f.filePath === jalur);
    if (ketemu) return ketemu.fileId;
    if (j.length < 1000) break;
  }
  return null;
}

export async function hapusBerkasIK(url: string): Promise<boolean> {
  const a = auth();
  const jalur = jalurIK(url);
  if (!a || !jalur) return false;
  try {
    const id = await cariIdBerkas(a, jalur);
    if (!id) return false;
    return (await fetch(`${API}/files/${id}`, { method: "DELETE", headers: { Authorization: a } })).ok;
  } catch {
    return false;
  }
}

// Apakah nama berkas ini masih tertulis di artikel, sampul, galeri, foto redaksi, atau pengaturan situs?
async function masihDipakai(jalur: string): Promise<boolean> {
  const nama = jalur.split("/").pop() ?? "";
  const pola = `%${nama.replace(/[%_\\]/g, "\\$&")}%`;
  const r = await db().execute(sql`select (
    exists(select 1 from posts where content ilike ${pola} or cover_url ilike ${pola})
    or exists(select 1 from images where url ilike ${pola})
    or exists(select 1 from redaksi where foto_url ilike ${pola})
    or exists(select 1 from settings where value ilike ${pola})
    or exists(select 1 from site_settings where value ilike ${pola})
  ) as dipakai`);
  return (r.rows[0] as { dipakai?: boolean } | undefined)?.dipakai !== false;
}

// Dipanggil SETELAH data tersimpan: berkas yang sudah tidak dipakai di mana pun dihapus dari ImageKit.
// Tidak pernah melempar galat, supaya gagalnya pembersihan tidak menggagalkan penyimpanan.
export async function bersihkanYatim(urls: (string | null | undefined)[]): Promise<void> {
  try {
    const unik = new Set<string>();
    for (const u of urls) {
      const j = jalurIK(u);
      if (j) unik.add(u!.split("?")[0]);
    }
    let n = 0;
    for (const u of unik) {
      if (n++ >= MAKS_HAPUS) break;
      const j = jalurIK(u)!;
      if (!(await masihDipakai(j))) await hapusBerkasIK(u);
    }
  } catch { /* abaikan */ }
}

'@
Tulis 'src/lib/imagekit.ts' $f1
$f2 = @'
// PAKET-12B: daftar gambar yang sudah diunggah ke ImageKit (untuk pilihan "Gambar Galeri")
"use server";
import { requireUser } from "./auth";
import { daftarBerkasIK, type BerkasIK } from "./imagekit";

export async function ambilGaleri(skip: number): Promise<{ berkas: BerkasIK[]; lagi: boolean } | { galat: string }> {
  await requireUser();
  return daftarBerkasIK(Math.max(0, Math.floor(Number(skip)) || 0));
}

'@
Tulis 'src/lib/galeri-actions.ts' $f2
$f3 = @'
// PAKET-12B: pilihan gambar utama artikel: Masukkan URL, Upload Gambar (membuka penjelajah berkas), atau Gambar Galeri (ImageKit).
"use client";
import { useEffect, useRef, useState } from "react";
import { unggahGambarArtikel } from "@/lib/unggah-actions";
import { ambilGaleri } from "@/lib/galeri-actions";
import { kecil } from "@/lib/gambar-url";
import { kb, perkecil } from "@/components/Editor";

type Berkas = { id: string; nama: string; url: string };

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
      const k = await perkecil(f);
      setPesan(`Mengunggah gambar (${kb(k.size)})...`);
      const fd = new FormData();
      fd.set("berkas", k);
      const r = await unggahGambarArtikel(fd);
      if ("url" in r) { setUrl(r.url); setPesan(""); } else setPesan(r.galat);
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
      {galeri && <Galeri tutup={() => setGaleri(false)} pilih={(u) => { setUrl(u); setGaleri(false); setPesan(""); }} />}
    </div>
  );
}

function Galeri({ tutup, pilih }: { tutup: () => void; pilih: (url: string) => void }) {
  const [daftar, setDaftar] = useState<Berkas[]>([]);
  const [lagi, setLagi] = useState(false);
  const [muat, setMuat] = useState(true);
  const [galat, setGalat] = useState("");

  const ambil = async (skip: number) => {
    setMuat(true);
    try {
      const r = await ambilGaleri(skip);
      if ("galat" in r) setGalat(r.galat);
      else { setDaftar((d) => (skip === 0 ? r.berkas : [...d, ...r.berkas])); setLagi(r.lagi); setGalat(""); }
    } catch {
      setGalat("Gagal memuat galeri. Coba lagi.");
    } finally {
      setMuat(false);
    }
  };
  useEffect(() => { ambil(0); }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") tutup(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [tutup]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Gambar galeri" onMouseDown={(e) => { if (e.target === e.currentTarget) tutup(); }}>
      <div className="a-card flex max-h-[85vh] w-full max-w-4xl flex-col p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Gambar Galeri</h2>
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
        {!muat && !galat && daftar.length === 0 && <p className="py-8 text-center opacity-70">Belum ada gambar di galeri.</p>}
        <div className="mt-3 text-center">
          {muat ? <span className="opacity-70">Memuat...</span> : lagi && <button type="button" className="a-btn-soft" onClick={() => ambil(daftar.length)}>Muat lebih banyak</button>}
        </div>
      </div>
    </div>
  );
}

'@
Tulis 'src/components/admin/PilihSampul.tsx' $f3
$a0 = @'
import { unggahGambarArtikel } from "@/lib/unggah-actions";
'@
$b0 = @'
import { unggahGambarArtikel } from "@/lib/unggah-actions";
import { posisiCatatan, sisipCatatanKaki as sisipNomorCatatan } from "@/lib/catatan-kaki";
'@
Ganti 'src/components/Editor.tsx' $a0 $b0
$a1 = @'
async function perkecil(file: File)
'@
$b1 = @'
export async function perkecil(file: File)
'@
Ganti 'src/components/Editor.tsx' $a1 $b1
$a2 = @'
const kb = (n: number)
'@
$b2 = @'
export const kb = (n: number)
'@
Ganti 'src/components/Editor.tsx' $a2 $b2
$a3 = @'
  const aksiTautan = useRef<() => void>(() => {});
'@
$b3 = @'
  const aksiTautan = useRef<() => void>(() => {});
  const aksiCatatan = useRef<() => void>(() => {});
  const [catatanBaru, setCatatanBaru] = useState<number | null>(null);
'@
Ganti 'src/components/Editor.tsx' $a3 $b3
$a4 = @'
if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
'@
$b4 = @'
if (catatanKaki && (e.ctrlKey || e.metaKey) && e.altKey && e.code === "KeyF") { e.preventDefault(); aksiCatatan.current(); return true; }
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
'@
Ganti 'src/components/Editor.tsx' $a4 $b4
$a5 = @'
<Tombol judul="Sisipkan catatan kaki" lebar onClick={sisipCatatanKaki}>Catatan kaki</Tombol>
'@
$b5 = @'
<Tombol judul="Sisipkan catatan kaki (Ctrl+Alt+F)" lebar onClick={sisipCatatanKaki}>Catatan kaki</Tombol>
'@
Ganti 'src/components/Editor.tsx' $a5 $b5
$a6 = @'
      <EditorContent editor={editor} />
'@
$b6 = @'
      {catatanBaru !== null && (
        <p className="border border-b-0 bg-amber-50 px-3 py-1.5 text-sm text-amber-900" role="status">
          Catatan kaki [{catatanBaru}] disisipkan; nomor catatan lain sudah diurutkan ulang dari atas ke bawah.{" "}
          <button type="button" onClick={lompatCatatan} className="font-semibold underline">Ke catatan [{catatanBaru}]</button>
          <button type="button" onClick={() => setCatatanBaru(null)} className="ml-3 opacity-60">Tutup</button>
        </p>
      )}
      <EditorContent editor={editor} />
'@
Ganti 'src/components/Editor.tsx' $a6 $b6
$a7 = @'
import { TombolKembali } from "@/components/admin/TombolKembali";
'@
$b7 = @'
import { TombolKembali } from "@/components/admin/TombolKembali";
import { PilihSampul } from "@/components/admin/PilihSampul";
'@
Ganti 'src/app/admin/artikel/[id]/page.tsx' $a7 $b7
$a8 = @'
<input name="coverUrl" defaultValue={p?.coverUrl ?? ""} placeholder="URL gambar sampul (https://...)" className="w-full rounded border p-3" />
'@
$b8 = @'
<PilihSampul defaultUrl={p?.coverUrl ?? ""} />
'@
Ganti 'src/app/admin/artikel/[id]/page.tsx' $a8 $b8
$a9 = @'
import { clearFailures, clientIp, isLocked, recordFailure } from "./ratelimit";
'@
$b9 = @'
import { clearFailures, clientIp, isLocked, recordFailure } from "./ratelimit";
import { bersihkanYatim, urlIKDalam } from "./imagekit";
'@
Ganti 'src/lib/actions.ts' $a9 $b9
$a10 = @'
  if (id) { await d.update(posts).set(data).where(eq(posts.id, id)); await simpanKategori(d, id, fd); }
'@
$b10 = @'
  if (id) {
    await d.update(posts).set(data).where(eq(posts.id, id)); await simpanKategori(d, id, fd);
    // Gambar yang dibuang dari artikel/sampul dihapus dari ImageKit bila tidak dipakai di tempat lain
    if (old) {
      const dipakai = new Set([...urlIKDalam(data.content), data.coverUrl?.split("?")[0]]);
      await bersihkanYatim([...urlIKDalam(old.content), old.coverUrl?.split("?")[0]].filter((u) => u && !dipakai.has(u)));
    }
  }
'@
Ganti 'src/lib/actions.ts' $a10 $b10
$a11 = @'
  const [p] = await db().select({ authorId: posts.authorId }).from(posts).where(eq(posts.id, id)).limit(1);
'@
$b11 = @'
  const [p] = await db().select({ authorId: posts.authorId, content: posts.content, coverUrl: posts.coverUrl }).from(posts).where(eq(posts.id, id)).limit(1);
'@
Ganti 'src/lib/actions.ts' $a11 $b11
$a12 = @'
  if (p && canDeletePost(u, p)) await db().delete(posts).where(eq(posts.id, id));
'@
$b12 = @'
  if (p && canDeletePost(u, p)) {
    await db().delete(posts).where(eq(posts.id, id));
    await bersihkanYatim([...urlIKDalam(p.content), p.coverUrl?.split("?")[0]]);
  }
'@
Ganti 'src/lib/actions.ts' $a12 $b12
$a13 = @'
import { unggahKeImageKit } from "./gambar-simpan";
'@
$b13 = @'
import { unggahKeImageKit } from "./gambar-simpan";
import { bersihkanYatim } from "./imagekit";
'@
Ganti 'src/lib/gambar-actions.ts' $a13 $b13
$a14 = @'
  else await d.insert(images).values(data);
'@
$b14 = @'
  else await d.insert(images).values(data);
  // Gambar diganti: berkas lama di ImageKit dihapus bila tidak dipakai di tempat lain
  if (old && old.url !== url) await bersihkanYatim([old.url]);
'@
Ganti 'src/lib/gambar-actions.ts' $a14 $b14
$a15 = @'
  if (id) await db().delete(images).where(eq(images.id, id));
'@
$b15 = @'
  if (id) {
    const [g] = await db().select({ url: images.url }).from(images).where(eq(images.id, id)).limit(1);
    await db().delete(images).where(eq(images.id, id));
    if (g) await bersihkanYatim([g.url]);
  }
'@
Ganti 'src/lib/gambar-actions.ts' $a15 $b15
$fp = @'
  const sisipCatatanKaki = \(\) => \{.*?\r?\n  \};\r?\n
'@
$fb = @'
  const sisipCatatanKaki = () => {
    if (!editor) return;
    const h = sisipNomorCatatan(editor.state);
    if (!h) { setPesan("Letakkan kursor di dalam teks artikel dulu, lalu sisipkan catatan kaki."); return; }
    editor.view.dispatch(h.tr);
    editor.view.focus();
    setPesan("");
    setCatatanBaru(h.nomor);
  };
  aksiCatatan.current = sisipCatatanKaki;
  const lompatCatatan = () => {
    if (!editor || catatanBaru === null) return;
    const pos = posisiCatatan(editor.state, catatanBaru);
    if (pos !== null) editor.chain().focus().setTextSelection(pos).scrollIntoView().run();
  };

'@
GantiRegex2 'src/components/Editor.tsx' $fp $fb

Write-Host ""
Write-Host "Selesai. Jalankan: npm run dev  (tanpa npm install)." -ForegroundColor Cyan
Write-Host "Bila ada baris merah GAGAL di atas, kirim tangkapan layarnya." -ForegroundColor Cyan
