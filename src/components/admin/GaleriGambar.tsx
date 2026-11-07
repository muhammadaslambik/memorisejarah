// PAKET-13B/15L: jendela pemilih gambar galeri: seluruh gambar dalam satu daftar yang digulir atas-bawah, bergambar besar,
// dengan pencarian (nama berkas atau judul) dan pilihan kategori. Tanpa tombol "Muat lebih banyak".
"use client";
import { useEffect, useMemo, useState } from "react";
import { ambilGaleriLengkap, type ItemGaleri } from "@/lib/galeri-lengkap-actions";
import { kecil } from "@/lib/gambar-url";

export function GaleriGambar({ tutup, pilih }: { tutup: () => void; pilih: (url: string) => void }) {
  const [item, setItem] = useState<ItemGaleri[]>([]);
  const [kat, setKat] = useState<{ id: number; name: string }[]>([]);
  const [muat, setMuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [cari, setCari] = useState("");
  const [pilihKat, setPilihKat] = useState("semua"); // "semua" | "0" (tanpa kategori) | id

  useEffect(() => {
    let batal = false;
    ambilGaleriLengkap()
      .then((r) => {
        if (batal) return;
        if ("galat" in r) setGalat(r.galat);
        else { setItem(r.item); setKat(r.kategori); }
      })
      .catch(() => { if (!batal) setGalat("Gagal memuat galeri. Coba lagi."); })
      .finally(() => { if (!batal) setMuat(false); });
    return () => { batal = true; };
  }, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") tutup(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [tutup]);

  const tampil = useMemo(() => {
    const q = cari.trim().toLowerCase();
    return item.filter((g) => {
      if (pilihKat !== "semua" && (pilihKat === "0" ? g.categoryId !== null : g.categoryId !== Number(pilihKat))) return false;
      return !q || g.nama.toLowerCase().includes(q) || g.judul.toLowerCase().includes(q);
    });
  }, [item, cari, pilihKat]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Gambar galeri" onMouseDown={(e) => { if (e.target === e.currentTarget) tutup(); }}>
      <div className="a-card flex max-h-[90vh] w-full max-w-5xl flex-col p-4 shadow-2xl">
        <div className="mb-3 flex flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-lg font-semibold">Gambar Galeri</h2>
          <span className="a-muted text-sm">{muat ? "" : `${tampil.length} gambar`}</span>
          <button type="button" className="a-btn-soft ml-auto sm:order-last sm:ml-0" onClick={tutup}>Tutup</button>
          <select value={pilihKat} onChange={(e) => setPilihKat(e.target.value)} aria-label="Kategori" className="min-w-0 !py-1.5 text-sm">
            <option value="semua">Semua kategori</option>
            {kat.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            <option value="0">(tanpa kategori)</option>
          </select>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari judul atau nama berkas..."
            aria-label="Cari gambar"
            spellCheck={false}
            className="min-w-0 flex-1 rounded border p-2 text-sm sm:max-w-xs"
          />
        </div>
        {galat && <p className="mb-2 rounded bg-amber-50 px-3 py-1.5 text-amber-900">{galat}</p>}
        <div className="grid min-h-0 flex-1 grid-cols-1 content-start gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
          {tampil.map((g) => (
            <button key={g.url} type="button" onClick={() => pilih(g.url)} title={g.judul || g.nama} className="group overflow-hidden rounded-lg border text-left focus-visible:outline focus-visible:outline-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={kecil(g.url, 800)} alt={g.judul || g.nama} loading="lazy" className="aspect-video w-full bg-black/20 object-cover transition group-hover:opacity-90" />
              <span className="block truncate px-3 py-2 text-sm">{g.judul || g.nama}</span>
            </button>
          ))}
        </div>
        {muat && <p className="py-8 text-center opacity-70">Memuat...</p>}
        {!muat && !galat && tampil.length === 0 && <p className="py-8 text-center opacity-70">{cari || pilihKat !== "semua" ? "Tidak ada gambar yang cocok." : "Belum ada gambar di galeri."}</p>}
      </div>
    </div>
  );
}
