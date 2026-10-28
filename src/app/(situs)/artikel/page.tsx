import { desc, eq } from "drizzle-orm";
import { db, posts, categories } from "@/db";
import { DaftarArtikel } from "@/components/content/DaftarArtikel";

export const dynamic = "force-dynamic";
export const metadata = { title: "Semua Artikel" };
const PER_PAGE = 12;

export default async function SemuaArtikel({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const d = db();
  const [rows, cats] = await Promise.all([
    d.select().from(posts).where(eq(posts.status, "published")).orderBy(desc(posts.publishedAt)).limit(PER_PAGE + 1).offset((page - 1) * PER_PAGE),
    d.select().from(categories).orderBy(categories.name),
  ]);
  return (
    <DaftarArtikel
      judul="Semua Artikel" deskripsi="Kisah, tokoh, dan peristiwa yang membentuk hari ini."
      rows={rows.slice(0, PER_PAGE)} cats={cats} page={page} hasNext={rows.length > PER_PAGE} basePath="/artikel"
    />
  );
}