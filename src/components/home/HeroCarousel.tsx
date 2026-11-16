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
  const mulai = Math.min(Math.max(0, n - 5), Math.max(0, i - 2)); // paling banyak 5 titik terlihat, ukuran titik tetap kecil

  // Putaran tanpa ujung: setelah artikel terakhir ada salinan artikel pertama. Begitu salinan itu terlihat dan geseran berhenti,
  // posisi dipindahkan diam-diam ke artikel pertama yang asli, sehingga pengguna merasa terus bergeser dari awal lagi.
  const loop = n > 1;
  const item = loop ? [...slides, slides[0]] : slides;
  const settle = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ditekan = useRef(false);

  const lompat = useCallback((m: number) => {
    const el = jalur.current;
    if (!el) return;
    el.style.scrollSnapType = "none";
    el.style.scrollBehavior = "auto";
    el.scrollLeft = m * el.clientWidth;
    requestAnimationFrame(() => { el.style.scrollSnapType = ""; el.style.scrollBehavior = ""; });
  }, []);

  const ke = useCallback((k: number) => {
    const el = jalur.current;
    if (!el || n < 1) return;
    const w = el.clientWidth;
    if (k >= n) { el.scrollTo({ left: n * w, behavior: "smooth" }); return; } // ke salinan, lalu dipindah ke awal
    if (k < 0) {
      if (loop) { lompat(n); requestAnimationFrame(() => el.scrollTo({ left: (n - 1) * w, behavior: "smooth" })); }
      return;
    }
    el.scrollTo({ left: k * w, behavior: "smooth" });
  }, [n, loop, lompat]);

  // posisi aktif mengikuti geseran (untuk titik penanda)
  const saatGeser = () => {
    const el = jalur.current;
    if (!el || el.clientWidth === 0) return;
    const m = Math.round(el.scrollLeft / el.clientWidth);
    setI(m >= n ? 0 : Math.max(0, m));
    if (!loop) return;
    if (settle.current) clearTimeout(settle.current);
    const cek = () => {
      const e2 = jalur.current;
      if (!e2 || e2.clientWidth === 0) return;
      if (ditekan.current) { settle.current = setTimeout(cek, 150); return; } // jari masih menahan: tunggu
      if (Math.round(e2.scrollLeft / e2.clientWidth) >= n) lompat(0);
    };
    settle.current = setTimeout(cek, 160);
  };
  useEffect(() => () => { if (settle.current) clearTimeout(settle.current); }, []);

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
      className="relative overflow-hidden rounded-xl border border-ms-line bg-ms-surface"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        ref={jalur}
        onScroll={saatGeser}
        onTouchStart={() => { ditekan.current = true; sentuh(); }}
        onTouchEnd={() => { ditekan.current = false; }}
        onTouchCancel={() => { ditekan.current = false; }}
        onWheel={sentuh}
        onPointerDown={() => { ditekan.current = true; sentuh(); }}
        onPointerUp={() => { ditekan.current = false; }}
        onPointerCancel={() => { ditekan.current = false; }}
        className="flex h-[340px] snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] sm:h-[400px] lg:h-[440px] [&::-webkit-scrollbar]:hidden"
        style={{ WebkitOverflowScrolling: "touch" }}
        aria-roledescription="karusel"
      >
        {item.map((s, k) => (
          <Link
            key={`${k}-${s.slug}`}
            href={`/artikel/${s.slug}`}
            draggable={false}
            tabIndex={k >= n ? -1 : undefined}
            aria-hidden={k >= n ? true : undefined}
            aria-label={`${(k % n) + 1} dari ${n}: ${s.title}`}
            className="group relative h-full w-full shrink-0 snap-center"
          >
            {s.coverUrl && <img src={s.coverUrl} alt="" draggable={false} loading={k < 2 || k >= n ? "eager" : "lazy"} decoding="async" className="absolute inset-0 h-full w-full select-none object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-t from-ms-bg via-ms-bg/55 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 px-4 pb-10 sm:px-16 md:pb-12">
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
          <div className="absolute right-3 top-3 z-20 rounded-full border border-ms-line bg-ms-bg/80 px-2.5 py-1 text-[11px] font-semibold text-ms-cream/90 sm:right-5 sm:top-4" aria-hidden="true">{i + 1}/{n}</div>
          <button type="button" aria-label="Sebelumnya" onClick={() => { sentuh(); ke(i - 1); }} className={`${bulat} left-3 sm:left-5`}>&lsaquo;</button>
          <button type="button" aria-label="Berikutnya" onClick={() => { sentuh(); ke(i + 1); }} className={`${bulat} right-3 sm:right-5`}>&rsaquo;</button>
          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-3 sm:right-16">
            <button
              type="button" aria-label={jeda ? "Putar" : "Jeda"} onClick={() => setJeda(!jeda)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-ms-line bg-ms-bg/80 text-[11px] text-ms-cream hover:border-ms-gold hover:text-ms-gold"
            >
              {jeda ? "\u25B6" : "II"}
            </button>
            <div className="flex items-center gap-2 rounded-full border border-ms-line bg-ms-bg/80 px-3 py-2">
              {slides.slice(mulai, mulai + 5).map((s, j) => {
                const k = mulai + j;
                return (
                  <button
                    key={s.slug} type="button" aria-label={`Slide ${k + 1}`} onClick={() => { sentuh(); ke(k); }}
                    className={`h-1.5 rounded-full transition-all ${k === i ? "w-6 bg-ms-gold" : "w-1.5 bg-ms-cream/40"}`}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
