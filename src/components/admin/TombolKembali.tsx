// PAKET-12A2: kembali ke daftar artikel seperti sebelumnya (halaman, filter, pencarian, dan posisi gulir).
// Saat tombol utama tergulir keluar layar, muncul tombol ringkas "Kembali" di bawah tombol hamburger.
// Selama tombol itu tampil, bilah alat editor turun sedikit (variabel --adm-lengket) supaya tidak saling menutupi.
"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function TombolKembali({ label = "Kembali ke daftar artikel" }: { label?: string }) {
  const router = useRouter();
  const utama = useRef<HTMLButtonElement>(null);
  const [melayang, setMelayang] = useState(false);

  useEffect(() => {
    const el = utama.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // 64 px = tinggi bilah atas CMS; tombol dianggap "tenggelam" bila sudah lewat di atas bilah itu
    const io = new IntersectionObserver(
      ([e]) => setMelayang(!e.isIntersecting && e.boundingClientRect.top < 64),
      { rootMargin: "-64px 0px 0px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Beri ruang bagi benda lengket lain (bilah alat editor) selama tombol melayang tampil
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--adm-lengket", melayang ? "7rem" : "4rem");
    return () => { root.style.removeProperty("--adm-lengket"); };
  }, [melayang]);

  const kembali = () => {
    let url = "/admin/artikel";
    try {
      const s = JSON.parse(sessionStorage.getItem("adm-daftar") ?? "null") as { url: string; y: number } | null;
      if (s?.url?.startsWith("/admin/artikel")) {
        url = s.url;
        sessionStorage.setItem("adm-daftar", JSON.stringify({ ...s, pulihkan: true }));
      }
    } catch { /* gunakan alamat bawaan */ }
    router.push(url);
  };

  return (
    <>
      <button ref={utama} type="button" onClick={kembali} className="a-btn-soft">&larr; {label}</button>
      <button
        type="button"
        onClick={kembali}
        aria-label={label}
        title={label}
        aria-hidden={!melayang}
        tabIndex={melayang ? 0 : -1}
        className={`a-btn-soft fixed left-4 top-[4.5rem] z-[25] !px-3 !py-1.5 text-xs shadow-lg transition-opacity duration-150 lg:left-[calc(17rem+2rem)] ${melayang ? "opacity-100" : "pointer-events-none opacity-0"}`}
      >
        &larr; Kembali
      </button>
    </>
  );
}
