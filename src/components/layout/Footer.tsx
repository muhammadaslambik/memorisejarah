import Link from "next/link";
import { db, categories } from "@/db";
import { Logo } from "./Logo";

async function ambilKategori() {
  try { const k = await db().select().from(categories).orderBy(categories.name); const p = new Set(k.map((c) => c.parentId)); return k.filter((c) => !p.has(c.id)); } catch { return []; }
}

const tautan = "text-sm text-ms-cream/70 hover:text-ms-gold";
const judul = "mb-4 text-xs font-bold uppercase tracking-[0.2em] text-ms-cream";

export async function Footer() {
  const cats = (await ambilKategori()).slice(0, 8);
  return (
    <footer className="border-t border-ms-line bg-ms-bg text-ms-cream">
      <div className="mx-auto grid max-w-[90rem] gap-10 px-6 md:px-10 lg:px-16 py-12 md:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-sm text-sm text-ms-gold">
            Selamat datang di Memori Sejarah. Situs ini berisi karya historiografi dan kumpulan data sumber primer sejarah.
          </p>
          <p className="mt-3 max-w-sm text-sm text-ms-cream/60">
            Kami percaya sejarah bukan hanya hafalan tanggal, melainkan dialog kritis antara masa lalu dan masa kini untuk masa depan yang lebih adil.
          </p>
        </div>
        <div>
          <h3 className={judul}>Artikel</h3>
          <ul className="space-y-2">
            {cats.map((c) => <li key={c.id}><Link href={`/kategori/${c.slug}`} className={tautan}>{c.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className={judul}>Jelajahi</h3>
          <ul className="space-y-2">
            <li><Link href="/artikel" className={tautan}>Semua Artikel</Link></li>
            <li><Link href="/gambar" className={tautan}>Gambar</Link></li>
            <li><Link href="/video" className={tautan}>Video</Link></li>
            <li><Link href="/tentang" className={tautan}>Tentang</Link></li>
            <li><Link href="/tentang/redaksi" className={tautan}>Redaksi</Link></li>
            <li><Link href="/privasi" className={tautan}>Kebijakan Privasi</Link></li>
          </ul>
        </div>
        <div>
          <h3 className={judul}>Hubungi Kami</h3>
          <ul className="space-y-2">
            <li><a href="https://www.instagram.com/memori_sejarah" target="_blank" rel="noopener noreferrer" className={tautan}>Instagram</a></li>
            <li><a href="https://www.youtube.com/@Memori_Sejarah" target="_blank" rel="noopener noreferrer" className={tautan}>YouTube</a></li>
            <li><a href="mailto:admin@memorisejarah.eu.org" className={tautan}>admin@memorisejarah.eu.org</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ms-line py-5 text-center text-xs text-ms-cream/50">
        &copy; 2023&ndash;{new Date().getFullYear()} Memori Sejarah. Dibuat dengan ingatan.
      </div>
    </footer>
  );
}