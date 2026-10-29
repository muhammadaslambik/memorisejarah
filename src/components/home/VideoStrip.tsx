// PAKET-2B: baris 5 kolom yang bisa digeser kanan-kiri, dengan tombol panah
"use client";
import Link from "next/link";
import { useRef } from "react";

type V = { slug: string; title: string; youtubeId: string };

export function VideoStrip({ items }: { items: V[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const geser = (arah: number) => {
    const el = ref.current;
    if (el) el.scrollBy({ left: arah * el.clientWidth, behavior: "smooth" });
  };
  const bulat = "absolute top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ms-line bg-ms-bg/90 text-2xl leading-none text-ms-cream transition hover:border-ms-gold hover:text-ms-gold";
  return (
    <div className="relative">
      <div
        ref={ref}
        className="flex snap-x gap-4 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((v) => (
          <Link
            key={v.slug} href={`/video/${v.slug}`}
            className="group min-w-0 shrink-0 basis-[70%] snap-start overflow-hidden rounded-xl border border-ms-line bg-ms-surface transition hover:border-ms-gold/50 sm:basis-[calc((100%-1rem)/2)] md:basis-[calc((100%-2rem)/3)] lg:basis-[calc((100%-4rem)/5)]"
          >
            <div className="relative aspect-video overflow-hidden bg-ms-bg">
              <img src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 flex items-center justify-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-ms-bg/80 text-sm text-ms-gold">&#9654;</span>
              </span>
            </div>
            <h3 className="line-clamp-3 p-3 font-serif text-sm font-bold leading-snug group-hover:text-ms-gold">{v.title}</h3>
          </Link>
        ))}
      </div>
      <button type="button" aria-label="Geser ke kiri" onClick={() => geser(-1)} className={`${bulat} -left-3`}>&lsaquo;</button>
      <button type="button" aria-label="Geser ke kanan" onClick={() => geser(1)} className={`${bulat} -right-3`}>&rsaquo;</button>
    </div>
  );
}