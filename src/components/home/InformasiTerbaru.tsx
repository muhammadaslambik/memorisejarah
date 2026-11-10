// PAKET-19: Informasi Terbaru (dari menu Informasi di CMS). Beranda: satu baris yang digeser. Halaman Informasi: kolom yang lebih luas.
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, infoItems } from "@/db";
import { kecil } from "@/lib/gambar-url";
import { tanggalLengkap } from "@/lib/tanggal";
import { JalurGeser } from "./JalurGeser";

type Item = typeof infoItems.$inferSelect;

function Kartu({ x, kelas }: { x: Item; kelas: string }) {
  const isi = (
    <>
      <div className="relative aspect-video overflow-hidden bg-gradient-to-br from-red-900/70 to-ms-surface">
        {x.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={kecil(x.imageUrl, 640)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
        )}
        {x.label && <span className="absolute left-3 top-3 rounded-full bg-ms-bg/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-ms-gold">{x.label}</span>}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="line-clamp-2 font-serif text-base font-bold leading-snug group-hover:text-ms-gold">{x.title}</h3>
        {x.summary && <p className="mt-2 line-clamp-3 text-sm text-ms-cream/70">{x.summary}</p>}
        <p className="mt-auto pt-3 text-xs text-ms-cream/50">{tanggalLengkap(x.publishedAt)}</p>
      </div>
    </>
  );
  const dasar = `group flex flex-col overflow-hidden rounded-2xl border border-ms-line bg-ms-surface transition hover:border-ms-gold/50 ${kelas}`;
  if (!x.linkUrl) return <article className={dasar}>{isi}</article>;
  return x.linkUrl.startsWith("/")
    ? <Link href={x.linkUrl} className={dasar}>{isi}</Link>
    : <a href={x.linkUrl} target="_blank" rel="noopener noreferrer" className={dasar}>{isi}</a>;
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
