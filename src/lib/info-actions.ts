// PAKET-19: aksi server untuk Informasi Terbaru (hanya admin dan editor)
"use server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db, infoItems } from "@/db";
import { requireReviewer } from "./auth";
import { unggahKeImageKit } from "./gambar-simpan";
import { bersihkanYatim } from "./imagekit";

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

  // gambar (boleh kosong): berkas unggahan, tautan, atau gambar lama
  let imageUrl = old?.imageUrl ?? "";
  const berkas = fd.get("berkas");
  if (String(fd.get("sumber")) === "berkas") {
    if (berkas instanceof File && berkas.size > 0) {
      const h = await unggahKeImageKit(berkas, `info-${Date.now().toString(36)}`);
      if ("galat" in h) redirect(`/admin/informasi${sufiks}?error=${h.galat}`);
      imageUrl = h.url;
    }
  } else {
    const baruUrl = String(fd.get("url") ?? "").trim();
    if (baruUrl) {
      const ok = urlAman(baruUrl);
      if (!ok) redirect(`/admin/informasi${sufiks}?error=url`);
      imageUrl = ok;
    } else if (fd.get("hapusGambar") === "1") imageUrl = "";
  }

  const status = String(fd.get("status")) === "published" ? "published" : "draft";
  const data = {
    title,
    summary: String(fd.get("summary") ?? "").slice(0, 1200),
    imageUrl,
    linkUrl: tautanAman(String(fd.get("linkUrl") ?? "")),
    label: String(fd.get("label") ?? "").trim().slice(0, 40),
    status,
    updatedAt: new Date(),
    ...(status === "published" && !old?.publishedAt ? { publishedAt: new Date() } : {}),
  } as const;
  if (id) await d.update(infoItems).set(data).where(eq(infoItems.id, id));
  else await d.insert(infoItems).values(data);
  if (old?.imageUrl && old.imageUrl !== imageUrl) await bersihkanYatim([old.imageUrl]);
  revalidatePath("/", "layout");
  redirect("/admin/informasi?tab=terbaru&ok=simpan");
}

export async function deleteInfoItem(fd: FormData) {
  await requireReviewer();
  const id = Number(fd.get("id"));
  if (id) {
    const [x] = await db().select({ url: infoItems.imageUrl }).from(infoItems).where(eq(infoItems.id, id)).limit(1);
    await db().delete(infoItems).where(eq(infoItems.id, id));
    if (x?.url) await bersihkanYatim([x.url]);
  }
  revalidatePath("/", "layout");
  redirect("/admin/informasi?tab=terbaru&ok=hapus");
}
