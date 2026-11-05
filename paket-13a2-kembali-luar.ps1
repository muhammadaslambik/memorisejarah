# paket-13a2-kembali-luar.ps1  (PAKET-13A2)
# Isi: tombol Kembali (ikon) diletakkan di luar kolom, di bawah tombol hamburger; di layar sempit tetap di bilah alat editor.
# Jalankan dari folder proyek:  powershell -ExecutionPolicy Bypass -File .\paket-13a2-kembali-luar.ps1
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

Write-Host "== Paket 13A2 ==" -ForegroundColor Cyan
$f0 = @'
// PAKET-13A2: tombol kembali ke daftar artikel berupa ikon.
// Bila ada ruang di samping kolom penulisan, tombol diletakkan DI LUAR kolom, tepat di bawah tombol hamburger,
// dan menempel saat halaman digulir. Bila layar sempit (tidak ada ruang), tombol tetap di kiri bilah alat editor.
// Tulisan "Kembali ke daftar artikel" muncul saat kursor diarahkan atau tombol difokuskan (keyboard).
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Posisi = { kiri: number; atas: number } | null;
const LEBAR = 32; // sama dengan h-8 w-8

export function TombolKembali({ label = "Kembali ke daftar artikel" }: { label?: string }) {
  const router = useRouter();
  const akar = useRef<HTMLSpanElement>(null);
  const [luar, setLuar] = useState<Posisi>(null);

  useEffect(() => {
    const hitung = () => {
      const form = akar.current?.closest("form");
      if (!form) { setLuar(null); return; }
      const ham = document.querySelector<HTMLElement>('label[for="adm-menu"]')?.getBoundingClientRect();
      const tampak = !!ham && ham.width > 0; // tombol hamburger hanya ada di layar sempit
      const sisi = document.querySelector<HTMLElement>(".a-side")?.getBoundingClientRect();
      const kiri = tampak ? ham!.left : (sisi && sisi.right > 0 ? sisi.right : 0) + 32;
      const atas = Math.max(tampak ? ham!.bottom : 0, 64) + 8; // di bawah bilah atas CMS (tinggi 64 px)
      const cukup = form.getBoundingClientRect().left - (kiri + LEBAR) >= 12;
      setLuar((lama) => {
        if (!cukup) return null;
        return lama && Math.abs(lama.kiri - kiri) < 0.5 && Math.abs(lama.atas - atas) < 0.5 ? lama : { kiri, atas };
      });
    };
    hitung();
    window.addEventListener("resize", hitung);
    const ro = new ResizeObserver(hitung);
    ro.observe(document.body);
    return () => { window.removeEventListener("resize", hitung); ro.disconnect(); };
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
    <span
      ref={akar}
      className="group relative inline-flex items-center"
      style={luar ? { position: "fixed", left: luar.kiri, top: luar.atas, zIndex: 25 } : undefined}
    >
      <button
        type="button"
        onClick={kembali}
        aria-label={label}
        className={`grid h-8 w-8 place-items-center rounded-md transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2 ${luar ? "border bg-cream-dark shadow-md" : ""}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M6 8l-4 4 4 4" />
          <path d="M10 6h11M10 12h11M10 18h11" />
        </svg>
      </button>
      {!luar && <span className="mx-1 h-5 w-px bg-black/15" aria-hidden="true" />}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-black/85 px-2.5 py-1 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${luar ? "left-full top-1/2 ml-2 -translate-y-1/2" : "left-0 top-full mt-1.5"}`}
      >
        {label}
      </span>
    </span>
  );
}

'@
Tulis 'src/components/admin/TombolKembali.tsx' $f0
$a0 = @'
{awal && <span className="mx-1 h-5 w-px bg-black/15" aria-hidden="true" />}
'@
$b0 = @'
{/* pemisah di samping ikon kembali kini digambar oleh komponennya sendiri */}
'@
Ganti 'src/components/Editor.tsx' $a0 $b0

Write-Host ""
Write-Host "Selesai. Muat ulang halaman edit artikel: ikon kembali ada di luar kolom, di bawah tombol hamburger." -ForegroundColor Cyan
