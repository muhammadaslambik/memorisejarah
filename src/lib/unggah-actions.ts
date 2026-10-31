// PAKET-6A: unggah gambar dari editor artikel (semua pengguna yang masuk)
"use server";
import { requireUser } from "./auth";
import { unggahKeImageKit } from "./gambar-simpan";

export async function unggahGambarArtikel(fd: FormData): Promise<{ url: string } | { galat: string }> {
  await requireUser();
  const f = fd.get("berkas");
  if (!(f instanceof File)) return { galat: "Berkas tidak ditemukan." };
  const h = await unggahKeImageKit(f, "artikel");
  if ("galat" in h) {
    return { galat: h.galat === "belum" ? "Penyimpanan ImageKit belum disiapkan." : h.galat === "berkas" ? "Berkas tidak valid (JPG, PNG, WEBP, GIF; maksimal 10 MB)." : "Unggah gagal. Coba lagi." };
  }
  return { url: h.url };
}