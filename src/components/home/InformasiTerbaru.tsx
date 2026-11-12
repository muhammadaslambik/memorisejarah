// PAKET-19/21: Informasi Terbaru (dari menu Informasi di CMS). Beranda: satu baris yang digeser. Halaman Informasi: kolom yang lebih luas.
// Setiap kartu boleh berisi gambar atau video (YouTube, Instagram, TikTok, X, Facebook, Vimeo, berkas) dan animasi ringan.
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, infoItems } from "@/db";
import { kecil } from "@/lib/gambar-url";
import { tanggalLengkap } from "@/lib/tanggal";
import { embedDariUrl } from "@/lib/embed-video";
import { AnimasiMasuk } from "@/components/AnimasiMasuk";
import { JalurGeser } from "./JalurGeser";
import { MediaKartu } from "./MediaKartu";

type Item = typeof infoItems.$inferSelect;

function Kartu({ x, kelas }: { x: Item; kelas: string }) {
  const embed = x.videoUrl ? embedDariUrl(x.videoUrl) : null;
  const gambar = x.imageUrl ? kecil(x.imageUrl, 640) : "";
  const judul = x.linkUrl
    ? (x.linkUrl.startsWith("/")
      ? <Link href={x.linkUrl} className="hover:text-ms-gold">{x.title}</Link>
      : <a href={x.linkUrl} target="_blank" rel="noopener noreferrer" className="hover:text-ms-gold">{x.title}</a>)
    : x.title;
  return (
    <AnimasiMasuk anim={x.animation} className={kelas}>
      <article className="flex h-full flex-col overflow-hidden rounded-2xl border border-ms-line bg-ms-surface transition hover:border-ms-gold/50">
        {embed ? (
          <MediaKartu embed={embed} gambar={gambar} judul={x.title} />
        ) : (
          <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-red-900/70 to-ms-surface">
            {gambar && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={gambar} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover" />
            )}
          </div>
        )}
        <div className="flex flex-1 flex-col p-4">
          {x.label && <span className="mb-2 w-fit rounded-full bg-ms-bg/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ms-gold">{x.label}</span>}
          <h3 className="line-clamp-2 font-serif text-base font-bold leading-snug">{judul}</h3>
          {x.summary && <p className="mt-2 line-clamp-3 text-sm text-ms-cream/70">{x.summary}</p>}
          <p className="mt-auto pt-3 text-xs text-ms-cream/50">{tanggalLengkap(x.publishedAt)}</p>
        </div>
      </article>
    </AnimasiMasuk>
  );
}

export async function InformasiTerbaru({ mode }: { mode: "jalur" | "grid" }) {
  let items: Item[] = [];
  try {
    items = await db().select().from(infoItems).where(eq(infoItems.status, "published"))
      .orderBy(desc(infoItems.publishedAt), desc(infoItems.id)).limit(mode === "jalur" ? 12 : 60);
  } catch { /* tanpa database (mis. saat build) atau tabel belum dibuat: tampil kosong, situs tetap jalan */ }
  if (items.length === 0) return <p className="mt-6 text-sm text-ms-cream/60">Belum ada informasi terbaru.</p>;
  if (mode === "jalur") {
    return (
      <div className="mt-6">
        <JalurGeser>{items.map((x) => <Kartu key={x.id} x={x} kelas="min-w-0 shrink-0 basis-[78%] snap-start sm:basis-[calc((100%-1rem)/2)] lg:basis-[calc((100%-3rem)/4)]" />)}</JalurGeser>
      </div>
    );
  }
  return <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{items.map((x) => <Kartu key={x.id} x={x} kelas="" />)}</div>;
}
