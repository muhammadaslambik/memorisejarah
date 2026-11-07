// PAKET-15A: menu akun di bilah atas CMS: tombol hanya berupa foto/inisial; isi lengkap muncul saat diklik.
// Klik di luar menu HANYA menutup menu (klik itu tidak diteruskan ke tombol/tautan di bawahnya).
"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type Props = { nama: string; peran: string; inisial: string; foto?: string | null; logout: () => void | Promise<void> };

export function MenuAkun({ nama, peran, inisial, foto, logout }: Props) {
  const [buka, setBuka] = useState(false);
  const akar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!buka) return;
    const diLuar = (e: Event) => !akar.current?.contains(e.target as Node);
    const tekan = (e: MouseEvent) => { if (diLuar(e)) e.preventDefault(); }; // cegah fokus/seleksi di elemen lain
    const klik = (e: MouseEvent) => {
      if (!diLuar(e)) return;
      e.preventDefault();
      e.stopPropagation(); // jangan sampai mengenai tombol atau tautan di bawahnya
      setBuka(false);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    document.addEventListener("mousedown", tekan, true);
    document.addEventListener("click", klik, true);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", tekan, true);
      document.removeEventListener("click", klik, true);
      document.removeEventListener("keydown", esc);
    };
  }, [buka]);

  return (
    <div ref={akar} className="a-menu relative">
      <button
        type="button"
        onClick={() => setBuka((b) => !b)}
        aria-expanded={buka}
        aria-haspopup="menu"
        aria-label={`Menu akun: ${nama}`}
        title={nama}
        className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-[#d9a441] to-[#a8691b] text-sm font-bold text-[#1b1108] ring-2 ring-transparent transition hover:ring-[color:var(--a-accent)] focus-visible:outline focus-visible:outline-2"
      >
        {foto ? <img src={foto} alt="" className="h-full w-full object-cover" /> : inisial}
      </button>
      {buka && (
        <div role="menu" className="a-card absolute right-0 top-12 z-50 w-60 p-2 shadow-xl">
          <div className="px-3 pb-2 pt-1.5">
            <p className="truncate text-sm font-semibold">{nama}</p>
            <p className="a-muted text-xs">{peran}</p>
          </div>
          <div className="mb-1 border-t" style={{ borderColor: "var(--a-line)" }} />
          <Link href="/admin/akun" role="menuitem" onClick={() => setBuka(false)} className="a-menu-item">Akun Saya</Link>
          <Link href="/" target="_blank" role="menuitem" onClick={() => setBuka(false)} className="a-menu-item md:hidden">Lihat Situs</Link>
          <form action={logout}><button role="menuitem" className="a-menu-item w-full text-left">Keluar</button></form>
        </div>
      )}
    </div>
  );
}
