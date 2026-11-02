// PAKET-10B: navigasi samping CMS (menandai halaman aktif, menutup laci menu di layar kecil)
"use client";
import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IkonAdmin } from "./ikon-admin";

export type ItemNav = { label: string; href?: string; badge?: number; segera?: boolean; ikon?: string };
export type Grup = { judul: string; item: ItemNav[] };

export function AdminNav({ grup }: { grup: Grup[] }) {
  const path = usePathname();
  const aktif = (h: string) => (h === "/admin" ? path === "/admin" : path === h || path.startsWith(h + "/"));

  // Layar kecil: tutup laci menu setelah berpindah halaman
  useEffect(() => {
    const kotak = document.getElementById("adm-menu") as HTMLInputElement | null;
    if (kotak) kotak.checked = false;
  }, [path]);

  return (
    <nav className="space-y-6" aria-label="Menu CMS">
      {grup.map((g) => (
        <div key={g.judul} className="space-y-1">
          <p className="a-nav-judul">{g.judul}</p>
          {g.item.map((i) =>
            i.href && !i.segera ? (
              <Link key={i.label} href={i.href} className="a-nav" aria-current={aktif(i.href) ? "page" : undefined}>
                {i.ikon && <IkonAdmin nama={i.ikon} />}
                <span className="flex-1 truncate">{i.label}</span>
                {!!i.badge && <span className="a-badge">{i.badge}</span>}
              </Link>
            ) : (
              <span key={i.label} className="a-nav opacity-40">
                {i.ikon && <IkonAdmin nama={i.ikon} />}
                <span className="flex-1">{i.label}</span>
                <span className="text-[10px] uppercase tracking-wider">segera</span>
              </span>
            ),
          )}
        </div>
      ))}
    </nav>
  );
}