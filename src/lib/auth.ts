import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, users } from "@/db";

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

// Pengguna saat ini dari database (supaya peran dan status nonaktif selalu terbaru)
export async function getCurrentUser() {
  const s = await getSession();
  if (!s) return null;
  const [u] = await db().select({ id: users.id, email: users.email, name: users.name, role: users.role, active: users.active, trusted: users.trusted })
    .from(users).where(eq(users.id, s.uid)).limit(1);
  return u && u.active ? u : null;
}

export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) redirect("/admin/login");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "admin") redirect("/admin");
  return u;
}

export type Role = "admin" | "editor" | "penulis";
export const ROLE_LABEL: Record<Role, string> = { admin: "Admin", editor: "Editor", penulis: "Penulis" };

// Aturan akses artikel:
// - admin dan editor boleh mengedit semua artikel
// - penulis hanya boleh mengedit artikel yang ia tulis sendiri
export function canEditPost(u: { id: number; role: string }, post: { authorId: number | null }) {
  return u.role === "admin" || u.role === "editor" || post.authorId === u.id;
}
// Hapus: admin boleh semua; editor dan penulis hanya artikel miliknya sendiri
export function canDeletePost(u: { id: number; role: string }, post: { authorId: number | null }) {
  return u.role === "admin" || post.authorId === u.id;
}

// Admin dan editor boleh memberi persetujuan artikel penulis
export const isReviewer = (role: string) => role === "admin" || role === "editor";
export async function requireReviewer() {
  const u = await requireUser();
  if (!isReviewer(u.role)) redirect("/admin");
  return u;
}
// Penulis yang belum tepercaya harus meminta persetujuan sebelum artikelnya terbit
export const needsApproval = (u: { role: string; trusted: boolean }) => u.role === "penulis" && !u.trusted;
