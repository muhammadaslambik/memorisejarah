// PAKET-9C: aksi server untuk redaksi (admin dan editor)
"use server";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db, redaksi, redaksiTim } from "@/db";
import { requireAdmin, requireReviewer } from "./auth";
import { unggahKeImageKit } from "./gambar-simpan";
import { TIM, slugify, tautanHttps, tautanInstagram, waDigits } from "./redaksi";

export async function saveRedaksi(fd: FormData) {
  await requireReviewer();
  const d = db();
  const id = Number(fd.get("id")) || null;
  const s = (k: string, maks: number) => String(fd.get(k) ?? "").trim().slice(0, maks);
  const name = s("name", 120);
  const sufiks = id ? `&edit=${id}` : "";
  if (!name) redirect(`/admin/redaksi?error=nama${sufiks}`);

  const [old] = id ? await d.select().from(redaksi).where(eq(redaksi.id, id)).limit(1) : [];
  if (id && !old) redirect("/admin/redaksi");

  const slug = slugify(s("slug", 80)) || old?.slug || slugify(name.split(",")[0]) || "anggota";
  const [dup] = await d.select({ id: redaksi.id }).from(redaksi)
    .where(id ? and(eq(redaksi.slug, slug), ne(redaksi.id, id)) : eq(redaksi.slug, slug)).limit(1);
  if (dup) redirect(`/admin/redaksi?error=slug${sufiks}`);

  const email = s("email", 200);
  if (email && !/^\S+@\S+\.\S+$/.test(email)) redirect(`/admin/redaksi?error=email${sufiks}`);
  const instagram = tautanInstagram(s("instagram", 200));
  const linkedin = tautanHttps(s("linkedin", 500));
  const facebook = tautanHttps(s("facebook", 500));
  const website = tautanHttps(s("website", 500));
  if (instagram === null || linkedin === null || facebook === null || website === null) redirect(`/admin/redaksi?error=tautan${sufiks}`);

  // Foto: berkas unggahan, tautan https, atau tetap yang lama
  let fotoUrl: string | null = old?.fotoUrl ?? null;
  if (String(fd.get("sumber")) === "berkas") {
    const f = fd.get("berkas");
    if (f instanceof File && f.size > 0) {
      const h = await unggahKeImageKit(f, slug);
      if ("galat" in h) redirect(`/admin/redaksi?error=${h.galat}${sufiks}`);
      fotoUrl = h.url;
    }
  } else {
    const u = tautanHttps(s("url", 500));
    if (u === null) redirect(`/admin/redaksi?error=tautan${sufiks}`);
    fotoUrl = u || null;
  }

  const nilai = {
    slug, name,
    peran: s("peran", 160),
    pemimpin: fd.get("pemimpin") === "on",
    urutan: Math.max(0, Math.min(9999, Math.round(Number(fd.get("urutan")) || 0))),
    bidang: s("bidang", 300),
    bio: s("bio", 4000),
    fotoUrl,
    domisili: s("domisili", 120),
    email,
    whatsapp: waDigits(s("whatsapp", 40)),
    instagram, linkedin, facebook, website,
    userId: Number(fd.get("userId")) || null,
    aktif: fd.get("aktif") === "on",
    updatedAt: new Date(),
  };

  let mid: number;
  if (id) {
    await d.update(redaksi).set(nilai).where(eq(redaksi.id, id));
    mid = id;
  } else {
    const [r] = await d.insert(redaksi).values(nilai).returning({ id: redaksi.id });
    mid = r.id;
  }
  await d.delete(redaksiTim).where(eq(redaksiTim.memberId, mid));
  const dipilih = fd.getAll("tim").map(String);
  const baris = TIM.filter((t) => dipilih.includes(t.kunci)).map((t) => ({ memberId: mid, tim: t.kunci, catatan: s(`catatan_${t.kunci}`, 120) }));
  if (baris.length) await d.insert(redaksiTim).values(baris);
  redirect("/admin/redaksi?ok=simpan");
}

export async function deleteRedaksi(fd: FormData) {
  await requireAdmin();
  const id = Number(fd.get("id"));
  if (id) await db().delete(redaksi).where(eq(redaksi.id, id));
  redirect("/admin/redaksi?ok=hapus");
}