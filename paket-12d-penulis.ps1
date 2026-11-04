# paket-12d-penulis.ps1  (PAKET-12D)
# Isi: nama penulis di artikel bisa diklik (biografi singkat, biografi detail, kumpulan tulisan) + halaman /penulis/[id]. Jalankan SETELAH paket 12A.
# Jalankan dari folder proyek:  powershell -ExecutionPolicy Bypass -File .\paket-12d-penulis.ps1
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

Write-Host "== Paket 12D ==" -ForegroundColor Cyan
$f0 = @'
// PAKET-12D: data penulis untuk halaman artikel dan halaman tulisan penulis.
// Profil diambil dari Redaksi (bila akun penulis punya profil aktif); email akun tidak pernah ditampilkan.
import { and, count, desc, eq } from "drizzle-orm";
import { db, posts, redaksi, redaksiTim, users } from "@/db";
import { namaTim, tautanAman } from "./redaksi";

export type DataPenulis = {
  id: number;
  nama: string;
  foto: string | null;
  peran: string;
  bidang: string;
  domisili: string;
  tim: string[];
  bio: string;
  kontak: [string, string][];
  profilSlug: string | null;
  jumlah: number;
  tulisan: { slug: string; title: string }[];
};

export async function ambilPenulis(authorId: number | null | undefined): Promise<DataPenulis | null> {
  if (!authorId) return null;
  try {
    const d = db();
    const [u] = await d.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, authorId)).limit(1);
    if (!u) return null;
    const [m] = await d.select().from(redaksi).where(and(eq(redaksi.userId, u.id), eq(redaksi.aktif, true))).limit(1);
    const terbit = and(eq(posts.authorId, u.id), eq(posts.status, "published"));
    const [tim, [jml], tulisan] = await Promise.all([
      m ? d.select().from(redaksiTim).where(eq(redaksiTim.memberId, m.id)) : Promise.resolve([]),
      d.select({ n: count() }).from(posts).where(terbit),
      d.select({ slug: posts.slug, title: posts.title }).from(posts).where(terbit).orderBy(desc(posts.publishedAt)).limit(8),
    ]);
    const kontak: [string, string][] = [];
    if (m?.email) kontak.push(["Email", `mailto:${m.email}`]);
    if (m?.whatsapp) kontak.push(["WhatsApp", `https://wa.me/${m.whatsapp}`]);
    if (m?.instagram) kontak.push(["Instagram", m.instagram]);
    if (m?.linkedin) kontak.push(["LinkedIn", m.linkedin]);
    if (m?.facebook) kontak.push(["Facebook", m.facebook]);
    if (m?.website) kontak.push(["Situs web", m.website]);
    return {
      id: u.id,
      nama: m?.name ?? u.name,
      foto: m?.fotoUrl ?? null,
      peran: m?.peran ?? "",
      bidang: m?.bidang ?? "",
      domisili: m?.domisili ?? "",
      tim: tim.map((t) => namaTim(t.tim)),
      bio: m?.bio ?? "",
      kontak: kontak.filter(([, url]) => tautanAman(url)),
      profilSlug: m?.slug ?? null,
      jumlah: Number(jml?.n ?? 0),
      tulisan,
    };
  } catch {
    return null;
  }
}

// Artikel impor WordPress membawa tautan "Lihat Biografi Penulis" di dalam isi; sekarang digantikan nama penulis yang bisa diklik.
export function buangTautanBiografiLama(html: string): string {
  return html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (blok) =>
    /lihat\s+biografi\s+penulis/i.test(blok) && blok.replace(/<[^>]*>/g, "").trim().length < 60 ? "" : blok);
}

'@
Tulis 'src/lib/penulis.ts' $f0
$f1 = @'
// PAKET-12D: nama penulis yang bisa diklik. Panel menampilkan info singkat, tombol "Biografi detail", dan kumpulan tulisannya.
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Avatar } from "./Avatar";
import type { DataPenulis } from "@/lib/penulis";

export function PenulisInfo({ data }: { data: DataPenulis }) {
  const [buka, setBuka] = useState(false);
  const [detail, setDetail] = useState(false);
  const pendek = data.nama.split(",")[0];

  useEffect(() => {
    if (!buka) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [buka]);

  const tutup = () => { setBuka(false); setDetail(false); };
  const poin: [string, string][] = [
    ["Peran", data.peran],
    ["Bidang", data.bidang],
    ["Domisili", data.domisili],
    ["Tim", data.tim.join(", ")],
    ["Tulisan terbit", String(data.jumlah)],
  ];
  const ada = poin.filter(([, v]) => v);

  return (
    <>
      <button type="button" onClick={() => setBuka(true)} className="font-semibold text-ms-gold underline decoration-dotted underline-offset-4 hover:decoration-solid">
        {pendek}
      </button>
      {buka && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Penulis: ${data.nama}`}
          onMouseDown={(e) => { if (e.target === e.currentTarget) tutup(); }}
        >
          <div className="max-h-[88vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-ms-line bg-ms-surface p-6 text-ms-cream shadow-2xl">
            <div className="flex items-start gap-4">
              <Avatar nama={data.nama} url={data.foto} ukuran={72} />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ms-gold">Penulis</p>
                <h2 className="font-serif text-2xl font-bold leading-tight">{data.nama}</h2>
              </div>
              <button type="button" onClick={tutup} aria-label="Tutup" className="shrink-0 rounded-full px-2 py-1 text-xl leading-none text-ms-cream/60 hover:text-ms-gold">&times;</button>
            </div>

            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {ada.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-ms-cream/55">{k}</dt>
                  <dd className="text-ms-cream/90">{v}</dd>
                </div>
              ))}
            </dl>

            {(data.bio || data.kontak.length > 0 || data.profilSlug) && (
              <div className="mt-4">
                <button type="button" onClick={() => setDetail(!detail)} aria-expanded={detail} className="rounded-full border border-ms-gold/50 px-4 py-1.5 text-sm text-ms-gold transition hover:bg-ms-gold/10">
                  {detail ? "Sembunyikan biografi" : "Biografi detail"}
                </button>
                {detail && (
                  <div className="mt-4 space-y-4 border-t border-ms-line pt-4 text-sm">
                    {data.bio && <p className="whitespace-pre-line leading-relaxed text-ms-cream/85">{data.bio}</p>}
                    {data.kontak.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {data.kontak.map(([label, url]) => (
                          <a key={label} href={url} {...(url.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                            className="rounded-full border border-ms-line px-3 py-1 text-ms-cream/85 transition hover:border-ms-gold hover:text-ms-gold">{label}</a>
                        ))}
                      </div>
                    )}
                    {data.profilSlug && <Link href={`/tentang/redaksi/${data.profilSlug}`} className="inline-block text-ms-gold underline underline-offset-4">Buka halaman profil lengkap</Link>}
                  </div>
                )}
              </div>
            )}

            {data.tulisan.length > 0 && (
              <div className="mt-6 border-t border-ms-line pt-4">
                <h3 className="font-serif text-lg font-bold">Tulisan oleh {pendek}</h3>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {data.tulisan.map((t) => (
                    <li key={t.slug}><Link href={`/artikel/${t.slug}`} onClick={tutup} className="text-ms-cream/85 hover:text-ms-gold">{t.title}</Link></li>
                  ))}
                </ul>
                <Link href={`/penulis/${data.id}`} onClick={tutup} className="mt-3 inline-block text-sm font-semibold text-ms-gold underline underline-offset-4">
                  Lihat semua tulisan ({data.jumlah})
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

'@
Tulis 'src/components/content/PenulisInfo.tsx' $f1
$f2 = @'
// PAKET-12D: semua tulisan seorang penulis
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, posts } from "@/db";
import { kolomKartu } from "@/lib/kolom";
import { ambilPenulis } from "@/lib/penulis";
import { Avatar } from "@/components/content/Avatar";
import { PostCardMini } from "@/components/content/PostCardMini";

export const dynamic = "force-dynamic";

const ambil = async (id: string) => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? ambilPenulis(n) : null;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await ambil((await params).id);
  return p ? { title: `Tulisan ${p.nama}` } : {};
}

export default async function TulisanPenulis({ params }: { params: Promise<{ id: string }> }) {
  const p = await ambil((await params).id);
  if (!p) notFound();
  const tulisan = await db().select(kolomKartu).from(posts)
    .where(and(eq(posts.authorId, p.id), eq(posts.status, "published"))).orderBy(desc(posts.publishedAt)).limit(60);
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <Link href="/artikel" className="text-sm text-ms-cream/60 hover:text-ms-gold">&larr; Semua artikel</Link>
        <div className="mt-6 flex items-center gap-5">
          <Avatar nama={p.nama} url={p.foto} ukuran={84} />
          <div className="min-w-0">
            <h1 className="font-serif text-3xl font-bold md:text-4xl">Tulisan oleh {p.nama.split(",")[0]}</h1>
            <p className="mt-1 text-ms-cream/70">{[p.peran, `${p.jumlah} tulisan terbit`].filter(Boolean).join(" \u2022 ")}</p>
            {p.profilSlug && <Link href={`/tentang/redaksi/${p.profilSlug}`} className="mt-1 inline-block text-sm text-ms-gold underline underline-offset-4">Lihat profil redaksi</Link>}
          </div>
        </div>
        {tulisan.length === 0 ? (
          <p className="mt-10 text-ms-cream/70">Belum ada tulisan yang terbit.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {tulisan.map((t) => <PostCardMini key={t.id} p={t} />)}
          </div>
        )}
        {p.jumlah > tulisan.length && <p className="mt-6 text-sm text-ms-cream/60">Menampilkan {tulisan.length} tulisan terbaru dari {p.jumlah}.</p>}
      </section>
    </div>
  );
}

'@
Tulis 'src/app/(situs)/penulis/[id]/page.tsx' $f2
$a0 = @'
import { sampulSudahAdaDiIsi } from "@/lib/sampul-ganda";
'@
$b0 = @'
import { sampulSudahAdaDiIsi } from "@/lib/sampul-ganda";
import { ambilPenulis, buangTautanBiografiLama } from "@/lib/penulis";
import { PenulisInfo } from "@/components/content/PenulisInfo";
'@
Ganti 'src/app/(situs)/artikel/[slug]/page.tsx' $a0 $b0
$a1 = @'
  if (!p) notFound();
'@
$b1 = @'
  if (!p) notFound();
  const penulis = await ambilPenulis(p.authorId);
'@
Ganti 'src/app/(situs)/artikel/[slug]/page.tsx' $a1 $b1
$a2 = @'
<p className="mt-3 text-sm text-ms-gold">{tanggalLengkap(p.publishedAt)}</p>
'@
$b2 = @'
<div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-ms-gold"><span>{tanggalLengkap(p.publishedAt)}</span>{penulis && (<><span aria-hidden="true">&bull;</span><span className="text-ms-cream/70">Oleh</span><PenulisInfo data={penulis} /></>)}</div>
'@
Ganti 'src/app/(situs)/artikel/[slug]/page.tsx' $a2 $b2
$a3 = @'
optimalkanGambar(sanitizeHtml(p.content))
'@
$b3 = @'
optimalkanGambar(buangTautanBiografiLama(sanitizeHtml(p.content)))
'@
Ganti 'src/app/(situs)/artikel/[slug]/page.tsx' $a3 $b3

Write-Host ""
Write-Host "Selesai. Jalankan: npm run dev  (tanpa npm install). Buka satu artikel: klik nama penulis di bawah judul." -ForegroundColor Cyan
Write-Host "Bila ada baris merah GAGAL di atas, kirim tangkapan layarnya." -ForegroundColor Cyan
