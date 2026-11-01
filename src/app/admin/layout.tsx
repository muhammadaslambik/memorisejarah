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