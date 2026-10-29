// PAKET-3C2: bingkai CMS dengan navigasi samping. Halaman masuk (belum login) tetap memakai bingkai lama.
import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { db, posts } from "@/db";
import { getCurrentUser, isReviewer, ROLE_LABEL, type Role } from "@/lib/auth";
import { logout } from "@/lib/actions";
import { PanelShell } from "@/components/layout/PanelShell";
import { AdminNav, type Grup } from "@/components/admin/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await getCurrentUser();
  if (!me) return <PanelShell>{children}</PanelShell>;

  const rev = isReviewer(me.role);
  let menunggu = 0;
  if (rev) {
    try {
      const [r] = await db().select({ n: count() }).from(posts).where(eq(posts.status, "pending"));
      menunggu = Number(r?.n ?? 0);
    } catch { /* abaikan; lencana tidak tampil */ }
  }

  const grup: Grup[] = [
    {
      judul: "Konten",
      item: [
        { label: "Artikel", href: "/admin" },
        ...(rev ? [{ label: "Persetujuan", href: "/admin/persetujuan", badge: menunggu }] : []),
        ...(rev ? [{ label: "Video", href: "/admin/video" }] : []),
        ...(rev ? [{ label: "Gambar", segera: true }, { label: "Kategori", segera: true }] : []),
      ],
    },
    ...(rev
      ? [{ judul: "Tampilan Situs", item: [{ label: "Agenda & Program", href: "/admin/agenda" }, { label: "Informasi", href: "/admin/informasi" }, { label: "Pustaka", href: "/admin/pustaka" }] }]
      : []),
    {
      judul: "Akun",
      item: [
        ...(me.role === "admin" ? [{ label: "Pengguna", href: "/admin/pengguna" }] : []),
        { label: "Akun Saya", href: "/admin/akun" },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-charcoal text-cream">
        <div className="mx-auto flex max-w-[90rem] items-center justify-between gap-4 px-5 py-3">
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
      <div className="mx-auto flex w-full max-w-[90rem] flex-1 flex-col gap-2 px-5 py-6 lg:flex-row lg:gap-8">
        <aside className="lg:w-56 lg:shrink-0"><AdminNav grup={grup} /></aside>
        <main className="min-w-0 flex-1 pb-16">{children}</main>
      </div>
    </div>
  );
}