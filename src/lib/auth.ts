import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export { hashPassword, verifyPassword } from "./password";

const key = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export async function createSession(userId: number) {
  const token = await new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d").sign(key());
  (await cookies()).set("session", token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 604800 });
}

export async function getSession() {
  const token = (await cookies()).get("session")?.value;
  if (!token) return null;
  try { return (await jwtVerify(token, key())).payload as { uid: number }; } catch { return null; }
}