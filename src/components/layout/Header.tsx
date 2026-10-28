import Link from "next/link";
import { db, categories } from "@/db";
import { Logo } from "./Logo";

async function ambilKategori() {
  try { return await db().select().from(categories).orderBy(categories.name); } catch { return []; }
}

const item = "rounded-full px-4 py-2 text-sm text-ms-cream/80 transition hover:bg-white/5 hover:text-ms-gold";
const menu =
  "invisible absolute left-0 top-full z-50 min-w-56 translate-y-1 rounded-xl border border-ms-line bg-ms-surface p-2 opacity-0 shadow-2xl transition " +
  "group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 " +
  "group-hover:visible group-hover:translate-y-0 group-hover:opacity-100";
const sub = "block rounded-lg px-3 py-2 text-sm text-ms-cream/80 hover:bg-white/5 hover:text-ms-gold";

export async function Header() {
  const cats = await ambilKategori();
  return (
    <header className="sticky top-0 z-40 border-b border-ms-line bg-ms-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <Link href="/" aria-label="Memori Sejarah, beranda"><Logo /></Link>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Utama">
          <Link href="/" className={item}>Beranda</Link>
          <div className="group relative">
            <Link href="/artikel" className={item}>Artikel &#9662;</Link>
            <div className={menu}>
              <Link href="/artikel" className={sub}>Semua Artikel</Link>
              {cats.map((c) => <Link key={c.id} href={`/kategori/${c.slug}`} className={sub}>{c.name}</Link>)}
            </div>
          </div>
          <Link href="/gambar" className={item}>Gambar</Link>
          <Link href="/video" className={item}>Video</Link>
          <div className="group relative">
            <Link href="/tentang" className={item}>Tentang &#9662;</Link>
            <div className={menu}>
              <Link href="/tentang" className={sub}>Memori Sejarah</Link>
              <Link href="/tentang/redaksi" className={sub}>Redaksi</Link>
            </div>
          </div>
        </nav>
        <form action="/cari" method="get" role="search" className="hidden md:block">
          <input
            name="q" type="search" placeholder="Cari artikel, tokoh, peristiwa..." aria-label="Cari"
            className="w-64 rounded-full border border-ms-line bg-ms-cream px-4 py-2 text-sm text-ms-bg placeholder:text-ms-bg/50"
          />
        </form>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-ms-line px-3 py-2 lg:hidden" aria-label="Menu seluler">
        {[["/", "Beranda"], ["/artikel", "Artikel"], ["/gambar", "Gambar"], ["/video", "Video"], ["/tentang", "Tentang"], ["/cari", "Cari"]].map(([h, l]) => (
          <Link key={h} href={h} className={`${item} whitespace-nowrap`}>{l}</Link>
        ))}
      </nav>
    </header>
  );
}