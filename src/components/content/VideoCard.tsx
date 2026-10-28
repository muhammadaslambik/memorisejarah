// PAKET-1B
import Link from "next/link";
import { tanggal } from "./PostCard";

type V = { slug: string; title: string; youtubeId: string; publishedAt: Date | null };

export function VideoCard({ v }: { v: V }) {
  return (
    <Link
      href={`/video/${v.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ms-line bg-ms-surface transition hover:-translate-y-1 hover:border-ms-gold/50"
    >
      <div className="relative aspect-video overflow-hidden bg-ms-bg">
        <img src={`https://i.ytimg.com/vi/${v.youtubeId}/hqdefault.jpg`} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-ms-bg/80 text-ms-gold">&#9654;</span>
        </span>
      </div>
      <div className="p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ms-gold">{tanggal(v.publishedAt)}</p>
        <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-ms-cream group-hover:text-ms-gold">{v.title}</h3>
      </div>
    </Link>
  );
}