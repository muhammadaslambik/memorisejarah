// PAKET-3C2: atur folder Google Drive pada halaman Pustaka (maksimal 8)
import { requireReviewer } from "@/lib/auth";
import { getPustaka } from "@/lib/pengaturan";
import { savePustaka } from "@/lib/pengaturan-actions";

export const dynamic = "force-dynamic";
const input = "mt-1 w-full rounded-lg border p-2";

export default async function AdminPustaka({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireReviewer();
  const { ok } = await searchParams;
  const daftar = await getPustaka();
  const baris = Array.from({ length: 8 }, (_, i) => daftar[i]);
  return (
    <div>
      <h1 className="font-serif text-3xl">Pustaka</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Tempel alamat folder Google Drive (atau ID-nya). Folder harus dibagikan dengan &quot;siapa saja yang memiliki link&quot; agar tampil di situs. Baris yang dikosongkan diabaikan.
      </p>
      {ok && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Perubahan disimpan.</p>}
      <form action={savePustaka} className="mt-6 space-y-4">
        {baris.map((p, i) => (
          <fieldset key={i} className="grid gap-3 rounded-xl bg-white/70 p-4 md:grid-cols-[1fr_1.5fr_1.5fr]">
            <legend className="px-1 text-xs text-charcoal/50">Folder {i + 1}</legend>
            <label className="block text-sm">Nama<input name={`nama_${i}`} defaultValue={p?.nama ?? ""} className={input} /></label>
            <label className="block text-sm">Alamat atau ID folder Drive<input name={`url_${i}`} defaultValue={p?.url ?? ""} className={input} /></label>
            <label className="block text-sm">Keterangan singkat<input name={`ket_${i}`} defaultValue={p?.ket ?? ""} className={input} /></label>
          </fieldset>
        ))}
        <button className="rounded-lg bg-gold px-5 py-2 text-white">Simpan</button>
      </form>
    </div>
  );
}