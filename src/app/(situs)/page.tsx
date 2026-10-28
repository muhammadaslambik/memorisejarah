// PAKET-2A
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, posts, categories, users } from "@/db";
import { PostCard, tanggal } from "@/components/content/PostCard";
import { PostCardMini } from "@/components/content/PostCardMini";
import { HeroCarousel } from "@/components/home/HeroCarousel";

export const dynamic = "force-dynamic";

const label = "inline-flex items-center rounded-full bg-gradient-to-r from-red-900 to-amber-700 px-4 py-2 text-sm font-semibold text-white";
const badge = "rounded-full bg-ms-gold px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ms-bg";
const tombol = "inline-flex items-center gap-2 rounded-full border border-ms-line px-5 py-2.5 text-sm text-ms-cream/80 transition hover:border-ms-gold hover:text-ms-gold";
const wadah = "mx-auto max-w-[90rem] px-6 md:px-10 lg:px-16";

export default async function Home() {
  const d = db();
  const [hasil, cats] = await Promise.all([
    d.select({ p: posts, penulis: users.name }).from(posts).leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.status, "published")).orderBy(desc(posts.publishedAt)).limit(13),
    d.select().from(categories),
  ]);
  const rows = hasil.map((r) => ({ ...r.p, penulis: r.penulis ?? "" }));
  const namaKat = new Map(cats.map((c) => [c.id, c.name]));
  const kat = (id: number | null) => (id ? namaKat.get(id) ?? "" : "");
  // Pilihan = artikel bertanda featured; kalau kurang dari 4, dilengkapi artikel terbaru
  const pilihan = [...rows.filter((p) => p.featured), ...rows.filter((p) => !p.featured)].slice(0, 4);
  const utama = pilihan[0];
  const samping = pilihan.slice(1, 4);
  const terbaru = rows;
  const baris1 = terbaru.slice(0, 3);
  const baris2 = terbaru.slice(3, 8);
  const baris3 = terbaru.slice(8, 13);

  if (!utama) {
    return <div className="-mb-16 min-h-[60vh] bg-ms-bg px-5 py-24 text-center text-ms-cream/70">Belum ada artikel.</div>;
  }

  const slides = pilihan.map((p) => ({
    slug: p.slug, title: p.title, coverUrl: p.coverUrl, kategori: kat(p.categoryId),
    tanggal: tanggal(p.publishedAt), penulis: p.penulis,
  }));
  const grid5 = "mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5";

  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className={`${wadah} pt-6`}>
        <HeroCarousel slides={slides} />
      </section>

      <section className={`${wadah} pt-14`}>
        <h2 className={label}>&#9733; Artikel Pilihan</h2>
        <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Link href={`/artikel/${utama.slug}`} className="group grid overflow-hidden rounded-3xl border border-ms-line bg-ms-surface md:grid-cols-2">
            <div className="relative min-h-60 bg-ms-bg">
              {utama.coverUrl && <img src={utama.coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />}
            </div>
            <div className="flex flex-col justify-center p-6 md:p-8">
              {kat(utama.categoryId) && <span className={`${badge} self-start`}>{kat(utama.categoryId)}</span>}
              <h3 className="mt-4 font-serif text-2xl font-bold leading-snug group-hover:text-ms-gold">{utama.title}</h3>
              <p className="mt-3 line-clamp-4 text-sm text-ms-cream/70">{utama.excerpt}</p>
              <span className="mt-5 inline-flex items-center gap-2 self-start rounded-full bg-ms-cream px-5 py-2.5 text-sm font-semibold text-ms-bg">
                Baca Selengkapnya &rarr;
              </span>
            </div>
          </Link>
          <div className="flex flex-col gap-4">
            {samping.map((p, i) => (
              <Link key={p.id} href={`/artikel/${p.slug}`} className="group flex items-center gap-4 rounded-2xl border border-ms-line bg-ms-surface p-4 transition hover:border-ms-gold/50">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ms-line font-serif text-ms-gold">{i + 1}</span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-semibold uppercase tracking-wider text-ms-gold">
                    {[kat(p.categoryId), tanggal(p.publishedAt)].filter(Boolean).join(" \u2022 ")}
                  </span>
                  <span className="mt-1 block font-serif font-bold leading-snug group-hover:text-ms-gold">{p.title}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={`${wadah} pt-14`}>
        <h2 className={label}>Artikel Terbaru</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {baris1.map((p) => <PostCard key={p.id} p={p} kategori={kat(p.categoryId)} />)}
        </div>
        {baris2.length > 0 && (
          <div className={grid5}>{baris2.map((p) => <PostCardMini key={p.id} p={p} kategori={kat(p.categoryId)} />)}</div>
        )}
        {baris3.length > 0 && (
          <div className={grid5}>{baris3.map((p) => <PostCardMini key={p.id} p={p} kategori={kat(p.categoryId)} />)}</div>
        )}
        <div className="mt-8 flex justify-end">
          <Link href="/artikel" className={tombol}>Artikel Lainnya &rarr;</Link>
        </div>
      </section>
    </div>
  );
}