import { eq } from "drizzle-orm";
import { db, posts, categories } from "@/db";
import { savePost } from "@/lib/actions";
import { Editor } from "@/components/Editor";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const isNew = id === "baru";
  const [p] = isNew ? [] : await db().select().from(posts).where(eq(posts.id, Number(id))).limit(1);
  const cats = await db().select().from(categories);
  return (
    <form action={savePost} className="mx-auto max-w-4xl space-y-4 px-5 py-10">
      <h1 className="font-serif text-3xl">{isNew ? "Artikel Baru" : "Edit Artikel"}</h1>
      {p && <input type="hidden" name="id" value={p.id} />}
      <input name="title" defaultValue={p?.title} placeholder="Judul" required className="w-full rounded border p-3 font-serif text-2xl" />
      <input name="slug" defaultValue={p?.slug} placeholder="Slug URL (kosongkan = otomatis dari judul)" className="w-full rounded border p-3 text-sm" />
      <textarea name="excerpt" defaultValue={p?.excerpt} placeholder="Ringkasan singkat" rows={2} className="w-full rounded border p-3" />
      <input name="coverUrl" defaultValue={p?.coverUrl ?? ""} placeholder="URL gambar sampul (https://...)" className="w-full rounded border p-3" />
      <Editor initial={p?.content ?? ""} />
      <div className="flex flex-wrap items-center gap-4">
        <select name="categoryId" defaultValue={p?.categoryId ?? ""} className="rounded border p-2">
          <option value="">Tanpa kategori</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="status" defaultValue={p?.status ?? "draft"} className="rounded border p-2">
          <option value="draft">Draft</option><option value="published">Terbit</option>
        </select>
        <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={p?.featured} /> Pilihan</label>
        <button className="ml-auto rounded bg-charcoal px-6 py-2 text-cream hover:bg-gold-dark">Simpan</button>
      </div>
    </form>
  );
}
