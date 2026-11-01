// PAKET-9B: area tengah header + ikon cari dan ikon masuk di pojok kanan.
// Ikon cari membuka kolom pencarian lebar yang menggantikan menu; Esc atau klik di luar mengembalikannya.
"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

const tombolIkon =
  "grid h-10 w-10 shrink-0 place-items-center rounded-full text-ms-cream/80 transition hover:bg-white/5 hover:text-ms-gold focus-visible:outline focus-visible:outline-2 focus-visible:outline-ms-gold";
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
          className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-ms-gold/60 bg-ms-cream px-5 py-2.5 shadow-lg"
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
      <div className={`${buka ? "" : "ml-auto"} flex shrink-0 items-center gap-1`}>
        <button data-tombol-cari type="button" aria-label="Cari" aria-expanded={buka} onClick={() => setBuka(!buka)} className={tombolIkon}>
          <svg {...svg} className="h-5 w-5" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
        </button>
        <Link href="/admin" aria-label="Masuk" title="Masuk" className={tombolIkon}>
          <svg {...svg} className="h-5 w-5" aria-hidden="true"><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
        </Link>
      </div>
    </>
  );
}