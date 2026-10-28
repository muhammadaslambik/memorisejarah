// PAKET-2A2: area menu yang bisa digeser kanan-kiri (roda mouse, sentuh, atau Shift+roda)
"use client";
import { useEffect, useRef } from "react";

export function NavScroll({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Roda mouse vertikal di atas menu diubah menjadi geser kanan-kiri (hanya bila menu memang meluap)
    const f = (e: WheelEvent) => {
      if (el.scrollWidth <= el.clientWidth) return;
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", f, { passive: false });
    return () => el.removeEventListener("wheel", f);
  }, []);
  return (
    <nav
      ref={ref}
      aria-label="Utama"
      className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto lg:flex [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {children}
    </nav>
  );
}