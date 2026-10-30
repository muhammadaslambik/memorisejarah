// PAKET-4A
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, images } from "@/db";
import { GambarCard } from "@/components/content/GambarCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Gambar" };
const PER_PAGE = 12;

export default async function Gambar({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const rows = await db().select().from(images).where(eq(images.status, "published"))
    .orderBy(desc(images.publishedAt)).limit(PER_PAGE + 1).offset((page - 1) * PER_PAGE);
  const tampil = rows.slice(0, PER_PAGE);
  const hasNext = rows.length > PER_PAGE;
  const href = (n: number) => (n === 1 ? "/gambar" : `/gambar?page=${n}`);
  const tombol = "inline-flex items-center gap-2 rounded-full border border-ms-line px-5 py-2.5 text-sm text-ms-cream/80 transition hover:border-ms-gold hover:text-ms-gold";
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <h1 className="font-serif text-4xl font-bold md:text-5xl">Gambar</h1>
        <p className="mt-3 max-w-2xl text-ms-cream/70">Foto, lukisan, dan arsip visual dari perjalanan sejarah.</p>
        {tampil.length > 0 ? (
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
            {tampil.map((g) => <GambarCard key={g.id} g={g} />)}
          </div>
        ) : (
          <p className="mt-10 text-ms-cream/60">Belum ada gambar.</p>
        )}
        {(page > 1 || hasNext) && (
          <div className="mt-10 flex items-center justify-between">
            {page > 1 ? <Link href={href(page - 1)} className={tombol}>&larr; Sebelumnya</Link> : <span />}
            {hasNext && <Link href={href(page + 1)} className={tombol}>Berikutnya &rarr;</Link>}
          </div>
        )}
      </section>
    </div>
  );
}