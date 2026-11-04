// PAKET-13B: pilihan gambar utama artikel: Masukkan URL, Upload Gambar (membuka penjelajah berkas), atau Gambar Galeri.
"use client";
import { useRef, useState } from "react";
import { unggahGambarArtikel } from "@/lib/unggah-actions";
import { kecil } from "@/lib/gambar-url";
import { hashBerkas } from "@/lib/gambar-klien";
import { kb, perkecil } from "@/components/Editor";
import { GaleriGambar } from "./GaleriGambar";

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
      const hashAsli = await hashBerkas(f);
      const k = await perkecil(f);
      setPesan(`Mengunggah gambar (${kb(k.size)})...`);
      const fd = new FormData();
      fd.set("berkas", k);
      if (hashAsli) fd.set("hashAsli", hashAsli);
      const r = await unggahGambarArtikel(fd);
      if ("url" in r) { setUrl(r.url); setPesan(r.dipakaiUlang ? "Gambar yang sama sudah ada di galeri; berkas yang ada dipakai ulang (hemat ruang)." : ""); } else setPesan(r.galat);
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
            spellCheck={false}
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
      {galeri && <GaleriGambar tutup={() => setGaleri(false)} pilih={(u) => { setUrl(u); setGaleri(false); setPesan(""); }} />}
    </div>
  );
}
