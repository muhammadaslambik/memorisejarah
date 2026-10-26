// Login Google (OAuth 2.0 Authorization Code + PKCE), tanpa pustaka tambahan.
export const googleConfigured = () => !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;

// Alamat dasar situs. Alamat callback yang didaftarkan di Google harus persis sama dengan ini.
export function siteBase(req: Request) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const u = new URL(req.url);
  if (u.hostname === "localhost") return u.origin; // pengembangan lokal
  return "https://memorisejarah.eu.org";
}
export const callbackUrl = (req: Request) => `${siteBase(req)}/api/auth/google/callback`;

const b64url = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const randomToken = (bytes = 32) => b64url(crypto.getRandomValues(new Uint8Array(bytes)));
export const challengeOf = async (verifier: string) =>
  b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
