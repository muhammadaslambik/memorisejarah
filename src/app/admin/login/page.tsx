import Link from "next/link";
import { login } from "@/lib/actions";
import { googleConfigured } from "@/lib/google";
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
      {error === "google-belum" && <p className="text-sm text-red-700">Email Google itu belum terdaftar. Minta admin menambahkannya, atau daftar lebih dulu.</p>}
      {error === "google-nonaktif" && <p className="text-sm text-red-700">Akun untuk email itu sedang dinonaktifkan.</p>}
      {error === "google-gagal" && <p className="text-sm text-red-700">Masuk dengan Google gagal. Coba lagi.</p>}
      {error === "1" && <p className="text-sm text-red-700">Email atau password salah.</p>}
      <input name="email" type="email" placeholder="Email" required className="w-full rounded border p-2" />
      <PasswordInput name="password" placeholder="Password" className="rounded border p-2" />
      <button className="w-full rounded bg-charcoal py-2 text-cream hover:bg-gold-dark">Masuk</button>
      {googleConfigured() && (
        <>
          <p className="text-center text-xs text-charcoal/50">atau</p>
          <a href="/api/auth/google" className="flex w-full items-center justify-center gap-2 rounded border bg-white py-2 hover:bg-cream-dark">
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
              <path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Masuk dengan Google
          </a>
        </>
      )}
      {canRegister && <p className="text-center text-sm"><Link href="/daftar" className="underline">Belum punya akun? Daftar</Link></p>}
    </form>
  );
}
