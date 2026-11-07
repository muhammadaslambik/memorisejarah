// PAKET-15C: tombol akun di header situs publik. Belum masuk: ikon orang (Masuk). Sudah masuk: foto atau inisial (buka CMS).
// Data diambil dari /api/saya di peramban supaya halaman publik tetap statis/ringan.
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

type Saya = { nama: string; foto: string | null; inisial: string } | null;
const KUNCI = "ms-saya";

export function AkunHeader({ className = "" }: { className?: string }) {
  const [saya, setSaya] = useState<Saya>(null);

  useEffect(() => {
    try { const c = sessionStorage.getItem(KUNCI); if (c) setSaya(JSON.parse(c) as Saya); } catch { /* abaikan */ }
    let batal = false;
    fetch("/api/saya", { cache: "no-store", credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: Saya) => {
        if (batal) return;
        const v = j && j.nama ? j : null;
        setSaya(v);
        try { if (v) sessionStorage.setItem(KUNCI, JSON.stringify(v)); else sessionStorage.removeItem(KUNCI); } catch { /* abaikan */ }
      })
      .catch(() => { /* tetap tampilan terakhir */ });
    return () => { batal = true; };
  }, []);

  if (!saya) {
    return (
      <Link href="/admin" aria-label="Masuk" title="Masuk" className={className}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
      </Link>
    );
  }
  return (
    <Link href="/admin" aria-label={`${saya.nama}: buka CMS`} title={`${saya.nama} (buka CMS)`} className={className}>
      <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full sm:h-8 sm:w-8 bg-gradient-to-br from-[#d9a441] to-[#a8691b] text-xs font-bold text-[#1b1108]">
        {saya.foto ? <img src={saya.foto} alt="" className="h-full w-full object-cover" /> : saya.inisial}
      </span>
    </Link>
  );
}
