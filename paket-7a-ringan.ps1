# Paket 7A: kurangi kueri database per halaman (Header/Footer/pengaturan). ASCII saja, idempoten.. ASCII saja, idempoten.
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






Tulis @('src','lib') 'data-situs.ts' @'
// PAKET-7A: data bersama yang dibaca sekali per permintaan (React cache), agar Header, Footer,
// dan blok beranda tidak mengulang kueri yang sama ke database.
import { cache } from "react";
import { db, categories, siteSettings } from "@/db";

// Kategori untuk menu: hanya subkategori (kategori induk tidak ditampilkan di menu)
export const ambilKategoriCache = cache(async () => {
  try {
    const k = await db().select().from(categories).orderBy(categories.name);
    const induk = new Set(k.map((c) => c.parentId));
    return k.filter((c) => !induk.has(c.id));
  } catch {
    return [];
  }
});

// Semua pengaturan tampilan dalam satu kueri
export const semuaPengaturan = cache(async () => {
  try {
    const rows = await db().select().from(siteSettings);
    return new Map(rows.map((r) => [r.key, r.value]));
  } catch {
    return new Map<string, string>();
  }
});
'@

function Ganti($f, $lama, $baru, $ket) {
  if (-not [System.IO.File]::Exists($f)) { Write-Host ('Tidak ada: ' + $f) -ForegroundColor Yellow; return }
  $t = [System.IO.File]::ReadAllText($f)
  if ($t.Contains($baru)) { Write-Host ($ket + ': sudah diterapkan (dilewati).') -ForegroundColor Yellow; return }
  if (-not $t.Contains($lama)) { Write-Host ('PERHATIAN ' + $ket + ': teks yang dicari tidak ditemukan, beri tahu saya.') -ForegroundColor Red; return }
  [System.IO.File]::WriteAllText($f, $t.Replace($lama, $baru), $utf8)
  Write-Host ($ket + ': diterapkan.') -ForegroundColor Green
}
function P { $f = $root; foreach ($b in $args) { $f = [System.IO.Path]::Combine($f, $b) }; return $f }




function GantiRegex($f, $pola, $baru, $ket, $tanda) {
  if (-not [System.IO.File]::Exists($f)) { Write-Host ('Tidak ada: ' + $f) -ForegroundColor Yellow; return }
  $t = [System.IO.File]::ReadAllText($f)
  if ($t.Contains($tanda)) { Write-Host ($ket + ': sudah diterapkan (dilewati).') -ForegroundColor Yellow; return }
  $rx = New-Object System.Text.RegularExpressions.Regex($pola, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  if (-not $rx.IsMatch($t)) { Write-Host ('PERHATIAN ' + $ket + ': bagian yang dicari tidak ditemukan, beri tahu saya.') -ForegroundColor Red; return }
  [System.IO.File]::WriteAllText($f, $rx.Replace($t, $baru.Replace('$','$$'), 1), $utf8)
  Write-Host ($ket + ': diterapkan.') -ForegroundColor Green
}
$polaKat = 'async function ambilKategori\(\) \{\r?\n.*?\r?\n\}'
$baruKat = "async function ambilKategori() {`r`n  return ambilKategoriCache();`r`n}"
$lamaImp = 'import { db, categories } from "@/db";'
$baruImp = 'import { ambilKategoriCache } from "@/lib/data-situs";'
$hf = P 'src' 'components' 'layout' 'Header.tsx'
$ff = P 'src' 'components' 'layout' 'Footer.tsx'
GantiRegex $hf $polaKat $baruKat 'Header (kategori)' 'ambilKategoriCache()'
Ganti $hf $lamaImp $baruImp 'Header (impor)'
Ganti $hf 'const cats = await ambilKategori();' 'const [cats, pustaka] = await Promise.all([ambilKategori(), getPustaka()]);' 'Header (kueri paralel)'
Ganti $hf 'const pustaka = await getPustaka();' '// pustaka dimuat bersamaan dengan kategori' 'Header (hapus kueri berurutan)'
GantiRegex $ff $polaKat $baruKat 'Footer (kategori)' 'ambilKategoriCache()'
Ganti $ff $lamaImp $baruImp 'Footer (impor)'
$pf = P 'src' 'lib' 'pengaturan.ts'
Ganti $pf 'import { PUSTAKA } from "./pustaka";' ('import { PUSTAKA } from "./pustaka";' + "`r`n" + 'import { semuaPengaturan } from "./data-situs";') 'Pengaturan (impor)'
$baruSet = "export async function getSetting<T>(key: string, def: T): Promise<T> {`r`n  try {`r`n    const v = (await semuaPengaturan()).get(key);`r`n    return v !== undefined ? (JSON.parse(v) as T) : def;`r`n  } catch {`r`n    return def;`r`n  }`r`n}"
GantiRegex $pf 'export async function getSetting<T>\(key: string, def: T\): Promise<T> \{\r?\n.*?\r?\n\}' $baruSet 'Pengaturan (satu kueri untuk semua)' 'semuaPengaturan()).get(key)'
Write-Host ''
Write-Host 'Selesai. Hentikan dan jalankan ulang npm run dev.' -ForegroundColor Cyan
