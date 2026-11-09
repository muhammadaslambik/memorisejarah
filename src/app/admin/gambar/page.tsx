// PAKET-4B: kelola gambar (admin dan editor)
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, images, categories } from "@/db";
import { requireReviewer } from "@/lib/auth";
import { saveGambar, deleteGambar } from "@/lib/gambar-actions";
import { GambarDaftar } from "@/components/admin/GambarDaftar";
import { PageHeader } from "@/components/admin/PageHeader";
import { IkonAdmin } from "@/components/admin/ikon-admin";
import { PilihSumberGambar } from "@/components/admin/PilihSumberGambar";
import { penyimpananSiap } from "@/lib/gambar-simpan";
import { kecil } from "@/lib/gambar-url";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  judul: "Judul wajib diisi.",
  url: "Alamat gambar harus berupa tautan https yang valid.",
  berkas: "Berkas tidak valid: pilih JPG, PNG, WEBP, atau GIF (maksimal 10 MB).",
  belum: "Penyimpanan ImageKit belum disiapkan (IMAGEKIT_PRIVATE_KEY kosong). Gunakan tautan dulu.",
  unggah: "Unggah ke ImageKit gagal. Coba lagi; periksa kunci dan batas gratis ImageKit.",
};
const oks: Record<string, string> = { simpan: "Gambar disimpan.", hapus: "Gambar dihapus." };

export default async function AdminGambar({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string; ok?: string; baru?: string }> }) {
  await requireReviewer();
  const { edit, error, ok, baru } = await searchParams;
  const editId = Number(edit) || null;
  const d = db();
  const [list, cats, cur] = await Promise.all([
    d.select().from(images).orderBy(desc(images.updatedAt)),
    d.select().from(categories).orderBy(categories.name),
    editId ? d.select().from(images).where(eq(images.id, editId)).limit(1) : Promise.resolve([]),
  ]);
  const g = cur[0];
  const input = "mt-1 w-full rounded border p-2";
  return (
    <div className="mx-auto max-w-5xl px-5">
      <PageHeader
        ikon="gambar"
        judul="Gambar"
        deskripsi="Kelola gambar galeri yang tampil di situs."
        aksi={<Link href="/admin/gambar?baru=1" className="a-btn"><IkonAdmin nama="tambah" className="h-4 w-4" /> Gambar Baru</Link>}
      />
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{errors[error] ?? "Terjadi kesalahan."}</p>}
      {ok && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">{oks[ok] ?? "Berhasil."}</p>}

      {(g || baru === "1" || error) && <form key={g?.id ?? "baru"} action={saveGambar} className="mt-6 space-y-4 rounded bg-white/70 p-5">
        <h2 className="font-medium">{g ? "Ubah gambar" : "Tambah gambar"}</h2>
        {g && <input type="hidden" name="id" value={g.id} />}
        <label className="block text-sm">Judul
          <input name="title" required maxLength={200} defaultValue={g?.title} className={input} />
        </label>
        <PilihSumberGambar key={g?.id ?? "baru"} defaultUrl={g?.url} baru={!g} siap={penyimpananSiap()} />
        {g && <img src={kecil(g.url, 800)} alt="" referrerPolicy="no-referrer" className="max-h-48 rounded border" />}
        <label className="block text-sm">Slug (alamat halaman; kosongkan agar dibuat dari judul)
          <input name="slug" defaultValue={g?.slug} className={input} />
        </label>
        <label className="block text-sm">Keterangan
          <textarea name="caption" rows={4} maxLength={5000} defaultValue={g?.caption} className={input} />
        </label>
        <label className="block text-sm">Sumber atau pemilik gambar
          <input name="credit" maxLength={300} defaultValue={g?.credit} className={input} />
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="block text-sm">Kategori
            <select name="categoryId" defaultValue={g?.categoryId ?? ""} className={input}>
              <option value="">(tanpa kategori)</option>
              {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">Status
            <select name="status" defaultValue={g?.status ?? "draft"} className={input}>
              <option value="draft">draft</option>
              <option value="published">terbit</option>
            </select>
          </label>
        </div>
        <div className="flex gap-3">
          <button className="rounded bg-gold px-4 py-2 text-white">{g ? "Simpan perubahan" : "Tambah gambar"}</button>
          {g && <Link href="/admin/gambar" className="rounded border px-4 py-2">Batal</Link>}
        </div>
      </form>}

      <GambarDaftar items={list.map((x) => ({ id: x.id, title: x.title, status: x.status, url: x.url, categoryId: x.categoryId }))} hapus={deleteGambar} cats={cats.map((c) => ({ id: c.id, name: c.name }))} />
    </div>
  );
}