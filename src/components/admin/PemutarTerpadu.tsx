// PAKET-17: video di CMS memakai kontrol sendiri (tanpa judul/logo/tulisan YouTube): bilah emas, waktu putih, tombol muncul saat kursor di atas video
// atau saat diketuk (ponsel); di luar itu video tampil bersih. Sampul menutup saran/judul YouTube saat dijeda atau selesai.
// PAKET-15L: SATU pemutar yang berpindah bentuk tanpa memuat ulang video: di kartu (inline), jendela (kecil/besar/layar penuh), atau mini player.
// Elemen iframe tidak pernah dibuat ulang saat bentuk berganti, sehingga video terus berlanjut dari detik yang sama.
// (Memuat ulang hanya terjadi bila video yang diputar berganti; induk memakai key = id video.)
"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ikutiSlot, mulaiIkuti } from "@/lib/ikuti-slot";
import { Bilah, waktu } from "@/components/video/PemutarGlobal";

export type ModePemutar = "inline" | "modal" | "mini";
type Ukuran = "kecil" | "besar" | "penuh";

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const NAMA: Record<Ukuran, string> = { kecil: "Kecil", besar: "Besar", penuh: "Layar penuh" };
const BERIKUT: Record<Ukuran, Ukuran> = { kecil: "besar", besar: "penuh", penuh: "kecil" };
const LEBAR: Record<Exclude<Ukuran, "penuh">, string> = { kecil: "48rem", besar: "96rem" };

export function PemutarTerpadu({ judul, youtubeId, mode, ubahMode, slotId, onTutup }: {
  judul: string; youtubeId: string; mode: ModePemutar; ubahMode: (m: ModePemutar) => void; slotId: string; onTutup: () => void;
}) {
  const [ukuran, setUkuran] = useState<Ukuran>("kecil");
  const tutupRef = useRef(onTutup);
  tutupRef.current = onTutup;
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null); // mini player: null = pojok kanan bawah
  const wadah = useRef<HTMLDivElement>(null);
  const tarik = useRef<{ dx: number; dy: number } | null>(null);
  const penuh = mode === "modal" && ukuran === "penuh";
  const bingkai = useRef<HTMLIFrameElement>(null);
  const [info, setInfo] = useState<{ playerState?: number; currentTime?: number; duration?: number; muted?: boolean; videoLoadedFraction?: number }>({});
  const [tap, setTap] = useState(false);
  const main = info.playerState === 1 || info.playerState === 3;
  const bersih = info.playerState === 2 || info.playerState === 0; // hanya saat dijeda/selesai: sampul menutup judul dan saran YouTube (3 detik awal dibiarkan apa adanya)
  const src = useMemo(() => {
    const asal = typeof window !== "undefined" ? `&origin=${encodeURIComponent(window.location.origin)}` : "";
    return `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&controls=0&fs=0&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&playsinline=1${asal}`;
  }, [youtubeId]);
  const perintah = useCallback((func: string, args: unknown[] = []) => {
    bingkai.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }, []);
  const langganan = useCallback(() => {
    const w = bingkai.current?.contentWindow;
    if (!w) return;
    w.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
    w.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "*");
  }, []);
  useEffect(() => {
    const saat = (e: MessageEvent) => {
      if (e.source !== bingkai.current?.contentWindow) return;
      let d: { event?: string; info?: unknown } | null = null;
      try { d = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch { return; }
      if (!d) return;
      if (d.event === "onStateChange" && typeof d.info === "number") setInfo((p) => ({ ...p, playerState: d!.info as number }));
      else if (d.event === "infoDelivery" && d.info && typeof d.info === "object") setInfo((p) => ({ ...p, ...(d!.info as object) }));
    };
    window.addEventListener("message", saat);
    const t = [600, 1800, 3500].map((ms) => setTimeout(langganan, ms));
    return () => { window.removeEventListener("message", saat); t.forEach(clearTimeout); };
  }, [langganan]);
  // ponsel: klik di luar area video menyembunyikan tombol
  useEffect(() => {
    if (!tap) return;
    const turun = (e: PointerEvent) => { if (!wadah.current?.contains(e.target as Node)) setTap(false); };
    document.addEventListener("pointerdown", turun, true);
    return () => document.removeEventListener("pointerdown", turun, true);
  }, [tap]);
  const jeda = () => perintah(main ? "pauseVideo" : "playVideo");
  const bisu = () => { const m = !!info.muted; perintah(m ? "unMute" : "mute"); setInfo((p) => ({ ...p, muted: !m })); };
  const cari = (d: number) => { perintah("seekTo", [d, true]); setInfo((p) => ({ ...p, currentTime: d })); };
  const layarPenuhSungguhan = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void wadah.current?.requestFullscreen?.().catch(() => undefined); };
  const klikVideo = (e: React.MouseEvent) => {
    const jenis = (e.nativeEvent as PointerEvent).pointerType;
    if (jenis === "touch" || jenis === "pen") setTap((b) => !b); else jeda();
  };

  // bentuk jendela selalu dimulai dari Kecil
  useEffect(() => { if (mode === "modal") setUkuran("kecil"); }, [mode]);

  // mode inline: ikuti posisi kartu. Wadah position:absolute di dalam dokumen (ikut tergulir oleh peramban, tidak tertinggal);
  // posisinya hanya diubah lewat DOM langsung bila letak kartu berubah (tanpa render ulang React).
  useLayoutEffect(() => {
    if (mode !== "inline") return;
    const el = wadah.current;
    if (!el) return;
    const st = { l: 0, t: 0 };
    mulaiIkuti(el, st);
    let id = 0;
    const tik = () => {
      const sl = document.getElementById(slotId);
      if (!sl) { tutupRef.current(); return; } // kartu hilang (saringan/halaman berganti)
      if (!document.fullscreenElement) ikutiSlot(el, sl, st);
      id = requestAnimationFrame(tik);
    };
    tik();
    // jangan menghapus left/top/width/height di sini: React sudah menuliskan gaya bentuk berikutnya (jendela/mini) sebelum pembersihan ini berjalan
    return () => cancelAnimationFrame(id);
  }, [mode, slotId]);

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
    gaya = { position: "absolute", zIndex: 15, borderRadius: 0, border: 0 };
    kelas = "flex flex-col overflow-hidden bg-black";
  } else if (mode === "mini") {
    gaya = { position: "fixed", zIndex: 65, width: "min(20rem, calc(100vw - 1.5rem))", height: "auto", ...(pos ? { left: pos.x, top: pos.y } : { left: "auto", top: "auto", right: 12, bottom: 12 }) };
    kelas += " shadow-2xl";
  } else if (penuh) {
    gaya = { position: "fixed", inset: 0, zIndex: 80, width: "100%", height: "100%", maxWidth: "none", borderRadius: 0 };
    kelas += " shadow-2xl";
  } else {
    gaya = { position: "fixed", left: "50%", top: "50%", height: "auto", transform: "translate(-50%, -50%)", zIndex: 75, width: `min(${LEBAR[ukuran as "kecil" | "besar"]}, calc((100vh - 7.5rem) * 16 / 9), calc(100vw - 1.5rem))` };
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
        <div key="media" className={`group relative w-full overflow-hidden bg-black ${mode === "inline" || penuh ? "min-h-0 flex-1" : "aspect-video"}`}>
          <iframe
            ref={bingkai}
            src={src}
            title={judul}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={langganan}
          />
          <div key="sampul" className={`pointer-events-none absolute inset-0 z-[5] bg-black transition-opacity duration-500 ${bersih ? "opacity-100" : "opacity-0"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" decoding="async" className="h-full w-full object-cover opacity-50" />
          </div>
          <button type="button" aria-label={main ? "Jeda" : "Putar"} onClick={klikVideo} className="absolute inset-0 z-10 cursor-pointer" />
          <div className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1 pt-8 text-white transition-opacity duration-200 ${tap || !main ? "opacity-100" : "pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100"}`}>
            <Bilah pos={info.currentTime ?? 0} dur={info.duration ?? 0} muat={Math.min(100, (info.videoLoadedFraction ?? 0) * 100)} onCari={cari} />
            <div className="-mt-1 flex items-center gap-1">
              <button type="button" onClick={jeda} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/20" aria-label={main ? "Jeda" : "Putar"}>
                {main
                  ? <svg {...g} className="h-4 w-4" fill="currentColor" stroke="none"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
                  : <svg {...g} className="h-4 w-4" fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></svg>}
              </button>
              <button type="button" onClick={bisu} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/20" aria-label={info.muted ? "Suarakan" : "Bisukan"}>
                {info.muted
                  ? <svg {...g} className="h-4 w-4"><path d="M11 5L6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6" /></svg>
                  : <svg {...g} className="h-4 w-4"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" /></svg>}
              </button>
              <span className="text-xs tabular-nums text-white">{waktu(info.currentTime ?? 0)} / {waktu(info.duration ?? 0)}</span>
              <button type="button" onClick={layarPenuhSungguhan} className="ml-auto grid h-8 w-8 place-items-center rounded-full hover:bg-white/20" aria-label="Layar penuh">
                <svg {...g} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
