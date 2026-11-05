# paket-13c-alat-bahasa.ps1  (PAKET-13C)
# Isi: alat bahasa di editor CMS (pilih bahasa, periksa ejaan, terjemahkan, kembali ke bahasa asli). Jalankan SETELAH 13B.
# Jalankan dari folder proyek:  powershell -ExecutionPolicy Bypass -File .\paket-13c-alat-bahasa.ps1
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

Write-Host "== Paket 13C ==" -ForegroundColor Cyan
$f0 = @'
// PAKET-13C: daftar bahasa untuk alat bahasa di CMS (sama dengan tombol bahasa di halaman utama)
export type Bahasa = { kode: string; lang: string; nama: string };

// kode = kode Google Translate; lang = kode BCP 47 untuk atribut lang (pemeriksa ejaan peramban)
export const BAHASA_CMS: Bahasa[] = [
  { kode: "id", lang: "id", nama: "Bahasa Indonesia" },
  { kode: "jw", lang: "jv", nama: "Basa Jawa" },
  { kode: "su", lang: "su", nama: "Basa Sunda" },
  { kode: "ms", lang: "ms", nama: "Bahasa Melayu" },
  { kode: "ar", lang: "ar", nama: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629 (Arab)" },
  { kode: "zh-CN", lang: "zh-CN", nama: "\u4E2D\u6587 (Mandarin)" },
  { kode: "en", lang: "en", nama: "English" },
  { kode: "fr", lang: "fr", nama: "Fran\u00E7ais" },
  { kode: "ru", lang: "ru", nama: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" },
  { kode: "es", lang: "es", nama: "Espa\u00F1ol" },
];
export const cariBahasa = (kode: string) => BAHASA_CMS.find((b) => b.kode === kode) ?? BAHASA_CMS[0];

'@
Tulis 'src/lib/bahasa.ts' $f0
$f1 = @'
// PAKET-13C: cadangan terjemahan lewat server (dipakai bila peramban tidak bisa memanggil layanan langsung).
// Tidak menyimpan apa pun di database. Hanya untuk pengguna yang sudah masuk.
"use server";
import { requireUser } from "./auth";
import { BAHASA_CMS } from "./bahasa";

export async function terjemahkanServer(tl: string, teks: string): Promise<{ segmen: [string, string][] } | { galat: string }> {
  await requireUser();
  if (!BAHASA_CMS.some((b) => b.kode === tl)) return { galat: "Bahasa tidak didukung." };
  if (typeof teks !== "string" || teks.length === 0 || teks.length > 5000) return { galat: "Teks terlalu panjang." };
  try {
    const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "q=" + encodeURIComponent(teks),
    });
    if (r.status === 429) return { galat: "Layanan terjemahan sedang membatasi permintaan. Coba lagi beberapa menit lagi." };
    if (!r.ok) return { galat: "Layanan terjemahan menolak permintaan." };
    const j = (await r.json()) as unknown[];
    const mentah = Array.isArray(j[0]) ? (j[0] as unknown[]) : [];
    return { segmen: mentah.filter(Array.isArray).map((s) => [String((s as unknown[])[0] ?? ""), String((s as unknown[])[1] ?? "")] as [string, string]) };
  } catch {
    return { galat: "Tidak dapat menghubungi layanan terjemahan." };
  }
}

'@
Tulis 'src/lib/terjemah-actions.ts' $f1
$f2 = @'
// PAKET-13C: terjemahan hemat dan gratis. Tidak memakai database; hasil hanya diingat di memori halaman.
// Urutan: panggilan langsung dari peramban (memakai IP pengguna sendiri) -> bila diblokir, lewat server.
import { terjemahkanServer } from "./terjemah-actions";

type Segmen = [string, string][];
const cache = new Map<string, string>();
let langsungBisa = true;
const BATAS_HURUF = 3000;
const BATAS_BARIS = 40;

const ambilSegmen = async (tl: string, teks: string): Promise<{ segmen: Segmen } | { galat: string }> => {
  if (langsungBisa) {
    try {
      const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "q=" + encodeURIComponent(teks),
      });
      if (r.status === 429) return { galat: "Layanan terjemahan sedang membatasi permintaan. Coba lagi beberapa menit lagi." };
      if (r.ok) {
        const j = (await r.json()) as unknown[];
        const mentah = Array.isArray(j[0]) ? (j[0] as unknown[]) : [];
        return { segmen: mentah.filter(Array.isArray).map((s) => [String((s as unknown[])[0] ?? ""), String((s as unknown[])[1] ?? "")] as [string, string]) };
      }
      langsungBisa = false;
    } catch {
      langsungBisa = false; // diblokir (CORS/jaringan): pakai server
    }
  }
  return terjemahkanServer(tl, teks);
};

// Mencocokkan hasil terjemahan dengan barisnya: segmen yang sumbernya berakhir "\n" menutup satu baris
export function pisahPerBaris(segmen: Segmen, jumlah: number): string[] | null {
  const hasil: string[] = [];
  let tr = "";
  let ada = false;
  for (const [t, s] of segmen) {
    tr += t;
    ada = true;
    if (s.endsWith("\n")) { hasil.push(tr.replace(/\n$/, "")); tr = ""; ada = false; }
  }
  if (ada) hasil.push(tr.replace(/\n$/, ""));
  return hasil.length === jumlah ? hasil : null;
}

export async function terjemahkanDaftar(items: string[], tl: string, kemajuan?: (selesai: number, total: number) => void): Promise<string[] | { galat: string }> {
  const unik = [...new Set(items)].filter((t) => !cache.has(`${tl}|${t}`));
  let selesai = 0;
  let i = 0;
  while (i < unik.length) {
    const bagian: string[] = [];
    let huruf = 0;
    while (i < unik.length && bagian.length < BATAS_BARIS && (bagian.length === 0 || huruf + unik[i].length < BATAS_HURUF)) {
      bagian.push(unik[i]);
      huruf += unik[i].length + 1;
      i++;
    }
    const r = await ambilSegmen(tl, bagian.join("\n"));
    if ("galat" in r) return r;
    let baris = pisahPerBaris(r.segmen, bagian.length);
    if (!baris) {
      // susunan baris tidak cocok: terjemahkan satu per satu supaya tetap akurat
      baris = [];
      for (const b of bagian) {
        const satu = await ambilSegmen(tl, b);
        if ("galat" in satu) return satu;
        baris.push(satu.segmen.map((s) => s[0]).join("").replace(/\n$/, ""));
      }
    }
    bagian.forEach((b, k) => cache.set(`${tl}|${b}`, baris![k]));
    selesai += bagian.length;
    kemajuan?.(selesai, unik.length);
    if (i < unik.length) await new Promise((res) => setTimeout(res, 200)); // jeda kecil agar layanan gratis tidak menolak
  }
  return items.map((t) => cache.get(`${tl}|${t}`) ?? t);
}

'@
Tulis 'src/lib/terjemah.ts' $f2
$f3 = @'
// PAKET-13C: mengumpulkan dan mengganti teks pada dokumen editor (ProseMirror) tanpa merusak format
import type { Node as PMNode, Mark } from "@tiptap/pm/model";
import type { Transaction } from "@tiptap/pm/state";

export type Potongan = { from: number; to: number; inti: string; awal: string; akhir: string; marks: readonly Mark[] };

const CATATAN_KAKI = /^(_ftnref|_ftn|fnref|fn)\d+$/;

// Teks yang layak diterjemahkan pada rentang tertentu; rujukan catatan kaki, kode, dan teks tanpa huruf dilewati
export function kumpulkanTeks(doc: PMNode, dari: number, sampai: number): Potongan[] {
  const out: Potongan[] = [];
  doc.nodesBetween(dari, sampai, (node, pos) => {
    if (!node.isText || !node.text) return;
    if (node.marks.some((m) => (m.type.name === "link" && CATATAN_KAKI.test(String(m.attrs.id ?? ""))) || m.type.name === "code")) return;
    const a = Math.max(dari, pos);
    const b = Math.min(sampai, pos + node.nodeSize);
    const teks = node.text.slice(a - pos, b - pos);
    const inti = teks.trim();
    if (!/\p{L}/u.test(inti)) return;
    out.push({
      from: a,
      to: b,
      inti: inti.replace(/\s*\n\s*/g, " "),
      awal: teks.slice(0, teks.length - teks.trimStart().length),
      akhir: teks.slice(teks.trimEnd().length),
      marks: node.marks,
    });
  });
  return out;
}

// Mengganti teks dari belakang ke depan agar posisi di depan tetap benar
export function terapkanTerjemahan(tr: Transaction, potongan: Potongan[], hasil: string[]): void {
  for (let i = potongan.length - 1; i >= 0; i--) {
    const p = potongan[i];
    const t = hasil[i];
    if (!t || t === p.inti) continue;
    tr.replaceWith(p.from, p.to, tr.doc.type.schema.text(p.awal + t + p.akhir, p.marks));
  }
}

'@
Tulis 'src/lib/terjemah-editor.ts' $f3
$f4 = @'
// PAKET-13C: alat bahasa di bilah alat editor CMS. Semuanya hanya bekerja saat tombolnya ditekan:
//  - pilih bahasa tulisan (menentukan bahasa pemeriksa ejaan dan bahasa tujuan terjemahan)
//  - Periksa ejaan: menyalakan garis merah pemeriksa ejaan peramban untuk bahasa terpilih
//  - Terjemahkan: menerjemahkan seluruh teks (atau bagian yang diblok), tanpa menyimpan apa pun di database
//  - Kembali ke bahasa asli: mengembalikan teks sebelum diterjemahkan
"use client";
import { useEffect, useRef, useState } from "react";
import type { Editor as TipTapEditor } from "@tiptap/react";
import type { JSONContent } from "@tiptap/core";
import { BAHASA_CMS, cariBahasa } from "@/lib/bahasa";
import { terjemahkanDaftar } from "@/lib/terjemah";
import { kumpulkanTeks, terapkanTerjemahan } from "@/lib/terjemah-editor";

type Props = {
  editor: TipTapEditor | null;
  bahasa: string;
  setBahasa: (kode: string) => void;
  ejaan: boolean;
  setEjaan: (v: boolean) => void;
};

export function AlatBahasa({ editor, bahasa, setBahasa, ejaan, setEjaan }: Props) {
  const akar = useRef<HTMLDivElement>(null);
  const asli = useRef<{ json: JSONContent; bahasa: string } | null>(null);
  const [buka, setBuka] = useState(false);
  const [sibuk, setSibuk] = useState(false);
  const [pesan, setPesan] = useState("");
  const [aktif, setAktif] = useState<string | null>(null); // kode bahasa terjemahan yang sedang tampil di editor
  const b = cariBahasa(bahasa);

  useEffect(() => {
    if (!buka) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    const luar = (e: MouseEvent) => { if (!akar.current?.contains(e.target as Node)) setBuka(false); };
    document.addEventListener("keydown", esc);
    document.addEventListener("mousedown", luar);
    return () => { document.removeEventListener("keydown", esc); document.removeEventListener("mousedown", luar); };
  }, [buka]);

  // Mencegah terjemahan tersimpan tanpa sengaja
  useEffect(() => {
    const form = akar.current?.closest("form");
    if (!form || !aktif) return;
    const onSubmit = (e: SubmitEvent) => {
      if (e.defaultPrevented) return;
      if (!window.confirm("Teks di editor masih berupa terjemahan. Tetap simpan terjemahan ini?\n\nPilih Batal untuk kembali; gunakan \"Kembali ke bahasa asli\" bila perlu.")) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    form.addEventListener("submit", onSubmit);
    return () => form.removeEventListener("submit", onSubmit);
  }, [aktif]);

  const terjemahkan = async () => {
    if (!editor || sibuk) return;
    const { from, to, empty } = editor.state.selection;
    const potongan = kumpulkanTeks(editor.state.doc, empty ? 0 : from, empty ? editor.state.doc.content.size : to);
    if (potongan.length === 0) { setPesan("Tidak ada teks yang bisa diterjemahkan."); return; }
    setSibuk(true);
    setPesan("Menerjemahkan...");
    editor.setEditable(false); // kunci sementara agar posisi teks tidak bergeser
    try {
      const hasil = await terjemahkanDaftar(potongan.map((p) => p.inti), b.kode, (s, t) => setPesan(`Menerjemahkan... ${s}/${t}`));
      if ("galat" in hasil) { setPesan(hasil.galat + " Teks tidak diubah."); return; }
      if (!asli.current) asli.current = { json: editor.getJSON(), bahasa };
      const tr = editor.state.tr;
      terapkanTerjemahan(tr, potongan, hasil);
      editor.view.dispatch(tr);
      setAktif(b.kode);
      setPesan(`Selesai: ${empty ? "seluruh teks" : "bagian terpilih"} diterjemahkan ke ${b.nama}. Gunakan "Kembali ke bahasa asli" untuk membatalkan.`);
    } catch {
      setPesan("Terjemahan gagal. Teks tidak diubah.");
    } finally {
      editor.setEditable(true);
      setSibuk(false);
    }
  };

  const kembaliAsli = () => {
    if (!editor || !asli.current || sibuk) return;
    if (!window.confirm("Kembalikan teks ke bahasa aslinya? Perubahan yang dibuat setelah menerjemahkan akan hilang.")) return;
    editor.commands.setContent(asli.current.json, true);
    setBahasa(asli.current.bahasa);
    asli.current = null;
    setAktif(null);
    setPesan("Teks dikembalikan ke bahasa asli.");
  };

  const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  const tombol = "w-full rounded-md border px-3 py-1.5 text-left text-sm transition hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <div ref={akar} className="relative inline-block">
      <button
        type="button"
        onClick={() => setBuka(!buka)}
        aria-expanded={buka}
        aria-label="Alat bahasa"
        title="Alat bahasa: periksa ejaan dan terjemahan"
        className={`flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-black/10 ${aktif || ejaan ? "bg-black/10 font-semibold" : ""}`}
      >
        <svg {...g} className="h-4 w-4" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
        <span className="uppercase">{(aktif ?? bahasa).split("-")[0]}</span>
      </button>
      {buka && (
        <div className="a-card absolute left-0 top-full z-50 mt-1 w-80 max-w-[85vw] p-3 text-sm shadow-2xl" role="dialog" aria-label="Alat bahasa">
          <p className="mb-1 font-medium">Bahasa tulisan</p>
          <div className="grid grid-cols-2 gap-1 notranslate">
            {BAHASA_CMS.map((x) => (
              <button
                key={x.kode}
                type="button"
                onClick={() => { setBahasa(x.kode); setPesan(""); }}
                aria-pressed={x.kode === bahasa}
                className={`rounded-md border px-2 py-1 text-left text-xs transition hover:bg-black/5 ${x.kode === bahasa ? "border-current font-semibold" : ""}`}
              >
                {x.nama}
              </button>
            ))}
          </div>

          <div className="mt-3 space-y-2">
            <button type="button" className={`${tombol} ${ejaan ? "font-semibold" : ""}`} aria-pressed={ejaan} onClick={() => setEjaan(!ejaan)}>
              {ejaan ? "Matikan" : "Nyalakan"} pemeriksa ejaan ({b.nama})
            </button>
            <p className="text-xs opacity-70">Garis merah memakai kamus bahasa di peramban. Tambahkan bahasanya di pengaturan peramban (Bahasa, Pemeriksa ejaan). Jawa dan Sunda umumnya belum tersedia.</p>

            <button type="button" className={tombol} disabled={sibuk || !editor} onClick={terjemahkan}>
              {sibuk ? "Menerjemahkan..." : `Terjemahkan ke ${b.nama}`}
            </button>
            <p className="text-xs opacity-70">Menerjemahkan seluruh teks, atau hanya bagian yang diblok. Hanya berjalan saat tombol ini ditekan.</p>

            <button type="button" className={tombol} disabled={!asli.current || sibuk} onClick={kembaliAsli}>
              Kembali ke bahasa asli
            </button>
          </div>
          {pesan && <p className="mt-2 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-900" role="status">{pesan}</p>}
        </div>
      )}
    </div>
  );
}

'@
Tulis 'src/components/admin/AlatBahasa.tsx' $f4
$a0 = @'
import { GaleriGambar } from "@/components/admin/GaleriGambar";
'@
$b0 = @'
import { GaleriGambar } from "@/components/admin/GaleriGambar";
import { AlatBahasa } from "@/components/admin/AlatBahasa";
import { cariBahasa } from "@/lib/bahasa";
'@
Ganti 'src/components/Editor.tsx' $a0 $b0
$a1 = @'
  const [ejaan, setEjaan] = useState(false);
'@
$b1 = @'
  const [ejaan, setEjaan] = useState(false);
  const [bahasa, setBahasa] = useState("id");
'@
Ganti 'src/components/Editor.tsx' $a1 $b1
$a2 = @'
try { editor?.view.dom.setAttribute("spellcheck", ejaan ? "true" : "false"); } catch { /* editor belum terpasang */ }
'@
$b2 = @'
try {
      const dom = editor?.view.dom;
      dom?.setAttribute("spellcheck", ejaan ? "true" : "false");
      dom?.setAttribute("lang", cariBahasa(bahasa).lang);
    } catch { /* editor belum terpasang */ }
'@
Ganti 'src/components/Editor.tsx' $a2 $b2
$a3 = @'
  }, [editor, ejaan]);
'@
$b3 = @'
  }, [editor, ejaan, bahasa]);
'@
Ganti 'src/components/Editor.tsx' $a3 $b3
$a4 = @'
<Tombol judul="Nyalakan/matikan garis merah pemeriksa ejaan browser" aktif={ejaan} lebar onClick={() => setEjaan(!ejaan)}>Ejaan</Tombol>
'@
$b4 = @'
<AlatBahasa editor={editor} bahasa={bahasa} setBahasa={setBahasa} ejaan={ejaan} setEjaan={setEjaan} />
'@
Ganti 'src/components/Editor.tsx' $a4 $b4

Write-Host ""
Write-Host "Selesai. Buka Edit Artikel: ikon bumi di bilah alat editor (kanan tombol Bersihkan)." -ForegroundColor Cyan
Write-Host "Bila ada baris merah GAGAL di atas, kirim tangkapan layarnya." -ForegroundColor Cyan
