import { eq } from "drizzle-orm";
import { db, posts, categories, postCategories } from "@/db";
import { savePost } from "@/lib/actions";
import { redirect } from "next/navigation";
import { canEditPost, isReviewer, needsApproval, requireUser } from "@/lib/auth";
import { Editor } from "@/components/Editor";
import { TombolKembali } from "@/components/admin/TombolKembali";
import { MenuArtikel } from "@/components/admin/MenuArtikel";
import { PilihSampul } from "@/components/admin/PilihSampul";
import { TerjemahJudul } from "@/components/admin/TerjemahJudul";
import { PenjagaGambar } from "@/components/admin/PenjagaGambar";
import { urlIKDalam } from "@/lib/imagekit";

export const dynamic = "force-dynamic";

export default async function EditPost({ params }: { params: Promise<{ id: string }> }) {
  const me = await requireUser();
  const { id } = await params;
  const isNew = id === "baru";
  const [p] = isNew ? [] : await db().select().from(posts).where(eq(posts.id, Number(id))).limit(1);
  if (!isNew && (!p || !canEditPost(me, p))) redirect("/admin");
  const approval = needsApproval(me);
  const cats = await db().select().from(categories).orderBy(categories.name);
  const terpilih = new Set(isNew ? [] : (await db().select({ id: postCategories.categoryId }).from(postCategories).where(eq(postCategories.postId, Number(id)))).map((r) => r.id));
  return (
    <>
    <form action={savePost} className="-mt-5 mx-auto max-w-4xl space-y-4 px-5 pb-10 pt-1">
      {/* tombol kembali kini berupa ikon di bilah alat editor */}
      <h1 className="font-serif text-3xl">{isNew ? "Artikel Baru" : "Edit Artikel"}</h1>
      {p && <input type="hidden" name="id" value={p.id} />}
      {p && <PenjagaGambar postId={p.id} awal={[...urlIKDalam(p.content), p.coverUrl?.split("?")[0]].filter((u): u is string => !!u)} />}
      {p?.reviewNote && p.status === "draft" && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          <strong>Catatan dari editor:</strong> {p.reviewNote}
        </p>
      )}
      {approval && (
        <p className="rounded bg-cream-dark p-3 text-sm">
          Artikel Anda akan terbit setelah disetujui admin atau editor.
          {p?.status === "published" && " Karena artikel ini sudah terbit, menyimpannya akan menariknya dari situs sampai disetujui lagi."}
        </p>
      )}
      <input name="title" defaultValue={p?.title} placeholder="Judul" required spellCheck={false} className="w-full rounded border p-3 font-serif text-2xl" />
      <input name="slug" defaultValue={p?.slug} placeholder="Slug URL (kosongkan = otomatis dari judul)" spellCheck={false} className="w-full rounded border p-3 text-sm" />
      <textarea name="excerpt" defaultValue={p?.excerpt} placeholder="Ringkasan singkat" spellCheck={false} rows={2} className="w-full rounded border p-3" />
      <TerjemahJudul />
      <PilihSampul defaultUrl={p?.coverUrl ?? ""} />
      <Editor initial={p?.content ?? ""} catatanKaki awal={<TombolKembali />} />
      <div className="flex flex-wrap items-center gap-4">
        <fieldset className="w-full rounded border p-3 text-sm">
          <legend className="px-1">Kategori (boleh lebih dari satu)</legend>
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {cats.filter((a) => a.parentId === null).map((a) => (
              <div key={a.id}>
                {cats.some((c) => c.parentId === a.id) ? <p className="font-medium">{a.name}</p> : null}
                <label className="flex items-center gap-2"><input type="checkbox" name="categoryIds" value={a.id} defaultChecked={terpilih.has(a.id)} /> {cats.some((c) => c.parentId === a.id) ? `${a.name} (umum)` : a.name}</label>
                {cats.filter((c) => c.parentId === a.id).map((c) => (
                  <label key={c.id} className="ml-5 flex items-center gap-2"><input type="checkbox" name="categoryIds" value={c.id} defaultChecked={terpilih.has(c.id)} /> {c.name}</label>
                ))}
              </div>
            ))}
          </div>
        </fieldset>
        {approval ? (
          <select name="status" defaultValue={!p || p.status === "draft" ? "draft" : "pending"} className="rounded border p-2">
            <option value="draft">Draft</option><option value="pending">Ajukan untuk terbit (perlu persetujuan)</option>
          </select>
        ) : (
          <select name="status" defaultValue={p?.status ?? "draft"} className="rounded border p-2">
            <option value="draft">Draft</option>
            {p?.status === "pending" && <option value="pending">Menunggu persetujuan (belum diputuskan)</option>}
            <option value="published">{p?.status === "pending" ? "Setujui dan terbitkan" : "Terbit"}</option>
          </select>
        )}
        {isReviewer(me.role) && (
          <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={p?.featured} /> Pilihan (tampil di hero)</label>
        )}
        <button className="ml-auto rounded bg-charcoal px-6 py-2 text-cream hover:bg-gold-dark">Simpan</button>
      </div>
    </form>
    <MenuArtikel />
    </>
  );
}
