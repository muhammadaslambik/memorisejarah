// PAKET-9D: aksi cepat di daftar artikel (admin dan editor)
"use server";
import { redirect } from "next/navigation";
import { eq, sql } from "drizzle-orm";
import { db, posts } from "@/db";
import { requireReviewer } from "./auth";

export async function toggleFeatured(fd: FormData) {
  await requireReviewer();
  const id = Number(fd.get("id"));
  if (id) await db().update(posts).set({ featured: sql`not ${posts.featured}` }).where(eq(posts.id, id));
  const k = String(fd.get("kembali") ?? "/admin");
  redirect(k.startsWith("/admin") && !k.startsWith("//") ? k : "/admin");
}