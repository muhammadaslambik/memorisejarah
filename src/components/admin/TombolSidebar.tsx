// PAKET-15A: tombol hamburger CMS. Layar lebar (>= 1024 px): membuka/menutup sidebar (pilihan diingat). Layar sempit: membuka menu geser.
"use client";
import { useEffect, useState } from "react";

const KUNCI = "adm-side";
const lebar = () => window.matchMedia("(min-width: 1024px)").matches;

export function TombolSidebar() {
  const [tutup, setTutup] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(KUNCI) === "tutup") {
        document.querySelector<HTMLElement>(".adm")?.setAttribute("data-side", "tutup");
        setTutup(true);
      }
    } catch { /* abaikan */ }
  }, []);

  const klik = () => {
    if (!lebar()) {
      document.getElementById("adm-menu")?.click();
      return;
    }
    const akar = document.querySelector<HTMLElement>(".adm");
    if (!akar) return;
    const baru = akar.getAttribute("data-side") !== "tutup";
    if (baru) akar.setAttribute("data-side", "tutup"); else akar.removeAttribute("data-side");
    setTutup(baru);
    try { localStorage.setItem(KUNCI, baru ? "tutup" : "buka"); } catch { /* abaikan */ }
    // beri tahu komponen yang menghitung posisi (mis. tombol Kembali) setelah tata letak bergeser
    window.dispatchEvent(new Event("resize"));
    window.setTimeout(() => window.dispatchEvent(new Event("resize")), 260);
  };

  return (
    <button
      type="button"
      data-adm-ham
      onClick={klik}
      className="a-ikon-btn"
      aria-label={tutup ? "Buka sidebar" : "Tutup sidebar"}
      title={tutup ? "Buka sidebar" : "Tutup sidebar"}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" className="h-5 w-5" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
    </button>
  );
}
