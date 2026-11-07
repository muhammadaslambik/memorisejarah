// PAKET-15I: kontrol bersama daftar CMS (Video, Gambar): saring kategori, jumlah per halaman (sama seperti Artikel), dan penomoran halaman.
"use client";
import { useEffect, useState } from "react";
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
