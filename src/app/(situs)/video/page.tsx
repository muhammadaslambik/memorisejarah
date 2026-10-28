// PAKET-1B
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, videos } from "@/db";
import { VideoCard } from "@/components/content/VideoCard";

export const dynamic = "force-dynamic";
export const metadata = { title: "Video" };
const PER_PAGE = 12;

export default async function Video({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number((await searchParams).page) || 1);
  const rows = await db().select().from(videos).where(eq(videos.status, "published"))
    .orderBy(desc(videos.publishedAt)).limit(PER_PAGE + 1).offset((page - 1) * PER_PAGE);
  const tampil = rows.slice(0, PER_PAGE);
  const hasNext = rows.length > PER_PAGE;
  const href = (n: number) => (n === 1 ? "/video" : `/video?page=${n}`);
  const tombol = "inline-flex items-center gap-2 rounded-full border border-ms-line px-5 py-2.5 text-sm text-ms-cream/80 transition hover:border-ms-gold hover:text-ms-gold";
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 md:px-10 lg:px-16 pt-12">
        <h1 className="font-serif text-4xl font-bold md:text-5xl">Video</h1>
        <p className="mt-3 max-w-2xl text-ms-cream/70">Diskusi, dokumenter, dan kisah sejarah dalam bentuk video.</p>
        {tampil.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {tampil.map((v) => <VideoCard key={v.id} v={v} />)}
          </div>
        ) : (
          <p className="mt-10 text-ms-cream/60">Belum ada video.</p>
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