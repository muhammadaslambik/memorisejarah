# Paket 9B: header dengan ikon cari (kolom lebar) dan ikon masuk. ASCII saja, idempoten.. ASCII saja, idempoten.. ASCII saja, idempoten.
$ErrorActionPreference = 'Stop'
$root = (Get-Location).Path
if (-not [System.IO.File]::Exists([System.IO.Path]::Combine($root,'package.json')) -or -not [System.IO.Directory]::Exists([System.IO.Path]::Combine($root,'src','app','(situs)'))) {
  Write-Host 'Jalankan dari folder proyek memorisejarah (cabang tema-gelap).' -ForegroundColor Red; exit 1
}
$utf8 = New-Object System.Text.UTF8Encoding($false)
function Tulis($bagian, $nama, $isi) {
  $dir = $root
  foreach ($b in $bagian) { $dir = [System.IO.Path]::Combine($dir, $b) }
  $file = [System.IO.Path]::Combine($dir, $nama)
  if ([System.IO.File]::Exists($file)) {
    $lama = [System.IO.File]::ReadAllText($file)
    if (-not ($lama.Contains('PAKET-') -or $lama.Contains('Segera hadir'))) {
      Write-Host ('DILEWATI (berkas buatan Anda, tidak ditimpa): ' + $file) -ForegroundColor Yellow; return
    }
  }
  [System.IO.Directory]::CreateDirectory($dir) | Out-Null
  [System.IO.File]::WriteAllText($file, $isi.Replace("`r`n","`n").Replace("`n","`r`n"), $utf8)
  Write-Host ('Ditulis: ' + $file) -ForegroundColor Green
}







function Ganti($f, $lama, $baru, $ket) {
  if (-not [System.IO.File]::Exists($f)) { Write-Host ('Tidak ada: ' + $f) -ForegroundColor Yellow; return }
  $t = [System.IO.File]::ReadAllText($f)
  if ($t.Contains($baru)) { Write-Host ($ket + ': sudah diterapkan (dilewati).') -ForegroundColor Yellow; return }
  if (-not $t.Contains($lama)) { Write-Host ('PERHATIAN ' + $ket + ': teks yang dicari tidak ditemukan, beri tahu saya.') -ForegroundColor Red; return }
  [System.IO.File]::WriteAllText($f, $t.Replace($lama, $baru), $utf8)
  Write-Host ($ket + ': diterapkan.') -ForegroundColor Green
}
function P { $f = $root; foreach ($b in $args) { $f = [System.IO.Path]::Combine($f, $b) }; return $f }







Tulis @('src','components','layout') 'HeaderBar.tsx' @'
// PAKET-9B: area tengah header + ikon cari dan ikon masuk di pojok kanan.
// Ikon cari membuka kolom pencarian lebar yang menggantikan menu; Esc atau klik di luar mengembalikannya.
"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const tombolIkon =
  "grid h-10 w-10 shrink-0 place-items-center rounded-full text-ms-cream/80 transition hover:bg-white/5 hover:text-ms-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ms-gold";
const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function HeaderBar({ children }: { children: React.ReactNode }) {
  const [buka, setBuka] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const kotak = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // Pindah halaman: tutup pencarian
  useEffect(() => { setBuka(false); }, [path]);

  useEffect(() => {
    if (!buka) return;
    input.current?.focus();
    const tutupEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    const tutupLuar = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (kotak.current?.contains(t) || t?.closest("[data-tombol-cari]")) return;
      setBuka(false);
    };
    document.addEventListener("keydown", tutupEsc);
    document.addEventListener("mousedown", tutupLuar);
    return () => {
      document.removeEventListener("keydown", tutupEsc);
      document.removeEventListener("mousedown", tutupLuar);
    };
  }, [buka]);

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.current?.value.trim() ?? "";
    if (q) router.push(`/cari?q=${encodeURIComponent(q)}`);
    setBuka(false);
  };

  return (
    <>
      <div className={buka ? "hidden" : "contents"}>{children}</div>
      {buka && (
        <form
          ref={kotak}
          onSubmit={kirim}
          role="search"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-ms-gold/60 bg-ms-cream px-5 py-2.5 shadow-lg"
        >
          <svg {...svg} className="h-5 w-5 shrink-0 text-ms-bg/60" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            ref={input}
            type="search"
            name="q"
            autoComplete="off"
            placeholder="Cari artikel, tokoh, peristiwa..."
            aria-label="Cari"
            className="min-w-0 flex-1 bg-transparent text-base text-ms-bg outline-none placeholder:text-ms-bg/50"
          />
          <button type="button" onClick={() => setBuka(false)} aria-label="Tutup pencarian" className="shrink-0 text-ms-bg/60 hover:text-ms-bg">
            <svg {...svg} className="h-5 w-5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </form>
      )}
      <div className={`${buka ? "" : "ml-auto"} flex shrink-0 items-center gap-1`}>
        <button data-tombol-cari type="button" aria-label="Cari" aria-expanded={buka} onClick={() => setBuka(!buka)} className={tombolIkon}>
          <svg {...svg} className="h-5 w-5" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        </button>
        <Link href="/admin" aria-label="Masuk" title="Masuk" className={tombolIkon}>
          <svg {...svg} className="h-5 w-5" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
        </Link>
      </div>
    </>
  );
}
'@

Tulis @('src','components','layout') 'Header.tsx' @'
// PAKET-9B
import Link from "next/link";
import { ambilKategoriCache } from "@/lib/data-situs";
import { getPustaka } from "@/lib/pengaturan";
import { Logo } from "./Logo";
import { HeaderBar } from "./HeaderBar";
import { NavDropdown } from "./NavDropdown";
import { NavScroll } from "./NavScroll";
import { navItem, navSub } from "./nav-style";

const biasa = `${navItem} shrink-0 whitespace-nowrap`;

export async function Header() {
  const [cats, pustaka] = await Promise.all([ambilKategoriCache(), getPustaka()]);
  return (
    <header className="sticky top-0 z-40 border-b border-ms-line bg-ms-bg">
      <div className="mx-auto flex max-w-[90rem] items-center gap-3 px-6 py-3 md:px-10 lg:px-16">
        <Link href="/" aria-label="Memori Sejarah, beranda" className="shrink-0"><Logo /></Link>
        <HeaderBar>
          <Link href="/" className={`${biasa} hidden lg:block`}>Beranda</Link>
          <NavScroll>
            <NavDropdown label="Artikel" href="/artikel">
              <Link href="/artikel" className={navSub}>Semua Artikel</Link>
              {cats.map((c) => <Link key={c.id} href={`/kategori/${c.slug}`} className={navSub}>{c.name}</Link>)}
            </NavDropdown>
            <NavDropdown label="Pustaka" href="/pustaka">
              <Link href="/pustaka" className={navSub}>Semua Pustaka</Link>
              {pustaka.map((p) => <Link key={p.kunci} href={`/pustaka?f=${p.kunci}`} className={navSub}>{p.nama}</Link>)}
              <Link href="/gambar" className={navSub}>Galeri Gambar</Link>
            </NavDropdown>
            <Link href="/gambar" className={biasa}>Gambar</Link>
            <Link href="/video" className={biasa}>Video</Link>
            <NavDropdown label="Lainnya">
              <Link href="/informasi" className={navSub}>Informasi</Link>
              <Link href="/agenda" className={navSub}>Agenda Kegiatan</Link>
              <Link href="/tentang" className={navSub}>Tentang</Link>
              <Link href="/tentang/redaksi" className={navSub}>Redaksi</Link>
            </NavDropdown>
          </NavScroll>
        </HeaderBar>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-ms-line px-3 py-2 lg:hidden" aria-label="Menu seluler">
        {[["/", "Beranda"], ["/artikel", "Artikel"], ["/pustaka", "Pustaka"], ["/gambar", "Gambar"], ["/video", "Video"], ["/informasi", "Informasi"], ["/agenda", "Agenda"], ["/tentang", "Tentang"]].map(([h, l]) => (
          <Link key={h} href={h} className={`${navItem} whitespace-nowrap`}>{l}</Link>
        ))}
      </nav>
    </header>
  );
}
'@

Write-Host ''
Write-Host 'Selesai. Muat ulang halaman (npm run dev tetap jalan).' -ForegroundColor Cyan
