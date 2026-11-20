// PAKET-29: login kata sandi lewat kiriman formulir biasa + pengalihan 303 (bukan server action).
// Cookie sesi kini diterima peramban lewat navigasi penuh, sama seperti login Google. Peramban hemat data seperti Opera Mini
// kadang membuang cookie dari respons fetch/server action sehingga pengguna keluar sendiri.
import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db, users } from "@/db";
import { verifyPassword } from "@/lib/auth";
import { buatToken, opsiCookieSesi } from "@/lib/sesi";
import { clearFailures, clientIp, isLocked, recordFailure } from "@/lib/ratelimit";
import { siteBase } from "@/lib/google";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const ke = (jalur: string) => NextResponse.redirect(`${siteBase(req)}${jalur}`, 303);

  // formulir harus dikirim dari situs ini sendiri
  const asal = req.headers.get("origin");
  const host = req.headers.get("host");
  if (asal && host) {
    try { if (new URL(asal).host !== host) return ke("/admin/login?error=1"); } catch { return ke("/admin/login?error=1"); }
  }

  const fd = await req.formData();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const ip = await clientIp();

  // Terlalu banyak percobaan gagal: tolak tanpa memeriksa password
  if (await isLocked(email, ip)) return ke("/admin/login?error=locked");

  const [u] = await db().select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  const pwOk = !!u && (await verifyPassword(password, u.passwordHash));
  // Pendaftar admin/editor yang belum disetujui: beri tahu hanya jika password benar
  if (u && pwOk && !u.active && u.pendingRole) return ke("/admin/login?error=pending");
  const ok = pwOk && !!u && u.active;
  if (!u || !ok) {
    await recordFailure(email, ip);
    return ke("/admin/login?error=1");
  }
  await clearFailures(email);

  const res = ke("/admin");
  res.cookies.set("session", await buatToken(u.id), opsiCookieSesi);
  return res;
}
