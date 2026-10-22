// Hash password PBKDF2 (Web Crypto). Dipisah dari auth.ts agar bisa dipakai script seed.
const hex = (b: ArrayBuffer) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");

export async function hashPassword(pw: string, salt = hex(crypto.getRandomValues(new Uint8Array(16)).buffer)) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: new TextEncoder().encode(salt), iterations: 100000 }, base, 256);
  return `${salt}:${hex(bits)}`;
}
export async function verifyPassword(pw: string, stored: string) {
  const [salt] = stored.split(":");
  return (await hashPassword(pw, salt)) === stored;
}