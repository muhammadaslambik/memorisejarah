"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, users, posts } from "@/db";
import { createSession, requireUser, verifyPassword } from "./auth";
import { clearFailures, clientIp, isLocked, recordFailure } from "./ratelimit";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
    .replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export async function login(fd: FormData) {
  const email = String(fd.get("email") ?? "").trim().toLowerCase();
  const password = String(fd.get("password") ?? "");
  const ip = await clientIp();

  // Terlalu banyak percobaan gagal: tolak tanpa memeriksa password
  if (await isLocked(email, ip)) redirect("/admin/login?error=locked");

  const [u] = await db().select().from(users).where(sql`lower(${users.email}) = ${email}`).limit(1);
  const ok = !!u && u.active && (await verifyPassword(password, u.passwordHash));
  if (!u || !ok) {
    await recordFailure(email, ip);
    redirect("/admin/login?error=1");
  }
  await clearFailures(email);
  await createSession(u.id);
  redirect("/admin");
}

export async function logout() {
  (await cookies()).delete("session");
  redirect("/admin/login");
}

// Create & Update artikel
export async function savePost(fd: FormData) {
  const s = await requireUser();
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
  else await d.insert(posts).values({ ...data, authorId: s.id });
  redirect("/admin");
}

export async function deletePost(fd: FormData) {
  const u = await requireUser();
  const id = Number(fd.get("id"));
  // Admin boleh menghapus semua artikel; editor hanya artikel miliknya sendiri
  const where = u.role === "admin" ? eq(posts.id, id) : and(eq(posts.id, id), eq(posts.authorId, u.id));
  await db().delete(posts).where(where);
  redirect("/admin");
}
