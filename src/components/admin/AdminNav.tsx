// PAKET-9D: navigasi samping CMS dengan ikon (menandai halaman aktif)
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type ItemNav = { label: string; href?: string; badge?: number; segera?: boolean; ikon?: string };
export type Grup = { judul: string; item: ItemNav[] };

// Ikon garis sederhana 24x24 (tanpa pustaka)
const IKON: Record<string, React.ReactNode> = {
  artikel: <><path d="M7 3h7l4 4v14H7z" /><path d="M14 3v4h4M10 12h5M10 16h5" /></>,
  persetujuan: <><circle cx="12" cy="12" r="9" /><path d="m8 12 3 3 5-6" /></>,
  video: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m10 9 5 3-5 3z" /></>,
  gambar: <><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="9" cy="10" r="1.6" /><path d="m4 18 5-5 4 4 3-3 4 4" /></>,
  kategori: <><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.2" /></>,
  agenda: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>,
  informasi: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></>,
  pustaka: <path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z" />,
  redaksi: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 5a3.5 3.5 0 0 1 0 7M18 14c2.2.6 3.5 2.6 3.5 6" /></>,
  pengguna: <><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></>,
  akun: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="10" r="3" /><path d="M6.5 18.5c1.2-2.2 3.2-3 5.5-3s4.3.8 5.5 3" /></>,
  pengaturan: <><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></>,
  tentang: <><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.5" /></>,
};

export function AdminNav({ grup }: { grup: Grup[] }) {
  const path = usePathname();
  const aktif = (h: string) => (h === "/admin" ? path === "/admin" || path.startsWith("/admin/artikel") : path === h || path.startsWith(h + "/"));
  return (
    <nav className="flex gap-1 overflow-x-auto py-2 lg:block lg:space-y-6 lg:overflow-visible lg:py-0" aria-label="Menu CMS">
      {grup.map((g) => (
        <div key={g.judul} className="flex shrink-0 gap-1 lg:block lg:space-y-1">
          <p className="hidden px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-charcoal/45 lg:block">{g.judul}</p>
          {g.item.map((i) => {
            const gambar = i.ikon && IKON[i.ikon] ? (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-[18px] w-[18px] shrink-0" aria-hidden="true">{IKON[i.ikon]}</svg>
            ) : null;
            return i.href && !i.segera ? (
              <Link
                key={i.label} href={i.href}
                className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${aktif(i.href) ? "bg-charcoal text-cream shadow-sm" : "text-charcoal/80 hover:bg-cream-dark"}`}
              >
                {gambar}
                <span className="flex-1">{i.label}</span>
                {!!i.badge && <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-white">{i.badge}</span>}
              </Link>
            ) : (
              <span key={i.label} className="flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-charcoal/35">
                {gambar}
                <span className="flex-1">{i.label}</span>
                <span className="text-[10px] uppercase tracking-wider">segera</span>
              </span>
            );
          })}
        </div>
      ))}
    </nav>
  );
}