// PAKET-3A
import { notFound } from "next/navigation";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, videos } from "@/db";
import { VideoStrip } from "@/components/home/VideoStrip";
import { ProgramBlok } from "@/components/home/ProgramBlok";

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
    .where(and(eq(videos.status, "published"), ne(videos.id, v.id))).orderBy(desc(videos.publishedAt)).limit(10);
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <article className="mx-auto max-w-5xl px-5 pt-12">
        <h1 className="font-serif text-3xl leading-tight md:text-4xl">{v.title}</h1>
        <p className="mt-3 text-sm text-ms-gold">{v.publishedAt?.toLocaleDateString("id-ID", { dateStyle: "long" })}</p>
        <div className="mt-6 aspect-video overflow-hidden rounded-xl border border-ms-line bg-black">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
            title={v.title}
            className="h-full w-full"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
        {v.description && <p className="mt-6 whitespace-pre-line text-ms-cream/80">{v.description}</p>}
      </article>

      <div className="mx-auto mt-14 max-w-[90rem] space-y-14 px-6 md:px-10 lg:px-16">
        {lain.length > 0 && (
          <section>
            <h2 className="font-serif text-2xl font-bold">Video Lainnya</h2>
            <div className="mt-4">
              <VideoStrip items={lain.map((x) => ({ slug: x.slug, title: x.title, youtubeId: x.youtubeId }))} />
            </div>
          </section>
        )}
        <ProgramBlok />
      </div>
    </div>
  );
}