// PAKET-4B: unggah gambar ke ImageKit (kunci privat hanya di server)
const MAKS = 10 * 1024 * 1024; // 10 MB (batas gratis ImageKit: 25 MB)

const jenis = (b: Uint8Array): "jpg" | "png" | "gif" | "webp" | null => {
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "gif";
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return "webp";
  return null;
};

export const penyimpananSiap = () => !!process.env.IMAGEKIT_PRIVATE_KEY;

export type HasilUnggah = { url: string } | { galat: "belum" | "berkas" | "unggah" };

export async function unggahKeImageKit(file: File, slug: string): Promise<HasilUnggah> {
  const kunci = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!kunci) return { galat: "belum" };
  if (file.size === 0 || file.size > MAKS) return { galat: "berkas" };
  const buf = new Uint8Array(await file.arrayBuffer());
  const ext = jenis(buf);
  if (!ext) return { galat: "berkas" }; // hanya JPG, PNG, GIF, WEBP (SVG ditolak)

  const fd = new FormData();
  fd.set("file", new Blob([buf]), `x.${ext}`);
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
    const j = (await res.json()) as { url?: string };
    return j.url && j.url.startsWith("https://") ? { url: j.url } : { galat: "unggah" };
  } catch {
    return { galat: "unggah" };
  }
}