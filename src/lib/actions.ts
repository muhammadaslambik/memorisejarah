"use server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { and, eq, ne, sql } from "drizzle-orm";
import { db, users, posts } from "@/db";
import { canDeletePost, canEditPost, createSession, isReviewer, needsApproval, requireUser, verifyPassword } from "./auth";
import { safeCoverUrl, sanitizeHtml } from "./sanitize";
import { kategoriUtama, simpanKategori } from "./post-kategori";
import { clearFailures, clientIp, isLocked, recordFailure } from "./ratelimit";
import { bersihkanYatim, urlIKDalam } from "./imagekit";

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
  const pwOk = !!u && (await verifyPassword(password, u.passwordHash));
  // Pendaftar admin/editor yang belum disetujui: beri tahu hanya jika password benar
  if (u && pwOk && !u.active && u.pendingRole) redirect("/admin/login?error=pending");
  const ok = pwOk && !!u && u.active;
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
  const requested = String(fd.get("status") ?? "draft");

  // Ambil data lama agar tanggal terbit asli tidak tertimpa
  const [old] = id ? await d.select().from(posts).where(eq(posts.id, id)).limit(1) : [];
  // Mengedit artikel yang tidak ada, atau milik orang lain (khusus penulis), ditolak
  if (id && (!old || !canEditPost(s, old))) redirect("/admin");

  // Status akhir ditentukan di server (bukan dari pilihan formulir saja):
  // - penulis belum tepercaya: tidak pernah langsung terbit; "terbit" menjadi "menunggu persetujuan"
  // - admin, editor, penulis tepercaya: boleh menerbitkan langsung
  let status: "draft" | "pending" | "published";
  if (needsApproval(s)) status = requested === "draft" ? "draft" : "pending";
  else if (requested === "published") status = "published";
  else if (requested === "pending" && old?.status === "pending") status = "pending";
  else status = "draft";
  const published = status === "published";

  // Slug: pakai isian pengguna; kalau kosong, buat dari judul (atau pertahankan slug lama)
  let slug = slugify(String(fd.get("slug") ?? "")) || old?.slug || slugify(title) || "artikel";
  const [dup] = await d.select({ id: posts.id }).from(posts)
    .where(id ? and(eq(posts.slug, slug), ne(posts.id, id)) : eq(posts.slug, slug)).limit(1);
  if (dup) slug = `${slug}-${Date.now().toString(36)}`;

  const data = {
    title,
    slug,
    excerpt: String(fd.get("excerpt") ?? ""),
    content: sanitizeHtml(String(fd.get("content") ?? "")),
    coverUrl: safeCoverUrl(String(fd.get("coverUrl") ?? "")),
    // Hanya admin/editor yang boleh mengatur artikel Pilihan (hero)
    featured: isReviewer(s.role) ? fd.get("featured") === "on" : (old?.featured ?? false),
    status,
    // Catatan penolakan dipertahankan selama artikel masih draft; dihapus saat diajukan ulang/terbit
    reviewNote: status === "draft" ? (old?.reviewNote ?? null) : null,
    categoryId: await kategoriUtama(d, fd),
    updatedAt: new Date(),
    // Tanggal terbit hanya diisi sekali (saat pertama terbit); selanjutnya dipertahankan
    ...(published && !old?.publishedAt ? { publishedAt: new Date() } : {}),
  };
  if (id) {
    await d.update(posts).set(data).where(eq(posts.id, id)); await simpanKategori(d, id, fd);
    // Penghapusan permanen di ImageKit hanya atas pilihan eksplisit pengguna (dialog konfirmasi), dan hanya bila gambar tak dipakai di tempat lain
    if (old) {
      const dipilih = ((): string[] => {
        try {
          const a = JSON.parse(String(fd.get("hapusIK") ?? "[]"));
          return Array.isArray(a) ? a.filter((x): x is string => typeof x === "string").slice(0, 12) : [];
        } catch { return []; }
      })();
      if (dipilih.length) {
        const lama = new Set([...urlIKDalam(old.content), old.coverUrl?.split("?")[0]]);
        const sekarang = new Set([...urlIKDalam(data.content), data.coverUrl?.split("?")[0]]);
        await bersihkanYatim(dipilih.filter((u) => lama.has(u) && !sekarang.has(u)));
      }
    }
  }
  else { const [baru] = await d.insert(posts).values({ ...data, authorId: s.id }).returning({ id: posts.id }); await simpanKategori(d, baru.id, fd); }
  redirect("/admin/artikel");
}

export async function deletePost(fd: FormData) {
  const u = await requireUser();
  const id = Number(fd.get("id"));
  const [p] = await db().select({ authorId: posts.authorId, content: posts.content, coverUrl: posts.coverUrl }).from(posts).where(eq(posts.id, id)).limit(1);
  if (p && canDeletePost(u, p)) {
    await db().delete(posts).where(eq(posts.id, id));
    // Gambar artikel yang dihapus dibiarkan di galeri/ImageKit (aman bagi artikel lain); gambar tak terpakai bisa dirapikan dengan skrip sinkron-galeri
  }
  redirect("/admin/artikel");
}
