// PAKET-4A
import { notFound } from "next/navigation";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, images, categories } from "@/db";
import { GambarCard } from "@/components/content/GambarCard";
import { tanggal } from "@/components/content/PostCard";

export const dynamic = "force-dynamic";

const cari = async (slug: string) => {
  const [g] = await db().select().from(images).where(and(eq(images.slug, slug), eq(images.status, "published"))).limit(1);
  return g;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const g = await cari((await params).slug);
  return {
    title: g?.title,
    description: g?.caption.slice(0, 160),
    openGraph: g ? { images: [g.url] } : undefined,
  };
}

export default async function GambarPage({ params }: { params: Promise<{ slug: string }> }) {
  const g = await cari((await params).slug);
  if (!g) notFound();
  const d = db();
  const [lain, kat] = await Promise.all([
    d.select().from(images).where(and(eq(images.status, "published"), ne(images.id, g.id))).orderBy(desc(images.publishedAt)).limit(8),
    g.categoryId ? d.select().from(categories).where(eq(categories.id, g.categoryId)).limit(1) : Promise.resolve([]),
  ]);
  const info = [kat[0]?.name, tanggal(g.publishedAt)].filter(Boolean).join(" \u2022 ");
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <article className="mx-auto max-w-5xl px-5 pt-12">
        <h1 className="font-serif text-3xl leading-tight md:text-4xl">{g.title}</h1>
        {info && <p className="mt-3 text-sm text-ms-gold">{info}</p>}
        <div className="mt-6 overflow-hidden rounded-xl border border-ms-line bg-ms-surface">
          <img src={g.url} alt={g.title} referrerPolicy="no-referrer" className="mx-auto max-h-[80vh] w-auto max-w-full object-contain" />
        </div>
        {g.credit && <p className="mt-3 text-sm italic text-ms-cream/60">Sumber: {g.credit}</p>}
        {g.caption && <p className="mt-6 whitespace-pre-line text-ms-cream/80">{g.caption}</p>}
      </article>

      {lain.length > 0 && (
        <section className="mx-auto mt-14 max-w-[90rem] px-6 md:px-10 lg:px-16">
          <h2 className="font-serif text-2xl font-bold">Gambar Lainnya</h2>
          <div className="mt-4 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {lain.map((x) => <GambarCard key={x.id} g={x} />)}
          </div>
        </section>
      )}
    </div>
  );
}