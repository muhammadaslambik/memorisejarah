// PAKET-14A: tombol menu mengambang di pojok kanan bawah CMS: pintasan ke daftar artikel (semua, terbit, menunggu, draft) dan pencarian.
// Menu menutup saat klik di luar, tombol Esc, atau setelah memilih.
"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const IKON = {
  baru: <svg {...g} className="h-4 w-4"><path d="M12 5v14M5 12h14" /></svg>,
  semua: <svg {...g} className="h-4 w-4"><path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" /></svg>,
  terbit: <svg {...g} className="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="M8 12.5l3 3 5-6" /></svg>,
  menunggu: <svg {...g} className="h-4 w-4"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>,
  draft: <svg {...g} className="h-4 w-4"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4" /></svg>,
  cari: <svg {...g} className="h-4 w-4"><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>,
};
const MENU = [
  { label: "Artikel baru", href: "/admin/artikel/baru", ikon: IKON.baru },
  { label: "Semua artikel", href: "/admin/artikel", ikon: IKON.semua },
  { label: "Artikel terbit", href: "/admin/artikel?s=published", ikon: IKON.terbit },
  { label: "Artikel menunggu", href: "/admin/artikel?s=pending", ikon: IKON.menunggu },
  { label: "Draft artikel", href: "/admin/artikel?s=draft", ikon: IKON.draft },
];

export function MenuArtikel() {
  const router = useRouter();
  const akar = useRef<HTMLDivElement>(null);
  const [buka, setBuka] = useState(false);
  const [cari, setCari] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!buka) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    const luar = (e: MouseEvent | TouchEvent) => { if (!akar.current?.contains(e.target as Node)) setBuka(false); };
    document.addEventListener("keydown", esc);
    document.addEventListener("mousedown", luar);
    document.addEventListener("touchstart", luar);
    return () => { document.removeEventListener("keydown", esc); document.removeEventListener("mousedown", luar); document.removeEventListener("touchstart", luar); };
  }, [buka]);

  const tutup = () => { setBuka(false); setCari(false); };
  const kirimCari = (e: React.FormEvent) => {
    e.preventDefault();
    const kata = q.trim();
    tutup();
    router.push(kata ? `/admin/artikel?q=${encodeURIComponent(kata)}` : "/admin/artikel");
  };

  return (
    <div ref={akar} className="fixed bottom-6 right-6 z-40">
      {buka && (
        <div className="a-card absolute bottom-14 right-0 w-64 p-1.5 text-sm shadow-2xl" role="menu" aria-label="Menu artikel">
          {MENU.map((m) => (
            <Link key={m.href} href={m.href} role="menuitem" onClick={tutup} className="flex items-center gap-2.5 rounded-lg px-3 py-2 transition hover:bg-black/10">
              {m.ikon}{m.label}
            </Link>
          ))}
          {!cari ? (
            <button type="button" role="menuitem" onClick={() => setCari(true)} className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition hover:bg-black/10">
              {IKON.cari}Pencarian artikel
            </button>
          ) : (
            <form onSubmit={kirimCari} className="flex items-center gap-1.5 px-2 py-1.5">
              <span className="opacity-70">{IKON.cari}</span>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Cari judul artikel..."
                aria-label="Cari judul artikel"
                spellCheck={false}
                autoComplete="off"
                autoFocus
                className="min-w-0 flex-1 rounded border px-2 py-1"
              />
              <button type="submit" className="a-btn-soft !px-3 !py-1">Cari</button>
            </form>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => { setBuka(!buka); setCari(false); }}
        aria-expanded={buka}
        aria-haspopup="menu"
        aria-label="Menu artikel"
        title="Menu artikel"
        className="grid h-12 w-12 place-items-center rounded-full bg-[#b8893a] text-white shadow-lg transition hover:brightness-110 focus-visible:outline focus-visible:outline-2"
      >
        {buka
          ? <svg {...g} className="h-5 w-5"><path d="M6 6l12 12M18 6L6 18" /></svg>
          : <svg {...g} className="h-5 w-5"><path d="M4 7h16M4 12h16M4 17h16" /></svg>}
      </button>
    </div>
  );
}
