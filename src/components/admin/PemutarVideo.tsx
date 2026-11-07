// PAKET-15B: jendela pemutar video di dalam CMS (YouTube tersemat atau berkas dari perangkat).
// Bisa diperbesar/diperkecil; menutup dengan tombol X, klik di luar jendela, atau Esc.
"use client";
import { useEffect, useState } from "react";

export type SumberVideo = { tipe: "youtube"; id: string } | { tipe: "file"; url: string };

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function PemutarVideo({ judul, sumber, onTutup }: { judul: string; sumber: SumberVideo; onTutup: () => void }) {
  const [besar, setBesar] = useState(false);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") onTutup(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [onTutup]);

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-3 sm:p-6"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onTutup(); }}
      role="dialog"
      aria-modal="true"
      aria-label={`Pemutar video: ${judul}`}
    >
      <div className={`a-card w-full overflow-hidden shadow-2xl transition-[max-width] duration-200 ${besar ? "max-w-[92rem]" : "max-w-3xl"}`}>
        <div className="flex items-center gap-2 px-4 py-2.5">
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{judul}</p>
          <button type="button" onClick={() => setBesar((b) => !b)} className="a-ikon-btn !h-9 !w-9" aria-label={besar ? "Perkecil" : "Perbesar"} title={besar ? "Perkecil" : "Perbesar"}>
            {besar
              ? <svg {...g} className="h-[18px] w-[18px]"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
              : <svg {...g} className="h-[18px] w-[18px]"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>}
          </button>
          <button type="button" onClick={onTutup} className="a-ikon-btn !h-9 !w-9" aria-label="Tutup" title="Tutup">
            <svg {...g} className="h-[18px] w-[18px]"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
        <div className="aspect-video w-full bg-black">
          {sumber.tipe === "youtube" ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${sumber.id}?autoplay=1&rel=0`}
              title={judul}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : (
            <video src={sumber.url} controls autoPlay playsInline className="h-full w-full" />
          )}
        </div>
      </div>
    </div>
  );
}
