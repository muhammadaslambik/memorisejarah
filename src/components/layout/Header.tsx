// PAKET-3C2
import Link from "next/link";
import { db, categories } from "@/db";
import { getPustaka } from "@/lib/pengaturan";
import { Logo } from "./Logo";
import { NavDropdown } from "./NavDropdown";
import { NavScroll } from "./NavScroll";
import { navItem, navSub } from "./nav-style";

async function ambilKategori() {
  try { return await db().select().from(categories).orderBy(categories.name); } catch { return []; }
}

const biasa = `${navItem} shrink-0 whitespace-nowrap`;

export async function Header() {
  const cats = await ambilKategori();
  const pustaka = await getPustaka();
  return (
    <header className="sticky top-0 z-40 border-b border-ms-line bg-ms-bg">
      <div className="mx-auto flex max-w-[90rem] items-center gap-3 px-6 py-3 md:px-10 lg:px-16">
        <Link href="/" aria-label="Memori Sejarah, beranda" className="shrink-0"><Logo /></Link>
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
        <form action="/cari" method="get" role="search" className="ml-auto hidden shrink-0 md:block">
          <input
            name="q" type="search" placeholder="Cari artikel, tokoh, peristiwa..." aria-label="Cari"
            className="w-64 rounded-full border border-ms-line bg-ms-cream px-4 py-2 text-sm text-ms-bg placeholder:text-ms-bg/50"
          />
        </form>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-ms-line px-3 py-2 lg:hidden" aria-label="Menu seluler">
        {[["/", "Beranda"], ["/artikel", "Artikel"], ["/pustaka", "Pustaka"], ["/gambar", "Gambar"], ["/video", "Video"], ["/informasi", "Informasi"], ["/agenda", "Agenda"], ["/tentang", "Tentang"], ["/cari", "Cari"]].map(([h, l]) => (
          <Link key={h} href={h} className={`${navItem} whitespace-nowrap`}>{l}</Link>
        ))}
      </nav>
    </header>
  );
}