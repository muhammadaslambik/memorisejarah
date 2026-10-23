"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, eq, ne } from "drizzle-orm";
import { db, users, posts } from "@/db";
import { createSession, getSession, verifyPassword } from "./auth";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
    .replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

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
  const d = db();
  const id = Number(fd.get("id")) || null;
  const title = String(fd.get("title"));
  const published = fd.get("status") === "published";

  // Ambil data lama agar tanggal terbit asli tidak tertimpa
  const [old] = id ? await d.select().from(posts).where(eq(posts.id, id)).limit(1) : [];

  // Slug: pakai isian pengguna; kalau kosong, buat dari judul (atau pertahankan slug lama)
  let slug = slugify(String(fd.get("slug") ?? "")) || old?.slug || slugify(title) || "artikel";
  const [dup] = await d.select({ id: posts.id }).from(posts)
    .where(id ? and(eq(posts.slug, slug), ne(posts.id, id)) : eq(posts.slug, slug)).limit(1);
  if (dup) slug = `${slug}-${Date.now().toString(36)}`;

  const data = {
    title,
    slug,
    excerpt: String(fd.get("excerpt") ?? ""),
    content: String(fd.get("content") ?? ""),
    coverUrl: String(fd.get("coverUrl") || "") || null,
    featured: fd.get("featured") === "on",
    status: (published ? "published" : "draft") as "published" | "draft",
    categoryId: Number(fd.get("categoryId")) || null,
    updatedAt: new Date(),
    // Tanggal terbit hanya diisi sekali (saat pertama terbit); selanjutnya dipertahankan
    ...(published && !old?.publishedAt ? { publishedAt: new Date() } : {}),
  };
  if (id) await d.update(posts).set(data).where(eq(posts.id, id));
  else await d.insert(posts).values({ ...data, authorId: s.uid });
  redirect("/admin");
}

export async function deletePost(fd: FormData) {
  await requireAdmin();
  await db().delete(posts).where(eq(posts.id, Number(fd.get("id"))));
  redirect("/admin");
}
