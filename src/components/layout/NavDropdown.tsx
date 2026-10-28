// PAKET-2A2: dropdown yang tidak terpotong oleh area menu yang bisa digeser
"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { navItem, navMenuBox } from "./nav-style";

export function NavDropdown({ label, href, children }: { label: string; href: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buka = () => {
    const r = ref.current?.getBoundingClientRect();
    if (r) setPos({ top: r.bottom, left: r.left });
  };
  const tutup = () => setPos(null);

  // Tutup saat halaman atau menu digeser, supaya posisinya tidak basi
  useEffect(() => {
    if (!pos) return;
    window.addEventListener("scroll", tutup, true);
    return () => window.removeEventListener("scroll", tutup, true);
  }, [pos]);

  return (
    <div
      ref={ref}
      className="shrink-0"
      onMouseEnter={buka}
      onMouseLeave={tutup}
      onFocus={buka}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) tutup(); }}
    >
      <Link href={href} className={`${navItem} whitespace-nowrap`}>{label} &#9662;</Link>
      {pos && (
        <div style={{ top: pos.top, left: pos.left }} className={navMenuBox} onClick={tutup}>
          {children}
        </div>
      )}
    </div>
  );
}