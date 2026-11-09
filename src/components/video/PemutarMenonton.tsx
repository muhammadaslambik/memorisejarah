// PAKET-16/17: "slot" halaman tonton video. Komponen ini hanya menyediakan kotak 16:9 sebagai tempat pemutar; pemutarnya sendiri hidup di
// PemutarProvider (tata letak situs) supaya video terus berjalan saat pengunjung pindah halaman (lihat PemutarGlobal.tsx).
"use client";
import { useEffect, useRef, useState } from "react";
import { usePemutar, usePemutarAktif, type VideoMini } from "./PemutarGlobal";

export function PemutarMenonton({ slug, youtubeId, judul, lain }: { slug: string; youtubeId: string; judul: string; lain: VideoMini[] }) {
  const ctx = usePemutar();
  const akt = usePemutarAktif();
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const lainRef = useRef(lain);
  lainRef.current = lain;

  useEffect(() => {
    if (!ctx || !el) return;
    ctx.pasang({ slug, title: judul, youtubeId }, lainRef.current, el);
    return () => ctx.lepas(el);
  }, [ctx, el, slug, judul, youtubeId]);

  const beda = !!akt?.aktifId && akt.aktifId !== youtubeId; // yang sedang diputar adalah video lain (di mini player)
  const kosong = !!akt?.mini && !beda;                      // video halaman ini sedang di mini player: kotak dikosongkan agar tidak ada sisa hitam
  return (
    <div className={`tonton-band relative ${kosong ? "tonton-band-kosong" : ""}`}>
      <div ref={setEl} className={`tonton-slot relative aspect-video w-full overflow-hidden rounded-xl bg-black ${kosong ? "invisible" : ""}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-40" />
      </div>
      {(beda || kosong) && akt && (
        <div className={`absolute inset-0 z-[1] flex flex-col items-center justify-center gap-3 px-4 text-center ${kosong ? "rounded-xl border border-dashed border-ms-line" : ""}`}>
          <p className="text-sm text-ms-cream/80">{beda ? "Video lain sedang diputar di mini player." : "Video ini sedang diputar di mini player."}</p>
          <button type="button" onClick={akt.kembaliKeSlot} className="rounded-full border border-ms-gold px-4 py-1.5 text-sm font-semibold text-ms-gold hover:bg-ms-gold hover:text-ms-bg">
            {beda ? "Putar video ini di sini" : "Kembalikan ke sini"}
          </button>
        </div>
      )}
    </div>
  );
}
