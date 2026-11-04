// PAKET-13B: unggah gambar dari editor artikel (semua pengguna yang masuk), dengan pencegah gambar kembar
"use server";
import { requireUser } from "./auth";
import { unggahKeImageKit } from "./gambar-simpan";

export async function unggahGambarArtikel(fd: FormData): Promise<{ url: string; dipakaiUlang?: boolean } | { galat: string }> {
  await requireUser();
  const f = fd.get("berkas");
  if (!(f instanceof File)) return { galat: "Berkas tidak ditemukan." };
  const h = await unggahKeImageKit(f, "artikel", String(fd.get("hashAsli") ?? ""));
  if ("galat" in h) {
    return { galat: h.galat === "belum" ? "Penyimpanan ImageKit belum disiapkan." : h.galat === "berkas" ? "Berkas tidak valid (JPG, PNG, WEBP, GIF; maksimal 10 MB)." : "Unggah gagal. Coba lagi." };
  }
  return { url: h.url, dipakaiUlang: h.dipakaiUlang };
}
