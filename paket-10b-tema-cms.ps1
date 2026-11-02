# Paket 10B: tema CMS coklat (gelap/terang), dashboard, daftar artikel. ASCII saja, idempoten.. ASCII saja, idempoten.. ASCII saja, idempoten.
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









Tulis @('src','components','admin') 'ikon-admin.tsx' @'
// PAKET-10B: ikon garis 24x24 untuk CMS (tanpa pustaka ikon)
import type { ReactNode } from "react";

const IKON: Record<string, ReactNode> = {
  dashboard: <><rect x="3" y="3" width="7.5" height="9" rx="2" /><rect x="13.5" y="3" width="7.5" height="5.5" rx="2" /><rect x="13.5" y="11.5" width="7.5" height="9.5" rx="2" /><rect x="3" y="15" width="7.5" height="6" rx="2" /></>,
  artikel: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>,
  persetujuan: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  video: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3z" /></>,
  gambar: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 18 5-5 4 4 3-3 4 4" /></>,
  kategori: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.2" /></>,
  agenda: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  informasi: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  pustaka: <path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" />,
  redaksi: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 5a3.5 3.5 0 0 1 0 7M18 14c2.2.6 3.5 2.6 3.5 6" /></>,
  pengguna: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  akun: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.5 18.5c1.2-2.2 3.2-3 5.5-3s4.3.8 5.5 3" /></>,
  pengaturan: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
  tentang: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.5" /></>,
  tambah: <path d="M12 5v14M5 12h14" />,
  cari: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  lonceng: <><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 7H4c0-1 2-2 2-7z" /><path d="M10 20a2 2 0 0 0 4 0" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  keluar: <><path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4" /><path d="M16 8l4 4-4 4M20 12H9" /></>,
  bintang: <path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  mata: <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></>,
};

export function IkonAdmin({ nama, className = "h-[18px] w-[18px]" }: { nama: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden="true">
      {IKON[nama] ?? null}
    </svg>
  );
}
'@

Tulis @('src','components','admin') 'AdminNav.tsx' @'
// PAKET-10B: navigasi samping CMS (menandai halaman aktif, menutup laci menu di layar kecil)
"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IkonAdmin } from "./ikon-admin";

export type ItemNav = { label: string; href?: string; badge?: number; segera?: boolean; ikon?: string };
export type Grup = { judul: string; item: ItemNav[] };

export function AdminNav({ grup }: { grup: Grup[] }) {
  const path = usePathname();
  const aktif = (h: string) => (h === "/admin" ? path === "/admin" : path === h || path.startsWith(h + "/"));

  // Layar kecil: tutup laci menu setelah berpindah halaman
  useEffect(() => {
    const kotak = document.getElementById("adm-menu") as HTMLInputElement | null;
    if (kotak) kotak.checked = false;
  }, [path]);

  return (
    <nav className="space-y-6" aria-label="Menu CMS">
      {grup.map((g) => (
        <div key={g.judul} className="space-y-1">
          <p className="a-nav-judul">{g.judul}</p>
          {g.item.map((i) =>
            i.href && !i.segera ? (
              <Link key={i.label} href={i.href} className="a-nav" aria-current={aktif(i.href) ? "page" : undefined}>
                {i.ikon && <IkonAdmin nama={i.ikon} />}
                <span className="flex-1 truncate">{i.label}</span>
                {!!i.badge && <span className="a-badge">{i.badge}</span>}
              </Link>
            ) : (
              <span key={i.label} className="a-nav opacity-40">
                {i.ikon && <IkonAdmin nama={i.ikon} />}
                <span className="flex-1">{i.label}</span>
                <span className="text-[10px] uppercase tracking-wider">segera</span>
              </span>
            ),
          )}
        </div>
      ))}
    </nav>
  );
}
'@

Tulis @('src','components','admin') 'TombolTema.tsx' @'
// PAKET-10B: tombol ganti tema gelap/terang (disimpan di cookie, tanpa muat ulang halaman)
"use client";

export function TombolTema() {
  const ganti = () => {
    const el = document.querySelector(".adm");
    if (!el) return;
    const gelap = el.classList.contains("tema-gelap");
    el.classList.toggle("tema-gelap", !gelap);
    el.classList.toggle("tema-terang", gelap);
    document.cookie = `adm-tema=${gelap ? "terang" : "gelap"}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <button type="button" onClick={ganti} className="a-ikon-btn" aria-label="Ganti tema terang atau gelap" title="Ganti tema terang atau gelap">
      <svg className="a-ikon-matahari h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg className="a-ikon-bulan h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
      </svg>
    </button>
  );
}
'@

Tulis @('src','components','admin') 'PageHeader.tsx' @'
// PAKET-10B: kepala halaman CMS (ikon, judul, deskripsi, tombol aksi)
import type { ReactNode } from "react";
import { IkonAdmin } from "@/components/admin/ikon-admin";

export function PageHeader({ ikon, judul, deskripsi, aksi }: { ikon: string; judul: string; deskripsi?: string; aksi?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <span className="a-ico h-12 w-12 rounded-2xl" style={{ ["--c" as string]: "var(--a-accent)" }}><IkonAdmin nama={ikon} className="h-6 w-6" /></span>
        <div>
          <h1 className="font-serif text-2xl font-bold leading-tight md:text-3xl">{judul}</h1>
          {deskripsi && <p className="a-muted mt-0.5 text-sm">{deskripsi}</p>}
        </div>
      </div>
      {aksi && <div className="flex flex-wrap items-center gap-2">{aksi}</div>}
    </div>
  );
}
'@

Tulis @('src','app','admin') 'layout.tsx' @'
// PAKET-10B: bingkai CMS: sidebar coklat tua tetap di tempat, bilah atas dengan pencarian, tema, lonceng, dan menu profil.
// Halaman masuk (belum login) tetap memakai bingkai lama.
import Link from "next/link";
import { cookies } from "next/headers";
import { count, eq } from "drizzle-orm";
import { db, posts } from "@/db";
import { getCurrentUser, isReviewer, ROLE_LABEL, type Role } from "@/lib/auth";
import { logout } from "@/lib/actions";
import { PanelShell } from "@/components/layout/PanelShell";
import { AdminNav, type Grup } from "@/components/admin/AdminNav";
import { IkonAdmin } from "@/components/admin/ikon-admin";
import { TombolTema } from "@/components/admin/TombolTema";

const hitungMenunggu = async () => {
  try {
    const [r] = await db().select({ n: count() }).from(posts).where(eq(posts.status, "pending"));
    return Number(r?.n ?? 0);
  } catch {
    return 0;
  }
};

const inisial = (nama: string) => nama.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "?";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Kueri berjalan bersamaan (lebih cepat daripada berurutan)
  const [me, menunggu, jar] = await Promise.all([getCurrentUser(), hitungMenunggu(), cookies()]);
  if (!me) return <PanelShell>{children}</PanelShell>;

  const tema = jar.get("adm-tema")?.value === "terang" ? "tema-terang" : "tema-gelap";
  const rev = isReviewer(me.role);
  const grup: Grup[] = [
    {
      judul: "Konten",
      item: [
        { label: "Dashboard", href: "/admin", ikon: "dashboard" },
        { label: "Artikel", href: "/admin/artikel", ikon: "artikel" },
        ...(rev ? [{ label: "Persetujuan", href: "/admin/persetujuan", ikon: "persetujuan", badge: menunggu }] : []),
        ...(rev ? [{ label: "Video", href: "/admin/video", ikon: "video" }, { label: "Gambar", href: "/admin/gambar", ikon: "gambar" }, { label: "Kategori", href: "/admin/kategori", ikon: "kategori" }] : []),
      ],
    },
    ...(rev
      ? [{
          judul: "Tampilan Situs",
          item: [
            { label: "Agenda & Program", href: "/admin/agenda", ikon: "agenda" },
            { label: "Informasi", href: "/admin/informasi", ikon: "informasi" },
            { label: "Pustaka", href: "/admin/pustaka", ikon: "pustaka" },
            { label: "Redaksi", href: "/admin/redaksi", ikon: "redaksi" },
            { label: "Halaman Tentang", href: "/admin/tentang", ikon: "tentang" },
            { label: "Pengaturan Situs", href: "/admin/situs", ikon: "pengaturan" },
          ],
        }]
      : []),
    {
      judul: "Akun",
      item: [
        ...(me.role === "admin" ? [{ label: "Pengguna", href: "/admin/pengguna", ikon: "pengguna" }] : []),
        { label: "Akun Saya", href: "/admin/akun", ikon: "akun" },
      ],
    },
  ];

  return (
    <div className={`adm ${tema} min-h-screen`}>
      <input type="checkbox" id="adm-menu" className="peer hidden" aria-hidden="true" />
      <label htmlFor="adm-menu" className="a-scrim peer-checked:opacity-100 peer-checked:pointer-events-auto" aria-hidden="true" />

      <aside className="a-side fixed inset-y-0 left-0 z-40 flex w-[17rem] -translate-x-full flex-col transition-transform duration-200 peer-checked:translate-x-0 lg:translate-x-0">
        <Link href="/admin" className="flex items-center gap-3 px-5 py-5">
          <img src="/brand/logo-memori-sejarah-kecil.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
          <span className="leading-tight">
            <span className="block font-serif text-lg font-bold text-[#f3e3c3]">Memori Sejarah</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d9a441]">CMS</span>
          </span>
        </Link>
        <div className="a-scroll flex-1 overflow-y-auto px-3 pb-4"><AdminNav grup={grup} /></div>
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#d9a441] to-[#a8691b] text-sm font-bold text-[#1b1108]">{inisial(me.name)}</span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold text-[#f3e3c3]">{me.name}</span>
              <span className="block text-xs text-[#a8957a]">{ROLE_LABEL[me.role as Role]}</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[17rem]">
        <header className="a-top sticky top-0 z-30 flex h-16 items-center gap-3 px-4 lg:px-8">
          <label htmlFor="adm-menu" className="a-ikon-btn lg:hidden" aria-label="Buka menu"><IkonAdmin nama="menu" className="h-5 w-5" /></label>
          <form action="/admin/artikel" role="search" className="a-search hidden min-w-0 flex-1 sm:flex">
            <IkonAdmin nama="cari" className="h-4 w-4 opacity-60" />
            <input name="q" type="search" placeholder="Cari artikel..." aria-label="Cari artikel" autoComplete="off" />
          </form>
          <div className="ml-auto flex items-center gap-1.5">
            <TombolTema />
            {rev && (
              <Link href="/admin/persetujuan" className="a-ikon-btn relative" aria-label={`Persetujuan: ${menunggu} menunggu`} title="Artikel menunggu persetujuan">
                <IkonAdmin nama="lonceng" className="h-[18px] w-[18px]" />
                {menunggu > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{menunggu}</span>}
              </Link>
            )}
            <Link href="/" target="_blank" className="a-btn-soft hidden md:inline-flex">Lihat Situs &#8599;</Link>
            <details className="a-menu relative">
              <summary className="a-ikon-btn cursor-pointer list-none !w-auto gap-2 !px-2" aria-label="Menu akun">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-[#d9a441] to-[#a8691b] text-xs font-bold text-[#1b1108]">{inisial(me.name)}</span>
                <span className="hidden max-w-[8rem] truncate text-sm md:block">{me.name}</span>
              </summary>
              <div className="a-card absolute right-0 top-12 z-50 w-52 p-2 shadow-xl">
                <Link href="/admin/akun" className="a-menu-item">Akun Saya</Link>
                <Link href="/" target="_blank" className="a-menu-item md:hidden">Lihat Situs</Link>
                <form action={logout}><button className="a-menu-item w-full text-left">Keluar</button></form>
              </div>
            </details>
          </div>
        </header>
        <main className="mx-auto max-w-[90rem] px-4 py-6 pb-16 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
'@

Tulis @('src','app','admin') 'page.tsx' @'
// PAKET-10B: dashboard CMS (ringkasan, aksi cepat, artikel terbaru, kategori terbanyak)
import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { db, posts, categories, postCategories, videos, images, redaksi, users } from "@/db";
import { kolomKartu } from "@/lib/kolom";
import { kecil } from "@/lib/gambar-url";
import { isReviewer, requireUser, ROLE_LABEL, type Role } from "@/lib/auth";
import { IkonAdmin } from "@/components/admin/ikon-admin";
import { PageHeader } from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

const LABEL = { published: "Terbit", pending: "Menunggu", draft: "Draft" } as const;
const CHIP = { published: "a-chip-hijau", pending: "a-chip-kuning", draft: "a-chip-abu" } as const;
const aman = async <T,>(p: PromiseLike<T>, bawaan: T): Promise<T> => { try { return await p; } catch { return bawaan; } };
const tgl = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

export default async function Dashboard() {
  const me = await requireUser();
  const rev = isReviewer(me.role);
  const d = db();
  const milik = me.role === "penulis" ? eq(posts.authorId, me.id) : undefined;

  const [perStatus, terbaru, menunggu, nVideo, nGambar, nRedaksi, nPengguna, perKategori] = await Promise.all([
    d.select({ status: posts.status, n: count() }).from(posts).where(milik).groupBy(posts.status),
    d.select(kolomKartu).from(posts).where(milik).orderBy(desc(posts.updatedAt)).limit(6),
    rev ? d.select(kolomKartu).from(posts).where(eq(posts.status, "pending")).orderBy(desc(posts.updatedAt)).limit(5) : Promise.resolve([]),
    aman(d.select({ n: count() }).from(videos), [{ n: 0 }]),
    aman(d.select({ n: count() }).from(images), [{ n: 0 }]),
    aman(d.select({ n: count() }).from(redaksi), [{ n: 0 }]),
    me.role === "admin" ? aman(d.select({ n: count() }).from(users), [{ n: 0 }]) : Promise.resolve([{ n: 0 }]),
    aman(
      d.select({ nama: categories.name, n: sql<number>`count(*)::int` }).from(postCategories)
        .innerJoin(categories, eq(categories.id, postCategories.categoryId)).groupBy(categories.name).orderBy(desc(sql`count(*)`)).limit(6),
      [] as { nama: string; n: number }[],
    ),
  ]);
  const jml = (s: keyof typeof LABEL) => Number(perStatus.find((x) => x.status === s)?.n ?? 0);
  const total = jml("published") + jml("pending") + jml("draft");
  const maks = Math.max(1, ...perKategori.map((k) => k.n));
  const hariIni = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

  const kartu: { label: string; nilai: number; ikon: string; warna: string; href: string; ket: string }[] = [
    { label: "Artikel terbit", nilai: jml("published"), ikon: "artikel", warna: "#d9a441", href: "/admin/artikel?s=published", ket: `dari ${total} artikel` },
    { label: "Menunggu", nilai: jml("pending"), ikon: "persetujuan", warna: "#e8a13a", href: rev ? "/admin/persetujuan" : "/admin/artikel?s=pending", ket: "perlu ditinjau" },
    { label: "Draft", nilai: jml("draft"), ikon: "gambar", warna: "#8aa0b8", href: "/admin/artikel?s=draft", ket: "belum diterbitkan" },
    ...(rev ? [
      { label: "Video", nilai: Number(nVideo[0]?.n ?? 0), ikon: "video", warna: "#e0705a", href: "/admin/video", ket: "dalam pustaka" },
      { label: "Gambar", nilai: Number(nGambar[0]?.n ?? 0), ikon: "gambar", warna: "#5bb48a", href: "/admin/gambar", ket: "dalam galeri" },
      { label: "Anggota redaksi", nilai: Number(nRedaksi[0]?.n ?? 0), ikon: "redaksi", warna: "#a78bda", href: "/admin/redaksi", ket: "profil publik" },
    ] : []),
  ];
  const aksi: [string, string, string][] = [
    ["Tulis artikel baru", "/admin/artikel/baru", "artikel"],
    ...(rev ? [["Unggah gambar", "/admin/gambar", "gambar"], ["Tambah video", "/admin/video", "video"], ["Atur redaksi", "/admin/redaksi", "redaksi"], ["Pengaturan situs", "/admin/situs", "pengaturan"]] as [string, string, string][] : []),
  ];

  return (
    <div>
      <PageHeader
        ikon="dashboard"
        judul={`Selamat datang, ${me.name.split(" ")[0]}`}
        deskripsi={`${hariIni} \u2022 ${ROLE_LABEL[me.role as Role]}`}
        aksi={<Link href="/admin/artikel/baru" className="a-btn"><IkonAdmin nama="tambah" className="h-4 w-4" /> Artikel Baru</Link>}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kartu.map((k) => (
          <Link key={k.label} href={k.href} className="a-card a-card-hover flex flex-col gap-3 p-4">
            <span className="a-ico h-10 w-10 rounded-xl" style={{ ["--c" as string]: k.warna }}><IkonAdmin nama={k.ikon} className="h-5 w-5" /></span>
            <span>
              <span className="block font-serif text-3xl font-bold leading-none">{k.nilai}</span>
              <span className="mt-1.5 block text-sm font-medium">{k.label}</span>
              <span className="a-muted block text-xs">{k.ket}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <section className="a-card p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold">Artikel terbaru</h2>
            <Link href="/admin/artikel" className="a-link text-sm">Lihat semua &rarr;</Link>
          </div>
          {terbaru.length === 0 ? <p className="a-muted text-sm">Belum ada artikel.</p> : (
            <ul className="a-daftar">
              {terbaru.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/artikel/${p.id}`} className="flex items-center gap-3 py-3">
                    {p.coverUrl ? <img src={kecil(p.coverUrl, 120)} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-12 w-16 shrink-0 rounded-lg object-cover" /> : <span className="a-ico h-12 w-16 shrink-0 rounded-lg" style={{ ["--c" as string]: "var(--a-accent)" }}><IkonAdmin nama="artikel" /></span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{p.title}</span>
                      <span className="a-muted mt-0.5 block text-xs">{tgl(p.updatedAt)}</span>
                    </span>
                    <span className={`a-chip ${CHIP[p.status]}`}>{LABEL[p.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="a-card p-5">
            <h2 className="mb-3 font-serif text-lg font-bold">Aksi cepat</h2>
            <div className="grid grid-cols-1 gap-2">
              {aksi.map(([label, href, ikon]) => (
                <Link key={href} href={href} className="a-aksi"><IkonAdmin nama={ikon} /> <span className="flex-1">{label}</span> <span aria-hidden="true">&rarr;</span></Link>
              ))}
            </div>
          </section>
          {perKategori.length > 0 && (
            <section className="a-card p-5">
              <h2 className="mb-3 font-serif text-lg font-bold">Kategori terbanyak</h2>
              <ul className="space-y-3">
                {perKategori.map((k) => (
                  <li key={k.nama}>
                    <div className="mb-1 flex justify-between text-xs"><span className="truncate pr-2">{k.nama}</span><span className="a-muted">{k.n}</span></div>
                    <div className="a-bar"><span style={{ width: `${Math.max(6, (k.n / maks) * 100)}%` }} /></div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {rev && menunggu.length > 0 && (
        <section className="a-card mt-6 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold">Menunggu persetujuan</h2>
            <Link href="/admin/persetujuan" className="a-link text-sm">Tinjau &rarr;</Link>
          </div>
          <ul className="a-daftar">
            {menunggu.map((p) => (
              <li key={p.id}><Link href={`/admin/artikel/${p.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="truncate font-medium">{p.title}</span><span className="a-muted shrink-0 text-xs">{tgl(p.updatedAt)}</span></Link></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
'@

Tulis @('src','app','admin','artikel') 'page.tsx' @'
// PAKET-10B: daftar artikel dengan pencarian, tab status, dan tombol cepat "Pilihan"
import Link from "next/link";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { db, posts, users, categories } from "@/db";
import { kolomKartu } from "@/lib/kolom";
import { kecil } from "@/lib/gambar-url";
import { deletePost } from "@/lib/actions";
import { toggleFeatured } from "@/lib/artikel-cepat-actions";
import { canDeletePost, isReviewer, requireUser } from "@/lib/auth";
import { DeleteButton } from "@/components/DeleteButton";
import { IkonAdmin } from "@/components/admin/ikon-admin";
import { PageHeader } from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";
const PER_HALAMAN = 20;
const DASAR = "/admin/artikel";
type Status = "published" | "pending" | "draft";
const LABEL: Record<Status, string> = { published: "Terbit", pending: "Menunggu", draft: "Draft" };
const CHIP: Record<Status, string> = { published: "a-chip-hijau", pending: "a-chip-kuning", draft: "a-chip-abu" };

export default async function DaftarArtikel({ searchParams }: { searchParams: Promise<{ q?: string; s?: string; hal?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = (["published", "pending", "draft"] as const).find((x) => x === sp.s);
  const hal = Math.max(1, Number(sp.hal) || 1);
  const rev = isReviewer(me.role);

  const milik = me.role === "penulis" ? eq(posts.authorId, me.id) : undefined;
  const cocok = q ? ilike(posts.title, `%${q.replace(/[\\%_]/g, "\\$&")}%`) : undefined;
  const d = db();
  const [rows, hitung, kats] = await Promise.all([
    d.select({ post: kolomKartu, author: users.name }).from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(and(milik, cocok, status ? eq(posts.status, status) : undefined))
      .orderBy(desc(posts.updatedAt)).limit(PER_HALAMAN + 1).offset((hal - 1) * PER_HALAMAN),
    d.select({ status: posts.status, n: count() }).from(posts).where(milik).groupBy(posts.status),
    d.select({ id: categories.id, name: categories.name }).from(categories),
  ]);
  const tampil = rows.slice(0, PER_HALAMAN);
  const adaLagi = rows.length > PER_HALAMAN;
  const nama = new Map(kats.map((k) => [k.id, k.name]));
  const jml = (s: Status) => Number(hitung.find((h) => h.status === s)?.n ?? 0);
  const semua = jml("published") + jml("pending") + jml("draft");

  const href = (o: { s?: string; hal?: number }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const s = "s" in o ? o.s : status;
    if (s) p.set("s", s);
    if (o.hal && o.hal > 1) p.set("hal", String(o.hal));
    const str = p.toString();
    return DASAR + (str ? `?${str}` : "");
  };
  const tab: [string, number, string][] = [["Semua", semua, ""], ["Terbit", jml("published"), "published"], ["Menunggu", jml("pending"), "pending"], ["Draft", jml("draft"), "draft"]];
  const kembali = href({ hal });

  return (
    <div>
      <PageHeader
        ikon="artikel"
        judul="Artikel"
        deskripsi="Kelola semua tulisan di situs."
        aksi={<Link href="/admin/artikel/baru" className="a-btn"><IkonAdmin nama="tambah" className="h-4 w-4" /> Artikel Baru</Link>}
      />

      <div className="a-card p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="a-tab-baris" role="tablist" aria-label="Filter status">
            {tab.map(([label, jumlah, s]) => (
              <Link key={label} href={href({ s })} className="a-tab" aria-current={(status ?? "") === s ? "page" : undefined}>
                {label} <span className="a-tab-n">{jumlah}</span>
              </Link>
            ))}
          </div>
          <form action={DASAR} className="a-search flex w-full sm:w-72">
            <IkonAdmin nama="cari" className="h-4 w-4 opacity-60" />
            {status && <input type="hidden" name="s" value={status} />}
            <input name="q" type="search" defaultValue={q} placeholder="Cari judul artikel..." aria-label="Cari judul" autoComplete="off" />
          </form>
        </div>

        {tampil.length === 0 ? (
          <p className="a-muted py-12 text-center text-sm">Tidak ada artikel yang cocok.{(q || status) && <> <Link href={DASAR} className="a-link">Reset pencarian</Link></>}</p>
        ) : (
          <ul className="a-daftar mt-3">
            {tampil.map(({ post: p, author }) => (
              <li key={p.id} className="flex items-center gap-3 py-3">
                <Link href={`/admin/artikel/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  {p.coverUrl
                    ? <img src={kecil(p.coverUrl, 140)} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                    : <span className="a-ico h-14 w-20 shrink-0 rounded-lg" style={{ ["--c" as string]: "var(--a-accent)" }}><IkonAdmin nama="artikel" /></span>}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.title}</span>
                    <span className="a-muted mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                      <span className={`a-chip ${CHIP[p.status]}`}>{LABEL[p.status]}</span>
                      {p.categoryId && nama.get(p.categoryId) && <span>{nama.get(p.categoryId)}</span>}
                      {me.role !== "penulis" && author && <span>oleh {author}</span>}
                      <span>{p.updatedAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}</span>
                      {p.status === "draft" && p.reviewNote && <span className="a-chip a-chip-kuning">ada catatan editor</span>}
                    </span>
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-1">
                  {p.status === "published" && <Link href={`/artikel/${p.slug}`} target="_blank" className="a-ikon-btn" title="Lihat di situs" aria-label="Lihat di situs"><IkonAdmin nama="mata" /></Link>}
                  {rev && (
                    <form action={toggleFeatured}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="kembali" value={kembali} />
                      <button title={p.featured ? "Hapus dari Artikel Pilihan" : "Jadikan Artikel Pilihan"} aria-label="Artikel Pilihan" className={`a-ikon-btn ${p.featured ? "a-bintang-aktif" : ""}`}>
                        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={p.featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>
                      </button>
                    </form>
                  )}
                  {canDeletePost(me, p) && (
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <DeleteButton title={p.title} />
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {(hal > 1 || adaLagi) && (
          <div className="mt-4 flex items-center justify-between border-t border-[var(--a-line)] pt-4 text-sm">
            {hal > 1 ? <Link href={href({ hal: hal - 1 })} className="a-btn-soft">&larr; Sebelumnya</Link> : <span />}
            <span className="a-muted">Halaman {hal}</span>
            {adaLagi ? <Link href={href({ hal: hal + 1 })} className="a-btn-soft">Berikutnya &rarr;</Link> : <span />}
          </div>
        )}
      </div>
    </div>
  );
}
'@

# globals.css: ganti blok gaya CMS lama (9D) dengan tema baru
$gf = P 'src' 'app' 'globals.css'
$gt = [System.IO.File]::ReadAllText($gf)
if ($gt.Contains('PAKET-10B: tema CMS')) { Write-Host 'globals.css: tema CMS sudah ada (dilewati).' -ForegroundColor Yellow }
else {
  $i = $gt.IndexOf('/* PAKET-9D: tampilan CMS')
  if ($i -ge 0) { $dasar = $gt.Substring(0, $i).TrimEnd() } else { $dasar = $gt.TrimEnd() }
  $css = @'
/* PAKET-10B: tema CMS coklat (gelap/terang). Hanya berlaku di dalam .adm */
@layer components {
  .adm {
    --a-bg: #f5eee3; --a-card: #ffffff; --a-card2: #faf4ea; --a-line: rgb(74 48 22 / 0.12);
    --a-text: #2c1d10; --a-muted: #7d6b58; --a-accent: #b9822a; --a-accent2: #8f5f1a; --a-input: #ffffff;
    --a-shadow: 0 1px 2px rgb(60 36 12 / 0.06), 0 10px 28px -14px rgb(60 36 12 / 0.22);
    background: var(--a-bg); color: var(--a-text); color-scheme: light;
  }
  .adm.tema-gelap {
    --a-bg: #15100b; --a-card: #1f1710; --a-card2: #2a1e14; --a-line: rgb(255 228 184 / 0.09);
    --a-text: #f2e7d5; --a-muted: #a99a85; --a-accent: #dcab4f; --a-accent2: #b98a35; --a-input: #17100a;
    --a-shadow: 0 1px 2px rgb(0 0 0 / 0.4), 0 12px 32px -16px rgb(0 0 0 / 0.65);
    color-scheme: dark;
  }
  body:has(.adm.tema-gelap) { background: #15100b; }
  body:has(.adm.tema-terang) { background: #f5eee3; }

  /* Bingkai */
  .adm .a-side { background: linear-gradient(180deg, #27180d 0%, #170e07 100%); color: #ecdcc4; border-right: 1px solid rgb(255 228 184 / 0.06); }
  .adm .a-scroll { scrollbar-width: thin; scrollbar-color: rgb(255 228 184 / 0.2) transparent; }
  .adm .a-scrim { position: fixed; inset: 0; z-index: 35; background: rgb(0 0 0 / 0.55); opacity: 0; pointer-events: none; transition: opacity 0.2s; }
  @media (min-width: 1024px) { .adm .a-scrim { display: none; } }
  .adm .a-nav-judul { font-size: 0.65rem; letter-spacing: 0.16em; text-transform: uppercase; color: #8f7b5f; padding: 0 0.75rem 0.35rem; font-weight: 600; }
  .adm .a-nav { display: flex; align-items: center; gap: 0.75rem; padding: 0.55rem 0.75rem; border-radius: 0.75rem; font-size: 0.875rem; color: #cdb99b; transition: background-color 0.15s, color 0.15s, transform 0.15s; }
  .adm a.a-nav:hover { background: rgb(255 228 184 / 0.08); color: #f6ead6; }
  .adm .a-nav[aria-current="page"] { background: linear-gradient(135deg, #e0ae52, #b97b1f); color: #1b1108; font-weight: 600; box-shadow: 0 8px 20px -10px rgb(224 174 82 / 0.8); }
  .adm .a-badge { background: #e11d48; color: #fff; font-size: 0.68rem; font-weight: 700; border-radius: 999px; padding: 0.05rem 0.45rem; }
  .adm .a-nav[aria-current="page"] .a-badge { background: #1b1108; color: #f3e3c3; }
  .adm .a-top { background: color-mix(in srgb, var(--a-bg) 88%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--a-line); }
  .adm .a-search { align-items: center; gap: 0.5rem; background: var(--a-card); border: 1px solid var(--a-line); border-radius: 999px; padding: 0 0.9rem; max-width: 26rem; transition: box-shadow 0.15s, border-color 0.15s; }
  .adm .a-search:focus-within { border-color: var(--a-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--a-accent) 22%, transparent); }
  .adm .a-search input { flex: 1; min-width: 0; background: transparent !important; border: 0 !important; box-shadow: none !important; padding: 0.55rem 0 !important; outline: none; font-size: 0.875rem; }
  .adm .a-ikon-btn { display: inline-grid; place-items: center; width: 2.4rem; height: 2.4rem; border-radius: 999px; color: var(--a-text); background: transparent; border: 0; transition: background-color 0.15s, color 0.15s, transform 0.15s; cursor: pointer; }
  .adm .a-ikon-btn:hover { background: color-mix(in srgb, var(--a-text) 9%, transparent); color: var(--a-accent); }
  .adm .a-ikon-btn[aria-label^="Menu akun"] { display: inline-flex; align-items: center; }
  .adm .a-bintang-aktif { color: var(--a-accent); }
  .adm .a-ikon-matahari { display: none; }
  .adm.tema-gelap .a-ikon-matahari { display: block; }
  .adm.tema-gelap .a-ikon-bulan { display: none; }
  .adm .a-menu[open] > summary { background: color-mix(in srgb, var(--a-text) 9%, transparent); }
  .adm .a-menu-item { display: block; border-radius: 0.6rem; padding: 0.5rem 0.75rem; font-size: 0.875rem; }
  .adm .a-menu-item:hover { background: color-mix(in srgb, var(--a-text) 9%, transparent); }

  /* Komponen */
  .adm .a-card { background: var(--a-card); border: 1px solid var(--a-line); border-radius: 1.1rem; box-shadow: var(--a-shadow); }
  .adm .a-card-hover { transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s; }
  .adm .a-card-hover:hover { transform: translateY(-3px); border-color: color-mix(in srgb, var(--a-accent) 45%, var(--a-line)); }
  .adm .a-muted { color: var(--a-muted); }
  .adm .a-link { color: var(--a-accent); font-weight: 500; }
  .adm .a-link:hover { text-decoration: underline; text-underline-offset: 3px; }
  .adm .a-ico { display: inline-grid; place-items: center; background: color-mix(in srgb, var(--c, var(--a-accent)) 17%, transparent); color: var(--c, var(--a-accent)); }
  .adm .a-btn { display: inline-flex; align-items: center; gap: 0.45rem; border-radius: 0.8rem; padding: 0.6rem 1.05rem; font-size: 0.875rem; font-weight: 600; color: #1b1108; background: linear-gradient(135deg, #e6b45a, #c48a2a); box-shadow: 0 8px 20px -10px rgb(201 146 47 / 0.9); transition: transform 0.15s, filter 0.15s; }
  .adm .a-btn:hover { filter: brightness(1.06); transform: translateY(-1px); }
  .adm .a-btn-soft { display: inline-flex; align-items: center; gap: 0.4rem; border: 1px solid var(--a-line); border-radius: 0.8rem; padding: 0.5rem 0.9rem; font-size: 0.85rem; background: var(--a-card); transition: border-color 0.15s, color 0.15s; }
  .adm .a-btn-soft:hover { border-color: var(--a-accent); color: var(--a-accent); }
  .adm .a-chip { display: inline-block; border-radius: 999px; padding: 0.1rem 0.6rem; font-size: 0.7rem; font-weight: 600; }
  .adm .a-chip-hijau { background: rgb(34 197 94 / 0.15); color: #15803d; }
  .adm .a-chip-kuning { background: rgb(245 158 11 / 0.17); color: #b45309; }
  .adm .a-chip-abu { background: color-mix(in srgb, var(--a-text) 10%, transparent); color: var(--a-muted); }
  .adm.tema-gelap .a-chip-hijau { color: #86efac; }
  .adm.tema-gelap .a-chip-kuning { color: #fcd34d; }
  .adm .a-daftar > li + li { border-top: 1px solid var(--a-line); }
  .adm .a-daftar > li { transition: background-color 0.15s; }
  .adm .a-aksi { display: flex; align-items: center; gap: 0.7rem; border: 1px solid var(--a-line); border-radius: 0.8rem; padding: 0.65rem 0.85rem; font-size: 0.875rem; background: var(--a-card2); transition: border-color 0.15s, transform 0.15s; }
  .adm .a-aksi:hover { border-color: var(--a-accent); transform: translateX(2px); }
  .adm .a-bar { height: 0.45rem; border-radius: 999px; background: color-mix(in srgb, var(--a-text) 9%, transparent); overflow: hidden; }
  .adm .a-bar > span { display: block; height: 100%; border-radius: 999px; background: linear-gradient(90deg, var(--a-accent2), var(--a-accent)); }
  .adm .a-tab-baris { display: inline-flex; gap: 0.25rem; padding: 0.25rem; border-radius: 0.9rem; background: var(--a-card2); border: 1px solid var(--a-line); }
  .adm .a-tab { display: inline-flex; align-items: center; gap: 0.4rem; border-radius: 0.65rem; padding: 0.4rem 0.8rem; font-size: 0.85rem; color: var(--a-muted); transition: background-color 0.15s, color 0.15s; }
  .adm .a-tab:hover { color: var(--a-text); }
  .adm .a-tab[aria-current="page"] { background: var(--a-card); color: var(--a-text); font-weight: 600; box-shadow: var(--a-shadow); }
  .adm .a-tab-n { font-size: 0.7rem; border-radius: 999px; padding: 0 0.4rem; background: color-mix(in srgb, var(--a-accent) 20%, transparent); color: var(--a-accent); }

  /* Menyesuaikan kelas Tailwind yang dipakai halaman CMS lama ke tema */
  .adm .text-charcoal { color: var(--a-text); }
  .adm .text-charcoal\/80, .adm .text-charcoal\/75 { color: color-mix(in srgb, var(--a-text) 85%, transparent); }
  .adm .text-charcoal\/60, .adm .text-charcoal\/55, .adm .text-charcoal\/50 { color: var(--a-muted); }
  .adm .text-charcoal\/45, .adm .text-charcoal\/35, .adm .text-charcoal\/25 { color: color-mix(in srgb, var(--a-muted) 70%, transparent); }
  .adm main .bg-white\/70 { background: var(--a-card); border: 1px solid var(--a-line); border-radius: 1.1rem; box-shadow: var(--a-shadow); }
  .adm .bg-white\/60 { background: var(--a-card); }
  .adm .bg-cream-dark { background: var(--a-card2); }
  .adm .bg-cream { background: var(--a-bg); }
  .adm .bg-black\/10 { background: color-mix(in srgb, var(--a-text) 12%, transparent); }
  .adm .border, .adm .border-cream-dark { border-color: var(--a-line); }
  .adm .divide-cream-dark > :not([hidden]) ~ :not([hidden]) { border-color: var(--a-line); }
  .adm main .bg-gold { background-image: linear-gradient(135deg, #e6b45a, #c48a2a); color: #1b1108; font-weight: 600; border-radius: 0.8rem; }
  .adm main .bg-gold.text-white { color: #1b1108; }
  .adm main .bg-charcoal { background: var(--a-text); }
  .adm main .bg-charcoal.text-cream { color: var(--a-bg); }
  .adm .text-gold-dark, .adm .hover\:text-gold-dark:hover { color: var(--a-accent); }
  .adm .ring-gold { --tw-ring-color: var(--a-accent); }
  .adm.tema-gelap .bg-green-50, .adm.tema-gelap .bg-green-100 { background: rgb(34 197 94 / 0.14); }
  .adm.tema-gelap .text-green-800 { color: #86efac; }
  .adm.tema-gelap .bg-red-50, .adm.tema-gelap .bg-red-100 { background: rgb(239 68 68 / 0.14); }
  .adm.tema-gelap .text-red-700 { color: #fca5a5; }
  .adm.tema-gelap .bg-amber-50, .adm.tema-gelap .bg-amber-100 { background: rgb(245 158 11 / 0.14); }
  .adm.tema-gelap .text-amber-800, .adm.tema-gelap .text-amber-900 { color: #fcd34d; }
  .adm.tema-gelap .border-amber-300 { border-color: rgb(245 158 11 / 0.4); }
  .adm.tema-gelap .bg-stone-200 { background: rgb(255 255 255 / 0.1); }
  .adm.tema-gelap .text-stone-700 { color: var(--a-muted); }

  /* Isian formulir */
  .adm main input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]),
  .adm main select, .adm main textarea {
    background: var(--a-input); color: var(--a-text); border: 1px solid var(--a-line); border-radius: 0.7rem;
    padding: 0.55rem 0.8rem; font-size: 0.875rem; outline: none; transition: border-color 0.15s, box-shadow 0.15s;
  }
  .adm main input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]):focus,
  .adm main select:focus, .adm main textarea:focus {
    border-color: var(--a-accent); box-shadow: 0 0 0 3px color-mix(in srgb, var(--a-accent) 24%, transparent);
  }
  .adm main ::placeholder { color: color-mix(in srgb, var(--a-muted) 75%, transparent); }
  .adm main input[type="file"] { font-size: 0.85rem; }
  .adm main input[type="checkbox"], .adm main input[type="radio"] { accent-color: var(--a-accent); }
  .adm main fieldset { border-color: var(--a-line); border-radius: 1rem; }
  .adm main legend { font-weight: 600; }
  .adm main h1 { letter-spacing: -0.01em; }
  .adm main button, .adm main a { transition: color 0.15s, background-color 0.15s, border-color 0.15s, box-shadow 0.15s, filter 0.15s; }
  .adm main details > summary { cursor: pointer; }

  /* Editor teks */
  .adm .editor-kaya select { padding: 0 0.5rem; border-radius: 0.5rem; height: 2rem; }
  .adm .editor-kaya .ProseMirror { background: var(--a-input); color: var(--a-text); border-color: var(--a-line); }
  .adm .editor-kaya .prose {
    --tw-prose-body: var(--a-text); --tw-prose-headings: var(--a-text); --tw-prose-bold: var(--a-text);
    --tw-prose-links: var(--a-accent); --tw-prose-quotes: var(--a-text); --tw-prose-quote-borders: var(--a-accent);
    --tw-prose-bullets: var(--a-muted); --tw-prose-counters: var(--a-muted); --tw-prose-hr: var(--a-line); --tw-prose-captions: var(--a-muted);
  }
}
'@
  [System.IO.File]::WriteAllText($gf, $dasar + "`r`n" + $css.Replace("`r`n","`n").Replace("`n","`r`n") + "`r`n", $utf8)
  Write-Host 'globals.css: tema CMS baru diterapkan.' -ForegroundColor Green
}
# setelah menyimpan atau menghapus artikel, kembali ke daftar artikel (bukan dashboard)
$af = P 'src' 'lib' 'actions.ts'
$lamaS = 'await simpanKategori(d, baru.id, fd); }' + "`r`n" + '  redirect("/admin");'
$baruS = 'await simpanKategori(d, baru.id, fd); }' + "`r`n" + '  redirect("/admin/artikel");'
Ganti $af $lamaS $baruS 'actions.ts (setelah simpan artikel)'
$lamaH = 'canDeletePost(u, p)) await db().delete(posts).where(eq(posts.id, id));' + "`r`n" + '  redirect("/admin");'
$baruH = 'canDeletePost(u, p)) await db().delete(posts).where(eq(posts.id, id));' + "`r`n" + '  redirect("/admin/artikel");'
Ganti $af $lamaH $baruH 'actions.ts (setelah hapus artikel)'
Write-Host ''
Write-Host 'Selesai. Muat ulang /admin (npm run dev tetap jalan; bila gaya belum berubah, tekan Ctrl+F5).' -ForegroundColor Cyan
