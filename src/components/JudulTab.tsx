// PAKET-28: judul tab peramban. Beranda: "Memori Sejarah | <keterangan sesuai bahasa>". Halaman lain: "<judul halaman> | Memori Sejarah".
// Nama "Memori Sejarah" dipulihkan setiap kali Google Translate atau Next.js mengubah judul. Elemen <title> di Next 15 berada di dalam <body>,
// jadi yang diamati adalah elemen title itu sendiri (dipasang ulang bila diganti), ditambah pengecekan berkala sebagai cadangan.
"use client";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { TAGLINE, kodeBahasaAktif } from "@/lib/merek";

export function JudulTab() {
  const jalur = usePathname();
  useEffect(() => {
    const terapkan = () => {
      const sekarang = document.title;
      let baru = sekarang;
      if (jalur === "/") baru = `Memori Sejarah | ${TAGLINE[kodeBahasaAktif()] ?? TAGLINE.id}`;
      else {
        const i = sekarang.lastIndexOf(" | ");
        if (i > 0) baru = `${sekarang.slice(0, i)} | Memori Sejarah`;
      }
      if (baru !== sekarang) document.title = baru;
    };
    let pengamat: MutationObserver | null = null;
    let elemen: Element | null = null;
    const siklus = () => {
      const t = document.querySelector("title");
      if (t !== elemen) {
        pengamat?.disconnect();
        elemen = t;
        if (t) {
          pengamat = new MutationObserver(terapkan);
          pengamat.observe(t, { childList: true, characterData: true, subtree: true });
        }
      }
      terapkan();
    };
    siklus();
    const pewaktu = setInterval(siklus, 600);
    return () => { clearInterval(pewaktu); pengamat?.disconnect(); };
  }, [jalur]);
  return null;
}
