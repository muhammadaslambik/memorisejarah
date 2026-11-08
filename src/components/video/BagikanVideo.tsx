// PAKET-15M: tombol Bagikan (salin tautan, WhatsApp, Facebook, X, Telegram, dan bagikan bawaan perangkat) + Tonton di YouTube.
"use client";
import { useRef, useState } from "react";
import { useTutupLuar } from "@/lib/tutup-luar";

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const tombol = "inline-flex items-center gap-2 rounded-full border border-ms-line bg-ms-surface px-4 py-2 text-sm font-medium text-ms-cream transition hover:border-ms-gold hover:text-ms-gold";
const butir = "block w-full rounded-lg px-3 py-2 text-left text-sm text-ms-cream hover:bg-white/5";

export function BagikanVideo({ judul, youtubeId }: { judul: string; youtubeId: string }) {
  const [buka, setBuka] = useState(false);
  const [salin, setSalin] = useState(false);
  const akar = useRef<HTMLDivElement>(null);
  useTutupLuar(buka, [akar], () => setBuka(false));
  const alamat = () => (typeof window === "undefined" ? "" : window.location.href.split("#")[0]);
  const u = () => encodeURIComponent(alamat());
  const t = encodeURIComponent(judul);

  const salinTautan = async () => {
    try { await navigator.clipboard.writeText(alamat()); setSalin(true); setTimeout(() => setSalin(false), 2000); } catch { window.prompt("Salin tautan ini:", alamat()); }
  };
  const bawaan = typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div ref={akar} className="relative">
        <button type="button" className={tombol} onClick={() => setBuka((b) => !b)} aria-expanded={buka} aria-haspopup="menu">
          <svg {...g} className="h-4 w-4"><path d="M4 12v7a1 1 0 001 1h14a1 1 0 001-1v-7M16 6l-4-4-4 4M12 2v13" /></svg>Bagikan
        </button>
        {buka && (
          <div role="menu" className="absolute left-0 top-12 z-40 w-60 rounded-xl border border-ms-line bg-ms-surface p-2 shadow-2xl">
            <button type="button" role="menuitem" className={butir} onClick={salinTautan}>{salin ? "Tautan disalin \u2713" : "Salin tautan"}</button>
            {bawaan && <button type="button" role="menuitem" className={butir} onClick={() => { void navigator.share({ title: judul, url: alamat() }).catch(() => undefined); setBuka(false); }}>Bagikan lewat perangkat</button>}
            <a role="menuitem" className={butir} target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${t}%20${u()}`}>WhatsApp</a>
            <a role="menuitem" className={butir} target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${u()}`}>Facebook</a>
            <a role="menuitem" className={butir} target="_blank" rel="noopener noreferrer" href={`https://twitter.com/intent/tweet?url=${u()}&text=${t}`}>X</a>
            <a role="menuitem" className={butir} target="_blank" rel="noopener noreferrer" href={`https://t.me/share/url?url=${u()}&text=${t}`}>Telegram</a>
          </div>
        )}
      </div>
      <a className={tombol} href={`https://www.youtube.com/watch?v=${youtubeId}`} target="_blank" rel="noopener noreferrer">
        <svg {...g} className="h-4 w-4"><path d="M14 3h7v7M10 14L21 3M19 14v5a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h5" /></svg>Tonton di YouTube
      </a>
    </div>
  );
}
