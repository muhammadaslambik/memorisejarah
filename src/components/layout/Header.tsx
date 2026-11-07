// PAKET-9B
import Link from "next/link";
import { ambilKategoriCache } from "@/lib/data-situs";
import { getPustaka } from "@/lib/pengaturan";
import { Logo } from "./Logo";
import { HeaderBar } from "./HeaderBar";
import { NavDropdown } from "./NavDropdown";
import { NavScroll } from "./NavScroll";
import { NavSeluler } from "./NavSeluler";
import { navItem, navSub } from "./nav-style";

const biasa = `${navItem} shrink-0 whitespace-nowrap`;

export async function Header() {
  const [cats, pustaka] = await Promise.all([ambilKategoriCache(), getPustaka()]);
  return (
    <header className="sticky top-0 z-40 border-b border-ms-line bg-ms-bg">
      <div className="relative mx-auto flex max-w-[90rem] items-center gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-3 md:px-10 lg:px-16">
        <Link href="/" aria-label="Memori Sejarah, beranda" className="min-w-0 shrink"><Logo /></Link>
        <HeaderBar>
          <NavScroll>
            <Link href="/" className={biasa}>Beranda</Link>
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
        </HeaderBar>
      </div>
      <NavSeluler
        artikel={[{ href: "/artikel", label: "Semua Artikel" }, ...cats.map((c) => ({ href: `/kategori/${c.slug}`, label: c.name }))]}
        pustaka={[{ href: "/pustaka", label: "Semua Pustaka" }, ...pustaka.map((p) => ({ href: `/pustaka?f=${p.kunci}`, label: p.nama })), { href: "/gambar", label: "Galeri Gambar" }]}
      />
    </header>
  );
}