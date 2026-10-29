// PAKET-3A: folder Google Drive ditampilkan langsung di dalam situs
"use client";
import { useState } from "react";

type F = { kunci: string; nama: string; id: string; url: string };

export function PustakaViewer({ folders, awal }: { folders: F[]; awal: string }) {
  const [k, setK] = useState(folders.some((f) => f.kunci === awal) ? awal : folders[0].kunci);
  const f = folders.find((x) => x.kunci === k) ?? folders[0];
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {folders.map((x) => (
          <button
            key={x.kunci} type="button" onClick={() => setK(x.kunci)}
            className={`rounded-full border px-4 py-2 text-sm transition ${x.kunci === k ? "border-ms-gold bg-ms-gold font-semibold text-ms-bg" : "border-ms-line text-ms-cream/80 hover:border-ms-gold hover:text-ms-gold"}`}
          >
            {x.nama}
          </button>
        ))}
      </div>
      <div className="mt-5 overflow-hidden rounded-2xl border border-ms-line bg-white">
        <iframe key={f.kunci} src={`https://drive.google.com/embeddedfolderview?id=${f.id}#grid`} title={f.nama} loading="lazy" className="h-[640px] w-full" />
      </div>
      <a href={f.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block text-sm text-ms-gold">
        Buka folder ini di Google Drive &rarr;
      </a>
    </div>
  );
}