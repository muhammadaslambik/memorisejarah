// PAKET-38: daftar "Video Lainnya" di samping pemutar (halaman tonton). Tinggi daftar DIKUNCI sama dengan kolom kiri (pemutar + judul + deskripsi).
// PAKET-39 (layar lebar): tombol "Tampilkan video lainnya" MENEMPEL di dasar layar (sticky) dan ikut turun saat halaman digulir, sampai sejajar dengan dasar kolom deskripsi, lalu berhenti.
//   Digulir ke atas, tombol ikut naik. Selama menggulir, video yang belum tampil muncul satu per satu begitu sudah utuh berada di atas tombol (tidak pernah ada video yang tertutup tombol).
//   Tombol memperluas daftar menjadi kotak yang bisa digulir atas-bawah di tinggi yang sama; "Tampilkan lebih sedikit" mengembalikannya.
// Layar sempit: daftar di bawah video; mode ringkas 5 video, mode luas berupa kotak yang bisa digulir.
"use client";
import Link from "next/link";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

export type ItemSamping = { slug: string; title: string; youtubeId: string; tanggal: string };

const RINGKAS_HP = 5;     // jumlah video mode ringkas di layar sempit
const MAKS_RENDER = 14;   // jumlah video yang digambar pada mode ringkas layar lebar (cukup untuk kolom yang tinggi)
const GAP_TOMBOL = 8;      // jarak antara isi daftar dan tombol yang menempel (px)
const PEEK_MIN = 16;      // PAKET-40: bila video berikutnya tidak muat utuh, ia tetap tampil sebagian (terpotong dengan pudar) asalkan setidaknya sekian px bagian atasnya terlihat

const Panah = ({ atas }: { atas: boolean }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d={atas ? "M6 15l6-6 6 6" : "M6 9l6 6 6-6"} /></svg>
);
const GULIR = "[scrollbar-color:rgba(217,164,65,.5)_transparent] [scrollbar-width:thin]";

export function VideoLainnyaSamping({ items }: { items: ItemSamping[] }) {
  const [siap, setSiap] = useState(false);
  const [lebar, setLebar] = useState(false);   // layar lebar (>= 1024px)
  const [luas, setLuas] = useState(false);     // mode diperluas (bisa digulir)
  const [muatTetap, setMuatTetap] = useState(0); // jumlah video yang muat utuh di kolom (layar lebar, mode ringkas)
  const daftar = useRef<HTMLUListElement>(null);
  const tombol = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const baca = () => setLebar(mq.matches);
    baca();
    setSiap(true);
    mq.addEventListener("change", baca);
    return () => mq.removeEventListener("change", baca);
  }, []);

  // layar lebar: tentukan video mana yang tampil. Mode ringkas: hanya video yang utuh di dalam kolom DAN utuh di atas tombol yang sedang menempel.
  useLayoutEffect(() => {
    if (!siap || !lebar) return;
    const ul = daftar.current;
    if (!ul) return;
    let rafId = 0;
    const terapkan = () => {
      rafId = 0;
      const u = ul.getBoundingClientRect();
      const t = tombol.current?.getBoundingClientRect();
      const batasKolom = u.bottom + 0.5;
      const batas = Math.min(batasKolom, !luas && t ? t.top - GAP_TOMBOL : Infinity); // garis di bawahnya isi daftar tidak boleh terlihat (dasar kolom atau puncak tombol yang menempel)
      let muat = 0;
      Array.from(ul.children).forEach((li, i) => {
        const el = li as HTMLElement;
        const r = el.getBoundingClientRect();
        if (r.bottom <= batasKolom) muat = i + 1;
        let tampak = true;
        let pudar = "";
        if (!luas && r.bottom > batas) {
          // tidak muat utuh: tampilkan bagian atasnya saja (pudar di garis potong) bila cukup terlihat, supaya tidak ada ruang kosong di atas tombol
          const lihat = batas - r.top;
          if (lihat >= PEEK_MIN) pudar = `linear-gradient(to bottom, #000 ${Math.max(0, lihat - Math.min(28, lihat * 0.6))}px, transparent ${lihat}px)`;
          else tampak = false;
        }
        el.dataset.tampak = tampak ? "1" : "0";
        el.style.setProperty("mask-image", pudar || "none");
        el.style.setProperty("-webkit-mask-image", pudar || "none");
      });
      if (!luas) setMuatTetap((m) => (m === muat ? m : muat));
    };
    const jadwal = () => { if (!rafId) rafId = requestAnimationFrame(terapkan); };
    terapkan();
    window.addEventListener("scroll", jadwal, { passive: true });
    window.addEventListener("resize", jadwal);
    const ro = new ResizeObserver(jadwal);
    ro.observe(ul);
    return () => {
      window.removeEventListener("scroll", jadwal);
      window.removeEventListener("resize", jadwal);
      ro.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [siap, lebar, luas, items.length, muatTetap]);

  const lg = siap && lebar;
  const kecil = siap && !lebar;
  let tampil = items;
  let mode: "lebih" | "kurang" | null = null;
  let sisa = 0;
  if (lg) {
    if (luas) mode = "kurang";
    else {
      tampil = items.slice(0, MAKS_RENDER);
      if (items.length > muatTetap) { mode = "lebih"; sisa = items.length - muatTetap; }
    }
  } else if (kecil && items.length > RINGKAS_HP) {
    if (luas) mode = "kurang";
    else { tampil = items.slice(0, RINGKAS_HP); mode = "lebih"; sisa = items.length - RINGKAS_HP; }
  }

  const kelasDaftar = !siap
    ? "max-lg:[&>li:nth-child(n+6)]:hidden lg:min-h-0 lg:flex-1 lg:overflow-clip"   // sebelum JavaScript siap
    : lg ? (luas ? `min-h-0 flex-1 overflow-y-auto pr-1 ${GULIR}` : "min-h-0 flex-1 overflow-clip")
    : luas ? `max-h-[32rem] overflow-y-auto pr-1 ${GULIR}` : "";

  return (
    <div className="flex flex-col lg:absolute lg:inset-0">
      <h2 className="shrink-0 font-serif text-lg font-bold">Video Lainnya</h2>
      {/* PENTING: tidak boleh ada overflow hidden/auto pada wadah di atas tombol, karena akan mematikan sifat menempel (sticky) */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col">
        <ul ref={daftar} className={`space-y-3 ${kelasDaftar}`} aria-label="Daftar video lainnya">
          {tampil.map((x) => (
            <li key={x.slug} className="transition-[opacity,visibility] duration-200 data-[tampak='0']:invisible data-[tampak='0']:opacity-0">
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
          <div ref={tombol} className="mt-3 shrink-0 lg:sticky lg:bottom-4 lg:z-10">
            <button
              type="button"
              onClick={() => setLuas((v) => !v)}
              aria-expanded={luas}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-full border border-ms-line bg-ms-bg px-4 text-xs font-semibold text-ms-cream/85 shadow-[0_0_0_6px_rgb(var(--ms-bg))] transition hover:border-ms-gold hover:text-ms-gold"
            >
              {mode === "lebih" ? <>Tampilkan video lainnya ({sisa}) <Panah atas={false} /></> : <>Tampilkan lebih sedikit <Panah atas /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
