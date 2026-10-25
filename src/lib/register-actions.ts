"use server";
import { redirect } from "next/navigation";
import { sql } from "drizzle-orm";
import { db, users } from "@/db";
import { hashPassword } from "./auth";
import { clientIp, recordRegistration, registrationLimited } from "./ratelimit";
import { registrationOpen } from "./settings";

const MIN_PW = 12;
const back = (q: string): never => redirect(`/daftar?${q}`);

export async function register(fd: FormData) {
  if (!(await registrationOpen())) back("error=tutup");
  // Kolom jebakan untuk bot: manusia tidak melihatnya, jadi tidak pernah mengisinya
  if (String(fd.get("alamat_web") ?? "") !== "") back("ok=menunggu");
  const ip = await clientIp();
  if (await registrationLimited(ip)) back("error=batas");

  const name = String(fd.get("name") ?? "").trim();
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const want = String(fd.get("role") ?? "penulis");
  if (!name || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email)) back("error=data");
  if (password.length < MIN_PW) back("error=pw");
  const [dup] = await db().select({ id: users.id }).from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  if (dup) back("error=ada");
  await recordRegistration(ip);

  const passwordHash = await hashPassword(password);
  if (want === "admin" || want === "editor") {
    // Menunggu persetujuan admin: belum aktif dan belum punya hak apa pun
    await db().insert(users).values({ name, email, passwordHash, role: "penulis", active: false, pendingRole: want });
    back("ok=menunggu");
  }
  await db().insert(users).values({ name, email, passwordHash, role: "penulis", active: true });
  redirect("/admin/login?ok=terdaftar");
}
