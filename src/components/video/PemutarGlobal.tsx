// PAKET-16: pemutar video publik yang HIDUP DI TATA LETAK SITUS (tidak ikut hilang saat pindah halaman).
// Satu iframe YouTube tidak pernah dipindah di DOM (memindahkan iframe memuat ulang video). Di halaman /video/[slug] pemutar
// ditempatkan tepat di atas "slot" (lihat PemutarMenonton) lewat posisi fixed yang diikuti tiap frame; di halaman lain, atau saat slot
// tergulir keluar layar, pemutar yang sama menjadi mini player di pojok kanan bawah dan video terus berjalan dari menit yang sama.
"use client";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type VideoMini = { slug: string; title: string; youtubeId: string };
type Pesan = { event?: string; info?: unknown };
type Info = { playerState?: number; currentTime?: number; duration?: number; volume?: number; muted?: boolean; playbackRate?: number; videoLoadedFraction?: number };

type Konteks = {
  pasang: (v: VideoMini, lain: VideoMini[], el: HTMLElement) => void;
  lepas: (el: HTMLElement) => void;
};
const Ctx = createContext<Konteks | null>(null);
export const usePemutar = () => useContext(Ctx);

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const KECEPATAN = [0.5, 0.75, 1, 1.25, 1.5, 2];
const KUNCI_AUTO = "ms-autoputar";
const tombolKtl = "grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/15 focus-visible:bg-white/15";

const waktu = (d: number) => {
  if (!isFinite(d) || d < 0) return "0:00";
  const j = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60), s = Math.floor(d % 60);
  return j > 0 ? `${j}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};

export function PemutarProvider({ children }: { children: React.ReactNode }) {
  const [video, setVideo] = useState<VideoMini | null>(null);
  const [lain, setLain] = useState<VideoMini[]>([]);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [teater, setTeater] = useState(false);
  const sedangMain = useRef(false);

  const pasang = useCallback((v: VideoMini, l: VideoMini[], el: HTMLElement) => {
    setVideo((p) => (p && p.youtubeId === v.youtubeId ? p : v));
    setLain(l);
    setSlot(el);
  }, []);
  const lepas = useCallback((el: HTMLElement) => {
    setSlot((s) => (s === el ? null : s));
    if (!sedangMain.current) setVideo(null); // tidak sedang diputar: tidak ada yang perlu dilanjutkan
  }, []);
  const konteks = useMemo(() => ({ pasang, lepas }), [pasang, lepas]);

  useEffect(() => {
    document.documentElement.toggleAttribute("data-teater", teater && !!slot);
    return () => document.documentElement.removeAttribute("data-teater");
  }, [teater, slot]);

  const muatBerikut = useCallback((n: VideoMini) => {
    setLain((l) => [...l.filter((x) => x.slug !== n.slug), ...(video ? [video] : [])]);
    setVideo(n);
  }, [video]);

  return (
    <Ctx.Provider value={konteks}>
      {children}
      {video && (
        <Pemutar
          key={video.youtubeId}
          video={video}
          lain={lain.filter((x) => x.youtubeId !== video.youtubeId)}
          slot={slot}
          teater={teater}
          setTeater={setTeater}
          onMain={(b) => { sedangMain.current = b; }}
          onTutup={() => { sedangMain.current = false; setVideo(null); }}
          onMuat={muatBerikut}
        />
      )}
    </Ctx.Provider>
  );
}

// bilah geser buatan sendiri: jalur tipis, bagian termuat, bagian terputar, dan bulatan penunjuk (tanpa kotak)
function Bilah({ pos, dur, muat, onCari }: { pos: number; dur: number; muat: number; onCari: (d: number) => void }) {
  const pct = dur > 0 ? Math.min(100, Math.max(0, (pos / dur) * 100)) : 0;
  return (
    <div className="group relative h-5 w-full cursor-pointer">
      <div className="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-white/25 transition-all group-hover:h-[5px]">
        <div className="absolute inset-y-0 left-0 rounded-full bg-white/40" style={{ width: `${muat}%` }} />
        <div className="absolute inset-y-0 left-0 rounded-full bg-[#d9a441]" style={{ width: `${pct}%` }} />
        <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d9a441] opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" style={{ left: `${pct}%` }} />
      </div>
      <input type="range" min={0} max={dur || 1} step={0.1} value={Math.min(pos, dur || 1)} onChange={(e) => onCari(Number(e.target.value))} aria-label="Posisi video" className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
    </div>
  );
}

const IkonJeda = ({ main, c = "h-5 w-5" }: { main: boolean; c?: string }) => main
  ? <svg {...g} className={c} fill="currentColor" stroke="none"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
  : <svg {...g} className={c} fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></svg>;

function Pemutar({ video, lain, slot, teater, setTeater, onMain, onTutup, onMuat }: {
  video: VideoMini; lain: VideoMini[]; slot: HTMLElement | null; teater: boolean; setTeater: (f: (b: boolean) => boolean) => void;
  onMain: (b: boolean) => void; onTutup: () => void; onMuat: (v: VideoMini) => void;
}) {
  const router = useRouter();
  const kotak = useRef<HTMLDivElement>(null);
  const bingkai = useRef<HTMLIFrameElement>(null);
  const timerKtl = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerCatat = useRef<ReturnType<typeof setTimeout> | null>(null);
  const terakhir = useRef("");

  const [info, setInfo] = useState<Info>({});
  const [terlihat, setTerlihat] = useState(true);
  const [bar, setBar] = useState(false);       // mini player diperkecil menjadi bilah kecil (video tetap berjalan)
  const [paksa, setPaksa] = useState(false);   // mini player dibuka manual di halaman video
  const [ktl, setKtl] = useState(true);        // kontrol terlihat
  const [lainnya, setLainnya] = useState(false);
  const [menuKecepatan, setMenuKecepatan] = useState(false);
  const [teks, setTeks] = useState(false);
  const [mulai, setMulai] = useState(0);
  const [catatan, setCatatan] = useState("");
  const [auto, setAuto] = useState(true);
  const [penuh, setPenuh] = useState(false);

  const main = info.playerState === 1 || info.playerState === 3;
  const mini = !slot || paksa || (main && !terlihat);
  const berikut = lain[0];
  useEffect(() => { onMain(main); }, [main, onMain]);

  const src = useMemo(() => {
    const asal = typeof window !== "undefined" ? `&origin=${encodeURIComponent(window.location.origin)}` : "";
    return `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&controls=0&fs=0&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&playsinline=1&start=${mulai}${teks ? "&cc_load_policy=1&cc_lang_pref=id&hl=id" : ""}${asal}`;
  }, [video.youtubeId, mulai, teks]);

  const perintah = useCallback((func: string, args: unknown[] = []) => {
    bingkai.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }, []);

  // posisi: di atas slot (halaman video) atau mini player di pojok kanan bawah
  const posisi = useCallback(() => {
    const el = kotak.current;
    if (!el || document.fullscreenElement) return;
    if (!slot) return;
    const r = slot.getBoundingClientRect();
    const tinggiLayar = window.innerHeight;
    const tampak = Math.max(0, Math.min(r.bottom, tinggiLayar) - Math.max(r.top, 0));
    const ok = r.height > 0 && tampak / r.height >= 0.25;
    setTerlihat((p) => (p === ok ? p : ok));
    if (miniRef.current) return;
    const s = `${r.top}|${r.left}|${r.width}|${r.height}`;
    if (s === terakhir.current) return;
    terakhir.current = s;
    el.style.top = `${r.top}px`; el.style.left = `${r.left}px`; el.style.width = `${r.width}px`; el.style.height = `${r.height}px`;
  }, [slot]);
  const miniRef = useRef(mini);
  miniRef.current = mini;
  useLayoutEffect(() => {
    const el = kotak.current;
    if (el && (mini || !slot)) ["top", "left", "width", "height"].forEach((p) => el.style.removeProperty(p));
    terakhir.current = "";
    posisi();
  }, [mini, slot, posisi]);
  useEffect(() => {
    let id = 0;
    const loop = () => { posisi(); id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [posisi]);

  // pesan status dari YouTube
  useEffect(() => {
    const saat = (e: MessageEvent) => {
      if (e.source !== bingkai.current?.contentWindow) return;
      let d: Pesan | null = null;
      try { d = typeof e.data === "string" ? (JSON.parse(e.data) as Pesan) : (e.data as Pesan); } catch { return; }
      if (!d) return;
      if (d.event === "onStateChange" && typeof d.info === "number") setInfo((p) => ({ ...p, playerState: d!.info as number }));
      else if (d.event === "infoDelivery" && d.info && typeof d.info === "object") setInfo((p) => ({ ...p, ...(d!.info as Info) }));
    };
    window.addEventListener("message", saat);
    return () => window.removeEventListener("message", saat);
  }, []);
  const langganan = useCallback(() => {
    const w = bingkai.current?.contentWindow;
    if (!w) return;
    w.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
    w.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "*");
  }, []);
  useEffect(() => {
    const t = [600, 1800, 3500].map((ms) => setTimeout(langganan, ms));
    return () => t.forEach(clearTimeout);
  }, [langganan, src]);

  // putar otomatis: setelah video selesai lanjut ke video Memori Sejarah berikutnya
  useEffect(() => { try { setAuto(localStorage.getItem(KUNCI_AUTO) !== "0"); } catch { /* abaikan */ } }, []);
  useEffect(() => {
    if (info.playerState !== 0 || !auto || !berikut) return;
    if (slot) router.push(`/video/${berikut.slug}`); else onMuat(berikut);
  }, [info.playerState, auto, berikut, slot, router, onMuat]);

  // layar penuh
  useEffect(() => {
    const ubah = () => { setPenuh(document.fullscreenElement === kotak.current); terakhir.current = ""; };
    document.addEventListener("fullscreenchange", ubah);
    return () => document.removeEventListener("fullscreenchange", ubah);
  }, []);

  // kontrol tampil saat kursor bergerak; sembunyi otomatis saat sedang diputar
  const tampilKtl = useCallback(() => {
    setKtl(true);
    if (timerKtl.current) clearTimeout(timerKtl.current);
    timerKtl.current = setTimeout(() => setKtl(false), 3000);
  }, []);
  useEffect(() => () => { if (timerKtl.current) clearTimeout(timerKtl.current); if (timerCatat.current) clearTimeout(timerCatat.current); }, []);
  const kontrolTampil = ktl || !main || menuKecepatan || lainnya;

  const jeda = () => perintah(main ? "pauseVideo" : "playVideo");
  const cari = (d: number) => { perintah("seekTo", [d, true]); setInfo((p) => ({ ...p, currentTime: d })); };
  const atasVolume = (v: number) => { perintah("setVolume", [v]); perintah(v === 0 ? "mute" : "unMute"); setInfo((p) => ({ ...p, volume: v, muted: v === 0 })); };
  const bisu = () => { const m = !!info.muted; perintah(m ? "unMute" : "mute"); setInfo((p) => ({ ...p, muted: !m })); };
  const lajuUbah = (r: number) => { perintah("setPlaybackRate", [r]); setInfo((p) => ({ ...p, playbackRate: r })); setMenuKecepatan(false); };
  const ubahAuto = () => { const b = !auto; setAuto(b); try { localStorage.setItem(KUNCI_AUTO, b ? "1" : "0"); } catch { /* abaikan */ } };
  const layarPenuh = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void kotak.current?.requestFullscreen?.().catch(() => undefined); };
  // teks (CC): perintah postMessage "captions" tidak andal di semua peramban, jadi pemutar dimuat ulang dari menit yang sama dengan parameter teks
  const ubahTeks = () => {
    const b = !teks;
    setMulai(Math.floor(info.currentTime ?? 0));
    setTeks(b);
    setCatatan(b ? "Teks (CC) diaktifkan. Hanya tampil bila video ini menyediakan teks di YouTube." : "Teks (CC) dimatikan.");
    if (timerCatat.current) clearTimeout(timerCatat.current);
    timerCatat.current = setTimeout(() => setCatatan(""), 4500);
  };

  const bukaMini = () => { setPaksa(true); };
  const kembali = () => {
    setPaksa(false);
    if (slot) slot.scrollIntoView({ behavior: "smooth", block: "center" });
    else router.push(`/video/${video.slug}`);
  };

  // kontrol mini player: tampil saat kursor di atasnya atau saat diketuk; klik pada video TIDAK menjeda
  const [ktlMini, setKtlMini] = useState(false);
  const timerMini = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tampilMini = useCallback((otomatisSembunyi = true) => {
    setKtlMini(true);
    if (timerMini.current) clearTimeout(timerMini.current);
    if (otomatisSembunyi) timerMini.current = setTimeout(() => setKtlMini(false), 3500);
  }, []);
  useEffect(() => () => { if (timerMini.current) clearTimeout(timerMini.current); }, []);
  const miniTampil = ktlMini || !main;

  const dur = info.duration ?? 0;
  const pos = info.currentTime ?? 0;
  const laju = info.playbackRate ?? 1;
  const vol = info.muted ? 0 : (info.volume ?? 100);
  const muat = Math.min(100, Math.max(0, (info.videoLoadedFraction ?? 0) * 100));

  const lebarMini = "w-[min(22rem,calc(100vw-1.5rem))]";
  const kelasKotak = !mini
    ? `fixed z-30 overflow-hidden bg-black ${penuh || teater ? "" : "rounded-xl border border-ms-line"}`
    : bar
      ? `fixed bottom-3 right-3 z-30 ${lebarMini} overflow-hidden rounded-full border border-ms-line bg-ms-bg shadow-2xl`
      : `fixed bottom-3 right-3 z-30 ${lebarMini} overflow-hidden rounded-xl border border-ms-line bg-black shadow-2xl`;
  const kelasVideo = !mini ? "absolute inset-0 bg-black" : bar ? "fixed -left-[9999px] top-0 h-[180px] w-[320px]" : "relative aspect-video w-full bg-black";

  return (
    <div
      ref={kotak}
      onPointerMove={mini ? undefined : tampilKtl}
      onPointerLeave={(e) => {
        if (!mini) { if (main) setKtl(false); }
        else if (!bar && e.pointerType === "mouse") tampilMini(true);
      }}
      onPointerEnter={mini && !bar ? (e) => { if (e.pointerType === "mouse") tampilMini(false); } : undefined}
      className={kelasKotak}
    >
      {/* bilah kecil (mini player diperkecil) */}
      {mini && bar && (
        <div key="bilah" className="flex items-center gap-1 px-3 py-1.5 text-ms-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/logo-memori-sejarah-kecil.png" alt="" width={20} height={20} className="h-5 w-5 shrink-0 rounded-full" />
          <Link href={`/video/${video.slug}`} className="min-w-0 flex-1 truncate px-1 text-xs font-semibold hover:text-ms-gold" title={video.title}>{video.title}</Link>
          <button type="button" onClick={jeda} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10" title={main ? "Jeda" : "Putar"}><IkonJeda main={main} c="h-4 w-4" /></button>
          <button type="button" onClick={() => setBar(false)} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10" title="Perbesar mini player">
            <svg {...g} className="h-4 w-4"><path d="M7 14l5-5 5 5" /></svg>
          </button>
          <button type="button" onClick={onTutup} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/10" title="Tutup pemutar">
            <svg {...g} className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></svg>
          </button>
        </div>
      )}

      <div key="video" className={kelasVideo}>
        <iframe
          ref={bingkai}
          src={src}
          title={video.title}
          className="h-full w-full"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          referrerPolicy="strict-origin-when-cross-origin"
          onLoad={langganan}
        />
        {/* lapisan klik: di halaman video klik = putar/jeda dan klik dua kali = layar penuh; di mini player klik menampilkan tombol */}
        {!bar && (
          <button
            type="button"
            aria-label={mini ? "Tampilkan kontrol" : main ? "Jeda" : "Putar"}
            onClick={mini ? () => (ktlMini ? setKtlMini(false) : tampilMini(true)) : jeda}
            onDoubleClick={mini ? undefined : layarPenuh}
            className="absolute inset-0 z-10 cursor-pointer"
          />
        )}

        {/* kontrol mini player di dalam video */}
        {mini && !bar && (
          <div key="kontrolMini" className={`pointer-events-none absolute inset-0 z-20 flex flex-col justify-between text-white transition-opacity duration-200 ${miniTampil ? "opacity-100" : "opacity-0"}`}>
            <div className={`flex items-center gap-0.5 bg-gradient-to-b from-black/80 to-transparent px-2 pb-6 pt-1.5 ${miniTampil ? "pointer-events-auto" : ""}`}>
              <Link href={`/video/${video.slug}`} className="min-w-0 flex-1 truncate px-1 text-xs font-semibold hover:text-[#d9a441]" title={video.title}>{video.title}</Link>
              <button type="button" onClick={kembali} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/20" title="Kembali ke halaman video">
                <svg {...g} className="h-4 w-4"><path d="M14 4h6v6M20 4l-8 8M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4" /></svg>
              </button>
              <button type="button" onClick={() => { setBar(true); setPaksa(false); }} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/20" title="Perkecil (video tetap berjalan)">
                <svg {...g} className="h-4 w-4"><path d="M5 19h14" /></svg>
              </button>
              <button type="button" onClick={onTutup} className="grid h-8 w-8 place-items-center rounded-full hover:bg-white/20" title="Tutup pemutar">
                <svg {...g} className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className={`flex items-center justify-center gap-2 ${miniTampil ? "pointer-events-auto" : ""}`}>
              <button type="button" onClick={jeda} className="grid h-12 w-12 place-items-center rounded-full bg-black/55 hover:bg-black/75" title={main ? "Jeda" : "Putar"}><IkonJeda main={main} c="h-6 w-6" /></button>
              {berikut && (
                <button type="button" onClick={() => router.push(`/video/${berikut.slug}`)} className="grid h-10 w-10 place-items-center rounded-full bg-black/55 hover:bg-black/75" title={`Video berikutnya: ${berikut.title}`}>
                  <svg {...g} className="h-5 w-5" fill="currentColor" stroke="none"><path d="M6 5l9 7-9 7zM17 5h2v14h-2z" /></svg>
                </button>
              )}
            </div>
            <div className={`bg-gradient-to-t from-black/80 to-transparent px-2 pb-1 pt-5 ${miniTampil ? "pointer-events-auto" : ""}`}>
              <Bilah pos={pos} dur={dur} muat={muat} onCari={cari} />
              <p className="-mt-1 text-[11px] tabular-nums text-white/90">{waktu(pos)} / {waktu(dur)}</p>
            </div>
          </div>
        )}

        {/* kontrol penuh (di halaman video) */}
        {!mini && (
          <div className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-10 text-white transition-opacity duration-200 ${kontrolTampil ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <div className="mb-1"><Bilah pos={pos} dur={dur} muat={muat} onCari={cari} /></div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button type="button" onClick={jeda} className={tombolKtl} title={main ? "Jeda" : "Putar"}><IkonJeda main={main} /></button>
              {berikut && (
                <Link href={`/video/${berikut.slug}`} className={tombolKtl} title={`Video berikutnya: ${berikut.title}`}>
                  <svg {...g} className="h-5 w-5" fill="currentColor" stroke="none"><path d="M6 5l9 7-9 7zM17 5h2v14h-2z" /></svg>
                </Link>
              )}
              <button type="button" onClick={bisu} className={tombolKtl} title={vol === 0 ? "Suarakan" : "Bisukan"}>
                {vol === 0
                  ? <svg {...g} className="h-5 w-5"><path d="M11 5L6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6" /></svg>
                  : <svg {...g} className="h-5 w-5"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" /></svg>}
              </button>
              <input type="range" min={0} max={100} value={vol} onChange={(e) => atasVolume(Number(e.target.value))} aria-label="Volume" className="hidden h-1 w-16 cursor-pointer accent-[#d9a441] sm:block" />
              <span className="ml-1 whitespace-nowrap text-xs tabular-nums sm:ml-2 sm:text-sm">{waktu(pos)} / {waktu(dur)}</span>

              <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
                <button type="button" onClick={() => { setLainnya((b) => !b); setMenuKecepatan(false); }} className="mr-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 text-xs font-semibold hover:bg-white/25 sm:text-sm" title="Video lainnya dari Memori Sejarah" aria-expanded={lainnya}>
                  <svg {...g} className="h-4 w-4"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M7 20h10" /></svg><span className="hidden sm:inline">Video lainnya</span>
                </button>
                <button type="button" onClick={ubahAuto} className={`${tombolKtl} w-auto gap-1.5 px-2`} title={auto ? "Putar otomatis: aktif" : "Putar otomatis: mati"} aria-pressed={auto}>
                  <span className={`relative inline-block h-4 w-8 rounded-full transition ${auto ? "bg-[#d9a441]" : "bg-white/35"}`}><span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${auto ? "left-[1.1rem]" : "left-0.5"}`} /></span>
                </button>
                <button type="button" onClick={ubahTeks} className={`${tombolKtl} ${teks ? "bg-white/20" : ""}`} title={teks ? "Teks (CC): aktif" : "Teks (CC)"} aria-pressed={teks}>
                  <svg {...g} className="h-5 w-5"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10.5 10.2a2.2 2.2 0 100 3.6M17 10.2a2.2 2.2 0 100 3.6" /></svg>
                </button>
                <div className="relative">
                  <button type="button" onClick={() => { setMenuKecepatan((b) => !b); setLainnya(false); }} className={tombolKtl} title={`Kecepatan putar: ${laju}x`} aria-expanded={menuKecepatan}>
                    <svg {...g} className="h-5 w-5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>
                  </button>
                  {menuKecepatan && (
                    <div className="absolute bottom-11 right-0 z-30 w-36 rounded-xl border border-white/10 bg-black/90 p-1.5 shadow-2xl">
                      <p className="px-2 py-1 text-[11px] uppercase tracking-wider text-white/60">Kecepatan putar</p>
                      {KECEPATAN.map((r) => (
                        <button key={r} type="button" onClick={() => lajuUbah(r)} className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-white/10 ${r === laju ? "text-[#d9a441]" : ""}`}>
                          {r === 1 ? "Normal" : `${r}x`}{r === laju && <span aria-hidden="true">{"\u2713"}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button type="button" onClick={bukaMini} className={tombolKtl} title="Mini player">
                  <svg {...g} className="h-5 w-5"><path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h6" /><rect x="13" y="13" width="8" height="6" rx="1" fill="currentColor" /></svg>
                </button>
                {/* ikon mode teater seperti YouTube: persegi panjang lebar; saat aktif menjadi persegi panjang yang lebih kecil (kembali ke tampilan biasa) */}
                <button type="button" onClick={() => setTeater((b) => !b)} className={`${tombolKtl} hidden lg:grid`} title={teater ? "Tampilan default" : "Mode teater"} aria-pressed={teater}>
                  {teater
                    ? <svg {...g} className="h-6 w-6"><rect x="5" y="7.5" width="14" height="9" rx="2" /></svg>
                    : <svg {...g} className="h-6 w-6"><rect x="2.5" y="6" width="19" height="12" rx="3" /></svg>}
                </button>
                <button type="button" onClick={layarPenuh} className={tombolKtl} title={penuh ? "Keluar dari layar penuh" : "Layar penuh"}>
                  {penuh
                    ? <svg {...g} className="h-5 w-5"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" /></svg>
                    : <svg {...g} className="h-5 w-5"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>}
                </button>
              </div>
            </div>
          </div>
        )}

        {!mini && catatan && <p className="pointer-events-none absolute inset-x-0 top-3 z-20 mx-auto w-fit max-w-[90%] rounded-lg bg-black/80 px-3 py-1.5 text-center text-xs text-white">{catatan}</p>}

        {!mini && lainnya && (
          <div className="absolute inset-0 z-30 flex flex-col bg-black/90 p-3 text-white sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <h2 className="font-serif text-base font-bold sm:text-lg">Video Memori Sejarah</h2>
              <button type="button" onClick={() => setLainnya(false)} className="ml-auto grid h-9 w-9 place-items-center rounded-full hover:bg-white/15" title="Tutup">
                <svg {...g} className="h-5 w-5"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-y-auto overscroll-contain pr-2 [scrollbar-width:thin] sm:grid-cols-3 lg:grid-cols-4">
              {lain.map((x) => (
                <Link key={x.slug} href={`/video/${x.slug}`} className="group block overflow-hidden rounded-lg bg-white/5 hover:bg-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.ytimg.com/vi/${x.youtubeId}/mqdefault.jpg`} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                  <span className="line-clamp-2 block px-2 py-1.5 text-xs font-semibold leading-snug group-hover:text-[#d9a441]">{x.title}</span>
                </Link>
              ))}
              {lain.length === 0 && <p className="col-span-full text-sm text-white/70">Belum ada video lain.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
