// PAKET-20: tombol berupa ikon yang membuka menu pilihan (dipakai bilah daftar Video/Gambar dan bilah alat editor).
// Menu tertutup bila klik di luar, menekan Esc, atau memilih sebuah butir.
"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type Opsi = { label: string; ikon?: ReactNode; aktif?: boolean; n?: number; nonaktif?: boolean; klik: () => void };

const hover = "hover:bg-[color-mix(in_srgb,currentColor_10%,transparent)]";

export function MenuIkon({ judul, ikon, label, opsi, kanan, tanpaFokus, aktif }: {
  judul: string; ikon: ReactNode; label?: string; opsi: Opsi[]; kanan?: boolean; tanpaFokus?: boolean; aktif?: boolean;
}) {
  const [buka, setBuka] = useState(false);
  const akar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!buka) return;
    const luar = (e: PointerEvent) => { if (!akar.current?.contains(e.target as Node)) setBuka(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    document.addEventListener("pointerdown", luar, true);
    document.addEventListener("mousedown", luar as unknown as EventListener, true);
    document.addEventListener("touchstart", luar as unknown as EventListener, true);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("pointerdown", luar, true);
      document.removeEventListener("mousedown", luar as unknown as EventListener, true);
      document.removeEventListener("touchstart", luar as unknown as EventListener, true);
      document.removeEventListener("keydown", esc);
    };
  }, [buka]);
  return (
    <div ref={akar} className="relative shrink-0">
      <button
        type="button"
        title={judul}
        aria-label={judul}
        aria-haspopup="menu"
        aria-expanded={buka}
        onMouseDown={tanpaFokus ? (e) => e.preventDefault() : undefined}
        onClick={() => setBuka((b) => !b)}
        className={`inline-flex h-9 items-center gap-0.5 rounded-lg px-1.5 text-sm transition sm:gap-1 sm:px-2 ${hover} ${buka || aktif ? "bg-[color-mix(in_srgb,currentColor_12%,transparent)]" : ""}`}
      >
        {ikon}
        {label && <span className="hidden max-w-[9rem] truncate sm:inline">{label}</span>}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 opacity-60"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {buka && (
        <div
          role="menu"
          className={`absolute top-full z-40 mt-1 max-h-[min(22rem,70vh)] min-w-44 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-xl border p-1 shadow-xl ${kanan ? "right-0" : "left-0"}`}
          style={{ background: "var(--a-card, #fff)", color: "var(--a-text, inherit)", borderColor: "var(--a-line, rgba(0,0,0,.15))" }}
        >
          {opsi.map((o, i) => (
            <button
              key={i}
              type="button"
              role="menuitem"
              disabled={o.nonaktif}
              onMouseDown={tanpaFokus ? (e) => e.preventDefault() : undefined}
              onClick={() => { setBuka(false); o.klik(); }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm disabled:opacity-40 ${hover} ${o.aktif ? "font-semibold" : ""}`}
            >
              <span className="grid h-5 w-5 shrink-0 place-items-center">{o.ikon}</span>
              <span className="min-w-0 flex-1 truncate">{o.label}</span>
              {o.n !== undefined && <span className="text-xs opacity-60">{o.n}</span>}
              {o.aktif && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4 shrink-0"><path d="M5 12l5 5L20 7" /></svg>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
