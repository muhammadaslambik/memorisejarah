// PAKET-13A: tombol kembali ke daftar artikel berupa ikon, diletakkan di kiri bilah alat editor.
// Menampilkan tulisan "Kembali ke daftar artikel" saat kursor diarahkan atau tombol difokuskan (keyboard).
// Mengembalikan halaman, filter, pencarian, dan posisi gulir daftar artikel seperti sebelumnya.
"use client";
import { useRouter } from "next/navigation";

export function TombolKembali({ label = "Kembali ke daftar artikel" }: { label?: string }) {
  const router = useRouter();

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
    <span className="group relative inline-flex">
      <button
        type="button"
        onClick={kembali}
        aria-label={label}
        className="grid h-8 w-8 place-items-center rounded-md transition hover:bg-black/10 focus-visible:outline focus-visible:outline-2"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5" aria-hidden="true">
          <path d="M6 8l-4 4 4 4" />
          <path d="M10 6h11M10 12h11M10 18h11" />
        </svg>
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 whitespace-nowrap rounded-md bg-black/85 px-2.5 py-1 text-xs font-normal text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  );
}
