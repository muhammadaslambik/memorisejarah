// PAKET-12B: daftar gambar yang sudah diunggah ke ImageKit (untuk pilihan "Gambar Galeri")
"use server";
import { requireUser } from "./auth";
import { daftarBerkasIK, type BerkasIK } from "./imagekit";

export async function ambilGaleri(skip: number): Promise<{ berkas: BerkasIK[]; lagi: boolean } | { galat: string }> {
  await requireUser();
  return daftarBerkasIK(Math.max(0, Math.floor(Number(skip)) || 0));
}
