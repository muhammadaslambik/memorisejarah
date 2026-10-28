import Link from "next/link";
import { PostCard } from "./PostCard";

type Item = { id: number; slug: string; title: string; excerpt: string; coverUrl: string | null; publishedAt: Date | null; categoryId: number | null };
type Kat = { id: number; name: string; slug: string };

export function DaftarArtikel(props: {
  judul: string; deskripsi?: string; rows: Item[]; cats: Kat[];
  aktif?: string; page: number; hasNext: boolean; basePath: string;
}) {
  const { judul, deskripsi, rows, cats, aktif, page, hasNext, basePath } = props;
  const nama = new Map(cats.map((c) => [c.id, c.name]));
  const chip = (on: boolean) =>
    `rounded-full border px-4 py-1.5 text-sm transition ${on ? "border-ms-gold bg-ms-gold text-ms-bg" : "border-ms-line text-ms-cream/80 hover:border-ms-gold hover:text-ms-gold"}`;
  const href = (n: number) => (n === 1 ? basePath : `${basePath}?page=${n}`);
  const tombol = "inline-flex items-center gap-2 rounded-full border border-ms-line px-5 py-2.5 text-sm text-ms-cream/80 transition hover:border-ms-gold hover:text-ms-gold";
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-6xl px-5 pt-12">
        <h1 className="font-serif text-4xl font-bold md:text-5xl">{judul}</h1>
        {deskripsi && <p className="mt-3 max-w-2xl text-ms-cream/70">{deskripsi}</p>}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href="/artikel" className={chip(!aktif)}>Semua</Link>
          {cats.map((c) => <Link key={c.id} href={`/kategori/${c.slug}`} className={chip(aktif === c.slug)}>{c.name}</Link>)}
        </div>
        {rows.length > 0 ? (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {rows.map((p) => <PostCard key={p.id} p={p} kategori={p.categoryId ? nama.get(p.categoryId) : undefined} />)}
          </div>
        ) : (
          <p className="mt-10 text-ms-cream/60">Belum ada artikel.</p>
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