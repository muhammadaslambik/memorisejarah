// PAKET-12B: pilihan gambar utama artikel: Masukkan URL, Upload Gambar (membuka penjelajah berkas), atau Gambar Galeri (ImageKit).
"use client";
import { useEffect, useRef, useState } from "react";
import { unggahGambarArtikel } from "@/lib/unggah-actions";
import { ambilGaleri } from "@/lib/galeri-actions";
import { kecil } from "@/lib/gambar-url";
import { kb, perkecil } from "@/components/Editor";

type Berkas = { id: string; nama: string; url: string };

export function PilihSampul({ defaultUrl = "" }: { defaultUrl?: string }) {
  const [url, setUrl] = useState(defaultUrl);
  const [mode, setMode] = useState<"" | "url">("");
  const [ketik, setKetik] = useState("");
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galeri, setGaleri] = useState(false);
  const berkas = useRef<HTMLInputElement>(null);

  const pakaiUrl = () => {
    const v = ketik.trim();
    if (!/^https:\/\//i.test(v)) { setPesan("Alamat gambar harus diawali https://"); return; }
    setUrl(v); setKetik(""); setMode(""); setPesan("");
  };

  const unggah = async (f: File) => {
    setSibuk(true);
    try {
      setPesan("Mengecilkan gambar...");
      const k = await perkecil(f);
      setPesan(`Mengunggah gambar (${kb(k.size)})...`);
      const fd = new FormData();
      fd.set("berkas", k);
      const r = await unggahGambarArtikel(fd);
      if ("url" in r) { setUrl(r.url); setPesan(""); } else setPesan(r.galat);
    } catch {
      setPesan("Unggah gagal. Periksa koneksi lalu coba lagi.");
    } finally {
      setSibuk(false);
    }
  };

  const tombol = "a-btn-soft";
  return (
    <div className="rounded border p-3 text-sm">
      <input type="hidden" name="coverUrl" value={url} />
      <p className="mb-2 font-medium">Gambar utama artikel</p>
      <div className="flex flex-wrap items-start gap-4">
        {url ? (
          <img src={kecil(url, 480)} alt="Pratinjau gambar utama" className="h-28 w-44 rounded object-cover" />
        ) : (
          <div className="grid h-28 w-44 place-items-center rounded border border-dashed opacity-60">Belum ada gambar</div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={tombol} onClick={() => { setMode(mode === "url" ? "" : "url"); setPesan(""); }}>Masukkan URL</button>
          <button type="button" className={tombol} disabled={sibuk} onClick={() => berkas.current?.click()}>{sibuk ? "Memproses..." : "Upload Gambar"}</button>
          <button type="button" className={tombol} onClick={() => { setGaleri(true); setPesan(""); }}>Gambar Galeri</button>
          {url && <button type="button" className={tombol} onClick={() => { setUrl(""); setPesan(""); }}>Hapus gambar utama</button>}
        </div>
      </div>
      {mode === "url" && (
        <div className="mt-3 flex gap-2">
          <input
            value={ketik}
            onChange={(e) => setKetik(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); pakaiUrl(); } }}
            placeholder="https://..."
            aria-label="Alamat gambar utama"
            className="min-w-0 flex-1 rounded border p-2"
            autoFocus
          />
          <button type="button" className={tombol} onClick={pakaiUrl}>Gunakan</button>
        </div>
      )}
      <input
        ref={berkas}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) unggah(f); e.target.value = ""; }}
      />
      {pesan && <p className="mt-2 rounded bg-amber-50 px-3 py-1.5 text-amber-900" role="status">{pesan}</p>}
      {galeri && <Galeri tutup={() => setGaleri(false)} pilih={(u) => { setUrl(u); setGaleri(false); setPesan(""); }} />}
    </div>
  );
}

function Galeri({ tutup, pilih }: { tutup: () => void; pilih: (url: string) => void }) {
  const [daftar, setDaftar] = useState<Berkas[]>([]);
  const [lagi, setLagi] = useState(false);
  const [muat, setMuat] = useState(true);
  const [galat, setGalat] = useState("");

  const ambil = async (skip: number) => {
    setMuat(true);
    try {
      const r = await ambilGaleri(skip);
      if ("galat" in r) setGalat(r.galat);
      else { setDaftar((d) => (skip === 0 ? r.berkas : [...d, ...r.berkas])); setLagi(r.lagi); setGalat(""); }
    } catch {
      setGalat("Gagal memuat galeri. Coba lagi.");
    } finally {
      setMuat(false);
    }
  };
  useEffect(() => { ambil(0); }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") tutup(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [tutup]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-label="Gambar galeri" onMouseDown={(e) => { if (e.target === e.currentTarget) tutup(); }}>
      <div className="a-card flex max-h-[85vh] w-full max-w-4xl flex-col p-4 shadow-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Gambar Galeri</h2>
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
        {!muat && !galat && daftar.length === 0 && <p className="py-8 text-center opacity-70">Belum ada gambar di galeri.</p>}
        <div className="mt-3 text-center">
          {muat ? <span className="opacity-70">Memuat...</span> : lagi && <button type="button" className="a-btn-soft" onClick={() => ambil(daftar.length)}>Muat lebih banyak</button>}
        </div>
      </div>
    </div>
  );
}
