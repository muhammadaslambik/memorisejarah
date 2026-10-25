import Link from "next/link";
import { requireUser, ROLE_LABEL, type Role } from "@/lib/auth";
import { PasswordInput } from "@/components/PasswordInput";
import { changeOwnPassword, updateOwnName } from "@/lib/account-actions";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  nama: "Nama tidak boleh kosong (maksimal 100 karakter).",
  pw: "Password baru minimal 12 karakter.",
  lama: "Password lama salah.",
  locked: "Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.",
};
const oks: Record<string, string> = { nama: "Nama diperbarui.", password: "Password diganti." };

export default async function Akun({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const me = await requireUser();
  const { error, ok } = await searchParams;
  const input = "rounded border p-2 text-sm";
  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Akun Saya</h1>
        <Link href="/admin" className="rounded border px-4 py-2">← Artikel</Link>
      </div>
      <p className="mt-2 text-sm text-charcoal/60">{me.email} · {ROLE_LABEL[me.role as Role]}</p>
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{errors[error] ?? "Terjadi kesalahan."}</p>}
      {ok && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">{oks[ok] ?? "Berhasil."}</p>}

      <form action={updateOwnName} className="mt-6 space-y-3 rounded bg-white/70 p-5">
        <h2 className="font-medium">Ganti nama</h2>
        <div className="flex gap-3">
          <input name="name" defaultValue={me.name} required maxLength={100} autoComplete="off" className={`${input} flex-1`} />
          <button className="rounded bg-gold px-4 py-2 text-white">Simpan</button>
        </div>
      </form>

      <form action={changeOwnPassword} className="mt-6 space-y-3 rounded bg-white/70 p-5">
        <h2 className="font-medium">Ganti password</h2>
        <PasswordInput name="current" placeholder="Password lama" autoComplete="current-password" className={input} />
        <PasswordInput name="password" placeholder="Password baru (min. 12 karakter)" minLength={12} autoComplete="new-password" className={input} />
        <button className="rounded bg-gold px-4 py-2 text-white">Ganti password</button>
      </form>
    </div>
  );
}
