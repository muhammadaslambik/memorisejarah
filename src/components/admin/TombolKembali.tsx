// PAKET-14A: tombol kembali ke daftar artikel berupa ikon.
// Bila ada ruang di samping kolom penulisan, tombol diletakkan DI LUAR kolom, tepat di bawah tombol hamburger,
// dan menempel saat halaman digulir. Bila layar sempit (tidak ada ruang), tombol tetap di kiri bilah alat editor.
// Tulisan "Kembali ke daftar artikel" muncul saat kursor diarahkan atau tombol difokuskan (keyboard).
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Posisi = { kiri: number; atas: number } | null;
const LEBAR = 32; // sama dengan h-8 w-8

export function TombolKembali({ label = "Kembali ke daftar artikel" }: { label?: string }) {
  const router = useRouter();
  const akar = useRef<HTMLSpanElement>(null);
  const [luar, setLuar] = useState<Posisi>(null);

  useEffect(() => {
    const hitung = () => {
      const form = akar.current?.closest("form");
      if (!form) { setLuar(null); return; }
      const ham = document.querySelector<HTMLElement>('[data-adm-ham]')?.getBoundingClientRect();
      const tampak = !!ham && ham.width > 0; // tombol hamburger hanya ada di layar sempit
      const sisi = document.querySelector<HTMLElement>(".a-side")?.getBoundingClientRect();
      const kiri = tampak ? ham!.left : (sisi && sisi.right > 0 ? sisi.right : 0) + 32;
      const atas = Math.max(tampak ? ham!.bottom : 0, 64) + 8; // di bawah bilah atas CMS (tinggi 64 px)
      const gaya = getComputedStyle(form);
      const isiKiri = form.getBoundingClientRect().left + (parseFloat(gaya.paddingLeft) || 0); // tepi isi formulir
      const cukup = isiKiri - (kiri + LEBAR) >= 8;
      setLuar((lama) => {
        if (!cukup) return null;
        return lama && Math.abs(lama.kiri - kiri) < 0.5 && Math.abs(lama.atas - atas) < 0.5 ? lama : { kiri, atas };
      });
    };
    hitung();
    window.addEventListener("resize", hitung);
    const ro = new ResizeObserver(hitung);
    ro.observe(document.body);
    return () => { window.removeEventListener("resize", hitung); ro.disconnect(); };
  }, []);

  const kembali = () => {
    let url = "/admin/artikel";
    try {
      const s = JSON.parse(sessionStorage.getItem("adm-daftar") ?? "null") as { url: string; y: number } | null;
      if (s?.url?.startsWith("/admin/artikel")) {
        url = s.url;
        sessionStorage.setItem("adm-daftar", JSON.stringify({ ...s, pulihkan: true }));
      }
    } catch { /* gunakan alamat bawaan */ }
    router.push(url);
  };

  return (
    <span
      ref={akar}
      className="group relative inline-flex items-center"
      style={luar ? { position: "fixed", left: luar.kiri, top: luar.atas, zIndex: 25 } : undefined}
    >
      <button
        type="button"
        onClick={kembali}
        aria-label={label}
        className={`grid h-8 w-8 place-items-center rounded-md transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2 ${luar ? "border bg-cream-dark shadow-md" : ""}`}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M6 8l-4 4 4 4" />
          <path d="M10 6h11M10 12h11M10 18h11" />
        </svg>
      </button>
      {!luar && <span className="mx-1 h-5 w-px bg-black/15" aria-hidden="true" />}
      <span
        role="tooltip"
        className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-md bg-black/85 px-2.5 py-1 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${luar ? "left-full top-1/2 ml-2 -translate-y-1/2" : "left-0 top-full mt-1.5"}`}
      >
        {label}
      </span>
    </span>
  );
}
