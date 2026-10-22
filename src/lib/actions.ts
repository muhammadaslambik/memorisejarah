"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db, users, posts } from "@/db";
import { createSession, getSession, verifyPassword } from "./auth";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 80);

async function requireAdmin() {
  const s = await getSession();
  if (!s) redirect("/admin/login");
  return s;
}

export async function login(fd: FormData) {
  const [u] = await db().select().from(users).where(eq(users.email, String(fd.get("email")))).limit(1);
  if (!u || !(await verifyPassword(String(fd.get("password")), u.passwordHash))) redirect("/admin/login?error=1");
  await createSession(u.id);
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete("session");
  redirect("/admin/login");
}

// Create & Update artikel
export async function savePost(fd: FormData) {
  const s = await requireAdmin();
  const id = Number(fd.get("id")) || null;
  const title = String(fd.get("title"));
  const published = fd.get("status") === "published";
  const data = {
    title,
    excerpt: String(fd.get("excerpt") ?? ""),
    content: String(fd.get("content") ?? ""),
    coverUrl: String(fd.get("coverUrl") || "") || null,
    featured: fd.get("featured") === "on",
    status: (published ? "published" : "draft") as "published" | "draft",
    categoryId: Number(fd.get("categoryId")) || null,
    updatedAt: new Date(),
    ...(published ? { publishedAt: new Date() } : {}),
  };
  if (id) await db().update(posts).set(data).where(eq(posts.id, id));
  else await db().insert(posts).values({ ...data, slug: `${slugify(title)}-${Date.now().toString(36)}`, authorId: s.uid });
  redirect("/admin");
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  await db().delete(posts).where(eq(posts.id, Number(fd.get("id"))));
  redirect("/admin");
}
