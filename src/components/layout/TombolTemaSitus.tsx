// PAKET-12C: tombol mode gelap/terang untuk situs publik. Bawaan gelap; pilihan disimpan di peramban (localStorage).
// Skrip kecil di <head> (app/layout.tsx) menerapkan pilihan sebelum halaman tampil, jadi tidak berkedip.
"use client";

export function TombolTemaSitus({ className }: { className: string }) {
  const ganti = () => {
    const el = document.documentElement;
    const terang = el.dataset.tema !== "terang";
    if (terang) el.dataset.tema = "terang";
    else delete el.dataset.tema;
    try { localStorage.setItem("ms-tema", terang ? "terang" : "gelap"); } catch { /* penyimpanan dimatikan */ }
  };
  const g = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  return (
    <button type="button" onClick={ganti} aria-label="Ganti mode gelap atau terang" title="Mode gelap / terang" className={className}>
      {/* mode gelap: tampil matahari (klik = terang); mode terang: tampil bulan (klik = gelap). Pergantian lewat CSS agar tanpa kedip */}
      <svg {...g} className="ms-ikon-matahari h-5 w-5" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      <svg {...g} className="ms-ikon-bulan h-5 w-5" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
    </button>
  );
}
