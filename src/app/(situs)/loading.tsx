// PAKET-9A: kerangka ringan saat berpindah halaman publik
export default function Memuat() {
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24" aria-busy="true" aria-label="Memuat">
      <div className="mx-auto max-w-[90rem] animate-pulse px-6 pt-12 md:px-10 lg:px-16">
        <div className="h-10 w-64 rounded bg-ms-surface" />
        <div className="mt-4 h-4 w-96 max-w-full rounded bg-ms-surface" />
        <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="aspect-[4/5] rounded-xl bg-ms-surface" />)}
        </div>
      </div>
    </div>
  );
}