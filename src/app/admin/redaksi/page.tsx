// PAKET-9C: kelola redaksi dan profil anggota (admin dan editor)
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db, redaksi, redaksiTim, users } from "@/db";
import { requireReviewer } from "@/lib/auth";
import { saveRedaksi, deleteRedaksi } from "@/lib/redaksi-actions";
import { TIM, namaTim } from "@/lib/redaksi";
import { penyimpananSiap } from "@/lib/gambar-simpan";
import { ConfirmButton } from "@/components/ConfirmButton";
import { PilihSumberGambar } from "@/components/admin/PilihSumberGambar";
import { Avatar } from "@/components/content/Avatar";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  nama: "Nama wajib diisi.",
  slug: "Slug itu sudah dipakai anggota lain.",
  email: "Format email tidak valid.",
  tautan: "Tautan harus berupa alamat https yang valid (Instagram boleh @nama).",
  belum: "Penyimpanan ImageKit belum disiapkan. Gunakan tautan foto dulu.",
  berkas: "Berkas foto tidak valid (JPG, PNG, WEBP, GIF; maksimal 10 MB).",
  unggah: "Unggah foto gagal. Coba lagi.",
};
const oks: Record<string, string> = { simpan: "Anggota disimpan.", hapus: "Anggota dihapus." };

export default async function AdminRedaksi({ searchParams }: { searchParams: Promise<{ edit?: string; error?: string; ok?: string }> }) {
  const me = await requireReviewer();
  const { edit, error, ok } = await searchParams;
  const editId = Number(edit) || null;
  const d = db();
  const [daftar, relasi, akun] = await Promise.all([
    d.select().from(redaksi).orderBy(redaksi.urutan, redaksi.name),
    d.select().from(redaksiTim),
    d.select({ id: users.id, name: users.name }).from(users).orderBy(users.name),
  ]);
  const m = editId ? daftar.find((x) => x.id === editId) : undefined;
  const timM = new Map(relasi.filter((r) => r.memberId === m?.id).map((r) => [r.tim, r.catatan]));
  const input = "mt-1 w-full rounded border p-2";
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="font-serif text-3xl">Redaksi</h1>
      <p className="mt-1 text-sm text-charcoal/60">Susunan redaksi dan profil anggota di halaman Tentang. Hanya kolom yang diisi yang tampil di situs.</p>
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{errors[error] ?? "Terjadi kesalahan."}</p>}
      {ok && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">{oks[ok] ?? "Berhasil."}</p>}

      <form key={m?.id ?? "baru"} action={saveRedaksi} className="mt-6 space-y-4 rounded bg-white/70 p-5">
        <h2 className="font-medium">{m ? "Ubah anggota" : "Tambah anggota"}</h2>
        {m && <input type="hidden" name="id" value={m.id} />}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">Nama (boleh dengan gelar)
            <input name="name" required maxLength={120} defaultValue={m?.name} className={input} />
          </label>
          <label className="block text-sm">Jabatan atau peran
            <input name="peran" maxLength={160} defaultValue={m?.peran} placeholder="contoh: Pendiri & Pemimpin Redaksi" className={input} />
          </label>
          <label className="block text-sm">Slug (alamat profil; kosongkan agar dibuat dari nama)
            <input name="slug" defaultValue={m?.slug} className={input} />
          </label>
          <label className="block text-sm">Urutan tampil (angka kecil lebih dulu)
            <input name="urutan" type="number" min={0} max={9999} defaultValue={m?.urutan ?? 0} className={input} />
          </label>
        </div>

        <PilihSumberGambar key={`foto-${m?.id ?? "baru"}`} defaultUrl={m?.fotoUrl ?? ""} baru={false} siap={penyimpananSiap()} />
        {m?.fotoUrl && <Avatar nama={m.name} url={m.fotoUrl} ukuran={96} />}

        <label className="block text-sm">Bidang penelitian atau keahlian
          <input name="bidang" maxLength={300} defaultValue={m?.bidang} className={input} />
        </label>
        <label className="block text-sm">Profil singkat (biografi)
          <textarea name="bio" rows={5} maxLength={4000} defaultValue={m?.bio} className={input} />
        </label>

        <fieldset className="rounded border p-4">
          <legend className="px-1 text-sm font-medium">Kontak dan tautan (opsional)</legend>
          <p className="mb-3 text-xs text-charcoal/60">Hanya yang diisi yang tampil di profil publik. Pastikan anggota yang bersangkutan setuju sebelum menampilkan email, WhatsApp, atau domisili. Untuk domisili, cukup kota; jangan alamat lengkap.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">Domisili (kota)
              <input name="domisili" maxLength={120} defaultValue={m?.domisili} placeholder="contoh: Semarang" className={input} />
            </label>
            <label className="block text-sm">Email
              <input name="email" type="email" maxLength={200} defaultValue={m?.email} className={input} />
            </label>
            <label className="block text-sm">WhatsApp (contoh: 0812xxxxxxx)
              <input name="whatsapp" maxLength={40} defaultValue={m?.whatsapp ? `+${m.whatsapp}` : ""} className={input} />
            </label>
            <label className="block text-sm">Instagram (@nama atau tautan)
              <input name="instagram" maxLength={200} defaultValue={m?.instagram} className={input} />
            </label>
            <label className="block text-sm">LinkedIn (tautan)
              <input name="linkedin" maxLength={500} defaultValue={m?.linkedin} className={input} />
            </label>
            <label className="block text-sm">Facebook (tautan)
              <input name="facebook" maxLength={500} defaultValue={m?.facebook} className={input} />
            </label>
            <label className="block text-sm sm:col-span-2">Situs web pribadi (tautan)
              <input name="website" maxLength={500} defaultValue={m?.website} className={input} />
            </label>
          </div>
        </fieldset>

        <fieldset className="rounded border p-4">
          <legend className="px-1 text-sm font-medium">Tim</legend>
          <div className="space-y-2">
            {TIM.map((t) => (
              <div key={t.kunci} className="flex flex-wrap items-center gap-3 text-sm">
                <label className="flex w-64 items-center gap-2">
                  <input type="checkbox" name="tim" value={t.kunci} defaultChecked={timM.has(t.kunci)} /> {t.nama}
                </label>
                <input name={`catatan_${t.kunci}`} maxLength={120} defaultValue={timM.get(t.kunci) ?? ""} placeholder="catatan (opsional, contoh: Instagram)" className="min-w-0 flex-1 rounded border p-1.5" />
              </div>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2"><input type="checkbox" name="pemimpin" defaultChecked={m?.pemimpin} /> Pendiri atau pemimpin redaksi (ditampilkan di kotak khusus)</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="aktif" defaultChecked={m ? m.aktif : true} /> Tampilkan di situs</label>
        </div>
        <label className="block text-sm sm:max-w-sm">Hubungkan dengan akun penulis (untuk menampilkan tulisannya di profil)
          <select name="userId" defaultValue={m?.userId ?? ""} className={input}>
            <option value="">(tidak dihubungkan)</option>
            {akun.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <div className="flex gap-3">
          <button className="rounded bg-gold px-4 py-2 text-white">{m ? "Simpan perubahan" : "Tambah anggota"}</button>
          {m && <Link href="/admin/redaksi" className="rounded border px-4 py-2">Batal</Link>}
        </div>
      </form>

      <h2 className="mt-10 font-medium">Semua anggota ({daftar.length})</h2>
      {daftar.length === 0 ? (
        <p className="mt-2 text-sm text-charcoal/60">Belum ada anggota. Jalankan skrip seed-redaksi atau tambah lewat formulir di atas.</p>
      ) : (
        <ul className="mt-3 divide-y divide-cream-dark rounded bg-white/70">
          {daftar.map((x) => (
            <li key={x.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar nama={x.name} url={x.fotoUrl} ukuran={40} />
                <div className="min-w-0">
                  <Link href={`/admin/redaksi?edit=${x.id}`} className="font-medium hover:text-gold-dark">{x.name}</Link>
                  <span className="ml-2 text-xs text-charcoal/50">#{x.urutan}</span>
                  {!x.aktif && <span className="ml-2 rounded bg-cream-dark px-2 py-0.5 text-xs">tersembunyi</span>}
                  <p className="truncate text-xs text-charcoal/60">
                    {[x.peran, ...relasi.filter((r) => r.memberId === x.id).map((r) => namaTim(r.tim))].filter(Boolean).join(" \u2022 ")}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                {x.aktif && <Link href={`/tentang/redaksi/${x.slug}`} className="text-sm text-charcoal/60 hover:text-gold-dark">Lihat</Link>}
                {me.role === "admin" && (<form action={deleteRedaksi}>
                  <input type="hidden" name="id" value={x.id} />
                  <ConfirmButton pesan={`Hapus anggota "${x.name}"?`} />
                </form>)}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}