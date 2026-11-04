// PAKET-13B: unggah gambar ke ImageKit (kunci privat hanya di server) dengan pencegah gambar kembar.
// Gambar yang isinya sama persis dengan yang sudah ada tidak diunggah lagi; alamat berkas yang ada dipakai ulang.
import { cariBerkasSama, catatBerkas } from "./galeri";

const MAKS = 10 * 1024 * 1024; // 10 MB (batas gratis ImageKit: 25 MB)

const jenis = (b: Uint8Array): "jpg" | "png" | "gif" | "webp" | null => {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  return null;
};

const sha256 = async (b: Uint8Array) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", b as BufferSource))].map((x) => x.toString(16).padStart(2, "0")).join("");

export const penyimpananSiap = () => !!process.env.IMAGEKIT_PRIVATE_KEY;

export type HasilUnggah = { url: string; dipakaiUlang?: boolean } | { galat: "belum" | "berkas" | "unggah" };

// hashAsli (opsional): SHA-256 berkas asli sebelum dikecilkan di peramban, supaya unggahan ulang berkas yang sama terdeteksi
export async function unggahKeImageKit(file: File, slug: string, hashAsli?: string): Promise<HasilUnggah> {
  const kunci = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!kunci) return { galat: "belum" };
  if (file.size === 0 || file.size > MAKS) return { galat: "berkas" };
  const buf = new Uint8Array(await file.arrayBuffer());
  const ext = jenis(buf);
  if (!ext) return { galat: "berkas" }; // hanya JPG, PNG, GIF, WEBP (SVG ditolak)

  const hash = await sha256(buf);
  const asli = hashAsli && /^[a-f0-9]{64}$/.test(hashAsli) ? hashAsli : null;
  const sama = await cariBerkasSama(hash, asli);
  if (sama) return { url: sama.url, dipakaiUlang: true };

  const fd = new FormData();
  fd.set("file", new Blob([buf as BlobPart]), `x.${ext}`);
  fd.set("fileName", `${slug.slice(0, 60) || "gambar"}-${Date.now().toString(36)}.${ext}`);
  fd.set("folder", "/memori-sejarah");
  fd.set("useUniqueFileName", "true");
  try {
    const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
      method: "POST",
      headers: { Authorization: "Basic " + btoa(kunci + ":") },
      body: fd,
    });
    if (!res.ok) return { galat: "unggah" };
    const j = (await res.json()) as { url?: string; fileId?: string; name?: string; width?: number; height?: number; size?: number };
    if (!j.url || !j.url.startsWith("https://")) return { galat: "unggah" };
    await catatBerkas({ url: j.url, fileId: j.fileId ?? null, nama: j.name ?? `${slug}.${ext}`, hash, hashAsli: asli, ukuran: j.size ?? buf.length, lebar: j.width ?? null, tinggi: j.height ?? null });
    return { url: j.url, dipakaiUlang: false };
  } catch {
    return { galat: "unggah" };
  }
}
