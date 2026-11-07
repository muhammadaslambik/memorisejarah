// PAKET-15L: SATU pemutar yang berpindah bentuk tanpa memuat ulang video: di kartu (inline), jendela (kecil/besar/layar penuh), atau mini player.
// Elemen iframe tidak pernah dibuat ulang saat bentuk berganti, sehingga video terus berlanjut dari detik yang sama.
// (Memuat ulang hanya terjadi bila video yang diputar berganti; induk memakai key = id video.)
"use client";
import { useCallback, useEffect, useRef, useState } from "react";

export type ModePemutar = "inline" | "modal" | "mini";
type Ukuran = "kecil" | "besar" | "penuh";

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const NAMA: Record<Ukuran, string> = { kecil: "Kecil", besar: "Besar", penuh: "Layar penuh" };
const BERIKUT: Record<Ukuran, Ukuran> = { kecil: "besar", besar: "penuh", penuh: "kecil" };
const LEBAR: Record<Exclude<Ukuran, "penuh">, string> = { kecil: "48rem", besar: "96rem" };

type Kotak = { l: number; t: number; w: number; h: number };

export function PemutarTerpadu({ judul, youtubeId, mode, ubahMode, slotId, onTutup }: {
  judul: string; youtubeId: string; mode: ModePemutar; ubahMode: (m: ModePemutar) => void; slotId: string; onTutup: () => void;
}) {
  const [ukuran, setUkuran] = useState<Ukuran>("kecil");
  const [kotak, setKotak] = useState<Kotak | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null); // mini player: null = pojok kanan bawah
  const wadah = useRef<HTMLDivElement>(null);
  const tarik = useRef<{ dx: number; dy: number } | null>(null);
  const penuh = mode === "modal" && ukuran === "penuh";

  // bentuk jendela selalu dimulai dari Kecil
  useEffect(() => { if (mode === "modal") setUkuran("kecil"); }, [mode]);

  // mode inline: ikuti posisi kartu (video menempel di atas gambar mini kartu)
  useEffect(() => {
    if (mode !== "inline") return;
    let id = 0;
    const tik = () => {
      const s = document.getElementById(slotId);
      if (!s) { onTutup(); return; } // kartu hilang (saringan/halaman berganti)
      const r = s.getBoundingClientRect();
      setKotak((p) => (p && p.l === r.left && p.t === r.top && p.w === r.width && p.h === r.height ? p : { l: r.left, t: r.top, w: r.width, h: r.height }));
      id = requestAnimationFrame(tik);
    };
    tik();
    return () => cancelAnimationFrame(id);
  }, [mode, slotId, onTutup]);

  // layar penuh sungguhan untuk wadah yang sama (iframe tidak dipindah, jadi video tidak mengulang)
  useEffect(() => {
    if (penuh && !document.fullscreenElement) wadah.current?.requestFullscreen?.().catch(() => { /* tetap mode CSS */ });
    if (!penuh && document.fullscreenElement) document.exitFullscreen().catch(() => { /* abaikan */ });
  }, [penuh]);
  useEffect(() => {
    const ubah = () => { if (!document.fullscreenElement) setUkuran((u) => (u === "penuh" ? "kecil" : u)); };
    document.addEventListener("fullscreenchange", ubah);
    return () => { document.removeEventListener("fullscreenchange", ubah); if (document.fullscreenElement) document.exitFullscreen().catch(() => { /* abaikan */ }); };
  }, []);

  useEffect(() => {
    if (mode === "inline") return;
    const esc = (e: KeyboardEvent) => { if (e.key !== "Escape") return; if (penuh) setUkuran("kecil"); else onTutup(); };
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [mode, penuh, onTutup]);

  const batasi = useCallback((x: number, y: number) => {
    const el = wadah.current;
    const w = el?.offsetWidth ?? 320, h = el?.offsetHeight ?? 220;
    return { x: Math.min(Math.max(0, x), Math.max(0, window.innerWidth - w)), y: Math.min(Math.max(0, y), Math.max(0, window.innerHeight - h)) };
  }, []);
  useEffect(() => {
    const ukur = () => setPos((p) => (p ? batasi(p.x, p.y) : p));
    window.addEventListener("resize", ukur);
    return () => window.removeEventListener("resize", ukur);
  }, [batasi]);

  // ===== gaya wadah menurut bentuk =====
  let gaya: React.CSSProperties;
  let kelas = "a-card flex flex-col overflow-hidden";
  if (mode === "inline") {
    gaya = kotak ? { position: "fixed", left: kotak.l, top: kotak.t, width: kotak.w, height: kotak.h, zIndex: 20, borderRadius: 0, border: 0 } : { position: "fixed", visibility: "hidden", zIndex: 20 };
    kelas = "flex flex-col overflow-hidden bg-black";
  } else if (mode === "mini") {
    gaya = { position: "fixed", zIndex: 65, width: "min(20rem, calc(100vw - 1.5rem))", ...(pos ? { left: pos.x, top: pos.y } : { right: 12, bottom: 12 }) };
    kelas += " shadow-2xl";
  } else if (penuh) {
    gaya = { position: "fixed", inset: 0, zIndex: 80, width: "100%", height: "100%", maxWidth: "none", borderRadius: 0 };
    kelas += " shadow-2xl";
  } else {
    gaya = { position: "fixed", left: "50%", top: "50%", transform: "translate(-50%, -50%)", zIndex: 75, width: `min(${LEBAR[ukuran as "kecil" | "besar"]}, calc((100vh - 7.5rem) * 16 / 9), calc(100vw - 1.5rem))` };
    kelas += " shadow-2xl";
  }

  const mulai = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return;
    const r = wadah.current?.getBoundingClientRect();
    if (!r) return;
    tarik.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const geser = (e: React.PointerEvent<HTMLDivElement>) => { if (tarik.current) setPos(batasi(e.clientX - tarik.current.dx, e.clientY - tarik.current.dy)); };
  const selesai = (e: React.PointerEvent<HTMLDivElement>) => {
    tarik.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };
  const ganti = () => setUkuran(BERIKUT[ukuran]);
  const tuju = BERIKUT[ukuran];

  return (
    <>
      {mode === "modal" && !penuh && <div key="latar" className="fixed inset-0 z-[70] bg-black/75" onMouseDown={onTutup} aria-hidden="true" />}
      <div ref={wadah} key="wadah" className={kelas} style={gaya} role={mode === "inline" ? undefined : "dialog"} aria-label={mode === "inline" ? undefined : `Pemutar video: ${judul}`}>
        {mode === "modal" && (
          <div key="kepala" className="flex shrink-0 items-center gap-2 px-4 py-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-memori-sejarah-kecil.png" alt="" width={28} height={28} className="h-7 w-7 shrink-0 rounded-full" />
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">{judul}</p>
            <button type="button" onClick={ganti} className="a-btn-soft !px-2.5 !py-1.5 text-xs" aria-label={`Ubah ke ukuran ${NAMA[tuju].toLowerCase()}`} title={`Ukuran sekarang: ${NAMA[ukuran]}. Klik untuk ${NAMA[tuju].toLowerCase()}`}>
              {tuju === "kecil" && <svg {...g} className="h-4 w-4"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>}
              {tuju === "besar" && <svg {...g} className="h-4 w-4"><path d="M3 8V3h5M21 8V3h-5M3 16v5h5M21 16v5h-5" /></svg>}
              {tuju === "penuh" && <svg {...g} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>}
              <span>{NAMA[tuju]}</span>
            </button>
            <button type="button" onClick={() => ubahMode("mini")} className="a-ikon-btn !h-9 !w-9" aria-label="Mini player" title="Mini player (jendela kecil yang bisa digeser)">
              <svg {...g} className="h-[18px] w-[18px]"><rect x="3" y="5" width="18" height="14" rx="2" /><rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" /></svg>
            </button>
            <button type="button" onClick={onTutup} className="a-ikon-btn !h-9 !w-9 !bg-black/20 hover:!bg-black/30" aria-label="Tutup dan kembali ke daftar video" title="Tutup (kembali ke daftar video)">
              <svg {...g} className="h-[18px] w-[18px]"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        )}
        {mode === "mini" && (
          <div key="kepala" onPointerDown={mulai} onPointerMove={geser} onPointerUp={selesai} onPointerCancel={selesai} className="flex shrink-0 cursor-grab touch-none select-none items-center gap-1 px-2.5 py-1.5 active:cursor-grabbing" title="Tarik untuk menggeser">
            <svg {...g} className="h-4 w-4 shrink-0 opacity-60" aria-hidden="true"><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" strokeWidth={3} /></svg>
            <p className="min-w-0 flex-1 truncate text-xs font-semibold">{judul}</p>
            <button type="button" onClick={() => ubahMode("modal")} className="a-ikon-btn !h-7 !w-7" aria-label="Perbesar" title="Perbesar">
              <svg {...g} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
            </button>
            <button type="button" onClick={onTutup} className="a-ikon-btn !h-7 !w-7" aria-label="Tutup mini player" title="Tutup">
              <svg {...g} className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        )}
        <div key="media" className={`w-full bg-black ${mode === "inline" || penuh ? "min-h-0 flex-1" : "aspect-video"}`}>
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0`}
            title={judul}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          />
        </div>
      </div>
    </>
  );
}
