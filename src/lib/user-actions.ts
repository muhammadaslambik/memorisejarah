"use server";
import { redirect } from "next/navigation";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db, users } from "@/db";
import { hashPassword, requireAdmin } from "./auth";
import { setSetting } from "./settings";

const MIN_PW = 12;
const roleOf = (v: FormDataEntryValue | null) =>
  (v === "admin" ? "admin" : v === "editor" ? "editor" : "penulis") as "admin" | "editor" | "penulis";
const back = (q: string): never => redirect(`/admin/pengguna?${q}`);

export async function createUser(fd: FormData) {
  await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  if (!name || !/^\S+@\S+\.\S+$/.test(email)) back("error=data");
  if (password.length < MIN_PW) back("error=pw");
  const [dup] = await db().select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  if (dup) back("error=ada");
  await db().insert(users).values({ name, email, passwordHash: await hashPassword(password), role: roleOf(fd.get("role")), active: true });
  back("ok=dibuat");
}

export async function setUserRole(fd: FormData) {
  const me = await requireAdmin();
  const id = Number(fd.get("id"));
  if (id === me.id) back("error=diri"); // tidak boleh mengubah peran sendiri
  await db().update(users).set({ role: roleOf(fd.get("role")), trusted: false }).where(eq(users.id, id));
  back("ok=peran");
}

export async function setUserActive(fd: FormData) {
  const me = await requireAdmin();
  const id = Number(fd.get("id"));
  if (id === me.id) back("error=diri"); // tidak boleh menonaktifkan diri sendiri
  const [t] = await db().select({ pendingRole: users.pendingRole }).from(users).where(eq(users.id, id)).limit(1);
  if (t?.pendingRole) back("error=menunggu"); // pendaftar baru diproses lewat Setujui/Tolak
  await db().update(users).set({ active: fd.get("active") === "1" }).where(eq(users.id, id));
  back("ok=status");
}

export async function resetPassword(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const password = String(fd.get("password") ?? "");
  if (password.length < MIN_PW) back("error=pw");
  await db().update(users).set({ passwordHash: await hashPassword(password) }).where(eq(users.id, id));
  back("ok=password");
}

// Admin mengganti nama akun siapa pun
export async function renameUser(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const name = String(fd.get("name") ?? "").trim();
  if (!name || name.length > 100) back("error=nama");
  await db().update(users).set({ name }).where(eq(users.id, id));
  back("ok=nama");
}

// Buka/tutup pendaftaran publik
export async function toggleRegistration(fd: FormData) {
  await requireAdmin();
  await setSetting("registration_open", fd.get("open") === "1" ? "1" : "0");
  back("ok=daftar");
}

// Setujui pendaftar admin/editor (sesuai permintaan, atau diturunkan menjadi penulis)
export async function approveRegistration(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  const [t] = await db().select({ pendingRole: users.pendingRole }).from(users).where(eq(users.id, id)).limit(1);
  if (!t?.pendingRole) back("error=data");
  const role = fd.get("as") === "penulis" ? "penulis" : t.pendingRole!;
  await db().update(users).set({ role, active: true, pendingRole: null }).where(eq(users.id, id));
  back("ok=disetujui");
}

// Tolak pendaftar: akunnya dihapus (hanya untuk akun yang memang masih menunggu)
export async function rejectRegistration(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  await db().delete(users).where(and(eq(users.id, id), eq(users.active, false), isNotNull(users.pendingRole)));
  back("ok=ditolak");
}
