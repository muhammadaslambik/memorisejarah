# Paket 9D: bingkai CMS (sidebar tetap, ikon), daftar artikel, tampilan CMS. ASCII saja, idempoten.. ASCII saja, idempoten.. ASCII saja, idempoten.
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








Tulis @('src','components','admin') 'AdminNav.tsx' @'
// PAKET-9D: navigasi samping CMS dengan ikon (menandai halaman aktif)
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type ItemNav = { label: string; href?: string; badge?: number; segera?: boolean; ikon?: string };
export type Grup = { judul: string; item: ItemNav[] };

// Ikon garis sederhana 24x24 (tanpa pustaka)
const IKON: Record<string, React.ReactNode> = {
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
};

export function AdminNav({ grup }: { grup: Grup[] }) {
  const path = usePathname();
  const aktif = (h: string) => (h === "/admin" ? path === "/admin" || path.startsWith("/admin/artikel") : path === h || path.startsWith(h + "/"));
  return (
    <nav className="flex gap-1 overflow-x-auto py-2 lg:block lg:space-y-6 lg:overflow-visible lg:py-0" aria-label="Menu CMS">
      {grup.map((g) => (
        <div key={g.judul} className="flex shrink-0 gap-1 lg:block lg:space-y-1">
          <p className="hidden px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-charcoal/45 lg:block">{g.judul}</p>
          {g.item.map((i) => {
            const gambar = i.ikon && IKON[i.ikon] ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">{IKON[i.ikon]}</svg>
            ) : null;
            return i.href && !i.segera ? (
              <Link
                key={i.label} href={i.href}
                className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${aktif(i.href) ? "bg-charcoal text-cream shadow-sm" : "text-charcoal/80 hover:bg-cream-dark"}`}
              >
                {gambar}
                <span className="flex-1">{i.label}</span>
                {!!i.badge && <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-white">{i.badge}</span>}
              </Link>
            ) : (
              <span key={i.label} className="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-charcoal/35">
                {gambar}
                <span className="flex-1">{i.label}</span>
                <span className="text-[10px] uppercase tracking-wider">segera</span>
              </span>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
'@

Tulis @('src','app','admin') 'layout.tsx' @'
// PAKET-9D: bingkai CMS. Bilah atas dan navigasi samping tetap di tempat saat halaman digulir.
// Halaman masuk (belum login) tetap memakai bingkai lama.
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db, posts } from "@/db";
import { getCurrentUser, isReviewer, ROLE_LABEL, type Role } from "@/lib/auth";
import { logout } from "@/lib/actions";
import { PanelShell } from "@/components/layout/PanelShell";
import { AdminNav, type Grup } from "@/components/admin/AdminNav";

const hitungMenunggu = async () => {
  try {
    const [r] = await db().select({ n: count() }).from(posts).where(eq(posts.status, "pending"));
    return Number(r?.n ?? 0);
  } catch {
    return 0;
  }
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Dua kueri berjalan bersamaan (lebih cepat daripada berurutan)
  const [me, menunggu] = await Promise.all([getCurrentUser(), hitungMenunggu()]);
  if (!me) return <PanelShell>{children}</PanelShell>;

  const rev = isReviewer(me.role);
  const grup: Grup[] = [
    {
      judul: "Konten",
      item: [
        { label: "Artikel", href: "/admin", ikon: "artikel" },
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
    <div className="adm flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 h-14 bg-charcoal text-cream">
        <div className="mx-auto flex h-full max-w-[90rem] items-center justify-between gap-4 px-5">
          <Link href="/admin" className="font-serif text-xl tracking-wide text-gold">
            Memori Sejarah <span className="ml-1 rounded bg-white/10 px-2 py-0.5 font-sans text-[11px] uppercase tracking-wider text-cream/70">CMS</span>
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="hidden text-cream/70 sm:inline">{me.name} &middot; {ROLE_LABEL[me.role as Role]}</span>
            <Link href="/" target="_blank" className="hover:text-gold">Lihat Situs &#8599;</Link>
            <form action={logout}><button className="rounded border border-white/20 px-3 py-1 hover:border-gold hover:text-gold">Keluar</button></form>
          </div>
        </div>
      </header>
      <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col px-5 lg:flex-row lg:gap-8">
        <aside className="sticky top-14 z-20 -mx-5 bg-cream px-5 lg:mx-0 lg:h-[calc(100vh-3.5rem)] lg:w-56 lg:shrink-0 lg:self-start lg:overflow-y-auto lg:bg-transparent lg:px-0 lg:py-6">
          <AdminNav grup={grup} />
        </aside>
        <main className="min-w-0 flex-1 py-6 pb-16">{children}</main>
      </div>
    </div>
  );
}
'@

Tulis @('src','lib') 'artikel-cepat-actions.ts' @'
// PAKET-9D: aksi cepat di daftar artikel (admin dan editor)
"use server";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, posts } from "@/db";
import { requireReviewer } from "./auth";

export async function toggleFeatured(fd: FormData) {
  await requireReviewer();
  const id = Number(fd.get("id"));
  if (id) await db().update(posts).set({ featured: sql`not ${posts.featured}` }).where(eq(posts.id, id));
  const k = String(fd.get("kembali") ?? "/admin");
  redirect(k.startsWith("/admin") && !k.startsWith("//") ? k : "/admin");
}
'@

Tulis @('src','app','admin') 'page.tsx' @'
// PAKET-9D: daftar artikel dengan pencarian, filter status, dan tombol cepat "Pilihan"
import Link from "next/link";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { db, posts, users, categories } from "@/db";
import { kolomKartu } from "@/lib/kolom";
import { deletePost } from "@/lib/actions";
import { toggleFeatured } from "@/lib/artikel-cepat-actions";
import { canDeletePost, isReviewer, requireUser, ROLE_LABEL, type Role } from "@/lib/auth";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";
const PER_HALAMAN = 20;
type Status = "published" | "pending" | "draft";
const LABEL: Record<Status, string> = { published: "Terbit", pending: "Menunggu", draft: "Draft" };
const WARNA: Record<Status, string> = { published: "bg-green-100 text-green-800", pending: "bg-amber-100 text-amber-800", draft: "bg-stone-200 text-stone-700" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ q?: string; s?: string; hal?: string }> }) {
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
    return "/admin" + (str ? `?${str}` : "");
  };
  const kartu = [["Semua", semua, undefined, ""], ["Terbit", jml("published"), "published", ""], ["Menunggu", jml("pending"), "pending", ""], ["Draft", jml("draft"), "draft", ""]] as const;
  const kembali = href({ hal });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Artikel</h1>
          <p className="text-sm text-charcoal/60">{me.name} &middot; {ROLE_LABEL[me.role as Role]}</p>
        </div>
        <Link href="/admin/artikel/baru" className="rounded-lg bg-gold px-4 py-2 text-white">+ Artikel Baru</Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kartu.map(([label, jumlah, s]) => (
          <Link key={label} href={href({ s: s ?? "" })} className={`rounded-xl bg-white/70 p-4 transition hover:shadow ${status === s ? "ring-2 ring-gold" : ""}`}>
            <p className="text-xs uppercase tracking-wider text-charcoal/50">{label}</p>
            <p className="mt-1 font-serif text-2xl">{jumlah}</p>
          </Link>
        ))}
      </div>

      <form action="/admin" className="mt-5 flex gap-2">
        {status && <input type="hidden" name="s" value={status} />}
        <input name="q" defaultValue={q} placeholder="Cari judul artikel..." className="min-w-0 flex-1" />
        <button className="rounded-lg bg-charcoal px-4 py-2 text-sm text-cream">Cari</button>
        {(q || status) && <Link href="/admin" className="rounded-lg border px-4 py-2 text-sm">Reset</Link>}
      </form>

      {tampil.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white/70 p-6 text-center text-sm text-charcoal/60">Tidak ada artikel yang cocok.</p>
      ) : (
        <ul className="mt-4 divide-y divide-cream-dark rounded-xl bg-white/70">
          {tampil.map(({ post: p, author }) => (
            <li key={p.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link href={`/admin/artikel/${p.id}`} className="font-medium hover:text-gold-dark">{p.title}</Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-charcoal/55">
                  <span className={`rounded px-2 py-0.5 ${WARNA[p.status]}`}>{LABEL[p.status]}</span>
                  {p.categoryId && nama.get(p.categoryId) && <span>{nama.get(p.categoryId)}</span>}
                  {me.role !== "penulis" && author && <span>oleh {author}</span>}
                  <span>{p.updatedAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}</span>
                  {p.status === "draft" && p.reviewNote && <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">ada catatan editor</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {p.status === "published" && <Link href={`/artikel/${p.slug}`} target="_blank" className="text-sm text-charcoal/60 hover:text-gold-dark">Lihat</Link>}
                {rev && (
                  <form action={toggleFeatured}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="kembali" value={kembali} />
                    <button title={p.featured ? "Hapus dari Artikel Pilihan" : "Jadikan Artikel Pilihan"} aria-label="Artikel Pilihan" className={`text-xl leading-none ${p.featured ? "text-gold" : "text-charcoal/25 hover:text-gold"}`}>
                      {p.featured ? "\u2605" : "\u2606"}
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
        <div className="mt-5 flex items-center justify-between text-sm">
          {hal > 1 ? <Link href={href({ hal: hal - 1 })} className="rounded-lg border px-4 py-2">&larr; Sebelumnya</Link> : <span />}
          <span className="text-charcoal/50">Halaman {hal}</span>
          {adaLagi ? <Link href={href({ hal: hal + 1 })} className="rounded-lg border px-4 py-2">Berikutnya &rarr;</Link> : <span />}
        </div>
      )}
    </div>
  );
}
'@

# globals.css: gaya CMS (hanya berlaku di dalam .adm)
$gf = P 'src' 'app' 'globals.css'
if ([System.IO.File]::Exists($gf)) {
  $gt = [System.IO.File]::ReadAllText($gf)
  if ($gt.Contains('PAKET-9D: tampilan CMS')) { Write-Host 'globals.css: gaya CMS sudah ada (dilewati).' -ForegroundColor Yellow }
  else {
    $css = @'
/* PAKET-9D: tampilan CMS (hanya di dalam .adm, tanpa JavaScript) */
@layer components {
  .adm main input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]),
  .adm main select,
  .adm main textarea {
    @apply rounded-lg border border-charcoal/15 bg-white px-3 py-2 text-sm shadow-sm outline-none transition;
  }
  .adm main input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not([type="hidden"]):focus,
  .adm main select:focus,
  .adm main textarea:focus {
    @apply border-gold ring-2 ring-gold/30;
  }
  .adm main .bg-white\/70 {
    background: #fff;
    border: 1px solid rgb(0 0 0 / 0.06);
    border-radius: 0.9rem;
    box-shadow: 0 1px 2px rgb(0 0 0 / 0.04);
  }
  .adm main ul.divide-y > li { transition: background-color 0.15s; }
  .adm main ul.divide-y > li:hover { background-color: rgb(0 0 0 / 0.02); }
  .adm main fieldset { border-radius: 0.75rem; }
  .adm main h1 { letter-spacing: -0.01em; }
  .adm main button, .adm main a { transition: color 0.15s, background-color 0.15s, border-color 0.15s, box-shadow 0.15s; }
  .adm main .bg-gold:hover { filter: brightness(0.94); }
}
'@
    [System.IO.File]::WriteAllText($gf, $gt.TrimEnd() + "`r`n`r`n" + $css.Replace("`r`n","`n").Replace("`n","`r`n") + "`r`n", $utf8)
    Write-Host 'globals.css: gaya CMS ditambahkan.' -ForegroundColor Green
  }
}
Write-Host ''
Write-Host 'Selesai. Muat ulang /admin (npm run dev tetap jalan).' -ForegroundColor Cyan
