// PAKET-5A: aksi server untuk kategori (admin dan editor)
"use server";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db, categories } from "@/db";
import { requireReviewer } from "./auth";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
    .replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

export async function saveKategori(fd: FormData) {
  await requireReviewer();
  const d = db();
  const id = Number(fd.get("id")) || null;
  const name = String(fd.get("name") ?? "").trim().slice(0, 120);
  const sufiks = id ? `&edit=${id}` : "";
  if (!name) redirect(`/admin/kategori?error=nama${sufiks}`);

  let slug = slugify(String(fd.get("slug") ?? "")) || slugify(name) || "kategori";
  const [dup] = await d.select({ id: categories.id }).from(categories)
    .where(id ? and(eq(categories.slug, slug), ne(categories.id, id)) : eq(categories.slug, slug)).limit(1);
  if (dup) redirect(`/admin/kategori?error=slug${sufiks}`);

  // Induk: harus kategori tingkat atas, bukan diri sendiri, dan kategori yang punya anak tidak boleh diberi induk
  let parentId = Number(fd.get("parentId")) || null;
  if (parentId) {
    const [p] = await d.select().from(categories).where(eq(categories.id, parentId)).limit(1);
    if (!p || p.parentId !== null || parentId === id) parentId = null;
    if (id && parentId) {
      const [anak] = await d.select({ id: categories.id }).from(categories).where(eq(categories.parentId, id)).limit(1);
      if (anak) redirect(`/admin/kategori?error=punyaanak${sufiks}`);
    }
  }
  if (id) await d.update(categories).set({ name, slug, parentId }).where(eq(categories.id, id));
  else await d.insert(categories).values({ name, slug, parentId });
  redirect("/admin/kategori?ok=simpan");
}

export async function deleteKategori(fd: FormData) {
  await requireReviewer();
  const id = Number(fd.get("id"));
  if (!id) redirect("/admin/kategori");
  const d = db();
  const [anak] = await d.select({ id: categories.id }).from(categories).where(eq(categories.parentId, id)).limit(1);
  if (anak) redirect("/admin/kategori?error=anak");
  await d.delete(categories).where(eq(categories.id, id)); // artikel/gambar/video terkait menjadi tanpa kategori
  redirect("/admin/kategori?ok=hapus");
}