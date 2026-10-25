"use server";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, users } from "@/db";
import { hashPassword, requireAdmin } from "./auth";

const MIN_PW = 12;
const roleOf = (v: FormDataEntryValue | null) => (v === "admin" ? "admin" : "editor") as "admin" | "editor";
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
  await db().update(users).set({ role: roleOf(fd.get("role")) }).where(eq(users.id, id));
  back("ok=peran");
}

export async function setUserActive(fd: FormData) {
  const me = await requireAdmin();
  const id = Number(fd.get("id"));
  if (id === me.id) back("error=diri"); // tidak boleh menonaktifkan diri sendiri
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
