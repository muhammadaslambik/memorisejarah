import { and, count, eq, gt, lt } from "drizzle-orm";
import { headers } from "next/headers";
import { db, loginAttempts } from "@/db";

const WINDOW_MS = 15 * 60 * 1000; // jendela 15 menit
const MAX_PER_EMAIL = 5; // 5 kali gagal untuk satu email
const MAX_PER_IP = 20; // 20 kali gagal dari satu alamat IP

export async function clientIp() {
  const h = await headers();
  return h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function isLocked(email: string, ip: string) {
  const since = new Date(Date.now() - WINDOW_MS);
  const d = db();
  const [[byEmail], [byIp]] = await Promise.all([
    d.select({ n: count() }).from(loginAttempts).where(and(eq(loginAttempts.email, email), gt(loginAttempts.createdAt, since))),
    d.select({ n: count() }).from(loginAttempts).where(and(eq(loginAttempts.ip, ip), gt(loginAttempts.createdAt, since))),
  ]);
  return byEmail.n >= MAX_PER_EMAIL || byIp.n >= MAX_PER_IP;
}

export async function recordFailure(email: string, ip: string) {
  const d = db();
  await d.insert(loginAttempts).values({ email, ip });
  // bersihkan catatan lama (> 1 hari) supaya tabel tidak membesar
  await d.delete(loginAttempts).where(lt(loginAttempts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));
}

export async function clearFailures(email: string) {
  await db().delete(loginAttempts).where(eq(loginAttempts.email, email));
}

// Pembatasan pendaftaran: maksimal 5 pendaftaran per IP per jam
const REG_WINDOW_MS = 60 * 60 * 1000;
const MAX_REG_PER_IP = 5;
export async function registrationLimited(ip: string) {
  const since = new Date(Date.now() - REG_WINDOW_MS);
  const [r] = await db().select({ n: count() }).from(loginAttempts)
    .where(and(eq(loginAttempts.email, `daftar:${ip}`), gt(loginAttempts.createdAt, since)));
  return r.n >= MAX_REG_PER_IP;
}
export async function recordRegistration(ip: string) {
  await db().insert(loginAttempts).values({ email: `daftar:${ip}`, ip });
}
