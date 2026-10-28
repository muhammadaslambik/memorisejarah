// PAKET-2A: kartu ringkas untuk baris 5 kolom
import Link from "next/link";
import { tanggal } from "./PostCard";

type P = { slug: string; title: string; coverUrl: string | null; publishedAt: Date | null };

export function PostCardMini({ p, kategori }: { p: P; kategori?: string }) {
  const info = [kategori, tanggal(p.publishedAt)].filter(Boolean).join(" \u2022 ");
  return (
    <Link
      href={`/artikel/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-ms-line bg-ms-surface transition hover:-translate-y-1 hover:border-ms-gold/50"
    >
      <div className="aspect-[4/3] overflow-hidden bg-ms-bg">
        {p.coverUrl && <img src={p.coverUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
      </div>
      <div className="p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-ms-gold">{info}</p>
        <h3 className="mt-1.5 line-clamp-3 font-serif text-sm font-bold leading-snug group-hover:text-ms-gold">{p.title}</h3>
      </div>
    </Link>
  );
}