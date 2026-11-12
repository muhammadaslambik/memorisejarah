// PAKET-19: aksi server untuk Informasi Terbaru (hanya admin dan editor)
"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, infoItems } from "@/db";
import { requireReviewer } from "./auth";
import { bersihkanYatim } from "./imagekit";
import { ANIMASI } from "./informasi-tata";

const urlAman = (s: string): string | null => {
  const x = s.trim();
  if (!x || x.length > 2000) return null;
  try { const u = new URL(x); return u.protocol === "https:" ? u.toString() : null; } catch { return null; }
};
// tautan tombol boleh alamat internal (/artikel/slug) atau https
const tautanAman = (s: string): string => {
  const x = s.trim().slice(0, 500);
  if (!x) return "";
  if (x.startsWith("/") && !x.startsWith("//")) return x;
  return urlAman(x) ?? "";
};

export async function saveInfoItem(fd: FormData) {
  await requireReviewer();
  const d = db();
  const id = Number(fd.get("id")) || null;
  const title = String(fd.get("title") ?? "").trim().slice(0, 200);
  const sufiks = id ? `/${id}` : "/baru";
  if (!title) redirect(`/admin/informasi${sufiks}?error=judul`);

  const [old] = id ? await d.select().from(infoItems).where(eq(infoItems.id, id)).limit(1) : [];
  if (id && !old) redirect("/admin/informasi?tab=terbaru");

  // gambar dan video (boleh kosong): alamat https yang dipilih lewat PilihMedia (URL, unggahan, atau galeri)
  const gambarMentah = String(fd.get("imageUrl") ?? "").trim();
  const imageUrl = gambarMentah ? urlAman(gambarMentah) : "";
  if (imageUrl === null) redirect(`/admin/informasi${sufiks}?error=url`);
  const videoMentah = String(fd.get("videoUrl") ?? "").trim();
  const videoUrl = videoMentah ? urlAman(videoMentah) : "";
  if (videoUrl === null) redirect(`/admin/informasi${sufiks}?error=video`);
  const animasi = ANIMASI.some((a) => a.id === String(fd.get("animation"))) ? String(fd.get("animation")) : "";

  const status = String(fd.get("status")) === "published" ? "published" : "draft";
  const data = {
    title,
    summary: String(fd.get("summary") ?? "").slice(0, 1200),
    imageUrl,
    videoUrl,
    animation: animasi,
    linkUrl: tautanAman(String(fd.get("linkUrl") ?? "")),
    label: String(fd.get("label") ?? "").trim().slice(0, 40),
    status,
    updatedAt: new Date(),
    ...(status === "published" && !old?.publishedAt ? { publishedAt: new Date() } : {}),
  } as const;
  if (id) await d.update(infoItems).set(data).where(eq(infoItems.id, id));
  else await d.insert(infoItems).values(data);
  const lama = [old?.imageUrl && old.imageUrl !== imageUrl ? old.imageUrl : "", old?.videoUrl && old.videoUrl !== videoUrl ? old.videoUrl : ""].filter(Boolean);
  if (lama.length) await bersihkanYatim(lama);
  revalidatePath("/", "layout");
  redirect("/admin/informasi?tab=terbaru&ok=simpan");
}

export async function deleteInfoItem(fd: FormData) {
  await requireReviewer();
  const id = Number(fd.get("id"));
  if (id) {
    const [x] = await db().select({ url: infoItems.imageUrl, video: infoItems.videoUrl }).from(infoItems).where(eq(infoItems.id, id)).limit(1);
    await db().delete(infoItems).where(eq(infoItems.id, id));
    const lama = [x?.url, x?.video].filter((u): u is string => !!u);
    if (lama.length) await bersihkanYatim(lama);
  }
  revalidatePath("/", "layout");
  redirect("/admin/informasi?tab=terbaru&ok=hapus");
}
