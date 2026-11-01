// PAKET-9A: tampil seketika saat berpindah halaman CMS (ringan, tanpa pustaka)
export default function Memuat() {
  return (
    <div className="animate-pulse space-y-4" aria-busy="true" aria-label="Memuat">
      <div className="h-9 w-56 rounded bg-black/10" />
      <div className="h-4 w-80 max-w-full rounded bg-black/10" />
      <div className="mt-6 space-y-3 rounded-xl bg-white/60 p-5">
        <div className="h-5 w-2/3 rounded bg-black/10" />
        <div className="h-5 w-full rounded bg-black/10" />
        <div className="h-5 w-5/6 rounded bg-black/10" />
        <div className="h-5 w-3/4 rounded bg-black/10" />
      </div>
    </div>
  );
}