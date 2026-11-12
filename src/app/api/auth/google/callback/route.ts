import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { sql } from "drizzle-orm";
import { db, users } from "@/db";
import { createSession, getCurrentUser } from "@/lib/auth";
import { callbackUrl, googleConfigured, siteBase } from "@/lib/google";

export const dynamic = "force-dynamic";

// Langkah 2: Google mengembalikan pengguna ke sini dengan "code".
// Hanya email yang SUDAH terdaftar (dan aktif) yang boleh masuk; akun tidak dibuat otomatis.
export async function GET(req: Request) {
  const base = siteBase(req);
  // r = alasan rinci (ikut di alamat) supaya penyebab gagal bisa dibaca di halaman masuk
  const fail = (code: string, r = ""): never => redirect(`${base}/admin/login?error=${code}${r ? `&r=${r}` : ""}`);
  if (!googleConfigured()) fail("google-gagal", "belum-diatur");

  const url = new URL(req.url);
  const jar = await cookies();
  const saved = jar.get("g_oauth")?.value;
  jar.delete("g_oauth"); // sekali pakai
  const code = url.searchParams.get("code");
  // PAKET-22: peramban ponsel kadang memanggil alamat ini dua kali. Panggilan pertama berhasil dan membuat sesi; panggilan kedua
  // (kode sudah terpakai) dulu menampilkan "Masuk dengan Google gagal" padahal pengguna sudah masuk. Bila sesi sudah ada, langsung ke CMS.
  const sudahMasuk = await getCurrentUser().catch(() => null);
  if (sudahMasuk) redirect(`${base}/admin`);
  if (url.searchParams.get("error")) fail("google-gagal", "ditolak");
  if (!code) fail("google-gagal", "tanpa-kode");
  if (!saved) fail("google-gagal", "tanpa-cookie");
  const [state, verifier] = saved!.split(".");
  if (!state || !verifier || state !== url.searchParams.get("state")) fail("google-gagal", "state");

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
    if (!t.access_token) fail("google-gagal", "token");
    const ur = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${t.access_token}` },
    });
    const info = (await ur.json()) as { email?: string; email_verified?: boolean };
    // Email harus sudah diverifikasi oleh Google
    if (!info.email || info.email_verified !== true) fail("google-gagal", "email");
    email = info.email!.toLowerCase();
  } catch (e) {
    // redirect() melempar error khusus; teruskan apa adanya
    if (e && typeof e === "object" && "digest" in e) throw e;
    fail("google-gagal", "jaringan");
  }

  const [u] = await db().select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  if (!u) fail("google-belum");
  if (!u!.active) fail(u!.pendingRole ? "pending" : "google-nonaktif");
  await createSession(u!.id);
  redirect(`${base}/admin`);
}
