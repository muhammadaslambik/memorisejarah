// PAKET-19: satu baris yang bisa digeser kanan-kiri (tombol panah, gulir sentuh, dan trackpad)
"use client";
import { useRef } from "react";

export function JalurGeser({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const geser = (arah: number) => { const el = ref.current; if (el) el.scrollBy({ left: arah * el.clientWidth * 0.85, behavior: "smooth" }); };
  const bulat = "absolute top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-ms-line bg-ms-bg/90 text-2xl leading-none text-ms-cream transition hover:border-ms-gold hover:text-ms-gold md:flex";
  return (
    <div className="relative">
      <div ref={ref} className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{children}</div>
      <button type="button" aria-label="Geser ke kiri" onClick={() => geser(-1)} className={`${bulat} -left-3`}>&lsaquo;</button>
      <button type="button" aria-label="Geser ke kanan" onClick={() => geser(1)} className={`${bulat} -right-3`}>&rsaquo;</button>
    </div>
  );
}
