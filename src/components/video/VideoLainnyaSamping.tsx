// PAKET-38: daftar "Video Lainnya" di samping pemutar (halaman tonton).
//  - Layar lebar: tinggi daftar DIKUNCI sama dengan kolom kiri (pemutar + judul + deskripsi), tidak lagi memanjang mengikuti jumlah video.
//    Mode ringkas menampilkan sebanyak mungkin video yang muat utuh; bila masih ada sisa, tombol "Tampilkan video lainnya" memperluasnya menjadi
//    daftar yang bisa digulir atas-bawah di tinggi yang sama, dan tombol "Tampilkan lebih sedikit" mengembalikannya ke mode ringkas.
//  - Layar sempit: daftar di bawah video; mode ringkas 5 video, mode luas berupa kotak yang bisa digulir.
"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type ItemSamping = { slug: string; title: string; youtubeId: string; tanggal: string };

const JARAK = 12;       // jarak antar-video (space-y-3)
const TOMBOL = 44;      // tinggi area tombol (mt-3 + tombol 32px)
const RINGKAS_HP = 5;   // jumlah video mode ringkas di layar sempit

const Panah = ({ atas }: { atas: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={atas ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} /></svg>
);

export function VideoLainnyaSamping({ items }: { items: ItemSamping[] }) {
  const [siap, setSiap] = useState(false);
  const [lebar, setLebar] = useState(false);   // layar lebar (>= 1024px)
  const [luas, setLuas] = useState(false);     // mode diperluas (bisa digulir)
  const [tinggi, setTinggi] = useState(0);     // tinggi area daftar+tombol (layar lebar)
  const [tinggiItem, setTinggiItem] = useState(99);
  const badan = useRef<HTMLDivElement>(null);
  const contoh = useRef<HTMLLIElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const baca = () => setLebar(mq.matches);
    baca();
    setSiap(true);
    mq.addEventListener("change", baca);
    return () => mq.removeEventListener("change", baca);
  }, []);

  // ukur area yang tersedia (mengikuti tinggi kolom kiri) dan tinggi satu video
  useLayoutEffect(() => {
    const el = badan.current;
    if (!el || !lebar) return;
    const ukur = () => {
      const t = el.clientHeight;
      if (t > 0) setTinggi(t); // 0 berarti disembunyikan (mode teater): pertahankan ukuran terakhir
      const h = contoh.current?.getBoundingClientRect().height;
      if (h && h > 0) setTinggiItem(h);
    };
    ukur();
    const ro = new ResizeObserver(ukur);
    ro.observe(el);
    return () => ro.disconnect();
  }, [lebar, luas, siap, items.length]);

  const muat = (ruang: number) => Math.max(1, Math.floor((ruang + JARAK) / (tinggiItem + JARAK)));
  let tampil = items;
  let mode: "lebih" | "kurang" | null = null;
  if (siap) {
    if (lebar && tinggi > 0) {
      if (items.length > muat(tinggi)) {
        if (luas) mode = "kurang";
        else { tampil = items.slice(0, muat(tinggi - TOMBOL)); mode = "lebih"; }
      }
    } else if (!lebar && items.length > RINGKAS_HP) {
      if (luas) mode = "kurang";
      else { tampil = items.slice(0, RINGKAS_HP); mode = "lebih"; }
    }
  }
  const sisa = items.length - tampil.length;
  const gulir = mode === "kurang";

  return (
    <div className="flex flex-col lg:absolute lg:inset-0">
      <h2 className="shrink-0 font-serif text-lg font-bold">Video Lainnya</h2>
      {/* sebelum JavaScript siap: layar lebar memotong daftar di tinggi kolom kiri, layar sempit hanya menampilkan beberapa video pertama */}
      <div ref={badan} className="mt-3 flex min-h-0 flex-1 flex-col lg:overflow-hidden">
        <ul
          className={`space-y-3 ${gulir ? "min-h-0 flex-1 overflow-y-auto pr-1 max-lg:max-h-[32rem] [scrollbar-color:rgba(217,164,65,.5)_transparent] [scrollbar-width:thin]" : ""} ${siap ? "" : "max-lg:[&>li:nth-child(n+6)]:hidden"}`}
          aria-label="Daftar video lainnya"
        >
          {tampil.map((x, i) => (
            <li key={x.slug} ref={i === 0 ? contoh : undefined}>
              <Link href={`/video/${x.slug}`} prefetch={false} className="group flex gap-3">
                <span className="relative block aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-ms-surface sm:w-44">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://i.ytimg.com/vi/${x.youtubeId}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                </span>
                <span className="min-w-0">
                  <span className="line-clamp-3 block text-sm font-semibold leading-snug group-hover:text-ms-gold">{x.title}</span>
                  <span className="mt-1 block text-xs text-ms-cream/60">{x.tanggal}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {mode && (
          <button
            type="button"
            onClick={() => setLuas((v) => !v)}
            aria-expanded={luas}
            className="mt-3 inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full border border-ms-line px-4 text-xs font-semibold text-ms-cream/85 transition hover:border-ms-gold hover:text-ms-gold"
          >
            {mode === "lebih" ? <>Tampilkan video lainnya ({sisa}) <Panah atas={false} /></> : <>Tampilkan lebih sedikit <Panah atas /></>}
          </button>
        )}
      </div>
    </div>
  );
}
