// PAKET-21: unggah video (mp4/webm/mov) ke ImageKit untuk Informasi. Hanya admin/editor. Dipisah dari server action karena batas 11 MB di sana.
import { NextResponse } from "next/server";
import { getCurrentUser, isReviewer } from "@/lib/auth";

const MAKS = 40 * 1024 * 1024; // 40 MB (batas memori Worker; batas ImageKit gratis lebih besar)

export async function POST(req: Request) {
  const u = await getCurrentUser();
  if (!u || !isReviewer(u.role)) return NextResponse.json({ galat: "Tidak diizinkan." }, { status: 403 });
  const kunci = process.env.IMAGEKIT_PRIVATE_KEY;
  if (!kunci) return NextResponse.json({ galat: "Penyimpanan ImageKit belum disiapkan." }, { status: 503 });
  let f: FormDataEntryValue | null = null;
  try { f = (await req.formData()).get("berkas"); } catch { return NextResponse.json({ galat: "Berkas tidak terbaca." }, { status: 400 }); }
  if (!(f instanceof File) || f.size === 0) return NextResponse.json({ galat: "Pilih berkas video." }, { status: 400 });
  if (f.size > MAKS) return NextResponse.json({ galat: "Video terlalu besar (maksimal 40 MB). Unggah ke YouTube lalu pakai tautannya." }, { status: 413 });
  const kepala = new Uint8Array(await f.slice(0, 12).arrayBuffer());
  const mp4 = kepala[4] === 0x66 && kepala[5] === 0x74 && kepala[6] === 0x79 && kepala[7] === 0x70; // "ftyp" (mp4/mov)
  const webm = kepala[0] === 0x1a && kepala[1] === 0x45 && kepala[2] === 0xdf && kepala[3] === 0xa3;
  if (!mp4 && !webm) return NextResponse.json({ galat: "Format harus MP4, MOV, atau WebM." }, { status: 400 });
  const ext = webm ? "webm" : "mp4";
  const fd = new FormData();
  fd.set("file", f, `video.${ext}`);
  fd.set("fileName", `info-${Date.now().toString(36)}.${ext}`);
  fd.set("folder", "/memori-sejarah/video");
  fd.set("useUniqueFileName", "true");
  try {
    const res = await fetch("https://upload.imagekit.io/api/v1/files/upload", { method: "POST", headers: { Authorization: "Basic " + btoa(kunci + ":") }, body: fd });
    if (!res.ok) return NextResponse.json({ galat: "Unggah ke ImageKit gagal." }, { status: 502 });
    const j = (await res.json()) as { url?: string };
    if (!j.url?.startsWith("https://")) return NextResponse.json({ galat: "Unggah ke ImageKit gagal." }, { status: 502 });
    return NextResponse.json({ url: j.url });
  } catch {
    return NextResponse.json({ galat: "Unggah gagal. Coba lagi." }, { status: 502 });
  }
}
