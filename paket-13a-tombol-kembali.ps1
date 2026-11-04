# paket-13a-tombol-kembali.ps1  (PAKET-13A)
# Isi: tombol Kembali berupa ikon di kiri bilah alat editor (dengan tooltip); garis merah ejaan dihapus dari judul, slug, dan ringkasan.
# Jalankan dari folder proyek:  powershell -ExecutionPolicy Bypass -File .\paket-13a-tombol-kembali.ps1
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

Write-Host "== Paket 13A ==" -ForegroundColor Cyan
$f0 = @'
// PAKET-13A: tombol kembali ke daftar artikel berupa ikon, diletakkan di kiri bilah alat editor.
// Menampilkan tulisan "Kembali ke daftar artikel" saat kursor diarahkan atau tombol difokuskan (keyboard).
// Mengembalikan halaman, filter, pencarian, dan posisi gulir daftar artikel seperti sebelumnya.
"use client";
import { useRouter } from "next/navigation";

export function TombolKembali({ label = "Kembali ke daftar artikel" }: { label?: string }) {
  const router = useRouter();

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
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={kembali}
        aria-label={label}
        className="grid h-8 w-8 place-items-center rounded-md transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M6 8l-4 4 4 4" />
          <path d="M10 6h11M10 12h11M10 18h11" />
        </svg>
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 whitespace-nowrap rounded-md bg-black/85 px-2.5 py-1 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}

'@
Tulis 'src/components/admin/TombolKembali.tsx' $f0
$a0 = @'
import { useEffect, useRef, useState } from "react";
'@
$b0 = @'
import { useEffect, useRef, useState, type ReactNode } from "react";
'@
Ganti 'src/components/Editor.tsx' $a0 $b0
$a1 = @'
type Props = { initial: string; name?: string; catatanKaki?: boolean; tinggi?: number };
'@
$b1 = @'
type Props = { initial: string; name?: string; catatanKaki?: boolean; tinggi?: number; awal?: ReactNode };
'@
Ganti 'src/components/Editor.tsx' $a1 $b1
$a2 = @'
catatanKaki = false, tinggi = 300 }: Props)
'@
$b2 = @'
catatanKaki = false, tinggi = 300, awal }: Props)
'@
Ganti 'src/components/Editor.tsx' $a2 $b2
$a3 = @'
role="toolbar" aria-label="Pemformatan teks">
'@
$b3 = @'
role="toolbar" aria-label="Pemformatan teks">
        {awal}
        {awal && <span className="mx-1 h-5 w-px bg-black/15" aria-hidden="true" />}
'@
Ganti 'src/components/Editor.tsx' $a3 $b3
$a4 = @'
<div className="mb-3"><TombolKembali /></div>
'@
$b4 = @'
{/* tombol kembali kini berupa ikon di bilah alat editor */}
'@
Ganti 'src/app/admin/artikel/[id]/page.tsx' $a4 $b4
$a5 = @'
<Editor initial={p?.content ?? ""} catatanKaki />
'@
$b5 = @'
<Editor initial={p?.content ?? ""} catatanKaki awal={<TombolKembali />} />
'@
Ganti 'src/app/admin/artikel/[id]/page.tsx' $a5 $b5
$a6 = @'
placeholder="Judul" required
'@
$b6 = @'
placeholder="Judul" required spellCheck={false}
'@
Ganti 'src/app/admin/artikel/[id]/page.tsx' $a6 $b6
$a7 = @'
placeholder="Slug URL (kosongkan = otomatis dari judul)"
'@
$b7 = @'
placeholder="Slug URL (kosongkan = otomatis dari judul)" spellCheck={false}
'@
Ganti 'src/app/admin/artikel/[id]/page.tsx' $a7 $b7
$a8 = @'
placeholder="Ringkasan singkat"
'@
$b8 = @'
placeholder="Ringkasan singkat" spellCheck={false}
'@
Ganti 'src/app/admin/artikel/[id]/page.tsx' $a8 $b8

Write-Host ""
Write-Host "Selesai. Muat ulang halaman edit artikel: ikon kembali ada di kiri tombol Paragraf." -ForegroundColor Cyan
Write-Host "Bila ada baris merah GAGAL di atas, kirim tangkapan layarnya." -ForegroundColor Cyan
