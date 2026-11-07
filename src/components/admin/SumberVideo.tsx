// PAKET-15B: kolom sumber video pada formulir: alamat YouTube + pratinjau berkas video dari perangkat. Tombol Lihat membuka pemutar.
// Berkas dari perangkat HANYA untuk pratinjau (tidak diunggah/disimpan); situs memutar video dari YouTube.
"use client";
import { useEffect, useState } from "react";
import { PemutarVideo, type SumberVideo as Sumber } from "@/components/admin/PemutarVideo";
import { ambilIdYoutube } from "@/lib/youtube-id";

export function SumberVideo({ defaultValue = "", className = "", judulAwal = "" }: { defaultValue?: string; className?: string; judulAwal?: string }) {
  const [url, setUrl] = useState(defaultValue);
  const [berkas, setBerkas] = useState<{ nama: string; url: string } | null>(null);
  const [lihat, setLihat] = useState<Sumber | null>(null);
  const id = ambilIdYoutube(url);

  useEffect(() => () => { if (berkas) URL.revokeObjectURL(berkas.url); }, [berkas]);

  const pilihBerkas = (f?: File) => {
    setBerkas(f ? { nama: f.name, url: URL.createObjectURL(f) } : null);
  };
  const judul = () => (document.querySelector<HTMLInputElement>('input[name="title"]')?.value.trim() || judulAwal || "Pratinjau video");

  return (
    <div className="space-y-2 text-sm">
      <label className="block">Alamat YouTube atau ID video
        <input name="youtube" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." className={className} />
      </label>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={!id} onClick={() => id && setLihat({ tipe: "youtube", id })} className="a-btn-soft !px-3 !py-1.5 disabled:cursor-not-allowed disabled:opacity-50" title={id ? "Lihat video YouTube" : "Isi alamat YouTube yang valid dulu"}>
          Lihat video
        </button>
        <label className="a-btn-soft cursor-pointer !px-3 !py-1.5">
          Pratinjau berkas video
          <input type="file" accept="video/*" className="sr-only" onChange={(e) => pilihBerkas(e.target.files?.[0])} />
        </label>
        {berkas && (
          <>
            <button type="button" onClick={() => setLihat({ tipe: "file", url: berkas.url })} className="a-btn-soft !px-3 !py-1.5">Lihat berkas</button>
            <span className="a-muted max-w-[16rem] truncate" title={berkas.nama}>{berkas.nama}</span>
            <button type="button" onClick={() => pilihBerkas(undefined)} className="a-muted underline" aria-label="Lepas berkas pratinjau">lepas</button>
          </>
        )}
      </div>
      <p className="a-muted text-xs">Situs memutar video dari YouTube, jadi alamat YouTube tetap wajib diisi. Berkas dari perangkat hanya untuk pratinjau di sini dan tidak disimpan.</p>
      {lihat && <PemutarVideo judul={judul()} sumber={lihat} onTutup={() => setLihat(null)} />}
    </div>
  );
}
