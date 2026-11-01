// PAKET-9E: footer dengan kotak Cari Arsip, ikon sosial, dan tombol Hubungi Kami (tautan dari CMS: /admin/situs)
import Link from "next/link";
import { ambilKategoriCache } from "@/lib/data-situs";
import { getPustaka } from "@/lib/pengaturan";
import { getSitus } from "@/lib/situs";
import { Logo } from "./Logo";

const tautan = "text-sm text-ms-cream/70 hover:text-ms-gold";
const judul = "mb-4 text-xs font-bold uppercase tracking-[0.2em] text-ms-cream";
const ikonDasar = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const IKON: Record<string, React.ReactNode> = {
  Instagram: <><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" /></>,
  YouTube: <><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="m10 9 5 3-5 3z" fill="currentColor" /></>,
  WhatsApp: <><path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3z" /><path d="M9 8.8c.3 2.2 2.6 4.5 5.2 5.2l1.2-1.3-2-1-.9.8c-.8-.4-1.6-1.2-2-2l.8-.9-1-2z" /></>,
  Email: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3.5 7 8.5 6 8.5-6" /></>,
};

export async function Footer() {
  const [kategori, s, pustaka] = await Promise.all([ambilKategoriCache(), getSitus(), getPustaka()]);
  const cats = kategori.slice(0, 8);
  const sosial = [
    { nama: "Instagram", url: s.instagram },
    { nama: "YouTube", url: s.youtube },
    { nama: "WhatsApp", url: s.whatsapp },
    { nama: "Email", url: s.email ? `mailto:${s.email}` : "" },
  ].filter((x) => /^(https:\/\/|mailto:)/i.test(x.url));
  const kontak = /^https:\/\//i.test(s.whatsapp) ? s.whatsapp : s.email ? `mailto:${s.email}` : "/tentang/redaksi";

  return (
    <footer className="border-t border-ms-line bg-ms-bg text-ms-cream">
      <div className="mx-auto grid max-w-[90rem] gap-10 px-6 py-12 md:grid-cols-2 md:px-10 lg:grid-cols-[1.5fr_1fr_1fr_1.2fr] lg:px-16">
        <div>
          <Logo />
          {s.sambutan1 && <p className="mt-4 max-w-sm text-sm text-ms-gold">{s.sambutan1}</p>}
          {s.sambutan2 && <p className="mt-3 max-w-sm text-sm text-ms-cream/60">{s.sambutan2}</p>}
        </div>
        <div>
          <h3 className={judul}>Artikel</h3>
          <ul className="space-y-2">
            <li><Link href="/artikel" className={tautan}>Semua Artikel</Link></li>
            {cats.map((c) => <li key={c.id}><Link href={`/kategori/${c.slug}`} className={tautan}>{c.name}</Link></li>)}
          </ul>
        </div>
        <div>
          <h3 className={judul}>Pustaka &amp; Video</h3>
          <ul className="space-y-2">
            <li><Link href="/pustaka" className={tautan}>Pustaka</Link></li>
            {pustaka.map((p) => <li key={p.kunci}><Link href={`/pustaka?f=${p.kunci}`} className={tautan}>{p.nama}</Link></li>)}
            <li><Link href="/gambar" className={tautan}>Gambar</Link></li>
            <li><Link href="/video" className={tautan}>Video</Link></li>
            <li><Link href="/agenda" className={tautan}>Agenda Kegiatan</Link></li>
          </ul>
        </div>
        <div>
          <h3 className={judul}>Cari Arsip</h3>
          <form action="/cari" role="search" className="flex items-center gap-2 rounded-full bg-ms-cream py-1.5 pl-4 pr-1.5">
            <input name="q" type="search" placeholder="Cari artikel, tokoh..." aria-label="Cari arsip" autoComplete="off" className="min-w-0 flex-1 bg-transparent text-sm text-ms-bg outline-none placeholder:text-ms-bg/50" />
            <button aria-label="Cari" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ms-bg text-ms-gold">
              <svg {...ikonDasar} className="h-4 w-4" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            </button>
          </form>
          {sosial.length > 0 && (
            <div className="mt-5 flex gap-2">
              {sosial.map((x) => (
                <a key={x.nama} href={x.url} aria-label={x.nama} title={x.nama} {...(x.url.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                  className="grid h-10 w-10 place-items-center rounded-full border border-ms-line text-ms-cream/80 transition hover:border-ms-gold hover:text-ms-gold">
                  <svg {...ikonDasar} className="h-5 w-5" aria-hidden="true">{IKON[x.nama]}</svg>
                </a>
              ))}
            </div>
          )}
          {kontak.startsWith("/") ? (
            <Link href={kontak} className="mt-5 inline-block rounded-full bg-gradient-to-r from-emerald-500 to-yellow-400 px-6 py-2.5 text-sm font-semibold text-ms-bg transition hover:brightness-110">Hubungi Kami</Link>
          ) : (
            <a href={kontak} {...(kontak.startsWith("mailto:") ? {} : { target: "_blank", rel: "noopener noreferrer" })} className="mt-5 inline-block rounded-full bg-gradient-to-r from-emerald-500 to-yellow-400 px-6 py-2.5 text-sm font-semibold text-ms-bg transition hover:brightness-110">Hubungi Kami</a>
          )}
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t border-ms-line px-6 py-5 text-xs text-ms-cream/50">
        <span>&copy; 2023&ndash;{new Date().getFullYear()} Memori Sejarah. Dibuat dengan ingatan.</span>
        <Link href="/tentang" className="hover:text-ms-gold">Tentang</Link>
        <Link href="/tentang/redaksi" className="hover:text-ms-gold">Redaksi</Link>
        <Link href="/privasi" className="hover:text-ms-gold">Kebijakan Privasi</Link>
      </div>
    </footer>
  );
}