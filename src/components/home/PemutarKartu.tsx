// PAKET-31: pemutar video YouTube di dalam kartu Informasi Terbaru. Tampilannya mengikuti mini player (kontrol di dalam video, aksen kuning emas),
// bukan pemutar bawaan YouTube. Tombol sebelumnya/berikutnya berpindah antarkartu video dalam satu daftar (GrupPemutarInfo); hanya satu kartu yang memutar.
// Memakai API iframe YouTube lewat postMessage seperti PemutarGlobal. Klik layar = putar/jeda.
"use client";
import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { Bilah, usePemutar, usePemutarAktif, waktu } from "@/components/video/PemutarGlobal";
import { usePerangkatSentuh } from "@/lib/sentuh";

const EMAS = "#d9a441";
const KUNCI_AUTO = "ms-autoputar"; // pilihan yang sama dengan pemutar di halaman video
const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" } as const;
type Info = { playerState?: number; currentTime?: number; duration?: number; muted?: boolean; videoLoadedFraction?: number };
type Pesan = { event?: string; info?: unknown };

type Grup = {
  aktif: string | null;
  setAktif: (k: string | null) => void;
  daftar: (k: string, el: HTMLElement) => () => void;
  sebelah: (k: string, arah: -1 | 1) => string | null;
};
const CtxGrup = createContext<Grup | null>(null);

// Pembungkus daftar kartu: mengingat kartu video mana yang sedang diputar dan urutan kartunya di layar.
export function GrupPemutarInfo({ children }: { children: ReactNode }) {
  const [aktif, setAktif] = useState<string | null>(null);
  const peta = useRef(new Map<string, HTMLElement>());
  const daftar = useCallback((k: string, el: HTMLElement) => {
    peta.current.set(k, el);
    return () => { if (peta.current.get(k) === el) peta.current.delete(k); };
  }, []);
  const sebelah = useCallback((k: string, arah: -1 | 1) => {
    const urut = [...peta.current.entries()].sort((a, b) => (a[1].compareDocumentPosition(b[1]) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1)).map((x) => x[0]);
    const i = urut.indexOf(k);
    return i < 0 ? null : (urut[i + arah] ?? null);
  }, []);
  const nilai = useMemo(() => ({ aktif, setAktif, daftar, sebelah }), [aktif, daftar, sebelah]);
  return <CtxGrup.Provider value={nilai}>{children}</CtxGrup.Provider>;
}

const IkonJeda = ({ main, c = "h-5 w-5" }: { main: boolean; c?: string }) => main
  ? <svg {...g} className={c} fill="currentColor" stroke="none"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" /></svg>
  : <svg {...g} className={c} fill="currentColor" stroke="none"><path d="M8 5v14l11-7z" /></svg>;

const tombolKecil = "grid h-7 w-7 shrink-0 place-items-center rounded-full text-white hover:bg-white/20";
const tombolTengah = "grid h-9 w-9 place-items-center rounded-full bg-black/55 text-white hover:bg-black/75 disabled:opacity-40";

function Putar({ ytId, judul, poster, adaSebelum, adaBerikut, onSebelum, onBerikut, onTutup }: {
  ytId: string; judul: string; poster: string; adaSebelum: boolean; adaBerikut: boolean; onSebelum: () => void; onBerikut: () => void; onTutup: () => void;
}) {
  const bingkai = useRef<HTMLIFrameElement>(null);
  const kotak = useRef<HTMLDivElement>(null);
  const timerKtl = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sudahDijawab = useRef(false); // apakah YouTube sudah mengirim status pemutar
  const [info, setInfo] = useState<Info>({});
  const [ktl, setKtl] = useState(false);
  const [pernahMain, setPernahMain] = useState(false);
  const [auto, setAuto] = useState(true);
  const sentuh = usePerangkatSentuh();

  // status putar/jeda: bila YouTube belum mengirim status resmi, diduga dari pergerakan waktu video (lihat PemutarGlobal)
  const ultimaWaktu = useRef(-1);
  const terakhirMaju = useRef(0);
  const dugaMain = () => (info.playerState !== undefined ? info.playerState === 1 || info.playerState === 3 : Date.now() - terakhirMaju.current < 1500);
  const main = dugaMain();
  const [, tikStatus] = useState(0);
  useEffect(() => { if (info.playerState !== undefined) return; const i = setInterval(() => tikStatus((n) => n + 1), 500); return () => clearInterval(i); }, [info.playerState]);
  const selesai = info.playerState === 0;
  // Ponsel: ketukan pertama harus jatuh langsung pada pemutar YouTube agar peramban mau memutar; kontrol kita tembus ketuk sampai video pernah berjalan.
  const tembus = sentuh && !pernahMain;
  const jedaTampil = info.playerState === 2 && !tembus;
  const tampil = (ktl || !main) && !tembus;
  useEffect(() => { if (info.playerState === 1 || (info.playerState === undefined && main)) setPernahMain(true); }, [info.playerState, main]);

  const src = useMemo(() => {
    const asal = typeof window !== "undefined" ? `&origin=${encodeURIComponent(window.location.origin)}` : "";
    return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&controls=0&fs=0&rel=0&modestbranding=1&iv_load_policy=3&enablejsapi=1&playsinline=1${asal}`;
  }, [ytId]);
  const perintah = useCallback((func: string, args: unknown[] = []) => {
    bingkai.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func, args }), "*");
  }, []);
  useEffect(() => {
    const saat = (e: MessageEvent) => {
      if (e.source !== bingkai.current?.contentWindow) return;
      let d: Pesan | null = null;
      try { d = typeof e.data === "string" ? (JSON.parse(e.data) as Pesan) : (e.data as Pesan); } catch { return; }
      if (!d) return;
      if (d.event === "onStateChange" && typeof d.info === "number") { sudahDijawab.current = true; setInfo((p) => ({ ...p, playerState: d!.info as number })); }
      else if ((d.event === "infoDelivery" || d.event === "initialDelivery") && d.info && typeof d.info === "object") {
        const i = d.info as Info;
        if (typeof i.currentTime === "number") { if (Math.abs(i.currentTime - ultimaWaktu.current) > 0.01) terakhirMaju.current = Date.now(); ultimaWaktu.current = i.currentTime; }
        if (typeof i.playerState === "number") sudahDijawab.current = true;
        setInfo((p) => ({ ...p, ...i }));
      }
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
  // sapaan ringan tiap 2 dtk menyegarkan status resmi dan menyembuhkan status yang meleset
  useEffect(() => {
    const id = setInterval(() => { bingkai.current?.contentWindow?.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*"); }, 2000);
    return () => clearInterval(id);
  }, [src]);
  // sapaan diulang sampai YouTube menjawab (di peramban yang lebih lambat, sapaan 3 kali di 3,5 dtk pertama bisa terlewat)
  useEffect(() => {
    sudahDijawab.current = false;
    let n = 0;
    const id = setInterval(() => { if (sudahDijawab.current || ++n > 115) { clearInterval(id); return; } langganan(); }, 350);
    return () => clearInterval(id);
  }, [langganan, src]);
  useEffect(() => { try { setAuto(localStorage.getItem(KUNCI_AUTO) !== "0"); } catch { /* abaikan */ } }, []);
  useEffect(() => () => { if (timerKtl.current) clearTimeout(timerKtl.current); }, []);

  // video selesai: putar otomatis ke kartu video berikutnya bila diizinkan
  useEffect(() => { if (selesai && auto && adaBerikut) onBerikut(); }, [selesai, auto, adaBerikut, onBerikut]);

  const tampilKtl = useCallback(() => {
    setKtl(true);
    if (timerKtl.current) clearTimeout(timerKtl.current);
    timerKtl.current = setTimeout(() => setKtl(false), sentuh ? 5000 : 3000);
  }, [sentuh]);
  // status langsung dibalik tanpa menunggu balasan YouTube, jadi ketukan beruntun tetap bergantian putar/jeda dengan benar
  const jeda = () => { const sedangMain = dugaMain(); perintah(sedangMain ? "pauseVideo" : "playVideo"); setInfo((p) => ({ ...p, playerState: sedangMain ? 2 : 1 })); };
  const cari = (d: number) => { perintah("seekTo", [d, true]); setInfo((p) => ({ ...p, currentTime: d })); };
  const bisu = () => { const m = !!info.muted; perintah(m ? "unMute" : "mute"); setInfo((p) => ({ ...p, muted: !m })); };
  const ubahAuto = () => { const b = !auto; setAuto(b); try { localStorage.setItem(KUNCI_AUTO, b ? "1" : "0"); } catch { /* abaikan */ } };
  const layarPenuh = () => { if (document.fullscreenElement) void document.exitFullscreen(); else void kotak.current?.requestFullscreen?.().catch(() => undefined); };
  const klikSebelum = () => { if ((info.currentTime ?? 0) > 3 || !adaSebelum) cari(0); else onSebelum(); };

  const dur = info.duration ?? 0;
  const pos = info.currentTime ?? 0;
  const muat = Math.min(100, Math.max(0, (info.videoLoadedFraction ?? 0) * 100));
  const lapis = tampil ? "pointer-events-auto" : "";

  return (
    <div ref={kotak} className="relative aspect-video w-full overflow-hidden bg-black"
      onPointerMove={(e) => { if (e.pointerType !== "touch") tampilKtl(); }}
      onPointerLeave={(e) => { if (e.pointerType === "mouse" && main) setKtl(false); }}>
      {/* bingkai dibuat lebih tinggi dan digeser ke atas agar judul dan logo YouTube tidak terlihat */}
      <iframe ref={bingkai} src={src} title={judul} onLoad={langganan}
        className={`absolute left-0 w-full ${tembus ? "" : "pointer-events-none"}`}
        style={{ top: "calc(-1 * min(90px, 40%))", height: "calc(100% + 2 * min(90px, 40%))" }}
        allow="autoplay; encrypted-media; picture-in-picture; fullscreen" referrerPolicy="strict-origin-when-cross-origin" />
      {(selesai || jedaTampil) && (
        <div className="pointer-events-none absolute inset-0 z-[5] bg-black">
          {poster && /* eslint-disable-next-line @next/next/no-img-element */ <img src={poster} alt="" referrerPolicy="no-referrer" className={`h-full w-full object-cover ${selesai ? "opacity-50" : "opacity-90"}`} />}
        </div>
      )}
      {/* klik atau ketuk layar = putar/jeda (PAKET-34: juga di ponsel) */}
      <button type="button" aria-label={main ? "Jeda" : "Putar"}
        onClick={() => { jeda(); tampilKtl(); }}
        className={`absolute inset-0 z-10 cursor-pointer ${tembus ? "pointer-events-none" : ""}`} />
      <div className={`pointer-events-none absolute inset-0 z-20 flex flex-col justify-between text-white transition-opacity duration-200 ${tampil ? "opacity-100" : "opacity-0"}`}>
        <div className={`flex items-center gap-1 bg-gradient-to-b from-black/80 to-transparent px-2 pb-4 pt-1.5 ${lapis}`}>
          <span className="min-w-0 flex-1 truncate px-1 text-xs font-semibold">{judul}</span>
          <button type="button" onClick={onTutup} className={tombolKecil} title="Tutup pemutar"><svg {...g} className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>
        <div className={`flex items-center justify-center gap-2 ${lapis}`}>
          <button type="button" onClick={klikSebelum} className={tombolTengah} title={(info.currentTime ?? 0) > 3 || !adaSebelum ? "Ulangi dari awal" : "Video sebelumnya"}>
            <svg {...g} className="h-4 w-4" fill="currentColor" stroke="none"><path d="M18 5l-9 7 9 7zM5 5h2v14H5z" /></svg>
          </button>
          <button type="button" onClick={jeda} className="grid h-11 w-11 place-items-center rounded-full bg-black/55 text-white hover:bg-black/75" title={main ? "Jeda" : "Putar"}><IkonJeda main={main} c="h-5 w-5" /></button>
          <button type="button" disabled={!adaBerikut} onClick={onBerikut} className={tombolTengah} title={adaBerikut ? "Video berikutnya" : "Tidak ada video berikutnya"}>
            <svg {...g} className="h-4 w-4" fill="currentColor" stroke="none"><path d="M6 5l9 7-9 7zM17 5h2v14h-2z" /></svg>
          </button>
        </div>
        <div className={`bg-gradient-to-t from-black/85 to-transparent px-2 pb-1 pt-3 ${lapis}`}>
          <Bilah pos={pos} dur={dur} muat={muat} onCari={cari} />
          <div className="-mt-1 flex items-center gap-0.5">
            <span className="mr-auto text-[11px] tabular-nums">{waktu(pos)} / {waktu(dur)}</span>
            <button type="button" onClick={ubahAuto} className={`${tombolKecil} w-auto px-1`} title={auto ? "Putar otomatis: aktif" : "Putar otomatis: mati"} aria-pressed={auto}>
              <span className="relative inline-block h-3.5 w-7 rounded-full transition" style={{ background: auto ? EMAS : "rgba(255,255,255,.35)" }}><span className={`absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all ${auto ? "left-[1.1rem]" : "left-0.5"}`} /></span>
            </button>
            <button type="button" onClick={bisu} className={tombolKecil} title={info.muted ? "Suarakan" : "Bisukan"}>
              {info.muted
                ? <svg {...g} className="h-4 w-4"><path d="M11 5L6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6" /></svg>
                : <svg {...g} className="h-4 w-4"><path d="M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 010 7M18 6a8.5 8.5 0 010 12" /></svg>}
            </button>
            <button type="button" onClick={layarPenuh} className={tombolKecil} title="Layar penuh"><svg {...g} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg></button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PemutarKartu({ ytId, poster, judul, label }: { ytId: string; poster: string; judul: string; label: string }) {
  const grup = useContext(CtxGrup);
  const global = usePemutar();
  const globalAktif = usePemutarAktif();
  const kunci = useId();
  const [lokal, setLokal] = useState(false);
  const akar = useRef<HTMLDivElement>(null);
  const aktif = grup ? grup.aktif === kunci : lokal;
  const daftar = grup?.daftar;
  useEffect(() => (daftar && akar.current ? daftar(kunci, akar.current) : undefined), [daftar, kunci]);
  // kartu lain di daftar yang sama, dibaca saat tampil (bukan saat tombol ditekan) agar tombol bisa dinonaktifkan
  const sebelum = grup && aktif ? grup.sebelah(kunci, -1) : null;
  const berikut = grup && aktif ? grup.sebelah(kunci, 1) : null;

  const mulai = useCallback(() => {
    if (globalAktif?.aktifId) global?.tutup(); // mini player di pojok ditutup agar tidak ada dua video bersuara bersamaan
    if (grup) grup.setAktif(kunci); else setLokal(true);
  }, [grup, kunci, global, globalAktif?.aktifId]);
  const tutup = useCallback(() => { if (grup) grup.setAktif(null); else setLokal(false); }, [grup]);
  useEffect(() => { if (aktif) akar.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" }); }, [aktif]);
  const pindah = (k: string | null) => { if (k && grup) grup.setAktif(k); };

  return (
    <div ref={akar}>
      {aktif ? (
        <Putar ytId={ytId} judul={judul} poster={poster} adaSebelum={!!sebelum} adaBerikut={!!berikut} onSebelum={() => pindah(sebelum)} onBerikut={() => pindah(berikut)} onTutup={tutup} />
      ) : (
        <button type="button" onClick={mulai} aria-label={`Putar: ${judul}`} className="group/m relative block aspect-video w-full overflow-hidden bg-gradient-to-br from-red-900/70 to-ms-surface text-left">
          {poster && /* eslint-disable-next-line @next/next/no-img-element */ <img src={poster} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />}
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-14 w-14 place-items-center rounded-full bg-black/60 text-white transition group-hover/m:scale-110 group-hover/m:bg-ms-gold group-hover/m:text-ms-bg">
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6"><path d="M8 5v14l11-7z" /></svg>
            </span>
          </span>
          <span className="absolute bottom-2 left-2 rounded bg-black/65 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">{label}</span>
        </button>
      )}
    </div>
  );
}
