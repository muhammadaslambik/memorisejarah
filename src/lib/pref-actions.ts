// PAKET-11A: preferensi per akun (jumlah artikel per halaman di CMS)
"use server";
import { redirect } from "next/navigation";
import { db, userPrefs } from "@/db";
import { requireUser } from "./auth";
import { PILIHAN } from "./pilihan-halaman";

export async function simpanPerHalaman(fd: FormData) {
  const me = await requireUser();
  const n = Number(fd.get("per"));
  const nilai = (PILIHAN as readonly number[]).includes(n) ? n : 20;
  try {
    await db().insert(userPrefs).values({ userId: me.id, perHalaman: nilai })
      .onConflictDoUpdate({ target: userPrefs.userId, set: { perHalaman: nilai } });
  } catch { /* tabel belum dibuat: abaikan */ }
  const k = String(fd.get("kembali") ?? "/admin/artikel");
  redirect(k.startsWith("/admin/artikel") && !k.startsWith("//") ? k : "/admin/artikel");
}