// PAKET-15M/15N: keterangan seragam di seluruh situs dan CMS: tulisan putih di latar hitam, tampil di bawah elemen yang ditunjuk kursor.
//  - Atribut title bawaan peramban pada tombol/tautan dipindahkan ke data-tip (kotak putih bawaan peramban tidak dipakai).
//  - Judul yang terpotong (line-clamp / truncate) menampilkan teks lengkapnya saat kursor diarahkan.
// Kotaknya satu elemen melayang (fixed) sehingga tidak terpotong oleh kartu atau area bergulir.
"use client";
import { useEffect } from "react";

const SEL = "button[title], a[title], label[title], summary[title], [role='button'][title]";

function pindahTitle(el: Element) {
  const t = el.getAttribute("title");
  if (!t) return;
  el.setAttribute("data-tip", t);
  el.removeAttribute("title");
  if (!el.hasAttribute("aria-label") && !(el.textContent ?? "").trim()) el.setAttribute("aria-label", t);
}

const terpotong = (el: HTMLElement) => el.scrollHeight - el.clientHeight > 1 || el.scrollWidth - el.clientWidth > 1;

export function KeteranganSeragam() {
  useEffect(() => {
    document.querySelectorAll(SEL).forEach(pindahTitle);
    const mo = new MutationObserver((daftar) => {
      for (const m of daftar) {
        if (m.type === "attributes") { const e = m.target as Element; if (e.matches?.(SEL)) pindahTitle(e); continue; }
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          const e = n as Element;
          if (e.matches(SEL)) pindahTitle(e);
          e.querySelectorAll(SEL).forEach(pindahTitle);
        });
      }
    });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["title"] });

    const kotak = document.createElement("div");
    kotak.setAttribute("role", "tooltip");
    kotak.style.cssText = "position:fixed;left:0;top:0;z-index:2147483000;display:none;pointer-events:none;max-width:min(22rem,90vw);width:max-content;padding:.25rem .55rem;border-radius:.375rem;background:rgba(0,0,0,.92);color:#fff;font:500 .75rem/1.35 var(--font-sans),system-ui,sans-serif;letter-spacing:normal;text-transform:none;text-align:center;white-space:normal;box-shadow:0 4px 14px rgba(0,0,0,.35);";
    document.body.appendChild(kotak);

    let sasaran: Element | null = null;
    const sembunyi = () => { kotak.style.display = "none"; sasaran = null; };
    const tampil = (el: Element, teks: string) => {
      if (sasaran === el && kotak.textContent === teks && kotak.style.display === "block") return;
      sasaran = el;
      kotak.textContent = teks;
      kotak.style.display = "block";
      const r = el.getBoundingClientRect();
      const w = kotak.offsetWidth, h = kotak.offsetHeight;
      let kiri = r.left + r.width / 2 - w / 2;
      kiri = Math.max(6, Math.min(kiri, window.innerWidth - w - 6));
      let atas = r.bottom + 8;
      if (atas + h > window.innerHeight - 6) atas = Math.max(6, r.top - h - 8); // tidak muat di bawah: tampil di atas
      kotak.style.left = `${kiri}px`;
      kotak.style.top = `${atas}px`;
    };
    const cari = (t: EventTarget | null): { el: Element; teks: string } | null => {
      if (!(t instanceof Element)) return null;
      const tip = t.closest("[data-tip]");
      if (tip) return { el: tip, teks: tip.getAttribute("data-tip") ?? "" };
      const potong = t.closest<HTMLElement>("[class*='line-clamp-'], .truncate");
      if (potong && terpotong(potong)) { const teks = (potong.textContent ?? "").replace(/\s+/g, " ").trim(); if (teks) return { el: potong, teks }; }
      return null;
    };
    const masuk = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const h = cari(e.target);
      if (h) tampil(h.el, h.teks); else sembunyi();
    };
    const fokus = (e: FocusEvent) => { const h = cari(e.target); if (h && (e.target as Element).matches?.(":focus-visible")) tampil(h.el, h.teks); };

    document.addEventListener("pointerover", masuk, { passive: true });
    document.addEventListener("pointerdown", sembunyi, true);
    document.addEventListener("scroll", sembunyi, true);
    document.addEventListener("focusin", fokus);
    document.addEventListener("focusout", sembunyi);
    window.addEventListener("blur", sembunyi);
    return () => {
      mo.disconnect();
      document.removeEventListener("pointerover", masuk);
      document.removeEventListener("pointerdown", sembunyi, true);
      document.removeEventListener("scroll", sembunyi, true);
      document.removeEventListener("focusin", fokus);
      document.removeEventListener("focusout", sembunyi);
      window.removeEventListener("blur", sembunyi);
      kotak.remove();
    };
  }, []);
  return null;
}
