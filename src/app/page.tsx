import Link from "next/link";
import { desc, eq, and } from "drizzle-orm";
import { db, posts, categories } from "@/db";
import { PostCard } from "@/components/PostCard";

export const dynamic = "force-dynamic";
const PER_PAGE = 9;

export default async function Home({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const d = db();
  const pub = eq(posts.status, "published");
  const [[hero], cats, rows] = await Promise.all([
    // Hero = artikel pilihan yang paling baru terbit
    d.select().from(posts).where(and(pub, eq(posts.featured, true))).orderBy(desc(posts.publishedAt)).limit(1),
    d.select().from(categories),
    // Terbaru = semua artikel terbit (pilihan atau tidak); ambil 1 ekstra untuk cek halaman berikutnya
    d.select().from(posts).where(pub).orderBy(desc(posts.publishedAt)).limit(PER_PAGE + 1).offset((page - 1) * PER_PAGE),
  ]);
  const latest = rows.slice(0, PER_PAGE);
  const hasNext = rows.length > PER_PAGE;
  const showHero = page === 1 && !!hero;

  return (
    <>
      <section className="relative overflow-hidden bg-charcoal-soft py-16 text-center text-cream md:py-24">
        {showHero && hero.coverUrl && (
          <img src={hero.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
        )}
        <div className="relative mx-auto max-w-3xl px-5">
          {showHero ? (<>
            <p className="text-sm uppercase tracking-widest text-gold">Artikel Pilihan</p>
            <h1 className="mt-3 font-serif text-4xl text-gold md:text-6xl">{hero.title}</h1>
            {hero.excerpt && <p className="mx-auto mt-4 max-w-xl text-cream/80">{hero.excerpt}</p>}
            <Link href={`/artikel/${hero.slug}`} className="mt-6 inline-block rounded bg-gold px-6 py-3 text-white hover:bg-gold-dark">
              Baca Selengkapnya
            </Link>
          </>) : (<>
            <h1 className="font-serif text-4xl text-gold md:text-6xl">Menelusuri Jejak Masa Lalu</h1>
            <p className="mx-auto mt-4 max-w-xl text-cream/70">Kisah, tokoh, dan peristiwa yang membentuk hari ini.</p>
          </>)}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {cats.map((c) => (
              <span key={c.id} className="rounded-full border border-gold/60 px-4 py-1 text-sm text-gold">{c.name}</span>
            ))}
          </div>
        </div>
      </section>
      <div className="mx-auto max-w-6xl px-5">
        <h2 className="mb-6 mt-12 font-serif text-3xl">Terbaru</h2>
        {latest.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{latest.map((p) => <PostCard key={p.id} p={p} />)}</div>
        ) : (
          <p className="text-charcoal/60">Belum ada artikel.</p>
        )}
        {(page > 1 || hasNext) && (
          <div className="mt-10 flex items-center justify-between text-sm">
            {page > 1 ? <Link href={page === 2 ? "/" : `/?page=${page - 1}`} className="text-gold-dark underline">← Sebelumnya</Link> : <span />}
            {hasNext && <Link href={`/?page=${page + 1}`} className="text-gold-dark underline">Berikutnya →</Link>}
          </div>
        )}
      </div>
    </>
  );
}