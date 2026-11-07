// PAKET-15B/15G/15H: jendela pemutar video di dalam CMS (YouTube tersemat atau berkas dari perangkat).
// Satu tombol ukuran bergiliran: Kecil -> Besar -> Layar penuh -> Kecil. Tombol mini player memindahkan video ke jendela kecil yang bisa digeser.
// Tutup: tombol X, klik di luar jendela, atau Esc.
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type SumberVideo = { tipe: "youtube"; id: string } | { tipe: "file"; url: string };
export type Ukuran = "kecil" | "besar" | "penuh";

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const LEBAR: Record<Exclude<Ukuran, "penuh">, string> = { kecil: "48rem", besar: "96rem" };
const NAMA: Record<Ukuran, string> = { kecil: "Kecil", besar: "Besar", penuh: "Layar penuh" };
const BERIKUT: Record<Ukuran, Ukuran> = { kecil: "besar", besar: "penuh", penuh: "kecil" };

export function PemutarVideo({ judul, sumber, onTutup, onMini, awal = "kecil" }: { judul: string; sumber: SumberVideo; onTutup: () => void; onMini?: () => void; awal?: Ukuran }) {
  const [ukuran, setUkuran] = useState<Ukuran>(awal);
  const panel = useRef<HTMLDivElement>(null);
  const penuh = ukuran === "penuh";

  const keluarPenuh = useCallback(async (ke: Ukuran) => {
    if (document.fullscreenElement) { try { await document.exitFullscreen(); } catch { /* abaikan */ } }
    setUkuran(ke);
  }, []);

  // masuk ke layar penuh sungguhan (bila peramban mengizinkan) setiap kali ukuran menjadi "penuh"
  useEffect(() => {
    if (ukuran === "penuh" && !document.fullscreenElement) panel.current?.requestFullscreen?.().catch(() => { /* tetap mode CSS */ });
  }, [ukuran]);

  useEffect(() => {
    const ubah = () => { if (!document.fullscreenElement) setUkuran((u) => (u === "penuh" ? "kecil" : u)); }; // keluar layar penuh (Esc bawaan peramban) -> kembali ke Kecil
    document.addEventListener("fullscreenchange", ubah);
    return () => {
      document.removeEventListener("fullscreenchange", ubah);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => { /* abaikan */ });
    };
  }, []);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => { if (e.key !== "Escape") return; if (penuh) void keluarPenuh("kecil"); else onTutup(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [penuh, keluarPenuh, onTutup]);

  const ganti = () => {
    const ke = BERIKUT[ukuran];
    if (ukuran === "penuh") void keluarPenuh(ke); else setUkuran(ke);
  };

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
        // lebar dibatasi agar seluruh jendela (judul + video 16:9) selalu muat di layar
        style={penuh ? undefined : { maxWidth: `min(${LEBAR[ukuran as "kecil" | "besar"]}, calc((100vh - 7.5rem) * 16 / 9))` }}
      >
        <div className="flex shrink-0 items-center gap-2 px-4 py-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-memori-sejarah-kecil.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full" />
          <p className="min-w-0 flex-1 truncate text-sm font-semibold">{judul}</p>
          <button type="button" onClick={ganti} className="a-btn-soft !px-2.5 !py-1.5 text-xs" aria-label={`Ubah ke ukuran ${NAMA[BERIKUT[ukuran]].toLowerCase()}`} title={`Ukuran sekarang: ${NAMA[ukuran]}. Klik untuk ${NAMA[BERIKUT[ukuran]].toLowerCase()}`}>
            {BERIKUT[ukuran] === "kecil" && <svg {...g} className="h-4 w-4"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>}
            {BERIKUT[ukuran] === "besar" && <svg {...g} className="h-4 w-4"><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" /></svg>}
            {BERIKUT[ukuran] === "penuh" && <svg {...g} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>}
            <span>{NAMA[BERIKUT[ukuran]]}</span>
          </button>
          {onMini && (
            <button type="button" onClick={onMini} className="a-ikon-btn !h-9 !w-9" aria-label="Mini player" title="Mini player (jendela kecil yang bisa digeser)">
              <svg {...g} className="h-[18px] w-[18px]"><rect x="3" y="5" width="18" height="14" rx="2" /><rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" /></svg>
            </button>
          )}
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
