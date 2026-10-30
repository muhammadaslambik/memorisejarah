// PAKET-4B
import Link from "next/link";
import { tanggal } from "./PostCard";
import { kecil } from "@/lib/gambar-url";

type G = { slug: string; title: string; url: string; publishedAt: Date | null };

export function GambarCard({ g }: { g: G }) {
  return (
    <Link
      href={`/gambar/${g.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ms-line bg-ms-surface transition hover:-translate-y-1 hover:border-ms-gold/50"
    >
      <div className="aspect-[4/3] overflow-hidden bg-ms-bg">
        <img src={kecil(g.url)} alt={g.title} loading="lazy" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
      </div>
      <div className="p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ms-gold">{tanggal(g.publishedAt)}</p>
        <h3 className="mt-1.5 font-serif text-base font-bold leading-snug text-ms-cream group-hover:text-ms-gold">{g.title}</h3>
      </div>
    </Link>
  );
}