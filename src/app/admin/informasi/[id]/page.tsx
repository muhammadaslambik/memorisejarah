// PAKET-19: Informasi Baru / Edit Informasi (kartu pendek untuk bagian Informasi Terbaru)
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db, infoItems, videos } from "@/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { PilihMedia } from "@/components/admin/PilihMedia";
import { requireReviewer } from "@/lib/auth";
import { saveInfoItem } from "@/lib/info-actions";
import { ANIMASI } from "@/lib/informasi-tata";

export const dynamic = "force-dynamic";
const errors: Record<string, string> = {
  judul: "Judul wajib diisi.",
  url: "Alamat gambar harus berupa tautan https yang valid.",
  video: "Alamat video harus berupa tautan https yang valid.",
  berkas: "Berkas tidak valid: pilih JPG, PNG, WEBP, atau GIF (maksimal 10 MB).",
  belum: "Penyimpanan ImageKit belum disiapkan. Gunakan tautan dulu.",
  unggah: "Unggah ke ImageKit gagal. Coba lagi.",
};

export default async function FormInformasi({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireReviewer();
  const { id: idStr } = await params;
  const { error } = await searchParams;
  const baru = idStr === "baru";
  const id = baru ? null : Number(idStr);
  if (!baru && !id) redirect("/admin/informasi?tab=terbaru");
  const [x] = id ? await db().select().from(infoItems).where(eq(infoItems.id, id)).limit(1) : [];
  const galeriVideo = await db().select({ id: videos.id, title: videos.title, youtubeId: videos.youtubeId }).from(videos).orderBy(desc(videos.id));
  if (!baru && !x) redirect("/admin/informasi?tab=terbaru");
  const input = "mt-1 w-full rounded-lg border p-2";
  return (
    <div>
      <PageHeader
        ikon="informasi"
        judul={baru ? "Informasi Baru" : "Edit Informasi"}
        deskripsi="Tampil di bagian Informasi Terbaru pada Beranda (satu baris yang digeser) dan halaman Informasi."
        aksi={<Link href="/admin/informasi?tab=terbaru" className="rounded border px-4 py-2">&larr; Daftar informasi</Link>}
      />
      {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors[error] ?? "Terjadi kesalahan."}</p>}
      <form action={saveInfoItem} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        {x && <input type="hidden" name="id" value={x.id} />}
        <div className="a-card space-y-4 p-5">
          <label className="block text-sm">Judul
            <input name="title" required maxLength={200} defaultValue={x?.title} className={input} autoFocus />
          </label>
          <label className="block text-sm">Ringkasan
            <textarea name="summary" rows={4} maxLength={1200} defaultValue={x?.summary} className={input} />
          </label>
          <PilihMedia gambarAwal={x?.imageUrl} videoAwal={x?.videoUrl} galeriVideo={galeriVideo} />
        </div>
        <aside className="a-card space-y-4 p-4 lg:sticky lg:top-24">
          <h2 className="text-sm font-semibold">Terbitkan</h2>
          <label className="block text-sm">Status
            <select name="status" defaultValue={x?.status ?? "published"} className={input}>
              <option value="published">Terbit</option>
              <option value="draft">Draft (tidak tampil)</option>
            </select>
          </label>
          <label className="block text-sm">Label kecil
            <input name="label" maxLength={40} defaultValue={x?.label} placeholder="Contoh: Pengumuman" className={input} />
          </label>
          <label className="block text-sm">Animasi kartu (tampil di situs)
            <select name="animation" defaultValue={x?.animation ?? ""} className={input}>{ANIMASI.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}</select>
          </label>
          <label className="block text-sm">Tautan (boleh dikosongkan)
            <input name="linkUrl" maxLength={500} defaultValue={x?.linkUrl} placeholder="/artikel/slug atau https://..." className={input} />
          </label>
          <button className="a-btn w-full justify-center">{baru ? "Terbitkan informasi" : "Simpan perubahan"}</button>
        </aside>
      </form>
    </div>
  );
}
