// PAKET-13B: jendela pemilih gambar galeri (semua gambar di ImageKit, termasuk hasil impor WordPress), dengan pencarian nama
"use client";
import { useEffect, useRef, useState } from "react";
import { ambilGaleri } from "@/lib/galeri-actions";
import { kecil } from "@/lib/gambar-url";

type Berkas = { id: string; nama: string; url: string };

export function GaleriGambar({ tutup, pilih }: { tutup: () => void; pilih: (url: string) => void }) {
  const [daftar, setDaftar] = useState<Berkas[]>([]);
  const [lagi, setLagi] = useState(false);
  const [muat, setMuat] = useState(true);
  const [galat, setGalat] = useState("");
  const [cari, setCari] = useState("");
  const versi = useRef(0);

  const ambil = async (skip: number, kata: string) => {
    const saya = ++versi.current;
    setMuat(true);
    try {
      const r = await ambilGaleri(skip, kata);
      if (saya !== versi.current) return; // hasil lama dari pencarian sebelumnya
      if ("galat" in r) setGalat(r.galat);
      else { setDaftar((d) => (skip === 0 ? r.berkas : [...d, ...r.berkas])); setLagi(r.lagi); setGalat(""); }
    } catch {
      if (saya === versi.current) setGalat("Gagal memuat galeri. Coba lagi.");
    } finally {
      if (saya === versi.current) setMuat(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => { ambil(0, cari); }, cari ? 300 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cari]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") tutup(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [tutup]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Gambar galeri" onMouseDown={(e) => { if (e.target === e.currentTarget) tutup(); }}>
      <div className="a-card flex max-h-[85vh] w-full max-w-4xl flex-col p-4 shadow-2xl">
        <div className="mb-3 flex items-center gap-3">
          <h2 className="text-lg font-semibold">Gambar Galeri</h2>
          <input
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            placeholder="Cari nama berkas..."
            aria-label="Cari gambar"
            spellCheck={false}
            className="ml-auto min-w-0 flex-1 rounded border p-2 text-sm sm:max-w-xs"
          />
          <button type="button" className="a-btn-soft" onClick={tutup}>Tutup</button>
        </div>
        {galat && <p className="mb-2 rounded bg-amber-50 px-3 py-1.5 text-amber-900">{galat}</p>}
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {daftar.map((g) => (
            <button key={g.id} type="button" onClick={() => pilih(g.url)} title={g.nama} className="group overflow-hidden rounded border text-left focus-visible:outline focus-visible:outline-2">
              <img src={kecil(g.url, 320)} alt={g.nama} loading="lazy" className="aspect-[4/3] w-full object-cover transition group-hover:scale-105" />
            </button>
          ))}
        </div>
        {!muat && !galat && daftar.length === 0 && <p className="py-8 text-center opacity-70">{cari ? "Tidak ada gambar yang cocok." : "Belum ada gambar di galeri."}</p>}
        <div className="mt-3 text-center">
          {muat ? <span className="opacity-70">Memuat...</span> : lagi && <button type="button" className="a-btn-soft" onClick={() => ambil(daftar.length, cari)}>Muat lebih banyak</button>}
        </div>
      </div>
    </div>
  );
}
