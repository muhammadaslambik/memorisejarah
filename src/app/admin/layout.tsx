// PAKET-10B: bingkai CMS: sidebar coklat tua tetap di tempat, bilah atas dengan pencarian, tema, lonceng, dan menu profil.
// Halaman masuk (belum login) tetap memakai bingkai lama.
import Link from "next/link";
import { cookies } from "next/headers";
import { Manrope } from "next/font/google";
import { count, eq } from "drizzle-orm";
import { db, posts } from "@/db";
import { getCurrentUser, isReviewer, ROLE_LABEL, type Role } from "@/lib/auth";
import { logout } from "@/lib/actions";
import { PanelShell } from "@/components/layout/PanelShell";
import { AdminNav, type Grup } from "@/components/admin/AdminNav";
import { IkonAdmin } from "@/components/admin/ikon-admin";
import { TombolTema } from "@/components/admin/TombolTema";
import { TombolSidebar } from "@/components/admin/TombolSidebar";
import { MenuAkun } from "@/components/admin/MenuAkun";
import { MenuLihatSitus } from "@/components/admin/MenuLihatSitus";
import { fotoKecil } from "@/lib/foto";

const cms = Manrope({ subsets: ["latin"], variable: "--font-cms" });

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
    <div className={`adm ${cms.variable} ${tema} min-h-screen`}>
      <input type="checkbox" id="adm-menu" className="peer hidden" aria-hidden="true" />
      <label htmlFor="adm-menu" className="a-scrim peer-checked:opacity-100 peer-checked:pointer-events-auto" aria-hidden="true" />

      <aside className="a-side fixed inset-y-0 left-0 z-40 flex w-[17rem] -translate-x-full flex-col transition-transform duration-200 peer-checked:translate-x-0 lg:translate-x-0">
        <label htmlFor="adm-menu" className="a-ikon-btn absolute right-3 top-4 z-10 cursor-pointer !text-[#ecdcc4] lg:!hidden" aria-label="Tutup menu" title="Tutup menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </label>
        <Link href="/admin" className="flex items-center gap-3 px-5 py-5 pr-14">
          <img src="/brand/logo-memori-sejarah-kecil.png" alt="" width={40} height={40} className="h-10 w-10 rounded-full" />
          <span className="leading-tight">
            <span className="block font-serif text-lg font-bold text-[#f3e3c3]">Memori Sejarah</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d9a441]">CMS</span>
          </span>
        </Link>
        <div className="a-scroll flex-1 overflow-y-auto px-3 pb-4"><AdminNav grup={grup} /></div>
        <div className="border-t border-white/10 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#d9a441] to-[#a8691b] text-sm font-bold text-[#1b1108]">{me.photoUrl ? <img src={fotoKecil(me.photoUrl) ?? ""} alt="" className="h-full w-full object-cover" /> : inisial(me.name)}</span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-sm font-semibold text-[#f3e3c3]">{me.name}</span>
              <span className="block text-xs text-[#a8957a]">{ROLE_LABEL[me.role as Role]}</span>
            </span>
          </div>
        </div>
      </aside>

      <div className="a-main lg:pl-[17rem]">
        <header className="a-top sticky top-0 z-30 flex h-16 items-center gap-3 px-4 lg:px-8">
          <TombolSidebar />
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
            <MenuLihatSitus />
            <MenuAkun nama={me.name} peran={ROLE_LABEL[me.role as Role]} inisial={inisial(me.name)} foto={fotoKecil(me.photoUrl)} logout={logout} />
          </div>
        </header>
        <main className="mx-auto max-w-[90rem] px-4 py-6 pb-24 lg:px-8">{children}</main>
      </div>
    </div>
  );
}