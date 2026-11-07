// PAKET-15K: tombol ikon Edit/Hapus dengan keterangan yang muncul saat kursor diarahkan (atau tombol difokuskan).
"use client";
import Link from "next/link";

const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const kelas = "group relative a-ikon-btn !h-8 !w-8 shrink-0";
const Tip = ({ t }: { t: string }) => (
  <span role="tooltip" className="pointer-events-none absolute right-full top-1/2 z-30 mr-2 -translate-y-1/2 whitespace-nowrap rounded-md bg-black/90 px-2 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">{t}</span>
);

export function IkonEdit({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className={kelas} aria-label={label}>
      <svg {...g} className="h-4 w-4" aria-hidden="true"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z" /></svg>
      <Tip t={label} />
    </Link>
  );
}

// dipakai di dalam <form action={...}>
export function IkonHapus({ label, pesan }: { label: string; pesan: string }) {
  return (
    <button type="submit" className={`${kelas} !text-red-500 hover:!text-red-400`} aria-label={label} onClick={(e) => { if (!confirm(pesan)) e.preventDefault(); }}>
      <svg {...g} className="h-4 w-4" aria-hidden="true"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 002 2h6a2 2 0 002-2l1-12M9 7V4h6v3" /></svg>
      <Tip t={label} />
    </button>
  );
}
