// PAKET-15I: kontrol bersama daftar CMS (Video, Gambar): saring kategori, jumlah per halaman (sama seperti Artikel), dan penomoran halaman.
"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { PILIHAN } from "@/lib/pilihan-halaman";

export type Kat = { id: number; name: string };

export function useHalaman(kunci: string) {
  const [per, setPerState] = useState(10);
  const [hal, setHal] = useState(1);
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(kunci));
      if (localStorage.getItem(kunci) !== null && (PILIHAN as readonly number[]).includes(v)) setPerState(v);
    } catch { /* abaikan */ }
  }, [kunci]);
  const setPer = (n: number) => { setPerState(n); setHal(1); try { localStorage.setItem(kunci, String(n)); } catch { /* abaikan */ } };
  return { per, setPer, hal, setHal };
}

export function potong<T>(daftar: T[], hal: number, per: number) {
  if (per === 0) return { baris: daftar, jumlah: 1, hal: 1 };
  const jumlah = Math.max(1, Math.ceil(daftar.length / per));
  const h = Math.min(Math.max(1, hal), jumlah);
  return { baris: daftar.slice((h - 1) * per, h * per), jumlah, hal: h };
}

// nilai: "semua" | "0" (tanpa kategori) | id kategori
export const cocokKat = (nilai: string, categoryId: number | null) => nilai === "semua" || (nilai === "0" ? categoryId === null : categoryId === Number(nilai));

export function PilihKategori({ kats, nilai, ubah }: { kats: Kat[]; nilai: string; ubah: (v: string) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="a-muted whitespace-nowrap">Kategori</span>
      <select value={nilai} onChange={(e) => ubah(e.target.value)} className="!py-1.5">
        <option value="semua">Semua kategori</option>
        {kats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        <option value="0">(tanpa kategori)</option>
      </select>
    </label>
  );
}

export function PilihJumlah({ per, ubah }: { per: number; ubah: (n: number) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="a-muted whitespace-nowrap">Per halaman</span>
      <select value={per} onChange={(e) => ubah(Number(e.target.value))} className="!py-1.5">
        {PILIHAN.map((n) => <option key={n} value={n}>{n === 0 ? "Semua" : n}</option>)}
      </select>
    </label>
  );
}

export function Pager({ hal, jumlah, ubah }: { hal: number; jumlah: number; ubah: (h: number) => void }) {
  if (jumlah <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between border-t border-[var(--a-line)] pt-4 text-sm">
      {hal > 1 ? <button type="button" onClick={() => ubah(hal - 1)} className="a-btn-soft">&larr; Sebelumnya</button> : <span />}
      <span className="a-muted">Halaman {hal} dari {jumlah}</span>
      {hal < jumlah ? <button type="button" onClick={() => ubah(hal + 1)} className="a-btn-soft">Berikutnya &rarr;</button> : <span />}
    </div>
  );
}

// PAKET-18: bilah daftar yang menempel di bawah header CMS saat digulir dan meringkas dirinya dari dua baris menjadi satu baris.
// Tinggi tempatnya tidak berubah (versi lengkap tetap menahan ruang, tersembunyi), jadi isi di bawahnya tidak melompat.
export function BarDaftar({ judul, saring, tampilan, kontrol }: { judul: ReactNode; saring: ReactNode; tampilan: ReactNode; kontrol: ReactNode }) {
  const penanda = useRef<HTMLDivElement>(null);
  const [rapat, setRapat] = useState(false);
  useEffect(() => {
    const el = penanda.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setRapat(!e.isIntersecting && e.boundingClientRect.top < 64), { rootMargin: "-64px 0px 0px 0px", threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div ref={penanda} aria-hidden="true" className="h-px" />
      <div className={`a-sticky ${rapat ? "pointer-events-none !bg-transparent" : ""}`} style={rapat ? { backdropFilter: "none" } : undefined}>
        <div className={rapat ? "invisible" : ""} aria-hidden={rapat || undefined}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            {judul}
            <div className="flex flex-wrap items-center gap-2">{saring}{tampilan}</div>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">{kontrol}</div>
        </div>
        {rapat && (
          <div className="pointer-events-auto absolute inset-x-4 top-[0.6rem] lg:inset-x-8">
            <div className="a-card flex items-center gap-2 overflow-x-auto whitespace-nowrap p-2 [scrollbar-width:none] md:px-3">
              {saring}{tampilan}
              <div className="ml-auto flex items-center gap-4 pl-2">{kontrol}</div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
