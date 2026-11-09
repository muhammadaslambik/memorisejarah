// PAKET-10A: ubah teks halaman Tentang dengan editor (tanpa kode)
import { PageHeader } from "@/components/admin/PageHeader";
import { requireReviewer } from "@/lib/auth";
import { getTentang } from "@/lib/tentang";
import { resetTentang, saveTentang } from "@/lib/situs-actions";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Editor } from "@/components/Editor";

export const dynamic = "force-dynamic";

export default async function AdminTentang({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireReviewer();
  const { ok } = await searchParams;
  const bagian = await getTentang();
  const baris = [...bagian, { kunci: "", judul: "", isi: "" }]; // satu baris kosong untuk bagian baru
  return (
    <div className="max-w-4xl">
      <PageHeader ikon="tentang" judul="Halaman Tentang" deskripsi={<>Setiap bagian tampil sebagai kartu di halaman Tentang. Tulis dan format teks seperti di Word (Ctrl+B tebal, Ctrl+I miring, Ctrl+U garis bawah). Kosongkan judul dan isi untuk menghapus sebuah bagian; isi baris paling bawah untuk menambah bagian baru.</>} />
      {ok === "reset" && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Dikembalikan ke teks bawaan.</p>}
      {ok === "1" && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Perubahan disimpan.</p>}
      <form action={saveTentang} className="mt-6 space-y-5">
        <input type="hidden" name="jumlah" value={baris.length} />
        {baris.map((b, i) => (
          <fieldset key={i} className="space-y-3 rounded-xl bg-white/70 p-5">
            <legend className="px-1 text-sm font-medium">{i < bagian.length ? `Bagian ${i + 1}` : "Bagian baru (opsional)"}</legend>
            <input type="hidden" name={`kunci_${i}`} value={b.kunci} />
            <div className="flex gap-3">
              <label className="block flex-1 text-sm">Judul
                <input name={`judul_${i}`} defaultValue={b.judul} maxLength={120} className="mt-1 w-full" />
              </label>
              <label className="block w-24 text-sm">Urutan
                <input name={`urutan_${i}`} type="number" defaultValue={i + 1} className="mt-1 w-full" />
              </label>
            </div>
            <div className="text-sm"><p className="mb-1">Isi</p><Editor name={`isi_${i}`} initial={b.isi} tinggi={i < bagian.length ? 220 : 120} /></div>
            {b.kunci === "logo" && <p className="text-xs text-charcoal/55">Bagian ini ditampilkan lebar di bawah kartu lain, dengan gambar logo di sisi kanan.</p>}
          </fieldset>
        ))}
        <div className="flex flex-wrap items-center gap-4">
          <button className="rounded-lg bg-gold px-5 py-2 text-white">Simpan</button>
        </div>
      </form>
      <form action={resetTentang} className="mt-4">
        <ConfirmButton pesan="Kembalikan semua bagian ke teks bawaan? Perubahan Anda akan hilang." label="Kembalikan ke teks bawaan" />
      </form>
    </div>
  );
}