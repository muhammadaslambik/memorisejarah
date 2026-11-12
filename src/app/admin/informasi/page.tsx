// PAKET-3C2/19: menu Informasi di CMS. Tab "Informasi Pilihan": editor langsung (sama dengan tampilan situs). Tab "Informasi Terbaru": daftar kartu pendek.
import Link from "next/link";
import { desc } from "drizzle-orm";
import { db, infoItems } from "@/db";
import { PageHeader } from "@/components/admin/PageHeader";
import { IkonAdmin } from "@/components/admin/ikon-admin";
import { IkonEdit, IkonHapus } from "@/components/admin/TombolAksi";
import { InformasiEditor } from "@/components/admin/InformasiEditor";
import { requireReviewer } from "@/lib/auth";
import { getInformasi, getInformasiTata } from "@/lib/pengaturan";
import { saveInformasi } from "@/lib/pengaturan-actions";
import { deleteInfoItem } from "@/lib/info-actions";
import { kecil } from "@/lib/gambar-url";

export const dynamic = "force-dynamic";
const oks: Record<string, string> = { "1": "Perubahan disimpan.", simpan: "Informasi disimpan.", hapus: "Informasi dihapus." };

export default async function AdminInformasi({ searchParams }: { searchParams: Promise<{ ok?: string; tab?: string }> }) {
  await requireReviewer();
  const { ok, tab } = await searchParams;
  const terbaru = tab === "terbaru";
  const [d, tata, items] = await Promise.all([
    getInformasi(),
    getInformasiTata(),
    terbaru ? db().select().from(infoItems).orderBy(desc(infoItems.updatedAt)).catch(() => null) : Promise.resolve([]),
  ]);
  return (
    <div>
      <PageHeader
        ikon="informasi"
        judul="Informasi"
        deskripsi="Kelola bagian Informasi di Beranda dan halaman Informasi."
        aksi={<Link href="/admin/informasi/baru" className="a-btn"><IkonAdmin nama="tambah" className="h-4 w-4" /> Informasi Baru</Link>}
      />
      <div className="a-tab-baris mb-5 w-fit" role="tablist" aria-label="Bagian informasi">
        <Link href="/admin/informasi" className="a-tab" aria-current={!terbaru ? "page" : undefined}>Informasi Pilihan</Link>
        <Link href="/admin/informasi?tab=terbaru" className="a-tab" aria-current={terbaru ? "page" : undefined}>Informasi Terbaru{Array.isArray(items) && <span className="a-tab-n">{items.length}</span>}</Link>
      </div>
      {ok && <p className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">{oks[ok] ?? "Berhasil."}</p>}

      {!terbaru ? (
        <InformasiEditor d={d} tata={tata} aksi={saveInformasi} />
      ) : items === null ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Tabel Informasi Terbaru belum dibuat. Jalankan: <code>npx tsx --env-file=.env.local scripts\tambah-informasi.ts</code></p>
      ) : items.length === 0 ? (
        <div className="a-card p-8 text-center">
          <p className="a-muted">Belum ada Informasi Terbaru. Klik <strong>Informasi Baru</strong> untuk menambahkan.</p>
        </div>
      ) : (
        <ul className="a-card a-daftar">
          {items.map((x) => (
            <li key={x.id} className="flex flex-wrap items-center gap-3 p-4">
              {x.imageUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={kecil(x.imageUrl, 160)} alt="" loading="lazy" decoding="async" referrerPolicy="no-referrer" className="h-12 w-20 shrink-0 rounded object-cover" />
                : <span className="a-ico h-12 w-20 shrink-0 rounded"><IkonAdmin nama="informasi" className="h-5 w-5" /></span>}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{x.title}</p>
                <p className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className={`a-chip ${x.status === "published" ? "a-chip-hijau" : "a-chip-abu"}`}>{x.status === "published" ? "terbit" : "draft"}</span>
                  {x.label && <span className="a-chip a-chip-abu">{x.label}</span>}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <IkonEdit href={`/admin/informasi/${x.id}`} label="Edit informasi" />
                <form action={deleteInfoItem}>
                  <input type="hidden" name="id" value={x.id} />
                  <IkonHapus label="Hapus informasi" pesan={`Hapus informasi "${x.title}"? Tindakan ini tidak bisa dibatalkan.`} />
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
