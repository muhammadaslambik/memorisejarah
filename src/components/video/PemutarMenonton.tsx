// PAKET-15M: pemutar halaman tonton video. Langsung berputar. Saat video SEDANG diputar dan pemutarnya tergulir keluar layar,
// pemutar yang sama (iframe tidak dipindah/dimuat ulang) menjadi mini player di pojok kanan bawah. Bila video tidak sedang diputar, tidak ada mini player.
"use client";
import { useEffect, useRef, useState } from "react";

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
type Pesan = { event?: string; info?: unknown };

export function PemutarMenonton({ youtubeId, judul }: { youtubeId: string; judul: string }) {
  const tempat = useRef<HTMLDivElement>(null);
  const bingkai = useRef<HTMLIFrameElement>(null);
  const [main, setMain] = useState(false);
  const [terlihat, setTerlihat] = useState(true);
  const mini = main && !terlihat;

  // apakah tempat pemutar masih terlihat di layar
  useEffect(() => {
    const el = tempat.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setTerlihat(e.intersectionRatio >= 0.25), { threshold: [0, 0.25, 0.5, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // status pemutaran dari YouTube (1 = diputar, 3 = memuat)
  useEffect(() => {
    const saat = (e: MessageEvent) => {
      if (e.source !== bingkai.current?.contentWindow) return;
      let d: Pesan | null = null;
      try { d = typeof e.data === "string" ? (JSON.parse(e.data) as Pesan) : (e.data as Pesan); } catch { return; }
      if (!d) return;
      if (d.event === "onStateChange" && typeof d.info === "number") setMain(d.info === 1 || d.info === 3);
      else if (d.event === "infoDelivery" && d.info && typeof (d.info as { playerState?: unknown }).playerState === "number") {
        const s = (d.info as { playerState: number }).playerState;
        setMain(s === 1 || s === 3);
      }
    };
    window.addEventListener("message", saat);
    return () => window.removeEventListener("message", saat);
  }, []);

  const langganan = () => {
    const w = bingkai.current?.contentWindow;
    if (!w) return;
    w.postMessage(JSON.stringify({ event: "listening", id: 1, channel: "widget" }), "*");
    w.postMessage(JSON.stringify({ event: "command", func: "addEventListener", args: ["onStateChange"] }), "*");
  };
  useEffect(() => {
    const t = [600, 1800, 3500].map((ms) => setTimeout(langganan, ms));
    return () => t.forEach(clearTimeout);
  }, []);

  const tutupMini = () => {
    bingkai.current?.contentWindow?.postMessage(JSON.stringify({ event: "command", func: "pauseVideo", args: [] }), "*");
    setMain(false);
  };
  const kembali = () => tempat.current?.scrollIntoView({ behavior: "smooth", block: "center" });

  return (
    <div ref={tempat} className="relative aspect-video w-full">
      {mini && <div className="absolute inset-0 grid place-items-center rounded-xl border border-dashed border-ms-line bg-ms-surface px-4 text-center text-sm text-ms-cream/60">Video sedang diputar di pemutar mini</div>}
      <div className={mini ? "fixed bottom-3 right-3 z-50 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-ms-line bg-ms-bg shadow-2xl" : "absolute inset-0 overflow-hidden rounded-xl border border-ms-line bg-black"}>
        {mini && (
          <div key="kepala" className="flex items-center gap-2 px-3 py-2 text-ms-cream">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-memori-sejarah-kecil.png" alt="" width={20} height={20} className="h-5 w-5 shrink-0 rounded-full" />
            <p className="min-w-0 flex-1 truncate text-xs font-semibold">{judul}</p>
            <button type="button" onClick={kembali} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/10" title="Kembali ke video">
              <svg {...g} className="h-4 w-4"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" /></svg>
            </button>
            <button type="button" onClick={tutupMini} className="grid h-7 w-7 place-items-center rounded-full hover:bg-white/10" title="Tutup dan jeda video">
              <svg {...g} className="h-4 w-4"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
        )}
        <div key="video" className={mini ? "aspect-video w-full bg-black" : "h-full w-full"}>
          <iframe
            ref={bingkai}
            src={`https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&enablejsapi=1&playsinline=1`}
            title={judul}
            className="h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={langganan}
          />
        </div>
      </div>
    </div>
  );
}
