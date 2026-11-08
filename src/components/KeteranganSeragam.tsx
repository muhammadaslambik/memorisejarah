// PAKET-15M: keterangan tombol (tooltip) seragam di seluruh situs dan CMS: tulisan putih di latar hitam, tampil di bawah tombol.
// Atribut title bawaan peramban (kotak putih yang berbeda-beda) dipindahkan ke data-tip dan digambar oleh CSS (lihat globals.css).
"use client";
import { useEffect } from "react";

const SEL = "button[title], a[title], label[title], summary[title], [role='button'][title]";

function ubah(el: Element) {
  const t = el.getAttribute("title");
  if (!t) return;
  el.setAttribute("data-tip", t);
  el.removeAttribute("title");
  if (!el.hasAttribute("aria-label") && !(el.textContent ?? "").trim()) el.setAttribute("aria-label", t);
  if (getComputedStyle(el).position === "static") el.setAttribute("data-tip-rel", ""); // agar keterangan menempel pada tombolnya
}

export function KeteranganSeragam() {
  useEffect(() => {
    document.querySelectorAll(SEL).forEach(ubah);
    const mo = new MutationObserver((daftar) => {
      for (const m of daftar) {
        if (m.type === "attributes") { const e = m.target as Element; if (e.matches?.(SEL)) ubah(e); continue; }
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          const e = n as Element;
          if (e.matches(SEL)) ubah(e);
          e.querySelectorAll(SEL).forEach(ubah);
        });
      }
    });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["title"] });
    return () => mo.disconnect();
  }, []);
  return null;
}
