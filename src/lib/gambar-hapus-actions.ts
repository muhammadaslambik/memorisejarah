// PAKET-13B: pemeriksaan sebelum gambar dilepas dari artikel (dipakai dialog konfirmasi)
"use server";
import { requireUser } from "./auth";
import { rincianPemakaian, type Pemakaian } from "./imagekit";

export async function periksaGambarDihapus(postId: number | null, urls: string[]): Promise<Pemakaian[]> {
  await requireUser();
  const bersih = (Array.isArray(urls) ? urls : []).filter((u): u is string => typeof u === "string").slice(0, 12);
  try {
    return await rincianPemakaian(bersih, typeof postId === "number" ? postId : null);
  } catch {
    return []; // gagal memeriksa: simpan seperti biasa tanpa menghapus apa pun
  }
}
