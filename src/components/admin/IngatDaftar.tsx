// PAKET-11A: mengingat posisi daftar artikel (alamat dan gulir) agar tombol Kembali membawa Anda ke tempat semula
"use client";
import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function IngatDaftar() {
  const path = usePathname();
  const sp = useSearchParams();
  const url = path + (sp.toString() ? `?${sp.toString()}` : "");

  useEffect(() => {
    try {
      const simpan = JSON.parse(sessionStorage.getItem("adm-daftar") ?? "null") as { url: string; y: number; pulihkan?: boolean } | null;
      if (simpan?.pulihkan && simpan.url === url) {
        requestAnimationFrame(() => window.scrollTo(0, simpan.y));
        sessionStorage.setItem("adm-daftar", JSON.stringify({ url, y: simpan.y }));
      } else {
        sessionStorage.setItem("adm-daftar", JSON.stringify({ url, y: 0 }));
      }
    } catch { /* penyimpanan tidak tersedia */ }
    let tunda = 0;
    const gulir = () => {
      window.clearTimeout(tunda);
      tunda = window.setTimeout(() => {
        try { sessionStorage.setItem("adm-daftar", JSON.stringify({ url, y: window.scrollY })); } catch { /* abaikan */ }
      }, 120);
    };
    window.addEventListener("scroll", gulir, { passive: true });
    return () => { window.removeEventListener("scroll", gulir); window.clearTimeout(tunda); };
  }, [url]);

  return null;
}