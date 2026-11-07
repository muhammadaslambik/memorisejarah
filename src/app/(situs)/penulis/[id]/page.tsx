// PAKET-12D: semua tulisan seorang penulis
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { db, posts } from "@/db";
import { kolomKartu } from "@/lib/kolom";
import { ambilPenulis } from "@/lib/penulis";
import { Avatar } from "@/components/content/Avatar";
import { PostCardMini } from "@/components/content/PostCardMini";

export const dynamic = "force-dynamic";

const ambil = async (id: string) => {
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? ambilPenulis(n) : null;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const p = await ambil((await params).id);
  return p ? { title: `Tulisan ${p.nama}` } : {};
}

export default async function TulisanPenulis({ params }: { params: Promise<{ id: string }> }) {
  const p = await ambil((await params).id);
  if (!p) notFound();
  const tulisan = await db().select(kolomKartu).from(posts)
    .where(and(eq(posts.authorId, p.id), eq(posts.status, "published"))).orderBy(desc(posts.publishedAt)).limit(60);
  return (
    <div className="-mb-16 min-h-[70vh] bg-ms-bg pb-24 text-ms-cream">
      <section className="mx-auto max-w-[90rem] px-6 pt-12 md:px-10 lg:px-16">
        <Link href="/artikel" className="text-sm text-ms-cream/60 hover:text-ms-gold">&larr; Semua artikel</Link>
        <div className="mt-6 flex items-center gap-5">
          <Avatar nama={p.nama} url={p.foto} ukuran={84} />
          <div className="min-w-0">
            <h1 className="font-serif text-2xl sm:text-3xl font-bold md:text-4xl">Tulisan oleh {p.nama.split(",")[0]}</h1>
            <p className="mt-1 text-ms-cream/70">{[p.peran, `${p.jumlah} tulisan terbit`].filter(Boolean).join(" \u2022 ")}</p>
            {p.profilSlug && <Link href={`/${p.profilSlug}`} className="mt-1 inline-block text-sm text-ms-gold underline underline-offset-4">Lihat profil redaksi</Link>}
          </div>
        </div>
        {tulisan.length === 0 ? (
          <p className="mt-10 text-ms-cream/70">Belum ada tulisan yang terbit.</p>
        ) : (
          <div className="mt-8 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-5">
            {tulisan.map((t) => <PostCardMini key={t.id} p={t} />)}
          </div>
        )}
        {p.jumlah > tulisan.length && <p className="mt-6 text-sm text-ms-cream/60">Menampilkan {tulisan.length} tulisan terbaru dari {p.jumlah}.</p>}
      </section>
    </div>
  );
}
