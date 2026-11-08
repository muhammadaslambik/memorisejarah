// PAKET-15M/15N: pemutar halaman tonton video dengan kontrol sendiri bergaya YouTube (jeda/putar, berikutnya, volume, waktu, bilah geser,
// putar otomatis, teks, kecepatan, mini player, mode teater, layar penuh) dan tombol "Video lainnya" (hanya video Memori Sejarah).
// Video langsung berputar. Saat video SEDANG diputar dan pemutarnya tergulir keluar layar, pemutar yang sama (iframe tidak dipindah atau dimuat ulang)
// menjadi mini player di pojok kanan bawah. Mini player bisa diperkecil (tetap tertutup sampai video baru atau halaman dimuat ulang) atau dibuka manual.
"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Video = { slug: string; title: string; youtubeId: string };
type Pesan = { event?: string; info?: unknown };
type Info = { playerState?: number; currentTime?: number; duration?: number; volume?: number; muted?: boolean; playbackRate?: number; videoLoadedFraction?: number };

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const KECEPATAN = [0.5, 0.75, 1, 1.25, 1.5, 2];
const KUNCI_AUTO = "ms-autoputar";
const tombolKtl = "grid h-9 w-9 shrink-0 place-items-center rounded-full text-white transition hover:bg-white/15 focus-visible:bg-white/15";

const waktu = (d: number) => {
  if (!isFinite(d) || d < 0) return "0:00";
  const j = Math.floor(d / 3600), m = Math.floor((d % 3600) / 60), s = Math.floor(d % 60);
  return j > 0 ? `${j}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
};

export function PemutarMenonton({ youtubeId, judul, lain }: { youtubeId: string; judul: string; lain: Video[] }) {
  const router = useRouter();
  const tempat = useRef<HTMLDivElement>(null);
  const kotak = useRef<HTMLDivElement>(null);
  const bingkai = useRef<HTMLIFrameElement>(null);
  const timerKtl = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [info, setInfo] = useState<Info>({});
  const [terlihat, setTerlihat] = useState(true);
  const [diminimalkan, setDiminimalkan] = useState(false); // mini player ditutup pengguna: tetap tertutup sampai video baru / muat ulang
  const [paksa, setPaksa] = useState(false);               // mini player dibuka manual
  const [ktl, setKtl] = useState(true);                    // kontrol terlihat
  const [lainnya, setLainnya] = useState(false);
  const [menuKecepatan, setMenuKecepatan] = useState(false);
  const [teks, setTeks] = useState(false);
  const [auto, setAuto] = useState(true);
  const [teater, setTeater] = useState(false);
  const [penuh, setPenuh] = useState(false);

  const main = info.playerState === 1 || info.playerState === 3;
  const mini = paksa || (main && !terlihat && !diminimalkan);
  const berikut = lain[0];

  const perintah = useCallback((func: string, args: unknown[] = []) => {
    bingkai.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }, []);

  // tempat pemutar masih terlihat di layar?
  useEffect(() => {
    const el = tempat.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setTerlihat(e.intersectionRatio >= 0.25), { threshold: [0, 0.25, 0.5, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

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
  }, [langganan]);

  // putar otomatis: setelah video selesai lanjut ke video Memori Sejarah berikutnya
  useEffect(() => { try { setAuto(localStorage.getItem(KUNCI_AUTO) !== "0"); } catch { /* abaikan */ } }, []);
  useEffect(() => { if (info.playerState === 0 && auto && berikut) router.push(`/video/${berikut.slug}`); }, [info.playerState, auto, berikut, router]);

  // layar penuh dan mode teater
  useEffect(() => {
    const ubah = () => setPenuh(document.fullscreenElement === kotak.current);
    document.addEventListener("fullscreenchange", ubah);
    return () => document.removeEventListener("fullscreenchange", ubah);
  }, []);
  useEffect(() => {
    document.documentElement.toggleAttribute("data-teater", teater);
    return () => document.documentElement.removeAttribute("data-teater");
  }, [teater]);

  // kontrol tampil saat kursor bergerak; sembunyi otomatis saat sedang diputar
  const tampilKtl = useCallback(() => {
    setKtl(true);
    if (timerKtl.current) clearTimeout(timerKtl.current);
    timerKtl.current = setTimeout(() => setKtl(false), 3000);
  }, []);
  useEffect(() => () => { if (timerKtl.current) clearTimeout(timerKtl.current); }, []);
  const kontrolTampil = ktl || !main || menuKecepatan || lainnya;

  const jeda = () => perintah(main ? "pauseVideo" : "playVideo");
  const cari = (d: number) => { perintah("seekTo", [d, true]); setInfo((p) => ({ ...p, currentTime: d })); };
  const atasVolume = (v: number) => { perintah("setVolume", [v]); perintah(v === 0 ? "mute" : "unMute"); setInfo((p) => ({ ...p, volume: v, muted: v === 0 })); };
  const bisu = () => { const m = !!info.muted; perintah(m ? "unMute" : "mute"); setInfo((p) => ({ ...p, muted: !m })); };
  const lajuUbah = (r: number) => { perintah("setPlaybackRate", [r]); setInfo((p) => ({ ...p, playbackRate: r })); setMenuKecepatan(false); };
  const ubahTeks = () => { const b = !teks; setTeks(b); perintah(b ? "loadModule" : "unloadModule", ["captions"]); };
  const ubahAuto = () => { const b = !auto; setAuto(b); try { localStorage.setItem(KUNCI_AUTO, b ? "1" : "0"); } catch { /* abaikan */ } };
  const layarPenuh = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void kotak.current?.requestFullscreen?.().catch(() => undefined); };

  const bukaMini = () => { setDiminimalkan(false); setPaksa(true); };
  const kembali = () => { setPaksa(false); tempat.current?.scrollIntoView({ behavior: "smooth", block: "center" }); };
  const perkecil = () => { setDiminimalkan(true); setPaksa(false); };
  const tutupMini = () => { perintah("pauseVideo"); setPaksa(false); };

  const dur = info.duration ?? 0;
  const pos = info.currentTime ?? 0;
  const laju = info.playbackRate ?? 1;
  const vol = info.muted ? 0 : (info.volume ?? 100);
  const muat = Math.min(100, Math.max(0, (info.videoLoadedFraction ?? 0) * 100));

  return (
    <div ref={tempat} className="relative aspect-video w-full">
      {mini && <div className="absolute inset-0 grid place-items-center rounded-xl border border-dashed border-ms-line bg-ms-surface px-4 text-center text-sm text-ms-cream/60">Video sedang diputar di pemutar mini</div>}
      <div
        ref={kotak}
        onPointerMove={mini ? undefined : tampilKtl}
        onPointerLeave={mini ? undefined : () => { if (main) setKtl(false); }}
        className={mini ? "fixed bottom-3 right-3 z-30 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-ms-line bg-ms-bg shadow-2xl" : `absolute inset-0 overflow-hidden bg-black ${penuh ? "" : "rounded-xl border border-ms-line"}`}
      >
        {mini && (
          <div key="kepala" className="flex items-center gap-1 px-3 py-2 text-ms-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-memori-sejarah-kecil.png" alt="" width={20} height={20} className="h-5 w-5 shrink-0 rounded-full" />
            <p className="min-w-0 flex-1 truncate px-1 text-xs font-semibold">{judul}</p>
            <button type="button" onClick={kembali} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/10" title="Kembali ke video">
              <svg {...g} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
            </button>
            <button type="button" onClick={perkecil} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/10" title="Perkecil (sembunyikan mini player, video tetap berjalan)">
              <svg {...g} className="h-4 w-4"><path d="M5 19h14" /></svg>
            </button>
            <button type="button" onClick={tutupMini} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/10" title="Tutup dan jeda video">
              <svg {...g} className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        )}

        <div key="video" className={`relative bg-black ${mini ? "aspect-video w-full" : "h-full w-full"}`}>
          <iframe
            ref={bingkai}
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&controls=0&fs=0&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&playsinline=1`}
            title={judul}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={langganan}
          />
          {/* lapisan klik: klik = putar/jeda, klik dua kali = layar penuh */}
          <button type="button" aria-label={main ? "Jeda" : "Putar"} onClick={jeda} onDoubleClick={mini ? undefined : layarPenuh} className="absolute inset-0 z-10 cursor-pointer" />

          {!mini && (
            <div className={`absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-10 text-white transition-opacity duration-200 ${kontrolTampil ? "opacity-100" : "pointer-events-none opacity-0"}`}>
              {/* bilah geser */}
              <div className="relative mb-1 h-5">
                <div className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-white/25"><div className="h-full rounded-full bg-white/40" style={{ width: `${muat}%` }} /></div>
                <input
                  type="range" min={0} max={dur || 1} step={0.1} value={Math.min(pos, dur || 1)}
                  onChange={(e) => cari(Number(e.target.value))}
                  aria-label="Posisi video"
                  className="absolute inset-0 h-5 w-full cursor-pointer appearance-none bg-transparent accent-[#d9a441] [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:w-3 [&::-webkit-slider-runnable-track]:h-1 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#d9a441]"
                  style={{ background: `linear-gradient(to right, #d9a441 ${dur ? (pos / dur) * 100 : 0}%, transparent 0)`, backgroundSize: "100% 4px", backgroundRepeat: "no-repeat", backgroundPosition: "center" }}
                />
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1">
                <button type="button" onClick={jeda} className={tombolKtl} title={main ? "Jeda" : "Putar"}>
                  {main ? <svg {...g} className="h-5 w-5" fill="currentColor"><path d="M7 5h3v14H7zM14 5h3v14h-3z" /></svg> : <svg {...g} className="h-5 w-5" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>}
                </button>
                {berikut && (
                  <Link href={`/video/${berikut.slug}`} className={tombolKtl} title={`Video berikutnya: ${berikut.title}`}>
                    <svg {...g} className="h-5 w-5" fill="currentColor"><path d="M6 5l9 7-9 7zM17 5h2v14h-2z" /></svg>
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
                    <svg {...g} className="h-5 w-5"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 11h3M7 15h5M14 11h3M15 15h2" /></svg>
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
                    <svg {...g} className="h-5 w-5"><rect x="3" y="5" width="18" height="14" rx="2" /><rect x="12" y="11" width="7" height="5" rx="1" fill="currentColor" /></svg>
                  </button>
                  <button type="button" onClick={() => setTeater((b) => !b)} className={`${tombolKtl} hidden lg:grid ${teater ? "bg-white/20" : ""}`} title={teater ? "Mode default" : "Mode teater"} aria-pressed={teater}>
                    <svg {...g} className="h-5 w-5"><rect x="3" y="7" width="18" height="10" rx="1.5" /></svg>
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

          {!mini && lainnya && (
            <div className="absolute inset-0 z-30 flex flex-col bg-black/90 p-3 text-white sm:p-5">
              <div className="mb-3 flex items-center gap-2">
                <h2 className="font-serif text-base font-bold sm:text-lg">Video Memori Sejarah</h2>
                <button type="button" onClick={() => setLainnya(false)} className="ml-auto grid h-9 w-9 place-items-center rounded-full hover:bg-white/15" title="Tutup">
                  <svg {...g} className="h-5 w-5"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-3 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
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
    </div>
  );
}
