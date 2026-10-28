import Link from "next/link";

export const tanggal = (d: Date | null) =>
  d ? d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "";

type P = { slug: string; title: string; excerpt: string; coverUrl: string | null; publishedAt: Date | null };

export function PostCard({ p, kategori }: { p: P; kategori?: string }) {
  const info = [kategori, tanggal(p.publishedAt)].filter(Boolean).join(" \u2022 ");
  return (
    <Link
      href={`/artikel/${p.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-ms-line bg-ms-surface transition hover:-translate-y-1 hover:border-ms-gold/50"
    >
      <div className="aspect-[16/10] overflow-hidden bg-ms-bg">
        {p.coverUrl && <img src={p.coverUrl} alt="" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ms-gold">{info}</p>
        <h3 className="mt-2 font-serif text-lg font-bold leading-snug text-ms-cream group-hover:text-ms-gold">{p.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-ms-cream/65">{p.excerpt}</p>
      </div>
    </Link>
  );
}