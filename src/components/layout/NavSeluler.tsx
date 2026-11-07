// PAKET-15F: menu seluler lengkap. Artikel dan Pustaka membuka submenu saat diketuk; tautan lain langsung pindah halaman.
"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { navItem, navSub } from "./nav-style";

type Tautan = { href: string; label: string };
type Kunci = "artikel" | "pustaka" | null;
const biasa = `${navItem} shrink-0 whitespace-nowrap`;
const panah = (buka: boolean) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className={`ml-1 inline h-3.5 w-3.5 transition-transform ${buka ? "rotate-180" : ""}`} aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
);

export function NavSeluler({ artikel, pustaka }: { artikel: Tautan[]; pustaka: Tautan[] }) {
  const [buka, setBuka] = useState<Kunci>(null);
  const akar = useRef<HTMLDivElement>(null);
  const jalur = usePathname();

  useEffect(() => { setBuka(null); }, [jalur]);
  useEffect(() => {
    if (!buka) return;
    const luar = (e: Event) => { if (!akar.current?.contains(e.target as Node)) setBuka(null); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(null); };
    document.addEventListener("pointerdown", luar);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", luar); document.removeEventListener("keydown", esc); };
  }, [buka]);

  const tombol = (k: Exclude<Kunci, null>, label: string) => (
    <button type="button" aria-expanded={buka === k} onClick={() => setBuka((b) => (b === k ? null : k))} className={`${biasa} ${buka === k ? "bg-white/5 text-ms-gold" : ""}`}>
      {label}{panah(buka === k)}
    </button>
  );
  const daftar = buka === "artikel" ? artikel : buka === "pustaka" ? pustaka : [];

  return (
    <div ref={akar} className="lg:hidden">
      <nav className="flex gap-1 overflow-x-auto border-t border-ms-line px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Menu seluler">
        <Link href="/" className={biasa}>Beranda</Link>
        {tombol("artikel", "Artikel")}
        {tombol("pustaka", "Pustaka")}
        <Link href="/gambar" className={biasa}>Gambar</Link>
        <Link href="/video" className={biasa}>Video</Link>
        <Link href="/informasi" className={biasa}>Informasi</Link>
        <Link href="/agenda" className={biasa}>Agenda</Link>
        <Link href="/tentang" className={biasa}>Tentang</Link>
        <Link href="/tentang/redaksi" className={biasa}>Redaksi</Link>
      </nav>
      {buka && (
        <div className="absolute inset-x-0 top-full z-50 max-h-[60vh] overflow-y-auto border-b border-ms-line bg-ms-surface p-3 shadow-2xl">
          <div className="grid grid-cols-2 gap-1">
            {daftar.map((t, i) => (
              <Link key={t.href} href={t.href} className={`${navSub} ${i === 0 ? "col-span-2 font-semibold text-ms-gold" : ""}`}>{t.label}</Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
