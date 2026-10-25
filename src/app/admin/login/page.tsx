import Link from "next/link";
import { login } from "@/lib/actions";
import { registrationOpen } from "@/lib/settings";
import { PasswordInput } from "@/components/PasswordInput";

export const dynamic = "force-dynamic";

export default async function Login({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { error, ok } = await searchParams;
  const canRegister = await registrationOpen();
  return (
    <form action={login} className="mx-auto mt-20 max-w-sm space-y-4 rounded-lg bg-white/70 p-8 shadow">
      <h1 className="font-serif text-2xl">Masuk CMS</h1>
      {ok === "terdaftar" && <p className="text-sm text-green-800">Pendaftaran berhasil. Silakan masuk.</p>}
      {error === "locked" && <p className="text-sm text-red-700">Terlalu banyak percobaan gagal. Coba lagi dalam 15 menit.</p>}
      {error === "pending" && <p className="text-sm text-red-700">Akun Anda masih menunggu persetujuan admin.</p>}
      {error === "1" && <p className="text-sm text-red-700">Email atau password salah.</p>}
      <input name="email" type="email" placeholder="Email" required className="w-full rounded border p-2" />
      <PasswordInput name="password" placeholder="Password" className="rounded border p-2" />
      <button className="w-full rounded bg-charcoal py-2 text-cream hover:bg-gold-dark">Masuk</button>
      {canRegister && <p className="text-center text-sm"><Link href="/daftar" className="underline">Belum punya akun? Daftar</Link></p>}
    </form>
  );
}
