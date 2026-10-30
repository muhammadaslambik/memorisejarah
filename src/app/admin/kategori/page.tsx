// PAKET-5A: kelola kategori (admin dan editor)
import Link from "next/link";
import { eq, sql } from "drizzle-orm";
import { db, categories, posts } from "@/db";
import { requireReviewer } from "@/lib/auth";
import { saveKategori, deleteKategori } from "@/lib/kategori-actions";
import { ConfirmButton } from "@/components/ConfirmButton";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  nama: "Nama kategori wajib diisi.",
  slug: "Slug itu sudah dipakai kategori lain.",
  anak: "Kategori ini masih punya subkategori. Pindahkan atau hapus subkategorinya dulu.",
  punyaanak: "Kategori yang punya subkategori tidak bisa dijadikan subkategori.",
};
const oks: Record<string, string> = { simpan: "Kategori disimpan.", hapus: "Kategori dihapus." };

export default async function AdminKategori({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string; ok?: string }> }) {
  await requireReviewer();
  const { edit, error, ok } = await searchParams;
  const editId = Number(edit) || null;
  const d = db();
  const [semua, jumlah] = await Promise.all([
    d.select().from(categories).orderBy(categories.name),
    d.select({ id: posts.categoryId, n: sql<number>`count(*)::int` }).from(posts).groupBy(posts.categoryId),
  ]);
  const hitung = new Map(jumlah.map((j) => [j.id, j.n]));
  const g = editId ? semua.find((c) => c.id === editId) : undefined;
  const atas = semua.filter((c) => c.parentId === null);
  const urut = atas.flatMap((a) => [a, ...semua.filter((c) => c.parentId === a.id)]);
  const input = "mt-1 w-full rounded border p-2";
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="font-serif text-3xl">Kategori</h1>
      <p className="mt-1 text-sm text-charcoal/60">Kategori tingkat atas boleh punya subkategori (dua tingkat). Menu situs menampilkan subkategori; kategori induk hanya sebagai pengelompok.</p>
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{errors[error] ?? "Terjadi kesalahan."}</p>}
      {ok && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">{oks[ok] ?? "Berhasil."}</p>}

      <form key={g?.id ?? "baru"} action={saveKategori} className="mt-6 space-y-4 rounded bg-white/70 p-5">
        <h2 className="font-medium">{g ? "Ubah kategori" : "Tambah kategori"}</h2>
        {g && <input type="hidden" name="id" value={g.id} />}
        <label className="block text-sm">Nama
          <input name="name" required maxLength={120} defaultValue={g?.name} className={input} />
        </label>
        <label className="block text-sm">Slug (alamat halaman; kosongkan agar dibuat dari nama)
          <input name="slug" defaultValue={g?.slug} className={input} />
        </label>
        <label className="block text-sm">Induk
          <select name="parentId" defaultValue={g?.parentId ?? ""} className={input}>
            <option value="">(kategori tingkat atas)</option>
            {atas.filter((a) => a.id !== g?.id).map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </label>
        <div className="flex gap-3">
          <button className="rounded bg-gold px-4 py-2 text-white">{g ? "Simpan perubahan" : "Tambah kategori"}</button>
          {g && <Link href="/admin/kategori" className="rounded border px-4 py-2">Batal</Link>}
        </div>
      </form>

      <h2 className="mt-10 font-medium">Semua kategori ({semua.length})</h2>
      <ul className="mt-3 divide-y divide-cream-dark rounded bg-white/70">
        {urut.map((c) => (
          <li key={c.id} className={`flex items-center justify-between gap-3 p-4 ${c.parentId ? "pl-10" : ""}`}>
            <div>
              <Link href={`/admin/kategori?edit=${c.id}`} className={`hover:text-gold-dark ${c.parentId ? "" : "font-medium"}`}>{c.name}</Link>
              <span className="ml-2 text-xs text-charcoal/50">/kategori/{c.slug}</span>
              <span className="ml-2 rounded bg-cream-dark px-2 py-0.5 text-xs">{hitung.get(c.id) ?? 0} artikel</span>
            </div>
            <form action={deleteKategori}>
              <input type="hidden" name="id" value={c.id} />
              <ConfirmButton pesan={`Hapus kategori "${c.name}"? Artikel di dalamnya menjadi tanpa kategori.`} />
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}