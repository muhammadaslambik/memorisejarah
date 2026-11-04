// PAKET-13B: daftar gambar galeri untuk pemilih gambar (dibaca dari database; cadangan: langsung dari ImageKit)
"use server";
import { requireUser } from "./auth";
import { daftarGaleriDB, type BerkasGaleri } from "./galeri";
import { daftarBerkasIK } from "./imagekit";

export async function ambilGaleri(skip: number, cari = ""): Promise<{ berkas: BerkasGaleri[]; lagi: boolean } | { galat: string }> {
  await requireUser();
  const s = Math.max(0, Math.floor(Number(skip)) || 0);
  const r = await daftarGaleriDB(s, 24, String(cari ?? "").slice(0, 80));
  if (r) return r;
  return daftarBerkasIK(s);
}
