# paket-12d3-alamat-penulis.ps1  (PAKET-12D3)
# Isi: halaman penulis di alamat /nama-penulis (contoh /arya-bagus-nur-ajiyanto); alamat lama /tentang/redaksi/... dialihkan. Jalankan SETELAH paket 12D2.
# Jalankan dari folder proyek:  powershell -ExecutionPolicy Bypass -File .\paket-12d3-alamat-penulis.ps1
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

Write-Host "== Paket 12D3 ==" -ForegroundColor Cyan
$f0 = @'
// PAKET-12D3: halaman penulis di alamat /nama-penulis (profil, tombol Lihat Biografi, dan daftar tulisan).
// Nama folder [tahun] dipertahankan karena sudah dipakai rute alamat lama WordPress (/YYYY/MM/DD/slug);
// di halaman ini isinya adalah nama-penulis, bukan tahun.
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, redaksi, redaksiTim, posts } from "@/db";
import { kolomKartu } from "@/lib/kolom";
import { kecil } from "@/lib/gambar-url";
import { namaTim, tautanAman } from "@/lib/redaksi";
import { Avatar } from "@/components/content/Avatar";
import { PostCardMini } from "@/components/content/PostCardMini";
import { BiografiLengkap } from "@/components/content/BiografiLengkap";
import { sanitizeHtml } from "@/lib/sanitize";

export const dynamic = "force-dynamic";

const cari = async (slug: string) => {
  if (slug.includes(".")) return undefined; // berkas seperti /favicon.ico bukan penulis
  try {
    const [m] = await db().select().from(redaksi).where(and(eq(redaksi.slug, slug), eq(redaksi.aktif, true))).limit(1);
    return m;
  } catch {
    return undefined;
  }
};

export async function generateMetadata({ params }: { params: Promise<{ tahun: string }> }) {
  const m = await cari((await params).tahun);
  if (!m) return {};
  return {
    title: m.name,
    description: (m.bio || m.peran).slice(0, 160),
    openGraph: m.fotoUrl ? { images: [kecil(m.fotoUrl, 800)] } : undefined,
  };
}

export default async function Profil({ params }: { params: Promise<{ tahun: string }> }) {
  const m = await cari((await params).tahun);
  if (!m) notFound();
  const d = db();
  const [tim, tulisan] = await Promise.all([
    d.select().from(redaksiTim).where(eq(redaksiTim.memberId, m.id)),
    m.userId
      ? d.select(kolomKartu).from(posts).where(and(eq(posts.authorId, m.userId), eq(posts.status, "published"))).orderBy(desc(posts.publishedAt)).limit(30)
      : Promise.resolve([]),
  ]);

  const kontak: [string, string][] = [];
  if (m.email) kontak.push(["Email", `mailto:${m.email}`]);
  if (m.whatsapp) kontak.push(["WhatsApp", `https://wa.me/${m.whatsapp}`]);
  if (m.instagram) kontak.push(["Instagram", m.instagram]);
  if (m.linkedin) kontak.push(["LinkedIn", m.linkedin]);
  if (m.facebook) kontak.push(["Facebook", m.facebook]);
  if (m.website) kontak.push(["Situs web", m.website]);
  const aman = kontak.filter(([, u]) => tautanAman(u));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: m.name,
    ...(m.peran ? { jobTitle: m.peran } : {}),
    ...(m.fotoUrl ? { image: m.fotoUrl } : {}),
    worksFor: { "@type": "Organization", name: "Memori Sejarah" },
    ...(aman.filter(([k]) => k !== "Email" && k !== "WhatsApp").length ? { sameAs: aman.filter(([k]) => k !== "Email" && k !== "WhatsApp").map(([, u]) => u) } : {}),
  };

  const baris = (judul: string, isi: string) => isi ? (
    <div className="mt-5">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ms-gold">{judul}</p>
      <p className="mt-1 text-ms-cream/85">{isi}</p>
    </div>
  ) : null;

  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <section className="mx-auto max-w-5xl px-6 pt-12">
        <Link href="/tentang/redaksi" className="text-sm text-ms-cream/60 hover:text-ms-gold">&larr; Susunan Redaksi</Link>
        <div className="mt-6 flex flex-col gap-8 rounded-2xl border border-ms-line bg-ms-surface p-6 md:flex-row md:p-10">
          <div className="shrink-0"><Avatar nama={m.name} url={m.fotoUrl} ukuran={180} /></div>
          <div className="min-w-0">
            <h1 className="font-serif text-3xl font-bold md:text-4xl">{m.name}</h1>
            {m.peran && <p className="mt-2 text-ms-gold">{m.peran}</p>}
            {tim.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {tim.map((t) => <span key={t.tim} className="rounded-full border border-ms-line px-3 py-1 text-xs text-ms-cream/80">{namaTim(t.tim)}{t.catatan ? ` (${t.catatan})` : ""}</span>)}
              </div>
            )}
            {baris("Bidang penelitian", m.bidang)}
            {baris("Domisili", m.domisili)}
            {m.bio && <p className="mt-5 whitespace-pre-line leading-relaxed text-ms-cream/85">{m.bio}</p>}
            {m.bioLengkap && <BiografiLengkap html={sanitizeHtml(m.bioLengkap)} />}
            {aman.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {aman.map(([label, url]) => (
                  <a key={label} href={url} {...(url.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                    className="rounded-full border border-ms-line px-4 py-1.5 text-sm text-ms-cream/85 transition hover:border-ms-gold hover:text-ms-gold">{label}</a>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
      {tulisan.length > 0 && (
        <section className="mx-auto mt-12 max-w-[90rem] px-6 md:px-10 lg:px-16">
          <h2 className="font-serif text-2xl font-bold">Tulisan oleh {m.name.split(",")[0]}</h2>
          <div className="mt-5 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {tulisan.map((p) => <PostCardMini key={p.id} p={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
'@
Tulis 'src/app/(situs)/[tahun]/page.tsx' $f0
$f1 = @'
// PAKET-12D3: alamat lama profil redaksi dialihkan permanen ke alamat penulis (/nama-penulis)
import { permanentRedirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProfilLama({ params }: { params: Promise<{ slug: string }> }) {
  permanentRedirect(`/${encodeURIComponent((await params).slug)}`);
}

'@
Tulis 'src/app/(situs)/tentang/redaksi/[slug]/page.tsx' $f1
$f2 = @'
// PAKET-12D3: nama penulis di artikel = tautan ke halaman penulis /nama-penulis (atau halaman tulisan bila belum punya profil).
import Link from "next/link";
import type { RingkasPenulis } from "@/lib/penulis";

export function PenulisInfo({ data }: { data: RingkasPenulis }) {
  const href = data.profilSlug ? `/${data.profilSlug}` : `/penulis/${data.id}`;
  return (
    <Link href={href} className="font-semibold text-ms-gold underline decoration-dotted underline-offset-4 hover:decoration-solid">
      {data.nama.split(",")[0]}
    </Link>
  );
}

'@
Tulis 'src/components/content/PenulisInfo.tsx' $f2
$a0 = @'
href={`/tentang/redaksi/${x.slug}`}
'@
$b0 = @'
href={`/${x.slug}`}
'@
Ganti 'src/app/admin/redaksi/page.tsx' $a0 $b0
$a1 = @'
href={`/tentang/redaksi/${a.slug}`}
'@
$b1 = @'
href={`/${a.slug}`}
'@
Ganti 'src/app/(situs)/tentang/redaksi/page.tsx' $a1 $b1
$a2 = @'
href={`/tentang/redaksi/${p.profilSlug}`}
'@
$b2 = @'
href={`/${p.profilSlug}`}
'@
Ganti 'src/app/(situs)/penulis/[id]/page.tsx' $a2 $b2

Write-Host ""
Write-Host "Selesai. Jalankan: npm run dev. Buka http://localhost:3000/arya-bagus-nur-ajiyanto lalu klik nama penulis di salah satu artikel." -ForegroundColor Cyan
Write-Host "Bila ada baris merah GAGAL di atas, kirim tangkapan layarnya." -ForegroundColor Cyan
