// PAKET-10B: tombol ganti tema gelap/terang (disimpan di cookie, tanpa muat ulang halaman)
"use client";

export function TombolTema() {
  const ganti = () => {
    const el = document.querySelector(".adm");
    if (!el) return;
    const gelap = el.classList.contains("tema-gelap");
    el.classList.toggle("tema-gelap", !gelap);
    el.classList.toggle("tema-terang", gelap);
    document.cookie = `adm-tema=${gelap ? "terang" : "gelap"}; path=/; max-age=31536000; samesite=lax`;
  };
  return (
    <button type="button" onClick={ganti} className="a-ikon-btn" aria-label="Ganti tema terang atau gelap" title="Ganti tema terang atau gelap">
      <svg className="a-ikon-matahari h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
      <svg className="a-ikon-bulan h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5z" />
      </svg>
    </button>
  );
}