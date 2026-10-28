// PAKET-1A: pencarian teks sederhana (ILIKE) pada judul, kutipan, dan isi artikel terbit.
import Link from "next/link";
import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, posts, categories } from "@/db";
import { PostCard } from "@/components/content/PostCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Pencarian" };
const PER_PAGE = 12;

export default async function Cari({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const page = Math.max(1, Number(sp.page) || 1);
  const d = db();

  let rows: (typeof posts.$inferSelect)[] = [];
  let nama = new Map<number, string>();
  if (q.length >= 2) {
    const pola = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    const [hasil, cats] = await Promise.all([
      d.select().from(posts)
        .where(and(
          eq(posts.status, "published"),
          or(ilike(posts.title, pola), ilike(posts.excerpt, pola), ilike(posts.content, pola)),
        ))
        .orderBy(sql`(case when ${posts.title} ilike ${pola} then 0 else 1 end)`, desc(posts.publishedAt))
        .limit(PER_PAGE + 1).offset((page - 1) * PER_PAGE),
      d.select().from(categories),
    ]);
    rows = hasil;
    nama = new Map(cats.map((c) => [c.id, c.name]));
  }
  const hasNext = rows.length > PER_PAGE;
  const tampil = rows.slice(0, PER_PAGE);
  const href = (n: number) => `/cari?q=${encodeURIComponent(q)}${n > 1 ? `&page=${n}` : ""}`;
  const tombol = "inline-flex items-center gap-2 rounded-full border border-ms-line px-5 py-2.5 text-sm text-ms-cream/80 transition hover:border-ms-gold hover:text-ms-gold";

  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 md:px-10 lg:px-16 pt-12">
        <h1 className="font-serif text-4xl font-bold md:text-5xl">Pencarian</h1>
        <form action="/cari" method="get" className="mt-6 flex max-w-xl gap-2">
          <input
            type="search" name="q" defaultValue={q} placeholder="Cari artikel..."
            className="w-full rounded-full border border-ms-line bg-ms-surface px-5 py-2.5 text-ms-cream placeholder:text-ms-cream/40 focus:border-ms-gold focus:outline-none"
          />
          <button type="submit" className="rounded-full bg-ms-gold px-6 py-2.5 text-sm font-semibold text-ms-bg transition hover:opacity-90">Cari</button>
        </form>

        {q.length === 0 && <p className="mt-10 text-ms-cream/60">Ketik kata kunci untuk mencari artikel.</p>}
        {q.length > 0 && q.length < 2 && <p className="mt-10 text-ms-cream/60">Gunakan minimal 2 huruf.</p>}
        {q.length >= 2 && tampil.length === 0 && (
          <p className="mt-10 text-ms-cream/60">Tidak ada artikel yang cocok dengan &ldquo;{q}&rdquo;. Coba kata kunci lain.</p>
        )}
        {tampil.length > 0 && (
          <>
            <p className="mt-8 text-sm text-ms-cream/60">Hasil untuk &ldquo;{q}&rdquo;{page > 1 ? ` (halaman ${page})` : ""}</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tampil.map((p) => <PostCard key={p.id} p={p} kategori={p.categoryId ? nama.get(p.categoryId) : undefined} />)}
            </div>
          </>
        )}
        {(page > 1 || hasNext) && tampil.length > 0 && (
          <div className="mt-10 flex items-center justify-between">
            {page > 1 ? <Link href={href(page - 1)} className={tombol}>&larr; Sebelumnya</Link> : <span />}
            {hasNext && <Link href={href(page + 1)} className={tombol}>Berikutnya &rarr;</Link>}
          </div>
        )}
      </section>
    </div>
  );
}