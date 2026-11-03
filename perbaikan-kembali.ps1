# perbaikan-kembali.ps1  (PAKET-12A2)
# Isi: tombol Kembali melayang tidak lagi menutupi bilah alat editor (bilah alat turun selama tombol tampil).
# Jalankan dari folder proyek:  powershell -ExecutionPolicy Bypass -File .\perbaikan-kembali.ps1
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

Write-Host "== Perbaikan tombol Kembali ==" -ForegroundColor Cyan
$f0 = @'
// PAKET-12A2: kembali ke daftar artikel seperti sebelumnya (halaman, filter, pencarian, dan posisi gulir).
// Saat tombol utama tergulir keluar layar, muncul tombol ringkas "Kembali" di bawah tombol hamburger.
// Selama tombol itu tampil, bilah alat editor turun sedikit (variabel --adm-lengket) supaya tidak saling menutupi.
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

  // Beri ruang bagi benda lengket lain (bilah alat editor) selama tombol melayang tampil
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--adm-lengket", melayang ? "7rem" : "4rem");
    return () => { root.style.removeProperty("--adm-lengket"); };
  }, [melayang]);

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
Tulis 'src/components/admin/TombolKembali.tsx' $f0
$a0 = @'
sticky top-16 z-10
'@
$b0 = @'
sticky top-[var(--adm-lengket,4rem)] z-10
'@
Ganti 'src/components/Editor.tsx' $a0 $b0
Write-Host "Selesai. Muat ulang halaman edit artikel lalu gulir ke bawah." -ForegroundColor Cyan
