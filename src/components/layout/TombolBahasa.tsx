// PAKET-12C: tombol bahasa (ikon bumi). Terjemahan otomatis memakai Google Translate; skripnya baru dimuat
// setelah pengunjung memilih bahasa selain Indonesia. Teks asli situs tetap bahasa Indonesia.
"use client";
import { useEffect, useRef, useState } from "react";

const BAHASA = [
  { kode: "id", nama: "Bahasa Indonesia" },
  { kode: "jw", nama: "Basa Jawa" },
  { kode: "su", nama: "Basa Sunda" },
  { kode: "ms", nama: "Bahasa Melayu" },
  { kode: "ar", nama: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629 (Arab)" },
  { kode: "zh-CN", nama: "\u4E2D\u6587 (Mandarin)" },
  { kode: "en", nama: "English" },
  { kode: "fr", nama: "Fran\u00E7ais" },
  { kode: "ru", nama: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" },
  { kode: "es", nama: "Espa\u00F1ol" },
];
const SUMBER = "https://translate.google.com/translate_a/element.js?cb=msTerjemahSiap";

type GT = { translate: { TranslateElement: new (opsi: object, id: string) => unknown } };
type W = Window & { msTerjemahSiap?: () => void; google?: GT };

const kodeAktif = (): string => {
  const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  const k = m ? decodeURIComponent(m[1]).split("/")[2] : "";
  return k && BAHASA.some((b) => b.kode === k) ? k : "id";
};

const hapusKuki = () => {
  const mati = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = mati;
  const bagian = location.hostname.split(".");
  for (let i = 0; i < bagian.length - 1; i++) {
    const d = bagian.slice(i).join(".");
    document.cookie = `${mati}; domain=${d}`;
    document.cookie = `${mati}; domain=.${d}`;
  }
};

const muatWidget = () => {
  if (document.getElementById("ms-gt")) return;
  const w = window as W;
  const wadah = document.createElement("div");
  wadah.id = "google_translate_element";
  wadah.className = "notranslate";
  wadah.style.cssText = "position:absolute;width:0;height:0;overflow:hidden";
  document.body.appendChild(wadah);
  w.msTerjemahSiap = () => {
    if (w.google) new w.google.translate.TranslateElement({ pageLanguage: "id", includedLanguages: "jw,su,ms,ar,zh-CN,en,fr,ru,es", autoDisplay: false }, "google_translate_element");
  };
  const s = document.createElement("script");
  s.id = "ms-gt";
  s.src = SUMBER;
  s.async = true;
  document.body.appendChild(s);
};

export function TombolBahasa({ className }: { className: string }) {
  const [buka, setBuka] = useState(false);
  const [aktif, setAktif] = useState("id");
  const kotak = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const k = kodeAktif();
    setAktif(k);
    if (k !== "id") muatWidget();
  }, []);

  useEffect(() => {
    if (!buka) return;
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setBuka(false); };
    const luar = (e: MouseEvent) => { if (!kotak.current?.contains(e.target as Node)) setBuka(false); };
    document.addEventListener("keydown", esc);
    document.addEventListener("mousedown", luar);
    return () => { document.removeEventListener("keydown", esc); document.removeEventListener("mousedown", luar); };
  }, [buka]);

  const pilih = (kode: string) => {
    setBuka(false);
    if (kode === aktif) return;
    hapusKuki();
    if (kode !== "id") document.cookie = `googtrans=/id/${kode}; path=/`;
    location.reload();
  };

  const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <div ref={kotak} className="relative notranslate">
      <button type="button" onClick={() => setBuka(!buka)} aria-label="Pilih bahasa" aria-expanded={buka} title="Bahasa" className={className}>
        <svg {...g} className="h-5 w-5" aria-hidden="true">
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" />
        </svg>
      </button>
      {buka && (
        <div className="absolute right-0 top-12 z-50 w-56 rounded-xl border border-ms-line bg-ms-surface p-2 shadow-2xl" role="menu">
          {BAHASA.map((b) => (
            <button
              key={b.kode}
              type="button"
              role="menuitemradio"
              aria-checked={b.kode === aktif}
              onClick={() => pilih(b.kode)}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm hover:text-ms-gold ${b.kode === aktif ? "font-semibold text-ms-gold" : "text-ms-cream/80"}`}
            >
              <span>{b.nama}</span>
              {b.kode === aktif && <span aria-hidden="true">&#10003;</span>}
            </button>
          ))}
          <p className="mt-1 border-t border-ms-line px-3 pt-2 text-[11px] leading-snug text-ms-cream/55">Terjemahan otomatis oleh Google Translate. Teks asli situs berbahasa Indonesia.</p>
        </div>
      )}
    </div>
  );
}
