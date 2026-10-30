// PAKET-4B: aksi server untuk gambar (hanya admin dan editor)
"use server";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db, images } from "@/db";
import { requireReviewer } from "./auth";
import { unggahKeImageKit } from "./gambar-simpan";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
    .replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

// Hanya alamat https yang valid yang diterima
const urlAman = (input: string): string | null => {
  const s = input.trim();
  if (!s || s.length > 2000) return null;
  try {
    const u = new URL(s);
    return u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
};

export async function saveGambar(fd: FormData) {
  await requireReviewer();
  const d = db();
  const id = Number(fd.get("id")) || null;
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  const sufiks = id ? `&edit=${id}` : "";
  if (!title) redirect(`/admin/gambar?error=judul${sufiks}`);

  const [old] = id ? await d.select().from(images).where(eq(images.id, id)).limit(1) : [];
  if (id && !old) redirect("/admin/gambar");

  let slug = slugify(String(fd.get("slug") ?? "")) || old?.slug || slugify(title) || "gambar";
  const [dup] = await d.select({ id: images.id }).from(images)
    .where(id ? and(eq(images.slug, slug), ne(images.id, id)) : eq(images.slug, slug)).limit(1);
  if (dup) slug = `${slug}-${Date.now().toString(36)}`;

  // Tentukan alamat gambar: berkas unggahan, tautan, atau gambar lama (saat mengubah)
  let url: string | null = null;
  const berkas = fd.get("berkas");
  if (String(fd.get("sumber")) === "berkas") {
    if (berkas instanceof File && berkas.size > 0) {
      const h = await unggahKeImageKit(berkas, slug);
      if ("galat" in h) redirect(`/admin/gambar?error=${h.galat}${sufiks}`);
      url = h.url;
    } else if (old) url = old.url;
    else redirect(`/admin/gambar?error=berkas${sufiks}`);
  } else {
    url = urlAman(String(fd.get("url") ?? "")) ?? (old && !fd.get("url") ? old.url : null);
    if (!url) redirect(`/admin/gambar?error=url${sufiks}`);
  }

  const status = String(fd.get("status")) === "published" ? "published" : "draft";
  const data = {
    title,
    slug,
    url,
    caption: String(fd.get("caption") ?? "").slice(0, 5000),
    credit: String(fd.get("credit") ?? "").slice(0, 300),
    status,
    categoryId: Number(fd.get("categoryId")) || null,
    updatedAt: new Date(),
    ...(status === "published" && !old?.publishedAt ? { publishedAt: new Date() } : {}),
  } as const;
  if (id) await d.update(images).set(data).where(eq(images.id, id));
  else await d.insert(images).values(data);
  redirect("/admin/gambar?ok=simpan");
}

export async function deleteGambar(fd: FormData) {
  await requireReviewer();
  const id = Number(fd.get("id"));
  if (id) await db().delete(images).where(eq(images.id, id));
  redirect("/admin/gambar?ok=hapus");
}