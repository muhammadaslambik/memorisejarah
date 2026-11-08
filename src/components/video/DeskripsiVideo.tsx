// PAKET-15M: kotak deskripsi video bergaya YouTube (tanggal + deskripsi, dapat diperluas).
"use client";
import { useState } from "react";

export function DeskripsiVideo({ tanggal, deskripsi }: { tanggal: string; deskripsi: string }) {
  const [semua, setSemua] = useState(false);
  const panjang = deskripsi.length > 180 || deskripsi.split("\n").length > 3;
  return (
    <div className="rounded-xl border border-ms-line bg-ms-surface p-4 text-sm">
      <p className="font-semibold text-ms-gold">{tanggal}</p>
      {deskripsi && <p className={`mt-2 whitespace-pre-line text-ms-cream/85 ${semua ? "" : "line-clamp-3"}`}>{deskripsi}</p>}
      {panjang && <button type="button" onClick={() => setSemua((s) => !s)} className="mt-2 font-semibold text-ms-cream hover:text-ms-gold">{semua ? "Tampilkan lebih sedikit" : "Selengkapnya"}</button>}
    </div>
  );
}
