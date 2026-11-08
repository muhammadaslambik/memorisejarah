// PAKET-15K: tombol "Lihat Situs" di bilah atas CMS: Beranda website + halaman yang sesuai dengan bagian CMS yang sedang dibuka.
"use client";
import Link from "next/link";
import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useTutupLuar } from "@/lib/tutup-luar";

const KONTEKS: [string, string, string][] = [
  ["/admin/artikel", "Artikel di website", "/artikel"],
  ["/admin/kategori", "Artikel di website", "/artikel"],
  ["/admin/persetujuan", "Artikel di website", "/artikel"],
  ["/admin/video", "Video di website", "/video"],
  ["/admin/gambar", "Gambar di website", "/gambar"],
  ["/admin/pustaka", "Pustaka di website", "/pustaka"],
  ["/admin/agenda", "Agenda di website", "/agenda"],
  ["/admin/informasi", "Informasi di website", "/informasi"],
  ["/admin/redaksi", "Redaksi di website", "/tentang/redaksi"],
  ["/admin/tentang", "Halaman Tentang di website", "/tentang"],
];

export function MenuLihatSitus() {
  const [buka, setBuka] = useState(false);
  const akar = useRef<HTMLDivElement>(null);
  const jalur = usePathname();
  useTutupLuar(buka, [akar], () => setBuka(false), undefined, 25); // bilah atas CMS z-30: pelindung di bawahnya
  const k = KONTEKS.find(([p]) => jalur === p || jalur.startsWith(p + "/"));
  const item = "block rounded-lg px-3 py-2 text-sm hover:bg-white/5";
  // hanya satu pilihan (Beranda): langsung ke beranda tanpa menu
  if (!k) return <Link href="/" target="_blank" rel="noopener" className="a-btn-soft hidden md:inline-flex">Lihat Situs &#8599;</Link>;

  return (
    <div ref={akar} className="relative hidden md:block">
      <button type="button" onClick={() => setBuka((b) => !b)} aria-expanded={buka} aria-haspopup="menu" className="a-btn-soft">
        Lihat Situs <span aria-hidden="true">{buka ? "\u25B4" : "\u25BE"}</span>
      </button>
      {buka && (
        <div role="menu" className="a-card absolute right-0 top-12 z-50 w-60 p-2 shadow-xl">
          <Link href="/" target="_blank" rel="noopener" role="menuitem" onClick={() => setBuka(false)} className={item}>Beranda website &#8599;</Link>
          {k && <Link href={k[2]} target="_blank" rel="noopener" role="menuitem" onClick={() => setBuka(false)} className={item}>{k[1]} &#8599;</Link>}
        </div>
      )}
    </div>
  );
}
