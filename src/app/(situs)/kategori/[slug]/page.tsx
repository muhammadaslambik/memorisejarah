import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, posts, categories } from "@/db";
import { DaftarArtikel } from "@/components/content/DaftarArtikel";

export const dynamic = "force-dynamic";
const PER_PAGE = 12;

export default async function Kategori({
  params, searchParams,
}: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const { slug } = await params;
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const d = db();
  const [kat] = await d.select().from(categories).where(eq(categories.slug, slug)).limit(1);
  if (!kat) notFound();
  const [rows, cats] = await Promise.all([
    d.select().from(posts).where(and(eq(posts.status, "published"), eq(posts.categoryId, kat.id)))
      .orderBy(desc(posts.publishedAt)).limit(PER_PAGE + 1).offset((page - 1) * PER_PAGE),
    d.select().from(categories).orderBy(categories.name),
  ]);
  return (
    <DaftarArtikel
      judul={kat.name} rows={rows.slice(0, PER_PAGE)} cats={cats} aktif={kat.slug}
      page={page} hasNext={rows.length > PER_PAGE} basePath={`/kategori/${kat.slug}`}
    />
  );
}