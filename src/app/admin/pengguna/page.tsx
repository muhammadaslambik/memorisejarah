import Link from "next/link";
import { asc } from "drizzle-orm";
import { db, users } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { PasswordInput } from "@/components/PasswordInput";
import { registrationOpen } from "@/lib/settings";
import { approveRegistration, createUser, rejectRegistration, renameUser, resetPassword, setUserActive, setUserRole, toggleRegistration } from "@/lib/user-actions";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  data: "Nama dan email harus diisi dengan benar.",
  pw: "Password minimal 12 karakter.",
  ada: "Email itu sudah terdaftar.",
  nama: "Nama tidak boleh kosong (maksimal 100 karakter).",
  menunggu: "Akun ini masih pendaftar baru; gunakan Setujui atau Tolak.",
  diri: "Anda tidak bisa mengubah peran atau menonaktifkan akun Anda sendiri.",
};
const oks: Record<string, string> = {
  dibuat: "Pengguna berhasil ditambahkan.",
  peran: "Peran diperbarui.",
  status: "Status akun diperbarui.",
  password: "Password diganti.",
  nama: "Nama diperbarui.",
  daftar: "Pengaturan pendaftaran diperbarui.",
  disetujui: "Pendaftar disetujui.",
  ditolak: "Pendaftar ditolak dan dihapus.",
};

export default async function Pengguna({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  const me = await requireAdmin();
  const { error, ok } = await searchParams;
  const all = await db().select().from(users).orderBy(asc(users.id));
  const waiting = all.filter((u) => u.pendingRole);
  const list = all.filter((u) => !u.pendingRole);
  const open = await registrationOpen();
  const input = "rounded border p-2 text-sm";
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Pengguna</h1>
        <div className="flex gap-3">
          <Link href="/admin/persetujuan" className="rounded border px-4 py-2">Persetujuan artikel</Link>
          <Link href="/admin" className="rounded border px-4 py-2">← Artikel</Link>
        </div>
      </div>
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{errors[error] ?? "Terjadi kesalahan."}</p>}
      {ok && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">{oks[ok] ?? "Berhasil."}</p>}

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded bg-white/70 p-4">
        <p className="text-sm">
          Pendaftaran publik (<span className="font-mono">/daftar</span>): <strong>{open ? "terbuka" : "tertutup"}</strong>
        </p>
        <form action={toggleRegistration}>
          <input type="hidden" name="open" value={open ? "0" : "1"} />
          <button className="rounded border px-3 py-1 text-sm">{open ? "Tutup pendaftaran" : "Buka pendaftaran"}</button>
        </form>
      </div>

      {waiting.length > 0 && (
        <div className="mt-6 rounded bg-amber-50 p-4">
          <h2 className="font-medium">Menunggu persetujuan ({waiting.length})</h2>
          <ul className="mt-3 divide-y divide-cream-dark">
            {waiting.map((u) => (
              <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{u.name}</span>
                  <span className="text-sm text-charcoal/60">{u.email}</span>
                  <span className="rounded bg-cream-dark px-2 py-0.5 text-xs">minta: {u.pendingRole}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={approveRegistration}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="rounded bg-gold px-3 py-1 text-sm text-white">Setujui sebagai {u.pendingRole}</button>
                  </form>
                  <form action={approveRegistration}>
                    <input type="hidden" name="id" value={u.id} />
                    <input type="hidden" name="as" value="penulis" />
                    <button className="rounded border px-3 py-1 text-sm">Setujui sebagai penulis</button>
                  </form>
                  <form action={rejectRegistration}>
                    <input type="hidden" name="id" value={u.id} />
                    <button className="rounded border px-3 py-1 text-sm text-red-700">Tolak</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form action={createUser} className="mt-6 grid gap-3 rounded bg-white/70 p-5 md:grid-cols-5">
        <input name="name" placeholder="Nama" autoComplete="off" required className={input} />
        <input name="email" type="email" placeholder="Email" autoComplete="off" required className={input} />
        <PasswordInput name="password" placeholder="Password (min. 12 karakter)" minLength={12} autoComplete="new-password" className={input} />
        <select name="role" defaultValue="penulis" className={input}>
          <option value="penulis">Penulis (menulis dan mengedit artikelnya sendiri)</option>
          <option value="editor">Editor (mengedit semua artikel)</option>
          <option value="admin">Admin (akses penuh, kelola pengguna)</option>
        </select>
        <button className="rounded bg-gold px-4 py-2 text-white">+ Tambah</button>
      </form>

      <ul className="mt-6 divide-y divide-cream-dark rounded bg-white/70">
        {list.map((u) => (
          <li key={u.id} className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{u.name}</span>
              <span className="text-sm text-charcoal/60">{u.email}</span>
              <span className="rounded bg-cream-dark px-2 py-0.5 text-xs">{u.role}</span>
              {u.role === "penulis" && u.trusted && <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">tepercaya</span>}
              {!u.active && <span className="rounded bg-red-100 px-2 py-0.5 text-xs text-red-700">nonaktif</span>}
              {u.id === me.id && <span className="text-xs text-charcoal/50">(Anda)</span>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <form action={renameUser} className="flex gap-2">
                <input type="hidden" name="id" value={u.id} />
                <input name="name" defaultValue={u.name} required maxLength={100} autoComplete="off" placeholder="Nama" className={input} />
                <button className="rounded border px-3 py-1 text-sm">Ganti nama</button>
              </form>
              {u.id !== me.id && (<>
                <form action={setUserRole} className="flex gap-2">
                  <input type="hidden" name="id" value={u.id} />
                  <select name="role" defaultValue={u.role} className={input}>
                    <option value="penulis">penulis</option><option value="editor">editor</option><option value="admin">admin</option>
                  </select>
                  <button className="rounded border px-3 py-1 text-sm">Ubah peran</button>
                </form>
                <form action={setUserActive}>
                  <input type="hidden" name="id" value={u.id} />
                  <input type="hidden" name="active" value={u.active ? "0" : "1"} />
                  <button className="rounded border px-3 py-1 text-sm">{u.active ? "Nonaktifkan" : "Aktifkan"}</button>
                </form>
              </>)}
              {u.id === me.id ? (
                <Link href="/admin/akun" className="rounded border px-3 py-1 text-sm">Ganti password Anda di Akun Saya</Link>
              ) : (
              <form action={resetPassword} className="flex gap-2">
                <input type="hidden" name="id" value={u.id} />
                <PasswordInput name="password" placeholder="Password baru (min. 12)" minLength={12} autoComplete="new-password" className={input} />
                <button className="rounded border px-3 py-1 text-sm">Ganti password</button>
              </form>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
