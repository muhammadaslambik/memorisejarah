// PAKET-3C2: bagian program (Diskusi, Podcast, Jejak, Film Dokumenter). Isi otomatis dari video bertanda program;
// bila belum ada, tampil kolom simulasi yang berubah sendiri setelah video ditambahkan lewat CMS.
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, videos } from "@/db";
import { getAgenda } from "@/lib/pengaturan";
import { VideoStrip } from "./VideoStrip";

export function ProgramKosong({ jumlah = 5 }: { jumlah?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: jumlah }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl border border-dashed border-ms-line bg-ms-surface/50">
          <div className="flex aspect-video items-center justify-center bg-ms-bg text-ms-cream/25">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-ms-line text-sm">&#9654;</span>
          </div>
          <p className="p-3 text-xs text-ms-cream/45">Video segera hadir</p>
        </div>
      ))}
    </div>
  );
}

export async function ProgramBlok() {
  const agenda = await getAgenda();
  const semua = await db().select().from(videos).where(eq(videos.status, "published")).orderBy(desc(videos.publishedAt));
  return (
    <div className="space-y-12">
      {agenda.map((a) => {
        const items = semua.filter((v) => v.programs.includes(a.slug));
        return (
          <section key={a.slug}>
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="font-serif text-2xl font-bold"><span className="mr-2">{a.emoji}</span>{a.nama}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-ms-cream/50">{a.sub}</p>
              </div>
              <Link href={`/agenda/${a.slug}`} className="shrink-0 text-sm text-ms-gold">Lihat semua &rarr;</Link>
            </div>
            <div className="mt-4">
              {items.length > 0
                ? <VideoStrip items={items.map((v) => ({ slug: v.slug, title: v.title, youtubeId: v.youtubeId }))} />
                : <ProgramKosong />}
            </div>
          </section>
        );
      })}
    </div>
  );
}