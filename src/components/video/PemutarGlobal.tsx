// PAKET-16: pemutar video publik yang HIDUP DI TATA LETAK SITUS (tidak ikut hilang saat pindah halaman).
// Satu iframe YouTube tidak pernah dipindah di DOM (memindahkan iframe memuat ulang video). Di halaman /video/[slug] pemutar
// ditempatkan tepat di atas "slot" (lihat PemutarMenonton) lewat posisi fixed yang diikuti tiap frame; di halaman lain, atau saat slot
// tergulir keluar layar, pemutar yang sama menjadi mini player di pojok kanan bawah dan video terus berjalan dari menit yang sama.
"use client";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ikutiSlot, mulaiIkuti, type PosisiIkuti } from "@/lib/ikuti-slot";
import { usePerangkatSentuh } from "@/lib/sentuh";

export type VideoMini = { slug: string; title: string; youtubeId: string };
type Pesan = { event?: string; info?: unknown };
type Info = { playerState?: number; currentTime?: number; duration?: number; volume?: number; muted?: boolean; playbackRate?: number; videoLoadedFraction?: number };

type Konteks = {
  pasang: (v: VideoMini, lain: VideoMini[], el: HTMLElement) => void;
  lepas: (el: HTMLElement) => void;
};
type Aktif = { aktifId: string | null; mini: boolean; kembaliKeSlot: () => void };
const Ctx = createContext<Konteks | null>(null);
const CtxAktif = createContext<Aktif | null>(null);
export const usePemutar = () => useContext(Ctx);
export const usePemutarAktif = () => useContext(CtxAktif);
type Sub = "utama" | "cc" | "timer" | "kecepatan" | "kualitas";

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const KECEPATAN = [0.5, 0.75, 1, 1.25, 1.5, 2];
const KUNCI_AUTO = "ms-autoputar";
const KUNCI_BAR = "ms-mini-bar"; // pilihan mini player (diperkecil atau tidak) diingat per perangkat
const tombolKtl = "grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/15 focus-visible:bg-white/15";

export const waktu = (d: number) => {
  if (!isFinite(d) || d < 0) return "0:00";
  const j = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60), s = Math.floor(d % 60);
  return j > 0 ? `${j}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};

export function PemutarProvider({ children }: { children: React.ReactNode }) {
  const [video, setVideo] = useState<VideoMini | null>(null);
  const [lain, setLain] = useState<VideoMini[]>([]);
  const [riwayat, setRiwayat] = useState<VideoMini[]>([]);
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  const [slotVideo, setSlotVideo] = useState<VideoMini | null>(null);
  const [teater, setTeater] = useState(false);
  const [paksa, setPaksa] = useState(false);
  const [mini, setMini] = useState(false);
  const [bar, setBarState] = useState(false);
  const lewatCatat = useRef(false);
  const videoRef = useRef<VideoMini | null>(null);
  videoRef.current = video;

  useEffect(() => { try { setBarState(localStorage.getItem(KUNCI_BAR) === "1"); } catch { /* abaikan */ } }, []);
  const setBar = useCallback((b: boolean) => { setBarState(b); try { localStorage.setItem(KUNCI_BAR, b ? "1" : "0"); } catch { /* abaikan */ } }, []);

  const ganti = useCallback((v: VideoMini) => {
    const cur = videoRef.current;
    if (lewatCatat.current) lewatCatat.current = false;
    else if (cur && cur.youtubeId !== v.youtubeId) setRiwayat((r) => [...r, cur].slice(-30));
    setVideo(v);
  }, []);
  const pasang = useCallback((v: VideoMini, l: VideoMini[], el: HTMLElement) => {
    if (!videoRef.current || videoRef.current.youtubeId !== v.youtubeId) ganti(v);
    setLain(l);
    setSlot(el);
    setSlotVideo(v);
  }, [ganti]);
  const lepas = useCallback((el: HTMLElement) => {
    // video yang sedang berjalan TIDAK dihentikan saat halaman berganti: ia menjadi mini player
    setSlot((s) => (s === el ? null : s));
    setSlotVideo(null);
  }, []);
  const konteks = useMemo(() => ({ pasang, lepas }), [pasang, lepas]);

  useEffect(() => { setPaksa(false); }, [video?.youtubeId]);
  useEffect(() => {
    document.documentElement.toggleAttribute("data-teater", teater && !!slot);
    return () => document.documentElement.removeAttribute("data-teater");
  }, [teater, slot]);

  const muatBerikut = useCallback((n: VideoMini) => {
    const cur = videoRef.current;
    setLain((l) => [...l.filter((x) => x.slug !== n.slug), ...(cur ? [cur] : [])]);
    ganti(n);
  }, [ganti]);
  const sebelumnya = useCallback(() => {
    const prev = riwayat[riwayat.length - 1];
    if (!prev) return;
    const cur = videoRef.current;
    setRiwayat((r) => r.slice(0, -1));
    setLain((l) => [...(cur ? [cur] : []), ...l.filter((x) => x.slug !== prev.slug)]);
    setVideo(prev);
  }, [riwayat]);
  const sebelumnyaHalaman = useCallback(() => {
    const prev = riwayat[riwayat.length - 1];
    if (!prev) return null;
    setRiwayat((r) => r.slice(0, -1));
    lewatCatat.current = true;
    return prev;
  }, [riwayat]);
  const kembaliKeSlot = useCallback(() => {
    setPaksa(false);
    if (slotVideo && videoRef.current && videoRef.current.youtubeId !== slotVideo.youtubeId) ganti(slotVideo);
  }, [slotVideo, ganti]);
  const aktif = useMemo(() => ({ aktifId: video?.youtubeId ?? null, mini: !!video && mini, kembaliKeSlot }), [video, mini, kembaliKeSlot]);

  return (
    <Ctx.Provider value={konteks}>
      <CtxAktif.Provider value={aktif}>
        {children}
        {video && (
          <Pemutar
            key={video.youtubeId}
            video={video}
            lain={lain.filter((x) => x.youtubeId !== video.youtubeId)}
            slot={slot}
            sama={!!slotVideo && slotVideo.youtubeId === video.youtubeId}
            teater={teater}
            setTeater={setTeater}
            paksa={paksa}
            setPaksa={setPaksa}
            bar={bar}
            setBar={setBar}
            adaSebelumnya={riwayat.length > 0}
            onSebelumnya={sebelumnya}
            onSebelumnyaHalaman={sebelumnyaHalaman}
            onMini={setMini}
            onTutup={() => { setVideo(null); setMini(false); }}
            onMuat={muatBerikut}
          />
        )}
      </CtxAktif.Provider>
    </Ctx.Provider>
  );
}

// bilah geser buatan sendiri: jalur tipis, bagian termuat, bagian terputar, dan bulatan penunjuk (tanpa kotak)
export function Bilah({ pos, dur, muat, onCari }: { pos: number; dur: number; muat: number; onCari: (d: number) => void }) {
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

const KUALITAS: [string, string][] = [["auto", "Otomatis"], ["hd1080", "1080p"], ["hd720", "720p"], ["large", "480p"], ["medium", "360p"], ["small", "240p"]];
const TIMER = [0, 5, 10, 15, 30, 45, 60];

// ikon YouTube: mode teater = persegi panjang lebar bergaris tebal; saat aktif = "tampilan default" (persegi panjang lebih sempit)
const IkonTeater = ({ aktif, c = "h-7 w-7" }: { aktif: boolean; c?: string }) => aktif
  ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" className={c}><rect x="5" y="6" width="14" height="12" rx="2.4" /></svg>
  : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" className={c}><rect x="2" y="7" width="20" height="10" rx="2.4" /></svg>;

// panel pengaturan bergaya YouTube: daftar menu (Subtitel/CC, Timer tidur, Kecepatan pemutaran, Kualitas) dengan submenu dan tombol kembali
function PanelAtur({ sub, setSub, kecilUkuran, teks, onTeks, laju, onLaju, timer, onTimer, kual, onKual, labelKual }: {
  sub: Sub; setSub: (s: Sub) => void; kecilUkuran: boolean; teks: boolean; onTeks: (b: boolean) => void; laju: number; onLaju: (r: number) => void;
  timer: number; onTimer: (m: number) => void; kual: string; onKual: (q: string) => void; labelKual: string;
}) {
  const baris = "flex w-full items-center gap-3 px-3 text-left hover:bg-white/10 " + (kecilUkuran ? "py-1.5 text-xs" : "py-2.5 text-sm");
  const Ikon = ({ d }: { d: string }) => <svg {...g} className="h-5 w-5 shrink-0 opacity-90"><path d={d} /></svg>;
  const Centang = () => <svg {...g} className="ml-auto h-4 w-4 shrink-0"><path d="M5 12l5 5L20 7" /></svg>;
  const Panah = () => <svg {...g} className="h-4 w-4 shrink-0 opacity-70"><path d="M9 6l6 6-6 6" /></svg>;
  const judul: Record<Sub, string> = { utama: "", cc: "Subtitel/CC", timer: "Timer tidur", kecepatan: "Kecepatan pemutaran", kualitas: "Kualitas" };
  const Pilih = ({ ok, teksPilih, klik }: { ok: boolean; teksPilih: string; klik: () => void }) => (
    <button type="button" onClick={klik} className={`${baris} ${ok ? "font-semibold" : ""}`}><span className="w-5 shrink-0" />{teksPilih}{ok && <Centang />}</button>
  );
  return (
    <div
      data-atur
      className={`absolute z-40 overflow-y-auto rounded-xl bg-[rgba(28,28,28,0.96)] py-1.5 text-white shadow-2xl [scrollbar-width:thin] ${kecilUkuran ? "inset-x-2 bottom-[5.5rem] top-2" : "bottom-16 right-3 w-[min(18rem,calc(100%-1.5rem))] max-h-[calc(100%-5rem)]"}`}
    >
      {sub === "utama" ? (
        <>
          <button type="button" onClick={() => setSub("cc")} className={baris}>
            <Ikon d="M3 7a3 3 0 013-3h12a3 3 0 013 3v10a3 3 0 01-3 3H6a3 3 0 01-3-3zM7 11h3M7 15h5M14 11h3M15 15h2" /><span className="flex-1">Subtitel/CC</span><span className="opacity-70">{teks ? "Aktif" : "Nonaktif"}</span><Panah />
          </button>
          <button type="button" onClick={() => setSub("timer")} className={baris}>
            <Ikon d="M21 12.8A9 9 0 1111.2 3a7 7 0 009.8 9.8z" /><span className="flex-1">Timer tidur</span><span className="opacity-70">{timer ? `${timer} menit` : "Nonaktif"}</span><Panah />
          </button>
          <button type="button" onClick={() => setSub("kecepatan")} className={baris}>
            <Ikon d="M12 14l4-4M3.5 17a9 9 0 1117 0" /><span className="flex-1">Kecepatan pemutaran</span><span className="opacity-70">{laju === 1 ? "Normal" : `${laju}x`}</span><Panah />
          </button>
          <button type="button" onClick={() => setSub("kualitas")} className={baris}>
            <Ikon d="M4 6h10M18 6h2M4 12h2M10 12h10M4 18h12M20 18h0M14 4v4M8 10v4M16 16v4" /><span className="flex-1">Kualitas</span><span className="opacity-70">{labelKual}</span><Panah />
          </button>
        </>
      ) : (
        <>
          <button type="button" onClick={() => setSub("utama")} className={`${baris} border-b border-white/10 font-semibold`}>
            <svg {...g} className="h-4 w-4 shrink-0"><path d="M15 6l-6 6 6 6" /></svg>{judul[sub]}
          </button>
          {sub === "cc" && (<><Pilih ok={!teks} teksPilih="Nonaktif" klik={() => onTeks(false)} /><Pilih ok={teks} teksPilih="Indonesia (bila tersedia)" klik={() => onTeks(true)} /></>)}
          {sub === "timer" && TIMER.map((m) => <Pilih key={m} ok={timer === m} teksPilih={m === 0 ? "Nonaktif" : `${m} menit`} klik={() => onTimer(m)} />)}
          {sub === "kecepatan" && KECEPATAN.map((r) => <Pilih key={r} ok={laju === r} teksPilih={r === 1 ? "Normal" : `${r}x`} klik={() => onLaju(r)} />)}
          {sub === "kualitas" && KUALITAS.map(([k, n]) => <Pilih key={k} ok={kual === k} teksPilih={n} klik={() => onKual(k)} />)}
        </>
      )}
    </div>
  );
}

function Pemutar({ video, lain, slot, sama, teater, setTeater, paksa, setPaksa, bar, setBar, adaSebelumnya, onSebelumnya, onSebelumnyaHalaman, onMini, onTutup, onMuat }: {
  video: VideoMini; lain: VideoMini[]; slot: HTMLElement | null; sama: boolean; teater: boolean; setTeater: (f: (b: boolean) => boolean) => void;
  paksa: boolean; setPaksa: (b: boolean) => void; bar: boolean; setBar: (b: boolean) => void; adaSebelumnya: boolean; onSebelumnya: () => void; onSebelumnyaHalaman: () => VideoMini | null; onMini: (b: boolean) => void; onTutup: () => void; onMuat: (v: VideoMini) => void;
}) {
  const router = useRouter();
  const kotak = useRef<HTMLDivElement>(null);
  const bingkai = useRef<HTMLIFrameElement>(null);
  const timerKtl = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerCatat = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerTidurRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerMini = useRef<ReturnType<typeof setTimeout> | null>(null);
  const barusTutup = useRef(false);
  const stRef = useRef<PosisiIkuti>({ l: 0, t: 0 });

  const [info, setInfo] = useState<Info & { playbackQuality?: string }>({});
  const [terlihat, setTerlihat] = useState(true);
  const [ktl, setKtl] = useState(true);        // kontrol terlihat (halaman video)
  const [ktlMini, setKtlMini] = useState(false);
  const [lainnya, setLainnya] = useState(false);
  const [atur, setAtur] = useState<Sub | null>(null);
  const [timer, setTimer] = useState(0);
  const [kual, setKual] = useState("auto");
  const [teks, setTeks] = useState(false);
  const [mulai, setMulai] = useState(0);
  const [catatan, setCatatan] = useState("");
  const [auto, setAuto] = useState(true);
  const [penuh, setPenuh] = useState(false);

  const main = info.playerState === 1 || info.playerState === 3;
  const sentuh = usePerangkatSentuh();
  const [pernahMain, setPernahMain] = useState(false);
  useEffect(() => { if (info.playerState === 1) setPernahMain(true); }, [info.playerState]);
  // Ponsel: peramban hanya mau memutar bila ketukan jatuh LANGSUNG pada pemutar YouTube. Sebelum video pernah berjalan, lapisan klik dan kontrol kita
  // dibuat tembus ketuk supaya ketukan pertama mengenai tombol putar YouTube; setelah itu kontrol kita bekerja seperti biasa.
  const tembus = sentuh && !pernahMain;
  // mini player: di luar halaman video, saat slot tergulir keluar layar, dibuka manual, atau saat yang diputar bukan video halaman ini.
  // Tetap mini walaupun dijeda: tidak hilang dan tidak berpindah sendiri ke halaman video.
  const mini = !slot || paksa || !terlihat || !sama;
  const berikut = lain[0];
  useEffect(() => { onMini(mini); }, [mini, onMini]);

  const src = useMemo(() => {
    const asal = typeof window !== "undefined" ? `&origin=${encodeURIComponent(window.location.origin)}` : "";
    return `https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&controls=0&fs=0&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&playsinline=1&start=${mulai}${teks ? "&cc_load_policy=1&cc_lang_pref=id&hl=id" : ""}${asal}`;
  }, [video.youtubeId, mulai, teks]);

  const perintah = useCallback((func: string, args: unknown[] = []) => {
    bingkai.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }, []);

  const miniRef = useRef(mini);
  miniRef.current = mini;
  const posisi = useCallback(() => {
    const el = kotak.current;
    if (!el || document.fullscreenElement || !slot) return;
    const r = slot.getBoundingClientRect();
    const tampak = Math.max(0, Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0));
    const ok = r.height > 0 && tampak / r.height >= 0.25;
    setTerlihat((p) => (p === ok ? p : ok));
    if (miniRef.current) return;
    ikutiSlot(el, slot, stRef.current); // absolute di dalam dokumen: ikut tergulir tanpa tertinggal
  }, [slot]);
  useLayoutEffect(() => {
    const el = kotak.current;
    if (el) {
      if (mini || !slot) ["top", "left", "width", "height"].forEach((p) => el.style.removeProperty(p));
      else mulaiIkuti(el, stRef.current);
    }
    posisi();
  }, [mini, slot, posisi]);
  useEffect(() => {
    let id = 0;
    const loop = () => { posisi(); id = requestAnimationFrame(loop); };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [posisi]);

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

  useEffect(() => { try { setAuto(localStorage.getItem(KUNCI_AUTO) !== "0"); } catch { /* abaikan */ } }, []);
  // putar otomatis: di halaman video pindah ke halaman video berikutnya; sebagai mini player cukup memutar video berikutnya di tempat
  useEffect(() => {
    if (info.playerState !== 0 || !auto || !berikut) return;
    if (!mini) router.push(`/video/${berikut.slug}`); else onMuat(berikut);
  }, [info.playerState, auto, berikut, mini, router, onMuat]);

  useEffect(() => {
    const ubah = () => { setPenuh(document.fullscreenElement === kotak.current); };
    document.addEventListener("fullscreenchange", ubah);
    return () => document.removeEventListener("fullscreenchange", ubah);
  }, []);

  // klik di luar menu pengaturan menutupnya (klik di area video hanya menutup, tidak menjeda); klik di luar pemutar menutup juga daftar Video lainnya
  useEffect(() => {
    if (!atur && !lainnya) return;
    const turun = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (!t) return;
      const dalamKotak = !!kotak.current?.contains(t);
      if (atur && !t.closest("[data-atur]")) {
        setAtur(null);
        if (dalamKotak) { barusTutup.current = true; setTimeout(() => { barusTutup.current = false; }, 400); }
      }
      if (lainnya && !dalamKotak) setLainnya(false);
    };
    document.addEventListener("pointerdown", turun, true);
    return () => document.removeEventListener("pointerdown", turun, true);
  }, [atur, lainnya]);

  const tampilKtl = useCallback(() => {
    setKtl(true);
    if (timerKtl.current) clearTimeout(timerKtl.current);
    timerKtl.current = setTimeout(() => setKtl(false), 3000);
  }, []);
  const tampilMini = useCallback((otomatisSembunyi = true) => {
    setKtlMini(true);
    if (timerMini.current) clearTimeout(timerMini.current);
    if (otomatisSembunyi) timerMini.current = setTimeout(() => setKtlMini(false), 3500);
  }, []);
  useEffect(() => () => {
    [timerKtl, timerCatat, timerTidurRef, timerMini].forEach((t) => { if (t.current) clearTimeout(t.current); });
  }, []);
  const kontrolTampil = ktl || !main || !!atur || lainnya;
  const miniTampil = ktlMini || !main || !!atur;

  const jeda = () => perintah(main ? "pauseVideo" : "playVideo");
  const cari = (d: number) => { perintah("seekTo", [d, true]); setInfo((p) => ({ ...p, currentTime: d })); };
  const atasVolume = (v: number) => { perintah("setVolume", [v]); perintah(v === 0 ? "mute" : "unMute"); setInfo((p) => ({ ...p, volume: v, muted: v === 0 })); };
  const bisu = () => { const m = !!info.muted; perintah(m ? "unMute" : "mute"); setInfo((p) => ({ ...p, muted: !m })); };
  const lajuUbah = (r: number) => { perintah("setPlaybackRate", [r]); setInfo((p) => ({ ...p, playbackRate: r })); setAtur("utama"); };
  const ubahAuto = () => { const b = !auto; setAuto(b); try { localStorage.setItem(KUNCI_AUTO, b ? "1" : "0"); } catch { /* abaikan */ } };
  const layarPenuh = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void kotak.current?.requestFullscreen?.().catch(() => undefined); };
  const aturTimer = (m: number) => {
    if (timerTidurRef.current) clearTimeout(timerTidurRef.current);
    setTimer(m);
    if (m > 0) timerTidurRef.current = setTimeout(() => { perintah("pauseVideo"); setTimer(0); }, m * 60000);
    setAtur("utama");
  };
  const aturKual = (q: string) => { perintah("setPlaybackQuality", [q === "auto" ? "default" : q]); setKual(q); setAtur("utama"); };
  const labelKual = kual === "auto" ? "Otomatis" : (KUALITAS.find(([k]) => k === kual)?.[1] ?? "Otomatis");
  // teks (CC): perintah postMessage "captions" tidak andal, jadi pemutar dimuat ulang dari menit yang sama dengan parameter teks
  const setTeksNyala = (b: boolean) => {
    if (b === teks) { setAtur("utama"); return; }
    setMulai(Math.floor(info.currentTime ?? 0));
    setTeks(b);
    setAtur("utama");
    setCatatan(b ? "Teks (CC) diaktifkan. Hanya tampil bila video ini menyediakan teks di YouTube." : "Teks (CC) dimatikan.");
    if (timerCatat.current) clearTimeout(timerCatat.current);
    timerCatat.current = setTimeout(() => setCatatan(""), 4500);
  };

  const kembali = () => {
    setPaksa(false);
    if (slot && sama) slot.scrollIntoView({ behavior: "smooth", block: "center" });
    else router.push(`/video/${video.slug}`);
  };
  const keTeater = () => { setTeater(() => true); kembali(); };
  const klikSebelumnya = () => { if ((info.currentTime ?? 0) > 3 || !adaSebelumnya) cari(0); else onSebelumnya(); };

  const dur = info.duration ?? 0;
  const pos = info.currentTime ?? 0;
  const laju = info.playbackRate ?? 1;
  const vol = info.muted ? 0 : (info.volume ?? 100);
  const muat = Math.min(100, Math.max(0, (info.videoLoadedFraction ?? 0) * 100));
  const selesai = info.playerState === 0;

  const lebarMini = "w-[min(24rem,calc(100vw-1.5rem))]";
  const kelasKotak = !mini
    ? `absolute z-30 overflow-hidden bg-black ${penuh || teater ? "" : "rounded-xl border border-ms-line"}`
    : bar
      ? `fixed bottom-3 right-3 z-30 ${lebarMini} overflow-hidden rounded-full border border-ms-line bg-ms-bg shadow-2xl`
      : `fixed bottom-3 right-3 z-30 ${lebarMini} overflow-hidden rounded-xl border border-ms-line bg-black shadow-2xl`;
  const kelasVideo = penuh ? "absolute inset-0 bg-black" : !mini ? "absolute inset-0 bg-black" : bar ? "fixed -left-[9999px] top-0 h-[180px] w-[320px]" : "relative aspect-video w-full bg-black";
  const tombolMini = "grid h-7 w-7 place-items-center rounded-full hover:bg-white/20";

  const panel = atur && (
    <PanelAtur
      sub={atur} setSub={setAtur} kecilUkuran={mini && !penuh} teks={teks} onTeks={setTeksNyala} laju={laju} onLaju={lajuUbah}
      timer={timer} onTimer={aturTimer} kual={kual} onKual={aturKual} labelKual={labelKual}
    />
  );

  return (
    <div
      ref={kotak}
      onPointerMove={mini ? undefined : tampilKtl}
      onPointerEnter={(e) => { if (!mini) tampilKtl(); else if (!bar && e.pointerType === "mouse") tampilMini(false); }}
      onPointerLeave={(e) => {
        if (!mini) { if (main) setKtl(false); }
        else if (!bar && e.pointerType === "mouse") tampilMini(true);
      }}
      className={kelasKotak}
    >
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
        {/* setelah video selesai YouTube menampilkan saran video miliknya; ditutup dengan sampul */}
        {selesai && !bar && (
          <div key="sampul" className="pointer-events-none absolute inset-0 z-[5] bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-50" />
          </div>
        )}
        {/* lapisan klik: di halaman video klik = putar/jeda, klik dua kali = layar penuh; di mini player klik menampilkan tombol (tidak menjeda) */}
        {!bar && (
          <button
            type="button"
            aria-label={mini ? "Tampilkan kontrol" : main ? "Jeda" : "Putar"}
            onClick={() => {
              if (barusTutup.current) { barusTutup.current = false; return; }
              if (mini) { if (ktlMini) setKtlMini(false); else tampilMini(true); } else jeda();
            }}
            onDoubleClick={mini ? undefined : layarPenuh}
            className={`absolute inset-0 z-10 cursor-pointer ${tembus ? "pointer-events-none" : ""}`}
          />
        )}

        {/* kontrol mini player di dalam video */}
        {mini && !bar && (
          <div key="kontrolMini" className={`pointer-events-none absolute inset-0 z-20 flex flex-col justify-between text-white transition-opacity duration-200 ${miniTampil && !tembus ? "opacity-100" : "opacity-0"}`}>
            <div className={`flex items-center gap-0.5 bg-gradient-to-b from-black/80 to-transparent px-2 pb-5 pt-1.5 ${miniTampil && !tembus ? "pointer-events-auto" : ""}`}>
              <Link href={`/video/${video.slug}`} className="min-w-0 flex-1 truncate px-1 text-xs font-semibold hover:text-[#d9a441]" title={video.title}>{video.title}</Link>
              <button type="button" onClick={kembali} className={tombolMini} title="Kembali ke halaman video">
                <svg {...g} className="h-4 w-4"><path d="M14 4h6v6M20 4l-8 8M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4" /></svg>
              </button>
              <button type="button" onClick={() => { setBar(true); setPaksa(false); setAtur(null); }} className={tombolMini} title="Perkecil (video tetap berjalan)">
                <svg {...g} className="h-4 w-4"><path d="M5 19h14" /></svg>
              </button>
              <button type="button" onClick={onTutup} className={tombolMini} title="Tutup pemutar">
                <svg {...g} className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div className={`flex items-center justify-center gap-2 ${miniTampil && !tembus ? "pointer-events-auto" : ""}`}>
              <button type="button" onClick={klikSebelumnya} className="grid h-10 w-10 place-items-center rounded-full bg-black/55 hover:bg-black/75" title={(info.currentTime ?? 0) > 3 || !adaSebelumnya ? "Ulangi dari awal" : "Video sebelumnya"}>
                <svg {...g} className="h-5 w-5" fill="currentColor" stroke="none"><path d="M18 5l-9 7 9 7zM5 5h2v14H5z" /></svg>
              </button>
              <button type="button" onClick={jeda} className="grid h-12 w-12 place-items-center rounded-full bg-black/55 hover:bg-black/75" title={main ? "Jeda" : "Putar"}><IkonJeda main={main} c="h-6 w-6" /></button>
              <button type="button" disabled={!berikut} onClick={() => berikut && onMuat(berikut)} className="grid h-10 w-10 place-items-center rounded-full bg-black/55 hover:bg-black/75 disabled:opacity-40" title={berikut ? `Video berikutnya: ${berikut.title}` : "Tidak ada video berikutnya"}>
                <svg {...g} className="h-5 w-5" fill="currentColor" stroke="none"><path d="M6 5l9 7-9 7zM17 5h2v14h-2z" /></svg>
              </button>
            </div>
            <div className={`bg-gradient-to-t from-black/85 to-transparent px-2 pb-1 pt-4 ${miniTampil && !tembus ? "pointer-events-auto" : ""}`}>
              <Bilah pos={pos} dur={dur} muat={muat} onCari={cari} />
              <div className="-mt-1 flex items-center gap-0.5">
                <span className="mr-auto text-[11px] tabular-nums text-white">{waktu(pos)} / {waktu(dur)}</span>
                <button type="button" onClick={ubahAuto} className={`${tombolMini} w-auto px-1`} title={auto ? "Putar otomatis: aktif" : "Putar otomatis: mati"} aria-pressed={auto}>
                  <span className={`relative inline-block h-3.5 w-7 rounded-full transition ${auto ? "bg-[#d9a441]" : "bg-white/35"}`}><span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${auto ? "left-[1.1rem]" : "left-0.5"}`} /></span>
                </button>
                <button type="button" data-atur onClick={() => setAtur((a) => (a ? null : "utama"))} className={tombolMini} title="Pengaturan" aria-expanded={!!atur}>
                  <svg {...g} className="h-4 w-4"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>
                </button>
                <button type="button" onClick={keTeater} className={tombolMini} title="Mode teater (buka di halaman video)"><IkonTeater aktif={false} c="h-5 w-5" /></button>
                <button type="button" onClick={layarPenuh} className={tombolMini} title="Layar penuh">
                  <svg {...g} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
                </button>
              </div>
            </div>
            {panel}
          </div>
        )}

        {/* kontrol penuh (di halaman video) */}
        {!mini && (
          <div className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-10 text-white transition-opacity duration-200 ${kontrolTampil && !tembus ? "opacity-100" : "pointer-events-none opacity-0"}`}>
            <div className="mb-1"><Bilah pos={pos} dur={dur} muat={muat} onCari={cari} /></div>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <button type="button" onClick={() => { if ((info.currentTime ?? 0) > 3 || !adaSebelumnya) { cari(0); return; } const p = onSebelumnyaHalaman(); if (p) router.push(`/video/${p.slug}`); }} className={tombolKtl} title={(info.currentTime ?? 0) > 3 || !adaSebelumnya ? "Ulangi dari awal" : "Video sebelumnya"}>
                <svg {...g} className="h-5 w-5" fill="currentColor" stroke="none"><path d="M18 5l-9 7 9 7zM5 5h2v14H5z" /></svg>
              </button>
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
              <span className="ml-1 whitespace-nowrap text-xs tabular-nums text-white sm:ml-2 sm:text-sm">{waktu(pos)} / {waktu(dur)}</span>

              <div className="ml-auto flex items-center gap-0.5 sm:gap-1">
                <button type="button" onClick={() => { setLainnya((b) => !b); setAtur(null); }} className="mr-1 inline-flex h-9 items-center gap-1.5 rounded-full bg-white/15 px-3 text-xs font-semibold hover:bg-white/25 sm:text-sm" title="Video lainnya dari Memori Sejarah" aria-expanded={lainnya}>
                  <svg {...g} className="h-4 w-4"><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M7 20h10" /></svg><span className="hidden sm:inline">Video lainnya</span>
                </button>
                <button type="button" onClick={ubahAuto} className={`${tombolKtl} w-auto gap-1.5 px-2`} title={auto ? "Putar otomatis: aktif" : "Putar otomatis: mati"} aria-pressed={auto}>
                  <span className={`relative inline-block h-4 w-8 rounded-full transition ${auto ? "bg-[#d9a441]" : "bg-white/35"}`}><span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${auto ? "left-[1.1rem]" : "left-0.5"}`} /></span>
                </button>
                <button type="button" onClick={() => setTeksNyala(!teks)} className={`${tombolKtl} ${teks ? "bg-white/20" : ""}`} title={teks ? "Teks (CC): aktif" : "Teks (CC)"} aria-pressed={teks}>
                  <svg {...g} className="h-5 w-5"><rect x="3" y="5" width="18" height="14" rx="3" /><path d="M10.5 10.2a2.2 2.2 0 100 3.6M17 10.2a2.2 2.2 0 100 3.6" /></svg>
                </button>
                <button type="button" data-atur onClick={() => { setAtur((a) => (a ? null : "utama")); setLainnya(false); }} className={tombolKtl} title="Pengaturan" aria-expanded={!!atur}>
                  <svg {...g} className="h-5 w-5"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" /></svg>
                </button>
                <button type="button" onClick={() => setPaksa(true)} className={tombolKtl} title="Mini player">
                  <svg {...g} className="h-5 w-5"><path d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2h6" /><rect x="13" y="13" width="8" height="6" rx="1" fill="currentColor" /></svg>
                </button>
                <button type="button" onClick={() => setTeater((b) => !b)} className={`${tombolKtl} hidden lg:grid`} title={teater ? "Tampilan default" : "Mode teater"} aria-pressed={teater}>
                  <IkonTeater aktif={teater} />
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
        {!mini && panel}

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
                  <span className="block px-2 py-1.5"><span className="line-clamp-2 block text-xs font-semibold leading-snug group-hover:text-[#d9a441]">{x.title}</span></span>
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
