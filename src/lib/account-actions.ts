"use server";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";
import { hashPassword, requireUser, verifyPassword } from "./auth";
import { clearFailures, clientIp, isLocked, recordFailure } from "./ratelimit";

const MIN_PW = 12;
const back = (q: string): never => redirect(`/admin/akun?${q}`);

// Semua peran boleh mengganti nama akunnya sendiri
export async function updateOwnName(fd: FormData) {
  const me = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  if (!name || name.length > 100) back("error=nama");
  await db().update(users).set({ name }).where(eq(users.id, me.id));
  back("ok=nama");
}

// Semua peran boleh mengganti password sendiri, dengan memasukkan password lama
export async function changeOwnPassword(fd: FormData) {
  const me = await requireUser();
  const current = String(fd.get("current") ?? "");
  const next = String(fd.get("password") ?? "");
  const ip = await clientIp();
  if (await isLocked(me.email, ip)) back("error=locked");
  if (next.length < MIN_PW) back("error=pw");
  const [u] = await db().select({ hash: users.passwordHash }).from(users).where(eq(users.id, me.id)).limit(1);
  if (!u || !(await verifyPassword(current, u.hash))) {
    await recordFailure(me.email, ip);
    back("error=lama");
  }
  await clearFailures(me.email);
  await db().update(users).set({ passwordHash: await hashPassword(next) }).where(eq(users.id, me.id));
  back("ok=password");
}
