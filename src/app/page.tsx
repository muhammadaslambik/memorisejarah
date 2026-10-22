import Link from "next/link";
import { desc, eq, and } from "drizzle-orm";
import { db, posts, categories } from "@/db";
import { PostCard } from "@/components/PostCard";

export const runtime = "edge";
export const dynamic = "force-dynamic";

export default async function Home() {
  const d = db();
  const pub = eq(posts.status, "published");
  const [featured, latest, cats] = await Promise.all([
    d.select().from(posts).where(and(pub, eq(posts.featured, true))).orderBy(desc(posts.publishedAt)).limit(3),
    d.select().from(posts).where(pub).orderBy(desc(posts.publishedAt)).limit(9),
    d.select().from(categories),
  ]);
  return (
    <>
      <section className="bg-charcoal-soft py-16 text-center text-cream">
        <h1 className="font-serif text-4xl text-gold md:text-6xl">Menelusuri Jejak Masa Lalu</h1>
        <p className="mx-auto mt-4 max-w-xl px-5 text-cream/70">Kisah, tokoh, dan peristiwa yang membentuk hari ini.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2 px-5">
          {cats.map((c) => (
            <span key={c.id} className="rounded-full border border-gold/60 px-4 py-1 text-sm text-gold">{c.name}</span>
          ))}
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5">
        {featured.length > 0 && (<>
          <h2 className="mb-6 mt-12 font-serif text-3xl">Artikel Pilihan</h2>
          <div className="grid gap-6 md:grid-cols-3">{featured.map((p) => <PostCard key={p.id} p={p} />)}</div>
        </>)}
        <h2 className="mb-6 mt-12 font-serif text-3xl">Terbaru</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{latest.map((p) => <PostCard key={p.id} p={p} />)}</div>
      </div>
    </>
  );
}
