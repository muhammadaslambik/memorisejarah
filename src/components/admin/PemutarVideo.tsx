// PAKET-15B/15G: jendela pemutar video di dalam CMS (YouTube tersemat atau berkas dari perangkat).
// Ukuran awal sudah besar (muat di layar). Tombol Perbesar = layar penuh. Tutup: tombol X, klik di luar jendela, atau Esc.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type SumberVideo = { tipe: "youtube"; id: string } | { tipe: "file"; url: string };

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function PemutarVideo({ judul, sumber, onTutup }: { judul: string; sumber: SumberVideo; onTutup: () => void }) {
  const [penuh, setPenuh] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  const keluarPenuh = useCallback(async () => {
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* abaikan */ } }
    setPenuh(false);
  }, []);
  const masukPenuh = async () => {
    setPenuh(true); // tata letak layar penuh lewat CSS (cadangan bila peramban menolak Fullscreen API)
    try { await panel.current?.requestFullscreen?.(); } catch { /* tetap pakai mode CSS */ }
  };

  useEffect(() => {
    const ubah = () => { if (!document.fullscreenElement) setPenuh(false); }; // keluar dengan Esc bawaan peramban
    document.addEventListener("fullscreenchange", ubah);
    return () => {
      document.removeEventListener("fullscreenchange", ubah);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { /* abaikan */ });
    };
  }, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key !== "Escape") return; if (penuh) void keluarPenuh(); else onTutup(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [penuh, keluarPenuh, onTutup]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 sm:p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onTutup(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Pemutar video: ${judul}`}
    >
      <div
        ref={panel}
        className={`a-card flex w-full flex-col overflow-hidden shadow-2xl ${penuh ? "!fixed inset-0 z-[80] !max-w-none !rounded-none" : ""}`}
        // ukuran awal: selebar mungkin tetapi seluruh jendela (judul + video 16:9) tetap muat di layar
        style={penuh ? undefined : { maxWidth: "min(96rem, calc((100vh - 7.5rem) * 16 / 9))" }}
      >
        <div className="flex shrink-0 items-center gap-2 px-4 py-2.5">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{judul}</p>
          <button type="button" onClick={() => (penuh ? void keluarPenuh() : void masukPenuh())} className="a-ikon-btn !h-9 !w-9" aria-label={penuh ? "Keluar dari layar penuh" : "Layar penuh"} title={penuh ? "Keluar dari layar penuh" : "Layar penuh"}>
            {penuh
              ? <svg {...g} className="h-[18px] w-[18px]"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
              : <svg {...g} className="h-[18px] w-[18px]"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>}
          </button>
          <button type="button" onClick={onTutup} className="a-ikon-btn !h-9 !w-9 !bg-black/20 hover:!bg-black/30" aria-label="Tutup dan kembali ke daftar video" title="Tutup (kembali ke daftar video)">
            <svg {...g} className="h-[18px] w-[18px]"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className={`w-full bg-black ${penuh ? "min-h-0 flex-1" : "aspect-video"}`}>
          {sumber.tipe === "youtube" ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${sumber.id}?autoplay=1&rel=0`}
              title={judul}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            />
          ) : (
            <video src={sumber.url} controls autoPlay playsInline className="h-full w-full" />
          )}
        </div>
      </div>
    </div>
  );
}
