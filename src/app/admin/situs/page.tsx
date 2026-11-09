// PAKET-9E: pengaturan umum situs (tautan sosial, kontak, teks sambutan footer)
import { PageHeader } from "@/components/admin/PageHeader";
import { requireReviewer } from "@/lib/auth";
import { getSitus } from "@/lib/situs";
import { saveSitus } from "@/lib/situs-actions";

export const dynamic = "force-dynamic";
const errors: Record<string, string> = {
  tautan: "Tautan harus berupa alamat https yang valid (Instagram boleh @nama; YouTube boleh @nama; WhatsApp boleh nomor).",
  email: "Format email tidak valid.",
};

export default async function AdminSitus({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  await requireReviewer();
  const { ok, error } = await searchParams;
  const s = await getSitus();
  const input = "mt-1 w-full";
  return (
    <div className="max-w-3xl">
      <PageHeader ikon="pengaturan" judul="Pengaturan Situs" deskripsi={<>Tautan sosial dan kontak di footer dan tombol Hubungi Kami. Kosongkan sebuah kolom untuk menyembunyikannya dari situs.</>} />
      {ok && <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-800">Perubahan disimpan.</p>}
      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{errors[error] ?? "Terjadi kesalahan."}</p>}
      <form action={saveSitus} className="mt-6 space-y-5">
        <fieldset className="space-y-3 rounded-xl bg-white/70 p-5">
          <legend className="px-1 text-sm font-medium">Sosial media dan kontak</legend>
          <label className="block text-sm">Instagram (@nama atau tautan)
            <input name="instagram" defaultValue={s.instagram} maxLength={200} className={input} />
          </label>
          <label className="block text-sm">YouTube (@nama atau tautan kanal)
            <input name="youtube" defaultValue={s.youtube} maxLength={300} className={input} />
          </label>
          <label className="block text-sm">WhatsApp (tautan grup atau saluran, atau nomor)
            <input name="whatsapp" defaultValue={s.whatsapp} maxLength={300} placeholder="https://chat.whatsapp.com/... atau 0812xxxxxxx" className={input} />
          </label>
          <label className="block text-sm">Email kontak
            <input name="email" type="email" defaultValue={s.email} maxLength={200} className={input} />
          </label>
          <p className="text-xs text-charcoal/55">Tombol &quot;Hubungi Kami&quot; mengarah ke WhatsApp bila diisi; bila kosong, ke email.</p>
        </fieldset>
        <fieldset className="space-y-3 rounded-xl bg-white/70 p-5">
          <legend className="px-1 text-sm font-medium">Teks sambutan di footer</legend>
          <label className="block text-sm">Paragraf pertama (emas)
            <textarea name="sambutan1" rows={3} defaultValue={s.sambutan1} maxLength={500} className={input} />
          </label>
          <label className="block text-sm">Paragraf kedua
            <textarea name="sambutan2" rows={3} defaultValue={s.sambutan2} maxLength={500} className={input} />
          </label>
        </fieldset>
        <button className="rounded-lg bg-gold px-5 py-2 text-white">Simpan</button>
      </form>
    </div>
  );
}