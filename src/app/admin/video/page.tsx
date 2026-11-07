// PAKET-3A: kelola video (admin dan editor)
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, videos, categories } from "@/db";
import { requireReviewer } from "@/lib/auth";
import { saveVideo, deleteVideo } from "@/lib/video-actions";
import { AGENDA } from "@/lib/agenda";
import { SumberVideo } from "@/components/admin/SumberVideo";
import { VideoDaftar } from "@/components/admin/VideoDaftar";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  judul: "Judul wajib diisi.",
  youtube: "Alamat YouTube atau ID video tidak valid.",
};
const oks: Record<string, string> = { simpan: "Video disimpan.", hapus: "Video dihapus." };

export default async function AdminVideo({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string; ok?: string }> }) {
  await requireReviewer();
  const { edit, error, ok } = await searchParams;
  const editId = Number(edit) || null;
  const d = db();
  const [list, cats, cur] = await Promise.all([
    d.select().from(videos).orderBy(desc(videos.updatedAt)),
    d.select().from(categories).orderBy(categories.name),
    editId ? d.select().from(videos).where(eq(videos.id, editId)).limit(1) : Promise.resolve([]),
  ]);
  const v = cur[0];
  const input = "mt-1 w-full rounded border p-2";
  return (
    <div className="mx-auto max-w-5xl px-5">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Video</h1>
        <Link href="/admin" className="rounded border px-4 py-2">&larr; Artikel</Link>
      </div>
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{errors[error] ?? "Terjadi kesalahan."}</p>}
      {ok && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">{oks[ok] ?? "Berhasil."}</p>}

      <form key={v?.id ?? "baru"} action={saveVideo} className="mt-6 space-y-4 rounded bg-white/70 p-5">
        <h2 className="font-medium">{v ? "Ubah video" : "Tambah video"}</h2>
        {v && <input type="hidden" name="id" value={v.id} />}
        <label className="block text-sm">Judul
          <input name="title" required maxLength={200} defaultValue={v?.title} className={input} />
        </label>
        <SumberVideo defaultValue={v?.youtubeId} className={input} judulAwal={v?.title} />
        <label className="block text-sm">Slug (alamat halaman; kosongkan agar dibuat dari judul)
          <input name="slug" defaultValue={v?.slug} className={input} />
        </label>
        <label className="block text-sm">Deskripsi
          <textarea name="description" rows={4} maxLength={5000} defaultValue={v?.description} className={input} />
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="block text-sm">Kategori
            <select name="categoryId" defaultValue={v?.categoryId ?? ""} className={input}>
              <option value="">(tanpa kategori)</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">Status
            <select name="status" defaultValue={v?.status ?? "draft"} className={input}>
              <option value="draft">draft</option>
              <option value="published">terbit</option>
            </select>
          </label>
          <label className="flex items-end gap-2 pb-2 text-sm">
            <input type="checkbox" name="featured" defaultChecked={v?.featured} /> Video pilihan
          </label>
        </div>
        <fieldset className="text-sm">
          <legend>Program (video tampil di bagian program pada halaman Video dan Agenda)</legend>
          <div className="mt-2 flex flex-wrap gap-4">
            {AGENDA.map((p) => (
              <label key={p.slug} className="flex items-center gap-2">
                <input type="checkbox" name="programs" value={p.slug} defaultChecked={v?.programs.includes(p.slug)} /> {p.nama}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="flex gap-3">
          <button className="rounded bg-gold px-4 py-2 text-white">{v ? "Simpan perubahan" : "Tambah video"}</button>
          {v && <Link href="/admin/video" className="rounded border px-4 py-2">Batal</Link>}
        </div>
      </form>

      <VideoDaftar items={list.map((x) => ({ id: x.id, title: x.title, status: x.status, featured: x.featured, youtubeId: x.youtubeId }))} hapus={deleteVideo} />
    </div>
  );
}