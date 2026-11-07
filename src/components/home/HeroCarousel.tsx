// PAKET-2A/15K: karusel utama beranda. Berupa jalur geser horizontal asli peramban: seret satu jari (ponsel) atau geser dua jari di
// trackpad (desktop). Gambar tiap artikel bersambung langsung dengan artikel sebelum/sesudahnya dan bergeser mengikuti jari tanpa jeda.
// Panah, titik, jeda, dan putar otomatis tetap ada.
"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type Slide = { slug: string; title: string; coverUrl: string | null; kategori: string; tanggal: string; penulis: string };

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const n = slides.length;
  const jalur = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const [jeda, setJeda] = useState(false);
  const [hover, setHover] = useState(false);
  const [disentuh, setDisentuh] = useState(false); // pengguna sedang menggeser: hentikan putar otomatis sementara
  const reda = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ke = useCallback((k: number) => {
    const el = jalur.current;
    if (!el) return;
    const t = ((k % n) + n) % n;
    el.scrollTo({ left: t * el.clientWidth, behavior: "smooth" });
  }, [n]);

  // posisi aktif mengikuti geseran (untuk titik penanda)
  const saatGeser = () => {
    const el = jalur.current;
    if (!el || el.clientWidth === 0) return;
    setI(Math.min(n - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))));
  };

  // setelah pengguna selesai berinteraksi, tunggu sebentar sebelum putar otomatis berlanjut
  const sentuh = () => {
    setDisentuh(true);
    if (reda.current) clearTimeout(reda.current);
    reda.current = setTimeout(() => setDisentuh(false), 8000);
  };
  useEffect(() => () => { if (reda.current) clearTimeout(reda.current); }, []);

  useEffect(() => {
    if (n < 2 || jeda || hover || disentuh) return;
    const t = setInterval(() => {
      const el = jalur.current;
      if (!el) return;
      const sekarang = Math.round(el.scrollLeft / Math.max(1, el.clientWidth));
      ke(sekarang + 1);
    }, 6000);
    return () => clearInterval(t);
  }, [n, jeda, hover, disentuh, ke]);

  // ukuran jendela berubah: tetap pada slide yang sama
  useEffect(() => {
    const ubah = () => { const el = jalur.current; if (el) el.scrollTo({ left: i * el.clientWidth }); };
    window.addEventListener("resize", ubah);
    return () => window.removeEventListener("resize", ubah);
  }, [i]);

  const bulat = "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ms-line bg-ms-bg/80 text-xl sm:text-2xl leading-none text-ms-cream transition hover:border-ms-gold hover:text-ms-gold max-sm:hidden";
  return (
    <div
      className="relative overflow-hidden rounded-3xl border border-ms-line bg-ms-surface"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        ref={jalur}
        onScroll={saatGeser}
        onTouchStart={sentuh}
        onWheel={sentuh}
        onPointerDown={sentuh}
        className="flex h-[340px] snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:h-[400px] lg:h-[440px] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
        aria-roledescription="karusel"
      >
        {slides.map((s, k) => (
          <Link
            key={s.slug}
            href={`/artikel/${s.slug}`}
            draggable={false}
            aria-label={`${k + 1} dari ${n}: ${s.title}`}
            className="group relative h-full w-full shrink-0 snap-center"
          >
            {s.coverUrl && <img src={s.coverUrl} alt="" draggable={false} className="absolute inset-0 h-full w-full select-none object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-ms-bg via-ms-bg/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-6 pb-10 sm:px-16 md:pb-12">
              <div className="flex flex-wrap items-center gap-3 text-xs text-ms-cream/80">
                {s.kategori && <span className="rounded-full bg-ms-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ms-bg">{s.kategori}</span>}
                <span>{[s.tanggal, s.penulis].filter(Boolean).join(" \u2022 ")}</span>
              </div>
              <h2 className="mt-3 max-w-3xl line-clamp-3 font-serif text-xl font-bold leading-tight sm:text-2xl md:text-4xl">{s.title}</h2>
            </div>
          </Link>
        ))}
      </div>
      {n > 1 && (
        <>
          <button type="button" aria-label="Sebelumnya" onClick={() => { sentuh(); ke(i - 1); }} className={`${bulat} left-3 sm:left-5`}>&lsaquo;</button>
          <button type="button" aria-label="Berikutnya" onClick={() => { sentuh(); ke(i + 1); }} className={`${bulat} right-3 sm:right-5`}>&rsaquo;</button>
          <div className="absolute bottom-4 right-6 z-20 flex items-center gap-3 sm:right-16">
            <button
              type="button" aria-label={jeda ? "Putar" : "Jeda"} onClick={() => setJeda(!jeda)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ms-line bg-ms-bg/80 text-[11px] text-ms-cream hover:border-ms-gold hover:text-ms-gold"
            >
              {jeda ? "\u25B6" : "II"}
            </button>
            <div className="flex items-center gap-2 rounded-full border border-ms-line bg-ms-bg/80 px-3 py-2">
              {slides.map((s, k) => (
                <button
                  key={s.slug} type="button" aria-label={`Slide ${k + 1}`} onClick={() => { sentuh(); ke(k); }}
                  className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-ms-gold" : "w-1.5 bg-ms-cream/40"}`}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
