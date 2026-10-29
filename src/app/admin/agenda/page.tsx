// PAKET-3C2: ubah teks Agenda & Program (video per program diatur di menu Video)
import Link from "next/link";
import { requireReviewer } from "@/lib/auth";
import { getAgenda } from "@/lib/pengaturan";
import { saveAgenda } from "@/lib/pengaturan-actions";

export const dynamic = "force-dynamic";
const input = "mt-1 w-full rounded-lg border p-2";

export default async function AdminAgenda({ searchParams }: { searchParams: Promise<{ ok?: string }> }) {
  await requireReviewer();
  const { ok } = await searchParams;
  const agenda = await getAgenda();
  return (
    <div>
      <h1 className="font-serif text-3xl">Agenda &amp; Program</h1>
      <p className="mt-1 text-sm text-charcoal/60">
        Ubah nama dan teks tiap program. Untuk mengisi tayangannya, tambahkan video di menu <Link href="/admin/video" className="underline">Video</Link> lalu centang programnya.
      </p>
      {ok && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Perubahan disimpan.</p>}
      <form action={saveAgenda} className="mt-6 space-y-5">
        {agenda.map((a) => (
          <fieldset key={a.slug} className="space-y-3 rounded-xl bg-white/70 p-5">
            <legend className="px-1 text-sm font-medium">{a.emoji} {a.nama}</legend>
            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_6rem]">
              <label className="block text-sm">Nama<input name={`nama_${a.slug}`} defaultValue={a.nama} className={input} /></label>
              <label className="block text-sm">Sub judul<input name={`sub_${a.slug}`} defaultValue={a.sub} className={input} /></label>
              <label className="block text-sm">Ikon<input name={`emoji_${a.slug}`} defaultValue={a.emoji} className={input} /></label>
            </div>
            <label className="block text-sm">Deskripsi<textarea name={`deskripsi_${a.slug}`} rows={3} defaultValue={a.deskripsi} className={input} /></label>
            <label className="block text-sm">Jadwal (opsional)<input name={`jadwal_${a.slug}`} defaultValue={a.jadwal ?? ""} className={input} /></label>
          </fieldset>
        ))}
        <button className="rounded-lg bg-gold px-5 py-2 text-white">Simpan</button>
      </form>
    </div>
  );
}