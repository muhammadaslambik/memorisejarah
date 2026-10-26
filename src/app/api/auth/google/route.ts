import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { callbackUrl, challengeOf, googleConfigured, randomToken, siteBase } from "@/lib/google";

export const dynamic = "force-dynamic";

// Langkah 1: kirim pengguna ke halaman masuk Google
export async function GET(req: Request) {
  if (!googleConfigured()) redirect(`${siteBase(req)}/admin/login?error=google-gagal`);
  const state = randomToken();
  const verifier = randomToken(48);
  (await cookies()).set("g_oauth", `${state}.${verifier}`, {
    httpOnly: true, secure: true, sameSite: "lax", path: "/api/auth/google", maxAge: 600,
  });
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.search = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: callbackUrl(req),
    response_type: "code",
    scope: "openid email profile",
    state,
    code_challenge: await challengeOf(verifier),
    code_challenge_method: "S256",
    prompt: "select_account",
  }).toString();
  redirect(u.toString());
}
