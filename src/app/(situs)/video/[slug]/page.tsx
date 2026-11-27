// PAKET-3A/15M: halaman tonton video bergaya YouTube: pemutar langsung berputar, tombol Bagikan, deskripsi, daftar Video Lainnya di kanan,
// lalu bagian program (Diskusi Sejarah, Podcast, Jejak Memori Sejarah, Film Dokumenter). Tanpa bilah samping; header tetap header Memori Sejarah.
import { notFound } from "next/navigation";
import { tanggalLengkap } from "@/lib/tanggal";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, videos } from "@/db";
import { ProgramBlok } from "@/components/home/ProgramBlok";
import { PemutarMenonton } from "@/components/video/PemutarMenonton";
import { VideoLainnyaSamping } from "@/components/video/VideoLainnyaSamping";
import { VideoStrip } from "@/components/home/VideoStrip";
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
    .where(and(eq(videos.status, "published"), ne(videos.id, v.id))).orderBy(desc(videos.publishedAt)).limit(60);
  return (
    <div className="-mb-16 min-h-[70vh] overflow-x-clip bg-ms-bg pb-24 text-ms-cream">
      <div className="tonton-grid mx-auto max-w-[90rem] px-3 pt-4 sm:px-6 sm:pt-6 lg:px-10">
        <div className="tonton-pemutar min-w-0">
          <PemutarMenonton slug={v.slug} youtubeId={v.youtubeId} judul={v.title} lain={lain.map((x) => ({ slug: x.slug, title: x.title, youtubeId: x.youtubeId }))} />
        </div>
        <article className="tonton-info min-w-0 space-y-4">
          <h1 className="font-serif text-xl font-bold leading-snug sm:text-2xl">{v.title}</h1>
          <BagikanVideo judul={v.title} youtubeId={v.youtubeId} />
          <DeskripsiVideo tanggal={tanggalLengkap(v.publishedAt)} deskripsi={v.description} />
        </article>

        {lain.length > 0 && (
          // PAKET-38: tinggi kolom ini dikunci sama dengan kolom kiri (pemutar + judul + deskripsi); video yang tidak muat tersedia lewat tombol "Tampilkan video lainnya"
          <aside aria-label="Video lainnya" className="tonton-samping relative min-w-0">
            <VideoLainnyaSamping items={lain.map((x) => ({ slug: x.slug, title: x.title, youtubeId: x.youtubeId, tanggal: tanggalLengkap(x.publishedAt) }))} />
          </aside>
        )}
      </div>

      {/* mode teater: Video Lainnya berpindah ke baris horizontal di bawah video utama (di atas bagian program), bisa digeser kanan-kiri */}
      {lain.length > 0 && (
        <section aria-label="Video lainnya" className="tonton-horizontal mx-auto mt-10 max-w-[90rem] px-3 sm:px-6 lg:px-10">
          <h2 className="font-serif text-xl font-bold sm:text-2xl">Video Lainnya</h2>
          <div className="mt-4"><VideoStrip items={lain.map((x) => ({ slug: x.slug, title: x.title, youtubeId: x.youtubeId }))} /></div>
        </section>
      )}

      <div className="mx-auto mt-12 max-w-[90rem] space-y-14 px-3 sm:px-6 lg:px-10">
        <ProgramBlok />
      </div>
    </div>
  );
}
