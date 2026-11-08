// PAKET-3A/15M: halaman tonton video bergaya YouTube: pemutar langsung berputar, tombol Bagikan, deskripsi, daftar Video Lainnya di kanan,
// lalu bagian program (Diskusi Sejarah, Podcast, Jejak Memori Sejarah, Film Dokumenter). Tanpa bilah samping; header tetap header Memori Sejarah.
import Link from "next/link";
import { notFound } from "next/navigation";
import { tanggalLengkap } from "@/lib/tanggal";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, videos } from "@/db";
import { ProgramBlok } from "@/components/home/ProgramBlok";
import { PemutarMenonton } from "@/components/video/PemutarMenonton";
import { BagikanVideo } from "@/components/video/BagikanVideo";
import { DeskripsiVideo } from "@/components/video/DeskripsiVideo";

export const dynamic = "force-dynamic";

const cari = async (slug: string) => {
  const [v] = await db().select().from(videos).where(and(eq(videos.slug, slug), eq(videos.status, "published"))).limit(1);
  return v;
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const v = await cari((await params).slug);
  return { title: v?.title, description: v?.description.slice(0, 160) };
}

export default async function VideoPage({ params }: { params: Promise<{ slug: string }> }) {
  const v = await cari((await params).slug);
  if (!v || !/^[A-Za-z0-9_-]{11}$/.test(v.youtubeId)) notFound();
  const lain = await db().select().from(videos)
    .where(and(eq(videos.status, "published"), ne(videos.id, v.id))).orderBy(desc(videos.publishedAt)).limit(12);
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <div className="tonton-grid mx-auto grid max-w-[90rem] gap-6 px-3 pt-4 sm:px-6 sm:pt-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:px-10">
        <article className="min-w-0 space-y-4">
          <PemutarMenonton youtubeId={v.youtubeId} judul={v.title} lain={lain.map((x) => ({ slug: x.slug, title: x.title, youtubeId: x.youtubeId }))} />
          <h1 className="font-serif text-xl font-bold leading-snug sm:text-2xl">{v.title}</h1>
          <BagikanVideo judul={v.title} youtubeId={v.youtubeId} />
          <DeskripsiVideo tanggal={tanggalLengkap(v.publishedAt)} deskripsi={v.description} />
        </article>

        {lain.length > 0 && (
          <aside aria-label="Video lainnya" className="min-w-0">
            <h2 className="font-serif text-lg font-bold">Video Lainnya</h2>
            <ul className="mt-3 space-y-3">
              {lain.map((x) => (
                <li key={x.id}>
                  <Link href={`/video/${x.slug}`} className="group flex gap-3">
                    <span className="relative block aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-ms-surface sm:w-44">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`https://i.ytimg.com/vi/${x.youtubeId}/mqdefault.jpg`} alt="" loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                    </span>
                    <span className="min-w-0">
                      <span className="line-clamp-3 block text-sm font-semibold leading-snug group-hover:text-ms-gold">{x.title}</span>
                      <span className="mt-1 block text-xs text-ms-cream/60">{tanggalLengkap(x.publishedAt)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>

      <div className="mx-auto mt-12 max-w-[90rem] space-y-14 px-3 sm:px-6 lg:px-10">
        <ProgramBlok />
      </div>
    </div>
  );
}
