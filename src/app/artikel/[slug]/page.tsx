import { notFound } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db, posts } from "@/db";
import { PostCard } from "@/components/PostCard";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p] = await db().select().from(posts).where(eq(posts.slug, slug)).limit(1);
  return { title: p?.title, description: p?.excerpt };
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [p] = await db().select().from(posts).where(and(eq(posts.slug, slug), eq(posts.status, "published"))).limit(1);
  if (!p) notFound();

  // Artikel terkait: kategori yang sama
  const related = p.categoryId
    ? await db().select().from(posts)
        .where(and(eq(posts.categoryId, p.categoryId), eq(posts.status, "published"), ne(posts.id, p.id))).limit(3)
    : [];

  const url = encodeURIComponent(`https://memorisejarah.eu.org/artikel/${p.slug}`);
  const share = [
    ["WhatsApp", `https://wa.me/?text=${url}`],
    ["Facebook", `https://www.facebook.com/sharer/sharer.php?u=${url}`],
    ["X", `https://twitter.com/intent/tweet?url=${url}`],
  ];

  return (
    <article className="mx-auto max-w-3xl px-5 pt-12">
      <h1 className="font-serif text-4xl leading-tight md:text-5xl">{p.title}</h1>
      <p className="mt-3 text-sm text-gold-dark">{p.publishedAt?.toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
      {p.coverUrl && <img src={p.coverUrl} alt="" className="mt-8 w-full rounded-lg" />}
      <div className="prose prose-lg prose-stone mt-8 max-w-none prose-headings:font-serif prose-a:text-gold-dark"
        dangerouslySetInnerHTML={{ __html: p.content }} />
      <div className="mt-10 flex gap-3 border-t border-cream-dark pt-6 text-sm">
        <span>Bagikan:</span>
        {share.map(([n, h]) => <a key={n} href={h} target="_blank" rel="noopener" className="text-gold-dark underline">{n}</a>)}
      </div>
      {related.length > 0 && (<>
        <h2 className="mb-5 mt-12 font-serif text-2xl">Baca Juga</h2>
        <div className="grid gap-5 sm:grid-cols-3">{related.map((r) => <PostCard key={r.id} p={r} />)}</div>
      </>)}
    </article>
  );
}
