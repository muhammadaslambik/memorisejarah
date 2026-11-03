# paket-12c-tema-bahasa.ps1  (PAKET-12C)
# Isi: tombol mode gelap/terang dan tombol bahasa (ikon bumi) di header situs publik. Jalankan SETELAH paket 12A dan 12B.
# Jalankan dari folder proyek:  powershell -ExecutionPolicy Bypass -File .\paket-12c-tema-bahasa.ps1
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

Write-Host "== Paket 12C ==" -ForegroundColor Cyan
$f0 = @'
// PAKET-12C: tombol mode gelap/terang untuk situs publik. Bawaan gelap; pilihan disimpan di peramban (localStorage).
// Skrip kecil di <head> (app/layout.tsx) menerapkan pilihan sebelum halaman tampil, jadi tidak berkedip.
"use client";

export function TombolTemaSitus({ className }: { className: string }) {
  const ganti = () => {
    const el = document.documentElement;
    const terang = el.dataset.tema !== "terang";
    if (terang) el.dataset.tema = "terang";
    else delete el.dataset.tema;
    try { localStorage.setItem("ms-tema", terang ? "terang" : "gelap"); } catch { /* penyimpanan dimatikan */ }
  };
  const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <button type="button" onClick={ganti} aria-label="Ganti mode gelap atau terang" title="Mode gelap / terang" className={className}>
      {/* mode gelap: tampil matahari (klik = terang); mode terang: tampil bulan (klik = gelap). Pergantian lewat CSS agar tanpa kedip */}
      <svg {...g} className="ms-ikon-matahari h-5 w-5" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      <svg {...g} className="ms-ikon-bulan h-5 w-5" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
    </button>
  );
}

'@
Tulis 'src/components/layout/TombolTemaSitus.tsx' $f0
$f1 = @'
// PAKET-12C: tombol bahasa (ikon bumi). Terjemahan otomatis memakai Google Translate; skripnya baru dimuat
// setelah pengunjung memilih bahasa selain Indonesia. Teks asli situs tetap bahasa Indonesia.
"use client";
import { useEffect, useRef, useState } from "react";

const BAHASA = [
  { kode: "id", nama: "Bahasa Indonesia" },
  { kode: "jw", nama: "Basa Jawa" },
  { kode: "su", nama: "Basa Sunda" },
  { kode: "ms", nama: "Bahasa Melayu" },
  { kode: "ar", nama: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629 (Arab)" },
  { kode: "zh-CN", nama: "\u4E2D\u6587 (Mandarin)" },
  { kode: "en", nama: "English" },
  { kode: "fr", nama: "Fran\u00E7ais" },
  { kode: "ru", nama: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" },
  { kode: "es", nama: "Espa\u00F1ol" },
];
const SUMBER = "https://translate.google.com/translate_a/element.js?cb=msTerjemahSiap";

type GT = { translate: { TranslateElement: new (opsi: object, id: string) => unknown } };
type W = Window & { msTerjemahSiap?: () => void; google?: GT };

const kodeAktif = (): string => {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  const k = m ? decodeURIComponent(m[1]).split("/")[2] : "";
  return k && BAHASA.some((b) => b.kode === k) ? k : "id";
};

const hapusKuki = () => {
  const mati = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = mati;
  const bagian = location.hostname.split(".");
  for (let i = 0; i < bagian.length - 1; i++) {
    const d = bagian.slice(i).join(".");
    document.cookie = `${mati}; domain=${d}`;
    document.cookie = `${mati}; domain=.${d}`;
  }
};

const muatWidget = () => {
  if (document.getElementById("ms-gt")) return;
  const w = window as W;
  const wadah = document.createElement("div");
  wadah.id = "google_translate_element";
  wadah.className = "notranslate";
  wadah.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  document.body.appendChild(wadah);
  w.msTerjemahSiap = () => {
    if (w.google) new w.google.translate.TranslateElement({ pageLanguage: "id", includedLanguages: "jw,su,ms,ar,zh-CN,en,fr,ru,es", autoDisplay: false }, "google_translate_element");
  };
  const s = document.createElement("script");
  s.id = "ms-gt";
  s.src = SUMBER;
  s.async = true;
  document.body.appendChild(s);
};

export function TombolBahasa({ className }: { className: string }) {
  const [buka, setBuka] = useState(false);
  const [aktif, setAktif] = useState("id");
  const kotak = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const k = kodeAktif();
    setAktif(k);
    if (k !== "id") muatWidget();
  }, []);

  useEffect(() => {
    if (!buka) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    const luar = (e: MouseEvent) => { if (!kotak.current?.contains(e.target as Node)) setBuka(false); };
    document.addEventListener("keydown", esc);
    document.addEventListener("mousedown", luar);
    return () => { document.removeEventListener("keydown", esc); document.removeEventListener("mousedown", luar); };
  }, [buka]);

  const pilih = (kode: string) => {
    setBuka(false);
    if (kode === aktif) return;
    hapusKuki();
    if (kode !== "id") document.cookie = `googtrans=/id/${kode}; path=/`;
    location.reload();
  };

  const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <div ref={kotak} className="relative notranslate">
      <button type="button" onClick={() => setBuka(!buka)} aria-label="Pilih bahasa" aria-expanded={buka} title="Bahasa" className={className}>
        <svg {...g} className="h-5 w-5" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
      </button>
      {buka && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-ms-line bg-ms-surface p-2 shadow-2xl" role="menu">
          {BAHASA.map((b) => (
            <button
              key={b.kode}
              type="button"
              role="menuitemradio"
              aria-checked={b.kode === aktif}
              onClick={() => pilih(b.kode)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:text-ms-gold ${b.kode === aktif ? "font-semibold text-ms-gold" : "text-ms-cream/80"}`}
            >
              <span>{b.nama}</span>
              {b.kode === aktif && <span aria-hidden="true">&#10003;</span>}
            </button>
          ))}
          <p className="mt-1 border-t border-ms-line px-3 pt-2 text-[11px] leading-snug text-ms-cream/55">Terjemahan otomatis oleh Google Translate. Teks asli situs berbahasa Indonesia.</p>
        </div>
      )}
    </div>
  );
}

'@
Tulis 'src/components/layout/TombolBahasa.tsx' $f1
$a0 = @'
ms: { bg: "#140e08", surface: "#1d140b", line: "#3a2a18", gold: "#d9b26f", cream: "#f3e7d3" },
'@
$b0 = @'
ms: { bg: "rgb(var(--ms-bg) / <alpha-value>)", surface: "rgb(var(--ms-surface) / <alpha-value>)", line: "rgb(var(--ms-line) / <alpha-value>)", gold: "rgb(var(--ms-gold) / <alpha-value>)", cream: "rgb(var(--ms-cream) / <alpha-value>)" },
'@
Ganti 'tailwind.config.ts' $a0 $b0
$a1 = @'
export default function RootLayout(
'@
$b1 = @'
// PAKET-12C: menerapkan pilihan mode gelap/terang sebelum halaman tampil (tanpa berkedip)
const SKRIP_TEMA = `try{if(localStorage.getItem("ms-tema")==="terang")document.documentElement.dataset.tema="terang"}catch(e){}`;

export default function RootLayout(
'@
Ganti 'src/app/layout.tsx' $a1 $b1
$a2 = @'
<html lang="id" className={`${serif.variable} ${sans.variable}`}>
'@
$b2 = @'
<html lang="id" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA }} /></head>
'@
Ganti 'src/app/layout.tsx' $a2 $b2
$a3 = @'
import { usePathname, useRouter } from "next/navigation";
'@
$b3 = @'
import { usePathname, useRouter } from "next/navigation";
import { TombolTemaSitus } from "./TombolTemaSitus";
import { TombolBahasa } from "./TombolBahasa";
'@
Ganti 'src/components/layout/HeaderBar.tsx' $a3 $b3
$a4 = @'
<Link href="/admin" aria-label="Masuk" title="Masuk" className={tombolIkon}>
'@
$b4 = @'
<TombolTemaSitus className={tombolIkon} />
        <TombolBahasa className={tombolIkon} />
        <Link href="/admin" aria-label="Masuk" title="Masuk" className={tombolIkon}>
'@
Ganti 'src/components/layout/HeaderBar.tsx' $a4 $b4
$css = @'
/* PAKET-12C: palet situs publik lewat variabel warna (R G B) agar bisa gelap/terang.
   Bawaan = gelap (sama seperti sebelumnya). Mode terang dibuat hangat dan redup (bukan putih murni) agar nyaman di mata. */
:root {
  --ms-bg: 20 14 8; --ms-surface: 29 20 11; --ms-line: 58 42 24; --ms-gold: 217 178 111; --ms-cream: 243 231 211;
}
html[data-tema="terang"] {
  --ms-bg: 235 226 208; --ms-surface: 244 237 223; --ms-line: 205 189 159; --ms-gold: 138 90 18; --ms-cream: 43 29 16;
  color-scheme: light;
}
/* Blok berlatar gradien berwarna tetap memakai palet gelap agar teksnya terbaca */
html[data-tema="terang"] .bg-gradient-to-br,
html[data-tema="terang"] .bg-gradient-to-r {
  --ms-bg: 20 14 8; --ms-surface: 29 20 11; --ms-line: 58 42 24; --ms-gold: 217 178 111; --ms-cream: 243 231 211;
  color: rgb(243 231 211);
}
html[data-tema="terang"] [class~="hover:bg-white/5"]:hover { background-color: rgb(0 0 0 / 0.06); }
html[data-tema="terang"] .prose-invert {
  --tw-prose-body: rgb(var(--ms-cream) / 0.88); --tw-prose-headings: rgb(var(--ms-cream)); --tw-prose-lead: rgb(var(--ms-cream) / 0.8);
  --tw-prose-links: rgb(var(--ms-gold)); --tw-prose-bold: rgb(var(--ms-cream)); --tw-prose-counters: rgb(var(--ms-cream) / 0.6);
  --tw-prose-bullets: rgb(var(--ms-cream) / 0.5); --tw-prose-hr: rgb(var(--ms-line)); --tw-prose-quotes: rgb(var(--ms-cream));
  --tw-prose-quote-borders: rgb(var(--ms-gold)); --tw-prose-captions: rgb(var(--ms-cream) / 0.65); --tw-prose-code: rgb(var(--ms-cream));
  --tw-prose-pre-code: rgb(var(--ms-cream)); --tw-prose-pre-bg: rgb(var(--ms-surface));
  --tw-prose-th-borders: rgb(var(--ms-line)); --tw-prose-td-borders: rgb(var(--ms-line));
}
/* Ikon tombol tema: matahari di mode gelap, bulan di mode terang */
.ms-ikon-bulan { display: none; }
html[data-tema="terang"] .ms-ikon-matahari { display: none; }
html[data-tema="terang"] .ms-ikon-bulan { display: block; }
/* Google Translate: sembunyikan bilah dan tooltip bawaannya */
body { top: 0 !important; }
.goog-te-banner-frame, iframe.skiptranslate, .skiptranslate > iframe, iframe.VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; }
#goog-gt-tt, .goog-tooltip, .goog-te-balloon-frame { display: none !important; }
.goog-text-highlight { background: none !important; box-shadow: none !important; }
'@
Tambah 'src/app/globals.css' 'PAKET-12C' $css

Write-Host ""
Write-Host "Selesai. Jalankan: npm run dev  (tanpa npm install). Cek beranda: tombol matahari/bulan dan ikon bumi di kanan header." -ForegroundColor Cyan
Write-Host "Bila ada baris merah GAGAL di atas, kirim tangkapan layarnya." -ForegroundColor Cyan
