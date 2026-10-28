// PAKET-1B: kelola video (admin dan editor)
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, videos, categories } from "@/db";
import { requireReviewer } from "@/lib/auth";
import { saveVideo, deleteVideo } from "@/lib/video-actions";
import { ConfirmButton } from "@/components/ConfirmButton";

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
    <div className="mx-auto max-w-5xl px-5 py-10">
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
        <label className="block text-sm">Alamat YouTube atau ID video
          <input name="youtube" required defaultValue={v?.youtubeId} placeholder="https://www.youtube.com/watch?v=..." className={input} />
        </label>
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
        <div className="flex gap-3">
          <button className="rounded bg-gold px-4 py-2 text-white">{v ? "Simpan perubahan" : "Tambah video"}</button>
          {v && <Link href="/admin/video" className="rounded border px-4 py-2">Batal</Link>}
        </div>
      </form>

      <h2 className="mt-10 font-medium">Semua video ({list.length})</h2>
      {list.length === 0 ? (
        <p className="mt-2 text-sm text-charcoal/60">Belum ada video.</p>
      ) : (
        <ul className="mt-3 divide-y divide-cream-dark rounded bg-white/70">
          {list.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-3 p-4">
              <div>
                <Link href={`/admin/video?edit=${x.id}`} className="font-medium hover:text-gold-dark">{x.title}</Link>
                <span className="ml-2 rounded bg-cream-dark px-2 py-0.5 text-xs">{x.status === "published" ? "terbit" : "draft"}</span>
                {x.featured && <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">pilihan</span>}
              </div>
              <form action={deleteVideo}>
                <input type="hidden" name="id" value={x.id} />
                <ConfirmButton pesan={`Hapus video "${x.title}"? Tindakan ini tidak bisa dibatalkan.`} />
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}