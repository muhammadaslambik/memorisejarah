// PAKET-15H: mini player: jendela video kecil melayang yang bisa digeser (tarik bilah judulnya; mouse maupun sentuh).
"use client";
import { useEffect, useRef, useState } from "react";
import type { SumberVideo } from "@/components/admin/PemutarVideo";

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function MiniPemutar({ judul, sumber, onTutup, onBesar }: { judul: string; sumber: SumberVideo; onTutup: () => void; onBesar?: () => void }) {
  const kotak = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null); // null = sudut kanan bawah
  const tarik = useRef<{ dx: number; dy: number } | null>(null);

  const batasi = (x: number, y: number) => {
    const el = kotak.current;
    const w = el?.offsetWidth ?? 320, h = el?.offsetHeight ?? 220;
    return { x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - w)), y: Math.min(Math.max(0, y), Math.max(0, window.innerHeight - h)) };
  };

  useEffect(() => {
    const ukur = () => setPos((p) => (p ? batasi(p.x, p.y) : p));
    window.addEventListener("resize", ukur);
    return () => window.removeEventListener("resize", ukur);
  }, []);

  const mulai = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const r = kotak.current?.getBoundingClientRect();
    if (!r) return;
    tarik.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const geser = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!tarik.current) return;
    setPos(batasi(e.clientX - tarik.current.dx, e.clientY - tarik.current.dy));
  };
  const selesai = (e: React.PointerEvent<HTMLDivElement>) => {
    tarik.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      ref={kotak}
      className="a-card fixed z-[65] w-[min(20rem,calc(100vw-1.5rem))] overflow-hidden shadow-2xl"
      style={pos ? { left: pos.x, top: pos.y } : { right: 12, bottom: 12 }}
      role="dialog"
      aria-label={`Mini player: ${judul}`}
    >
      <div onPointerDown={mulai} onPointerMove={geser} onPointerUp={selesai} onPointerCancel={selesai} className="flex cursor-grab touch-none select-none items-center gap-1 px-2.5 py-1.5 active:cursor-grabbing" title="Tarik untuk menggeser">
        <svg {...g} className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth={3} /></svg>
        <p className="min-w-0 flex-1 truncate text-xs font-semibold">{judul}</p>
        {onBesar && (
          <button type="button" onClick={onBesar} className="a-ikon-btn !h-7 !w-7" aria-label="Perbesar" title="Perbesar">
            <svg {...g} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
          </button>
        )}
        <button type="button" onClick={onTutup} className="a-ikon-btn !h-7 !w-7" aria-label="Tutup mini player" title="Tutup">
          <svg {...g} className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>
      <div className="aspect-video w-full bg-black">
        {sumber.tipe === "youtube" ? (
          <iframe src={`https://www.youtube-nocookie.com/embed/${sumber.id}?autoplay=1&rel=0`} title={judul} className="h-full w-full" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" />
        ) : (
          <video src={sumber.url} controls autoPlay playsInline className="h-full w-full" />
        )}
      </div>
    </div>
  );
}
