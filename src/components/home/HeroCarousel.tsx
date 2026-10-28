// PAKET-2A: karusel utama beranda (panah, titik, jeda, autoplay)
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export type Slide = { slug: string; title: string; coverUrl: string | null; kategori: string; tanggal: string; penulis: string };

export function HeroCarousel({ slides }: { slides: Slide[] }) {
  const n = slides.length;
  const [i, setI] = useState(0);
  const [jeda, setJeda] = useState(false);
  const [hover, setHover] = useState(false);
  const ke = (k: number) => setI(((k % n) + n) % n);

  useEffect(() => {
    if (n < 2 || jeda || hover) return;
    const t = setInterval(() => setI((x) => (x + 1) % n), 6000);
    return () => clearInterval(t);
  }, [n, jeda, hover]);

  const bulat = "absolute top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-ms-line bg-ms-bg/80 text-2xl leading-none text-ms-cream transition hover:border-ms-gold hover:text-ms-gold";
  return (
    <div
      className="relative h-[340px] overflow-hidden rounded-3xl border border-ms-line bg-ms-surface sm:h-[400px] lg:h-[440px]"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {slides.map((s, k) => (
        <Link
          key={s.slug}
          href={`/artikel/${s.slug}`}
          aria-hidden={k !== i}
          tabIndex={k === i ? 0 : -1}
          className={`group absolute inset-0 transition-opacity duration-700 ${k === i ? "z-10 opacity-100" : "pointer-events-none opacity-0"}`}
        >
          {s.coverUrl && <img src={s.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
          <div className="absolute inset-0 bg-gradient-to-t from-ms-bg via-ms-bg/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-6 pb-10 sm:px-16 md:pb-12">
            <div className="flex flex-wrap items-center gap-3 text-xs text-ms-cream/80">
              {s.kategori && <span className="rounded-full bg-ms-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ms-bg">{s.kategori}</span>}
              <span>{[s.tanggal, s.penulis].filter(Boolean).join(" \u2022 ")}</span>
            </div>
            <h2 className="mt-3 max-w-3xl line-clamp-3 font-serif text-2xl font-bold leading-tight md:text-4xl">{s.title}</h2>
          </div>
        </Link>
      ))}
      {n > 1 && (
        <>
          <button type="button" aria-label="Sebelumnya" onClick={() => ke(i - 1)} className={`${bulat} left-3 sm:left-5`}>&lsaquo;</button>
          <button type="button" aria-label="Berikutnya" onClick={() => ke(i + 1)} className={`${bulat} right-3 sm:right-5`}>&rsaquo;</button>
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
                  key={s.slug} type="button" aria-label={`Slide ${k + 1}`} onClick={() => ke(k)}
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