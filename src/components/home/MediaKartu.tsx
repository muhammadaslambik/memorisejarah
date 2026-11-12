// PAKET-21: media kartu informasi yang RINGAN: awalnya hanya gambar/poster dengan tombol putar; pemutar sungguhan (iframe/video) baru dimuat saat diklik.
// Sematan yang tinggi (Instagram, TikTok, X, Facebook) dibuka dalam jendela melayang.
"use client";
import { useEffect, useState } from "react";
import type { Embed } from "@/lib/embed-video";

export function MediaKartu({ embed, gambar, judul }: { embed: Embed; gambar: string; judul: string }) {
  const [buka, setBuka] = useState(false);
  const poster = gambar || embed.poster;
  useEffect(() => {
    if (!buka || !embed.tinggi) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [buka, embed.tinggi]);

  if (embed.jenis === "tautan") {
    return (
      <a href={embed.src} target="_blank" rel="noopener noreferrer" className="relative flex aspect-video w-full items-center justify-center bg-gradient-to-br from-red-900/70 to-ms-surface" aria-label={`Buka video: ${judul}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {poster && <img src={poster} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />}
        <span className="relative rounded-full bg-black/60 px-4 py-1.5 text-xs font-semibold text-white">Buka video &#8599;</span>
      </a>
    );
  }
  if (buka && !embed.tinggi) {
    return embed.jenis === "berkas"
      ? <video src={embed.src} poster={poster || undefined} controls autoPlay playsInline preload="metadata" className="aspect-video w-full bg-black" />
      : <iframe src={embed.src} title={judul} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen loading="lazy" className="aspect-video w-full bg-black" />;
  }
  return (
    <>
      <button type="button" onClick={() => setBuka(true)} aria-label={`Putar: ${judul}`} className="group/m relative block aspect-video w-full overflow-hidden bg-gradient-to-br from-red-900/70 to-ms-surface text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {poster && <img src={poster} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
        <span className="absolute inset-0 grid place-items-center">
          <span className="grid h-14 w-14 place-items-center rounded-full bg-black/60 text-white transition group-hover/m:scale-110 group-hover/m:bg-ms-gold group-hover/m:text-ms-bg">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M8 5v14l11-7z" /></svg>
          </span>
        </span>
        <span className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">{embed.label}</span>
      </button>
      {buka && embed.tinggi && (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/80 p-3" role="dialog" aria-modal="true" aria-label={judul} onClick={() => setBuka(false)}>
          <div className="relative h-[min(86vh,46rem)] w-[min(94vw,28rem)] overflow-hidden rounded-2xl bg-black" onClick={(e) => e.stopPropagation()}>
            <iframe src={embed.src} title={judul} allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowFullScreen className="h-full w-full" />
            <button type="button" onClick={() => setBuka(false)} aria-label="Tutup" className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-full bg-black/70 text-white hover:bg-black">&#10005;</button>
          </div>
        </div>
      )}
    </>
  );
}
