// PAKET-1B: aksi server untuk video (hanya admin dan editor)
"use server";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db, videos } from "@/db";
import { requireReviewer } from "./auth";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
    .replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

// Terima alamat YouTube (watch, youtu.be, embed, shorts, live) atau ID 11 karakter
const ambilIdYoutube = (input: string): string | null => {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.split("/")[1] ?? null;
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const bagian = u.pathname.split("/").filter(Boolean);
      if (u.searchParams.get("v")) id = u.searchParams.get("v");
      else if (["embed", "shorts", "live", "v"].includes(bagian[0])) id = bagian[1] ?? null;
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
};

export async function saveVideo(fd: FormData) {
  await requireReviewer();
  const d = db();
  const id = Number(fd.get("id")) || null;
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  const youtubeId = ambilIdYoutube(String(fd.get("youtube") ?? ""));
  const sufiks = id ? `&edit=${id}` : "";
  if (!title) redirect(`/admin/video?error=judul${sufiks}`);
  if (!youtubeId) redirect(`/admin/video?error=youtube${sufiks}`);

  const [old] = id ? await d.select().from(videos).where(eq(videos.id, id)).limit(1) : [];
  if (id && !old) redirect("/admin/video");

  let slug = slugify(String(fd.get("slug") ?? "")) || old?.slug || slugify(title) || "video";
  const [dup] = await d.select({ id: videos.id }).from(videos)
    .where(id ? and(eq(videos.slug, slug), ne(videos.id, id)) : eq(videos.slug, slug)).limit(1);
  if (dup) slug = `${slug}-${Date.now().toString(36)}`;

  const status = String(fd.get("status")) === "published" ? "published" : "draft";
  const data = {
    title,
    slug,
    youtubeId,
    description: String(fd.get("description") ?? "").slice(0, 5000),
    featured: fd.get("featured") === "on",
    status,
    categoryId: Number(fd.get("categoryId")) || null,
    updatedAt: new Date(),
    ...(status === "published" && !old?.publishedAt ? { publishedAt: new Date() } : {}),
  } as const;
  if (id) await d.update(videos).set(data).where(eq(videos.id, id));
  else await d.insert(videos).values(data);
  redirect("/admin/video?ok=simpan");
}

export async function deleteVideo(fd: FormData) {
  await requireReviewer();
  const id = Number(fd.get("id"));
  if (id) await db().delete(videos).where(eq(videos.id, id));
  redirect("/admin/video?ok=hapus");
}