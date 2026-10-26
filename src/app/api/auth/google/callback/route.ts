import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { db, users } from "@/db";
import { createSession } from "@/lib/auth";
import { callbackUrl, googleConfigured, siteBase } from "@/lib/google";

export const dynamic = "force-dynamic";

// Langkah 2: Google mengembalikan pengguna ke sini dengan "code".
// Hanya email yang SUDAH terdaftar (dan aktif) yang boleh masuk; akun tidak dibuat otomatis.
export async function GET(req: Request) {
  const base = siteBase(req);
  const fail = (code: string): never => redirect(`${base}/admin/login?error=${code}`);
  if (!googleConfigured()) fail("google-gagal");

  const url = new URL(req.url);
  const jar = await cookies();
  const saved = jar.get("g_oauth")?.value;
  jar.delete("g_oauth"); // sekali pakai
  const code = url.searchParams.get("code");
  if (url.searchParams.get("error") || !code || !saved) fail("google-gagal");
  const [state, verifier] = saved!.split(".");
  if (!state || !verifier || state !== url.searchParams.get("state")) fail("google-gagal");

  let email = "";
  try {
    const tr = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      body: new URLSearchParams({
        code: code!, client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: callbackUrl(req), grant_type: "authorization_code", code_verifier: verifier,
      }),
    });
    const t = (await tr.json()) as { access_token?: string };
    if (!t.access_token) fail("google-gagal");
    const ur = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });
    const info = (await ur.json()) as { email?: string; email_verified?: boolean };
    // Email harus sudah diverifikasi oleh Google
    if (!info.email || info.email_verified !== true) fail("google-gagal");
    email = info.email!.toLowerCase();
  } catch (e) {
    // redirect() melempar error khusus; teruskan apa adanya
    if (e && typeof e === "object" && "digest" in e) throw e;
    fail("google-gagal");
  }

  const [u] = await db().select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  if (!u) fail("google-belum");
  if (!u!.active) fail(u!.pendingRole ? "pending" : "google-nonaktif");
  await createSession(u!.id);
  redirect(`${base}/admin`);
}
