// PAKET-3C1: navigasi samping CMS (menandai halaman aktif)
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type ItemNav = { label: string; href?: string; badge?: number; segera?: boolean };
export type Grup = { judul: string; item: ItemNav[] };

export function AdminNav({ grup }: { grup: Grup[] }) {
  const path = usePathname();
  const aktif = (h: string) => (h === "/admin" ? path === "/admin" || path.startsWith("/admin/artikel") : path === h || path.startsWith(h + "/"));
  return (
    <nav className="flex gap-1 overflow-x-auto pb-2 lg:block lg:space-y-6 lg:overflow-visible lg:pb-0" aria-label="Menu CMS">
      {grup.map((g) => (
        <div key={g.judul} className="flex shrink-0 gap-1 lg:block lg:space-y-1">
          <p className="hidden px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-charcoal/45 lg:block">{g.judul}</p>
          {g.item.map((i) =>
            i.href && !i.segera ? (
              <Link
                key={i.label} href={i.href}
                className={`flex items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm transition ${aktif(i.href) ? "bg-charcoal text-cream" : "text-charcoal/80 hover:bg-cream-dark"}`}
              >
                <span>{i.label}</span>
                {!!i.badge && <span className="rounded-full bg-gold px-2 py-0.5 text-[11px] font-semibold text-white">{i.badge}</span>}
              </Link>
            ) : (
              <span key={i.label} className="flex items-center justify-between gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm text-charcoal/35">
                <span>{i.label}</span>
                <span className="text-[10px] uppercase tracking-wider">segera</span>
              </span>
            ),
          )}
        </div>
      ))}
    </nav>
  );
}