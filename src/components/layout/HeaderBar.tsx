// PAKET-9B: area tengah header + ikon cari dan ikon masuk di pojok kanan.
// Ikon cari membuka kolom pencarian lebar yang menggantikan menu; Esc atau klik di luar mengembalikannya.
"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AkunHeader } from "./AkunHeader";
import { TombolTemaSitus } from "./TombolTemaSitus";
import { TombolBahasa } from "./TombolBahasa";

const tombolIkon =
  "grid h-9 w-9 shrink-0 place-items-center sm:h-10 sm:w-10 rounded-full text-ms-cream/80 transition hover:bg-white/5 hover:text-ms-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ms-gold";
const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;

export function HeaderBar({ children }: { children: React.ReactNode }) {
  const [buka, setBuka] = useState(false);
  const router = useRouter();
  const path = usePathname();
  const kotak = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);

  // Pindah halaman: tutup pencarian
  useEffect(() => { setBuka(false); }, [path]);

  useEffect(() => {
    if (!buka) return;
    input.current?.focus();
    const tutupEsc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    const tutupLuar = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (kotak.current?.contains(t) || t?.closest("[data-tombol-cari]")) return;
      setBuka(false);
    };
    document.addEventListener("keydown", tutupEsc);
    document.addEventListener("mousedown", tutupLuar);
    return () => {
      document.removeEventListener("keydown", tutupEsc);
      document.removeEventListener("mousedown", tutupLuar);
    };
  }, [buka]);

  const kirim = (e: React.FormEvent) => {
    e.preventDefault();
    const q = input.current?.value.trim() ?? "";
    if (q) router.push(`/cari?q=${encodeURIComponent(q)}`);
    setBuka(false);
  };

  return (
    <>
      <div className={buka ? "hidden" : "contents"}>{children}</div>
      {buka && (
        <form
          ref={kotak}
          onSubmit={kirim}
          role="search"
          className="flex min-w-0 items-center gap-3 rounded-full border border-ms-gold/60 bg-ms-cream px-4 py-2 shadow-lg max-md:absolute max-md:inset-x-2 max-md:top-1/2 max-md:z-20 max-md:-translate-y-1/2 md:flex-1 md:px-5 md:py-2.5"
        >
          <svg {...svg} className="h-5 w-5 shrink-0 text-ms-bg/60" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input
            ref={input}
            type="search"
            name="q"
            autoComplete="off"
            placeholder="Cari artikel, tokoh, peristiwa..."
            aria-label="Cari"
            className="min-w-0 flex-1 bg-transparent text-base text-ms-bg outline-none placeholder:text-ms-bg/50"
          />
          <button type="button" onClick={() => setBuka(false)} aria-label="Tutup pencarian" className="shrink-0 text-ms-bg/60 hover:text-ms-bg">
            <svg {...svg} className="h-5 w-5" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </form>
      )}
      <div className={`${buka ? "" : "ml-auto"} flex shrink-0 items-center gap-0 sm:gap-1`}>
        <button data-tombol-cari type="button" aria-label="Cari" aria-expanded={buka} onClick={() => setBuka(!buka)} className={tombolIkon}>
          <svg {...svg} className="h-5 w-5" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        </button>
        <TombolTemaSitus className={tombolIkon} />
        <TombolBahasa className={tombolIkon} />
        <AkunHeader className={tombolIkon} />
      </div>
    </>
  );
}