import Link from "next/link";
import { PasswordInput } from "@/components/PasswordInput";
import { register } from "@/lib/register-actions";
import { registrationOpen } from "@/lib/settings";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  tutup: "Pendaftaran sedang ditutup.",
  batas: "Terlalu banyak pendaftaran dari jaringan ini. Coba lagi nanti.",
  data: "Nama dan email harus diisi dengan benar.",
  pw: "Password minimal 12 karakter.",
  ada: "Email itu sudah terdaftar.",
  captcha: "Verifikasi gagal. Muat ulang halaman lalu coba lagi.",
};

export default async function Daftar({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const { error, ok } = await searchParams;
  const open = await registrationOpen();
  const input = "w-full rounded border border-ms-line bg-ms-bg p-2 text-ms-cream placeholder:text-ms-cream/40";
  const siteKey = process.env.TURNSTILE_SITE_KEY; // kunci situs Turnstile (publik); kosong = tanpa verifikasi
  return (
    <div className="mx-auto mt-16 max-w-sm space-y-4 rounded-2xl border border-ms-line bg-ms-surface p-8 text-ms-cream shadow-xl">
      <h1 className="font-serif text-2xl">Daftar</h1>
      {ok === "menunggu" && (
        <p className="rounded bg-emerald-500/10 p-3 text-sm text-emerald-400">
          Pendaftaran diterima. Akun Admin/Editor baru bisa dipakai setelah disetujui admin.
        </p>
      )}
      {error && <p className="text-sm text-rose-400">{errors[error] ?? "Terjadi kesalahan."}</p>}
      {!open ? (
        <p className="text-sm text-ms-cream/70">Pendaftaran sedang ditutup.</p>
      ) : (
        <form action={register} className="space-y-4">
          <input name="name" placeholder="Nama" required maxLength={100} autoComplete="name" className={input} />
          <input name="email" type="email" placeholder="Email" required autoComplete="email" className={input} />
          <PasswordInput name="password" placeholder="Password (min. 12 karakter)" minLength={12} autoComplete="new-password" className="rounded border border-ms-line bg-ms-bg p-2 text-ms-cream placeholder:text-ms-cream/40" />
          <select name="role" defaultValue="penulis" className={input}>
            <option value="penulis">Penulis (langsung aktif; artikel perlu persetujuan)</option>
            <option value="editor">Editor (perlu persetujuan admin)</option>
            <option value="admin">Admin (perlu persetujuan admin)</option>
          </select>
          {siteKey && (
            <>
              <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
              <div className="cf-turnstile" data-sitekey={siteKey} />
            </>
          )}
          <input name="alamat_web" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          <button className="w-full rounded bg-ms-gold py-2 font-semibold text-ms-bg hover:opacity-90">Daftar</button>
        </form>
      )}
      <p className="text-center text-sm"><Link href="/admin/login" className="underline">Sudah punya akun? Masuk</Link></p>
    </div>
  );
}
