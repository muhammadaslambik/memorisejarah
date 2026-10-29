// PAKET-3C2: isi tayangan diambil dari video bertanda program ini; tayang di dalam situs
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, videos } from "@/db";
import { getAgenda } from "@/lib/pengaturan";
import { VideoCard } from "@/components/content/VideoCard";
import { ProgramKosong } from "@/components/home/ProgramBlok";

export const dynamic = "force-dynamic";
const cari = async (slug: string) => (await getAgenda()).find((a) => a.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  return { title: (await cari((await params).slug))?.nama };
}

export default async function AgendaDetail({ params }: { params: Promise<{ slug: string }> }) {
  const a = await cari((await params).slug);
  if (!a) notFound();
  const items = await db().select().from(videos)
    .where(and(eq(videos.status, "published"), sql`${a.slug} = ANY(${videos.programs})`))
    .orderBy(desc(videos.publishedAt));
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <Link href="/agenda" className="text-sm text-ms-gold">&larr; Agenda Kegiatan</Link>
        <div className={`mt-4 rounded-3xl border bg-gradient-to-br p-8 ${a.kelas}`}>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black/30 text-3xl">{a.emoji}</span>
          <h1 className="mt-5 font-serif text-3xl font-bold md:text-4xl">{a.nama}</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-ms-cream/55">{a.sub}</p>
          <p className="mt-4 max-w-3xl text-ms-cream/80">{a.deskripsi}</p>
          {a.jadwal && <p className="mt-4 text-sm text-ms-gold">Jadwal: {a.jadwal}</p>}
        </div>
        <h2 className="mt-12 font-serif text-2xl font-bold">Tayangan</h2>
        {items.length > 0 ? (
          <div className="mt-5 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((v) => <VideoCard key={v.id} v={v} />)}
          </div>
        ) : (
          <div className="mt-5">
            <ProgramKosong />
            <p className="mt-4 text-sm text-ms-cream/55">Segera hadir. Tayangan akan muncul di sini setelah video ditambahkan.</p>
          </div>
        )}
      </section>
    </div>
  );
}