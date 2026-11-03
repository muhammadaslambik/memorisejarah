# paket-12a-perbaikan-cepat.ps1  (PAKET-12A)
# Isi: tanggal dengan nama hari, menu header lebih ke tengah, foto sampul ganda, tombol Kembali melayang, garis merah ejaan mati.
# Jalankan dari folder proyek:  powershell -ExecutionPolicy Bypass -File .\paket-12a-perbaikan-cepat.ps1
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

Write-Host "== Paket 12A ==" -ForegroundColor Cyan
$f0 = @'
// PAKET-12A: tanggal dengan nama hari, contoh "Selasa, 03 November 2026" (zona Asia/Jakarta)
export function tanggalLengkap(d: Date | null | undefined): string {
  if (!d) return "";
  return d.toLocaleDateString("id-ID", { weekday: "long", day: "2-digit", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}

'@
Tulis 'src/lib/tanggal.ts' $f0
$f1 = @'
// PAKET-12A: mencegah foto ganda. Bila gambar sampul ternyata sama dengan salah satu gambar di isi artikel
// (umum pada artikel impor WordPress), sampul tidak ditampilkan lagi supaya foto tidak muncul dua kali.
const tanpaQuery = (u: string) => u.split("?")[0].trim().toLowerCase();

// Nama berkas tanpa ekstensi, tanpa akhiran ukuran WordPress (-1024x768) dan tanpa akhiran acak ImageKit (_aB3dE9x)
const namaInti = (u: string) => {
  const akhir = tanpaQuery(u).split("/").pop() ?? "";
  return akhir
    .replace(/\.[a-z0-9]{2,5}$/, "")
    .replace(/-\d+x\d+$/, "")
    .replace(/_(?=[a-z0-9]{6,8}$)(?=[a-z]*\d)[a-z0-9]+$/, "");
};

export function sampulSudahAdaDiIsi(cover: string | null | undefined, html: string): boolean {
  if (!cover) return false;
  const penuh = tanpaQuery(cover);
  const nama = namaInti(cover);
  const re = /<img\b[^>]*?\ssrc="([^"]+)"/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    if (tanpaQuery(m[1]) === penuh) return true;
    if (nama.length >= 6 && namaInti(m[1]) === nama) return true;
  }
  return false;
}

'@
Tulis 'src/lib/sampul-ganda.ts' $f1
$f2 = @'
// PAKET-12A: kembali ke daftar artikel seperti sebelumnya (halaman, filter, pencarian, dan posisi gulir).
// Saat tombol utama tergulir keluar layar, muncul tombol ringkas "Kembali" melayang tepat di bawah tombol hamburger.
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function TombolKembali({ label = "Kembali ke daftar artikel" }: { label?: string }) {
  const router = useRouter();
  const utama = useRef<HTMLButtonElement>(null);
  const [melayang, setMelayang] = useState(false);

  useEffect(() => {
    const el = utama.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // 64 px = tinggi bilah atas CMS; tombol dianggap "tenggelam" bila sudah lewat di atas bilah itu
    const io = new IntersectionObserver(
      ([e]) => setMelayang(!e.isIntersecting && e.boundingClientRect.top < 64),
      { rootMargin: "-64px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const kembali = () => {
    let url = "/admin/artikel";
    try {
      const s = JSON.parse(sessionStorage.getItem("adm-daftar") ?? "null") as { url: string; y: number } | null;
      if (s?.url?.startsWith("/admin/artikel")) {
        url = s.url;
        sessionStorage.setItem("adm-daftar", JSON.stringify({ ...s, pulihkan: true }));
      }
    } catch { /* gunakan alamat bawaan */ }
    router.push(url);
  };

  return (
    <>
      <button ref={utama} type="button" onClick={kembali} className="a-btn-soft">&larr; {label}</button>
      <button
        type="button"
        onClick={kembali}
        aria-label={label}
        title={label}
        aria-hidden={!melayang}
        tabIndex={melayang ? 0 : -1}
        className={`a-btn-soft fixed left-4 top-[4.5rem] z-[25] !px-3 !py-1.5 text-xs shadow-lg transition-opacity duration-150 lg:left-[calc(17rem+2rem)] ${melayang ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        &larr; Kembali
      </button>
    </>
  );
}

'@
Tulis 'src/components/admin/TombolKembali.tsx' $f2
$a0 = @'
import { sanitizeHtml } from "@/lib/sanitize";
'@
$b0 = @'
import { sanitizeHtml } from "@/lib/sanitize";
import { tanggalLengkap } from "@/lib/tanggal";
import { sampulSudahAdaDiIsi } from "@/lib/sampul-ganda";
'@
Ganti 'src/app/(situs)/artikel/[slug]/page.tsx' $a0 $b0
$a1 = @'
{p.publishedAt?.toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" })}
'@
$b1 = @'
{tanggalLengkap(p.publishedAt)}
'@
Ganti 'src/app/(situs)/artikel/[slug]/page.tsx' $a1 $b1
$a2 = @'
{p.coverUrl && <img src={p.coverUrl} alt="" className="mt-8 w-full rounded-lg" />}
'@
$b2 = @'
{p.coverUrl && !sampulSudahAdaDiIsi(p.coverUrl, p.content) && <img src={p.coverUrl} alt="" className="mt-8 w-full rounded-lg" />}
'@
Ganti 'src/app/(situs)/artikel/[slug]/page.tsx' $a2 $b2
$a3 = @'
import { notFound } from "next/navigation";
'@
$b3 = @'
import { notFound } from "next/navigation";
import { tanggalLengkap } from "@/lib/tanggal";
'@
Ganti 'src/app/(situs)/video/[slug]/page.tsx' $a3 $b3
$a4 = @'
{v.publishedAt?.toLocaleDateString("id-ID", { dateStyle: "long", timeZone: "Asia/Jakarta" })}
'@
$b4 = @'
{tanggalLengkap(v.publishedAt)}
'@
Ganti 'src/app/(situs)/video/[slug]/page.tsx' $a4 $b4
$a5 = @'
className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
'@
$b5 = @'
className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>:first-child]:ml-auto [&>:last-child]:mr-auto"
'@
Ganti 'src/components/layout/NavScroll.tsx' $a5 $b5
$a6 = @'
import { useRef, useState } from "react";
'@
$b6 = @'
import { useEffect, useRef, useState } from "react";
'@
Ganti 'src/components/Editor.tsx' $a6 $b6
$a7 = @'
  const [sibuk, setSibuk] = useState(false);
'@
$b7 = @'
  const [sibuk, setSibuk] = useState(false);
  const [ejaan, setEjaan] = useState(false);
'@
Ganti 'src/components/Editor.tsx' $a7 $b7
$a8 = @'
attributes: { class: "prose prose-stone
'@
$b8 = @'
attributes: { lang: "id", class: "prose prose-stone
'@
Ganti 'src/components/Editor.tsx' $a8 $b8
$a9 = @'
  const c = () => editor?.chain().focus();
'@
$b9 = @'
  // Garis merah ejaan mati secara bawaan; tombol "Ejaan" menyalakannya (mengikuti kamus bahasa di browser)
  useEffect(() => {
    try { editor?.view.dom.setAttribute("spellcheck", ejaan ? "true" : "false"); } catch { /* editor belum terpasang */ }
  }, [editor, ejaan]);
  const c = () => editor?.chain().focus();
'@
Ganti 'src/components/Editor.tsx' $a9 $b9
$a10 = @'
<Tombol judul="Hapus semua pemformatan" lebar onClick={() => c()?.unsetAllMarks().clearNodes().run()}>Bersihkan</Tombol>
'@
$b10 = @'
<Tombol judul="Hapus semua pemformatan" lebar onClick={() => c()?.unsetAllMarks().clearNodes().run()}>Bersihkan</Tombol>
        <Tombol judul="Nyalakan/matikan garis merah pemeriksa ejaan browser" aktif={ejaan} lebar onClick={() => setEjaan(!ejaan)}>Ejaan</Tombol>
'@
Ganti 'src/components/Editor.tsx' $a10 $b10
$hp = @'
<Link\ href="/"\ className=\{`\$\{biasa\}\ hidden\ lg:block`\}>Beranda</Link>\s*<NavScroll>
'@
$hb = @'
<NavScroll>
            <Link href="/" className={biasa}>Beranda</Link>
'@
GantiRegex2 'src/components/layout/Header.tsx' $hp $hb

Write-Host ""
Write-Host "Selesai. Jalankan: npm run dev  (tanpa npm install). Lalu cek halaman artikel, header, dan editor." -ForegroundColor Cyan
Write-Host "Bila ada baris merah GAGAL di atas, kirim tangkapan layarnya." -ForegroundColor Cyan
