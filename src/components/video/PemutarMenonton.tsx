// PAKET-16: "slot" halaman tonton video. Komponen ini hanya menyediakan kotak 16:9 sebagai tempat pemutar; pemutarnya sendiri hidup di
// PemutarProvider (tata letak situs) supaya video terus berjalan saat pengunjung pindah halaman (lihat PemutarGlobal.tsx).
"use client";
import { useEffect, useRef, useState } from "react";
import { usePemutar, type VideoMini } from "./PemutarGlobal";

export function PemutarMenonton({ slug, youtubeId, judul, lain }: { slug: string; youtubeId: string; judul: string; lain: VideoMini[] }) {
  const ctx = usePemutar();
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const lainRef = useRef(lain);
  lainRef.current = lain;

  useEffect(() => {
    if (!ctx || !el) return;
    ctx.pasang({ slug, title: judul, youtubeId }, lainRef.current, el);
    return () => ctx.lepas(el);
  }, [ctx, el, slug, judul, youtubeId]);

  return (
    <div className="tonton-band">
      <div ref={setEl} className="tonton-slot relative aspect-video w-full overflow-hidden rounded-xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover opacity-40" />
      </div>
    </div>
  );
}
