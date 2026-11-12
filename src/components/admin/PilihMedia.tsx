// PAKET-21: gambar dan video untuk Informasi Terbaru. Gambar: Masukkan URL, Upload Gambar, Gambar Galeri, Hapus gambar (sama seperti gambar utama artikel).
// Video: Masukkan URL (YouTube, Instagram, TikTok, X/Twitter, Facebook, Vimeo, atau berkas .mp4), Upload Video (MP4/MOV/WebM, maks 40 MB), Galeri Video, Hapus video.
"use client";
import { useRef, useState } from "react";
import { unggahGambarArtikel } from "@/lib/unggah-actions";
import { kecil } from "@/lib/gambar-url";
import { hashBerkas } from "@/lib/gambar-klien";
import { embedDariUrl } from "@/lib/embed-video";
import { kb, perkecil } from "@/components/Editor";
import { GaleriGambar } from "./GaleriGambar";

export type VideoGaleri = { id: number; title: string; youtubeId: string };

export function PilihMedia({ gambarAwal = "", videoAwal = "", galeriVideo = [] }: { gambarAwal?: string; videoAwal?: string; galeriVideo?: VideoGaleri[] }) {
  const [gambar, setGambar] = useState(gambarAwal);
  const [video, setVideo] = useState(videoAwal);
  const [modeG, setModeG] = useState(false);
  const [modeV, setModeV] = useState(false);
  const [ketikG, setKetikG] = useState("");
  const [ketikV, setKetikV] = useState("");
  const [pesan, setPesan] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [galeri, setGaleri] = useState(false);
  const [galeriV, setGaleriV] = useState(false);
  const berkasG = useRef<HTMLInputElement>(null);
  const berkasV = useRef<HTMLInputElement>(null);
  const tombol = "a-btn-soft";
  const embed = video ? embedDariUrl(video) : null;

  const pakaiGambar = () => {
    const v = ketikG.trim();
    if (!/^https:\/\//i.test(v)) { setPesan("Alamat gambar harus diawali https://"); return; }
    setGambar(v); setKetikG(""); setModeG(false); setPesan("");
  };
  const pakaiVideo = () => {
    const v = ketikV.trim();
    if (!embedDariUrl(v)) { setPesan("Tautan video harus diawali https:// dan berupa alamat yang valid."); return; }
    setVideo(v); setKetikV(""); setModeV(false); setPesan("");
  };
  const unggahGambar = async (f: File) => {
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
      if ("url" in r) { setGambar(r.url); setPesan(r.dipakaiUlang ? "Gambar yang sama sudah ada di galeri; berkas yang ada dipakai ulang." : ""); } else setPesan(r.galat);
    } catch { setPesan("Unggah gagal. Periksa koneksi lalu coba lagi."); } finally { setSibuk(false); }
  };
  const unggahVideo = async (f: File) => {
    if (f.size > 40 * 1024 * 1024) { setPesan("Video terlalu besar (maksimal 40 MB). Unggah ke YouTube lalu pakai tautannya."); return; }
    setSibuk(true);
    try {
      setPesan(`Mengunggah video (${kb(f.size)})... mohon tunggu`);
      const fd = new FormData();
      fd.set("berkas", f);
      const res = await fetch("/api/unggah-video", { method: "POST", body: fd });
      const j = (await res.json()) as { url?: string; galat?: string };
      if (res.ok && j.url) { setVideo(j.url); setPesan(""); } else setPesan(j.galat ?? "Unggah video gagal.");
    } catch { setPesan("Unggah video gagal. Periksa koneksi lalu coba lagi."); } finally { setSibuk(false); }
  };

  return (
    <div className="space-y-4 text-sm">
      <input type="hidden" name="imageUrl" value={gambar} />
      <input type="hidden" name="videoUrl" value={video} />

      <div className="rounded border p-3">
        <p className="mb-2 font-medium">Gambar</p>
        <div className="flex flex-wrap items-start gap-4">
          {gambar
            // eslint-disable-next-line @next/next/no-img-element
            ? <img src={kecil(gambar, 480)} alt="Pratinjau gambar" referrerPolicy="no-referrer" className="h-28 w-44 rounded object-cover" />
            : <div className="grid h-28 w-44 place-items-center rounded border border-dashed opacity-60">Belum ada gambar</div>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={tombol} onClick={() => { setModeG((b) => !b); setPesan(""); }}>Masukkan URL</button>
            <button type="button" className={tombol} disabled={sibuk} onClick={() => berkasG.current?.click()}>{sibuk ? "Memproses..." : "Upload Gambar"}</button>
            <button type="button" className={tombol} onClick={() => { setGaleri(true); setPesan(""); }}>Gambar Galeri</button>
            {gambar && <button type="button" className={tombol} onClick={() => { setGambar(""); setPesan(""); }}>Hapus gambar utama</button>}
          </div>
        </div>
        {modeG && (
          <div className="mt-3 flex gap-2">
            <input value={ketikG} onChange={(e) => setKetikG(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); pakaiGambar(); } }} placeholder="https://..." aria-label="Alamat gambar" spellCheck={false} className="min-w-0 flex-1 rounded border p-2" autoFocus />
            <button type="button" className={tombol} onClick={pakaiGambar}>Gunakan</button>
          </div>
        )}
        <input ref={berkasG} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) unggahGambar(f); e.target.value = ""; }} />
      </div>

      <div className="rounded border p-3">
        <p className="mb-2 font-medium">Video (opsional)</p>
        <div className="flex flex-wrap items-start gap-4">
          {embed
            ? (
              <div className="relative grid h-28 w-44 place-items-center overflow-hidden rounded bg-black/70 text-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {embed.poster && <img src={embed.poster} alt="" className="absolute inset-0 h-full w-full object-cover opacity-70" />}
                <span className="relative rounded bg-black/70 px-2 py-1 text-xs font-semibold text-white">&#9654; {embed.label}</span>
              </div>
            )
            : <div className="grid h-28 w-44 place-items-center rounded border border-dashed opacity-60">Belum ada video</div>}
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" className={tombol} onClick={() => { setModeV((b) => !b); setPesan(""); }}>Masukkan URL video</button>
            <button type="button" className={tombol} disabled={sibuk} onClick={() => berkasV.current?.click()}>{sibuk ? "Memproses..." : "Upload Video"}</button>
            <button type="button" className={tombol} onClick={() => { setGaleriV(true); setPesan(""); }}>Galeri Video</button>
            {video && <button type="button" className={tombol} onClick={() => { setVideo(""); setPesan(""); }}>Hapus video</button>}
          </div>
        </div>
        {modeV && (
          <div className="mt-3 flex gap-2">
            <input value={ketikV} onChange={(e) => setKetikV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); pakaiVideo(); } }} placeholder="https://youtube.com/... instagram / tiktok / x / facebook / vimeo / .mp4" aria-label="Alamat video" spellCheck={false} className="min-w-0 flex-1 rounded border p-2" autoFocus />
            <button type="button" className={tombol} onClick={pakaiVideo}>Gunakan</button>
          </div>
        )}
        <p className="a-muted mt-2 text-xs">Kartu menampilkan gambar (atau gambar video) dengan tombol putar; pemutar baru dimuat saat diklik, jadi situs tetap ringan. Bila ada gambar dan video, gambar dipakai sebagai sampul.</p>
        <input ref={berkasV} type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) unggahVideo(f); e.target.value = ""; }} />
      </div>

      {pesan && <p className="rounded bg-amber-50 px-3 py-1.5 text-amber-900" role="status">{pesan}</p>}
      {galeri && <GaleriGambar tutup={() => setGaleri(false)} pilih={(u) => { setGambar(u); setGaleri(false); setPesan(""); }} />}
      {galeriV && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-3" role="dialog" aria-modal="true" aria-label="Galeri video" onClick={() => setGaleriV(false)}>
          <div className="a-card flex h-[min(90vh,40rem)] w-full max-w-3xl flex-col p-4" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Galeri Video ({galeriVideo.length})</h2><button type="button" className={tombol} onClick={() => setGaleriV(false)}>Tutup</button></div>
            <div className="grid min-h-0 flex-1 auto-rows-max content-start gap-3 overflow-y-auto sm:grid-cols-2">
              {galeriVideo.length === 0 && <p className="a-muted">Belum ada video di menu Video.</p>}
              {galeriVideo.map((v) => (
                <button key={v.id} type="button" onClick={() => { setVideo(`https://www.youtube.com/watch?v=${v.youtubeId}`); setGaleriV(false); setPesan(""); }} className="overflow-hidden rounded-lg border text-left hover:ring-2 hover:ring-amber-400">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.ytimg.com/vi/${v.youtubeId}/mqdefault.jpg`} alt="" loading="lazy" decoding="async" className="block h-32 w-full object-cover" />
                  <span className="block p-2"><span className="line-clamp-2 block">{v.title}</span></span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
