import Link from "next/link";

export function PostCard({ p }: { p: { slug: string; title: string; excerpt: string; coverUrl: string | null } }) {
  return (
    <Link href={`/artikel/${p.slug}`} className="group block overflow-hidden rounded-lg border border-cream-dark bg-white/60 transition hover:shadow-lg">
      {p.coverUrl && <img src={p.coverUrl} alt="" className="h-48 w-full object-cover" />}
      <div className="p-5">
        <h3 className="font-serif text-xl group-hover:text-gold-dark">{p.title}</h3>
        <p className="mt-2 line-clamp-3 text-sm text-charcoal/70">{p.excerpt}</p>
      </div>
    </Link>
  );
}
