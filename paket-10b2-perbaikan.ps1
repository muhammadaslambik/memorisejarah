# Paket 10B-2: arah kembali setelah simpan/hapus artikel (tahan terhadap jenis akhir baris). ASCII saja, idempoten.. ASCII saja, idempoten.. ASCII saja, idempoten.
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









function Ganti($f, $lama, $baru, $ket) {
  if (-not [System.IO.File]::Exists($f)) { Write-Host ('Tidak ada: ' + $f) -ForegroundColor Yellow; return }
  $t = [System.IO.File]::ReadAllText($f)
  if ($t.Contains($baru)) { Write-Host ($ket + ': sudah diterapkan (dilewati).') -ForegroundColor Yellow; return }
  if (-not $t.Contains($lama)) { Write-Host ('PERHATIAN ' + $ket + ': teks yang dicari tidak ditemukan, beri tahu saya.') -ForegroundColor Red; return }
  [System.IO.File]::WriteAllText($f, $t.Replace($lama, $baru), $utf8)
  Write-Host ($ket + ': diterapkan.') -ForegroundColor Green
}
function P { $f = $root; foreach ($b in $args) { $f = [System.IO.Path]::Combine($f, $b) }; return $f }









function GantiRegex2($f, $pola, $ganti, $ket) {
  $t = [System.IO.File]::ReadAllText($f)
  $rx = New-Object System.Text.RegularExpressions.Regex($pola, [System.Text.RegularExpressions.RegexOptions]::Singleline)
  if ($rx.IsMatch($t)) {
    [System.IO.File]::WriteAllText($f, $rx.Replace($t, $ganti, 1), $utf8)
    Write-Host ($ket + ': diterapkan.') -ForegroundColor Green
    return $true
  }
  return $false
}
$af = P 'src' 'lib' 'actions.ts'
$t = [System.IO.File]::ReadAllText($af)
$sudahS = $t.Contains('fd); }' + "`n" + '  redirect("/admin/artikel");') -or $t.Contains('fd); }' + "`r`n" + '  redirect("/admin/artikel");')
$p1 = '(simpanKategori\(d, baru\.id, fd\); \}\s*\r?\n\s*redirect\(")/admin("\);)'
$p2 = '(canDeletePost\(u, p\)\) await db\(\)\.delete\(posts\)\.where\(eq\(posts\.id, id\)\);\s*\r?\n\s*redirect\(")/admin("\);)'
$ok1 = GantiRegex2 $af $p1 '${1}/admin/artikel${2}' 'actions.ts (setelah simpan artikel)'
$ok2 = GantiRegex2 $af $p2 '${1}/admin/artikel${2}' 'actions.ts (setelah hapus artikel)'
if (-not $ok1 -or -not $ok2) {
  Write-Host ''
  Write-Host 'Sebagian bagian tidak ditemukan (mungkin sudah diterapkan). Baris terkait di actions.ts:' -ForegroundColor Yellow
  Select-String -Path $af -Pattern 'redirect\("/admin' | ForEach-Object { '  baris ' + $_.LineNumber + ': ' + $_.Line.Trim() }
}
Write-Host ''
Write-Host 'Selesai.' -ForegroundColor Cyan
