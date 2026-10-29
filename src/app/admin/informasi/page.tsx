// PAKET-3C2: ubah teks bagian Informasi Terbaru (beranda dan halaman Informasi)
import { requireReviewer } from "@/lib/auth";
import { getInformasi, INFORMASI_FIELDS } from "@/lib/pengaturan";
import { saveInformasi } from "@/lib/pengaturan-actions";

export const dynamic = "force-dynamic";
const input = "mt-1 w-full rounded-lg border p-2";

export default async function AdminInformasi({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireReviewer();
  const { ok } = await searchParams;
  const data = (await getInformasi()) as unknown as Record<string, Record<string, string>>;
  return (
    <div>
      <h1 className="font-serif text-3xl">Informasi</h1>
      <p className="mt-1 text-sm text-charcoal/60">Teks pada bagian Informasi Terbaru. Kosongkan sebuah kolom untuk kembali ke teks bawaan.</p>
      {ok && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Perubahan disimpan.</p>}
      <form action={saveInformasi} className="mt-6 space-y-5">
        {INFORMASI_FIELDS.map((g) => (
          <fieldset key={g.grup} className="space-y-3 rounded-xl bg-white/70 p-5">
            <legend className="px-1 text-sm font-medium">{g.judul}</legend>
            {g.fields.map((f) => (
              <label key={f.key} className="block text-sm">{f.label}
                {f.area
                  ? <textarea name={`${g.grup}__${f.key}`} rows={3} defaultValue={data[g.grup][f.key]} className={input} />
                  : <input name={`${g.grup}__${f.key}`} defaultValue={data[g.grup][f.key]} className={input} />}
              </label>
            ))}
          </fieldset>
        ))}
        <button className="rounded-lg bg-gold px-5 py-2 text-white">Simpan</button>
      </form>
    </div>
  );
}