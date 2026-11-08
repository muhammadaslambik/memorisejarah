// PAKET-15K/15N: menutup menu/kotak saat klik di luar, dan klik itu HANYA menutup (tidak ikut mengenai tombol/tautan di bawahnya).
// Klik berikutnya, setelah menu tertutup, bekerja seperti biasa. Esc juga menutup.
// Pelindung transparan menutupi halaman (termasuk video YouTube, yang klik-nya tidak terlihat oleh halaman) selama menu terbuka.
import { useEffect, type RefObject } from "react";

export function useTutupLuar(aktif: boolean, refs: RefObject<Element | null>[], tutup: () => void, abaikan?: string, zPelindung = 35) {
  useEffect(() => {
    if (!aktif) return;
    const diLuar = (e: Event) => {
      const t = e.target as Element | null;
      if (!t || !(t instanceof Element)) return false;
      if (t.hasAttribute("data-pelindung")) return true;
      if (refs.some((r) => r.current?.contains(t))) return false;
      if (abaikan && t.closest(abaikan)) return false;
      return true;
    };
    const tekan = (e: MouseEvent) => { if (diLuar(e)) e.preventDefault(); };
    const klik = (e: MouseEvent) => {
      if (!diLuar(e)) return;
      e.preventDefault();
      e.stopPropagation();
      tutup();
    };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") tutup(); };
    // lapisan transparan di atas isi halaman namun di bawah bilah atas dan menu
    const pelindung = document.createElement("div");
    pelindung.setAttribute("data-pelindung", "");
    pelindung.style.cssText = `position:fixed;inset:0;z-index:${zPelindung};background:transparent;`;
    document.body.appendChild(pelindung);
    document.addEventListener("mousedown", tekan, true);
    document.addEventListener("click", klik, true);
    document.addEventListener("keydown", esc);
    return () => {
      pelindung.remove();
      document.removeEventListener("mousedown", tekan, true);
      document.removeEventListener("click", klik, true);
      document.removeEventListener("keydown", esc);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aktif]);
}
