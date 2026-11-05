// PAKET-13C: cadangan terjemahan lewat server (dipakai bila peramban tidak bisa memanggil layanan langsung).
// Tidak menyimpan apa pun di database. Hanya untuk pengguna yang sudah masuk.
"use server";
import { requireUser } from "./auth";
import { BAHASA_CMS } from "./bahasa";

export async function terjemahkanServer(tl: string, teks: string): Promise<{ segmen: [string, string][] } | { galat: string }> {
  await requireUser();
  if (!BAHASA_CMS.some((b) => b.kode === tl)) return { galat: "Bahasa tidak didukung." };
  if (typeof teks !== "string" || teks.length === 0 || teks.length > 5000) return { galat: "Teks terlalu panjang." };
  try {
    const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "q=" + encodeURIComponent(teks),
    });
    if (r.status === 429) return { galat: "Layanan terjemahan sedang membatasi permintaan. Coba lagi beberapa menit lagi." };
    if (!r.ok) return { galat: "Layanan terjemahan menolak permintaan." };
    const j = (await r.json()) as unknown[];
    const mentah = Array.isArray(j[0]) ? (j[0] as unknown[]) : [];
    return { segmen: mentah.filter(Array.isArray).map((s) => [String((s as unknown[])[0] ?? ""), String((s as unknown[])[1] ?? "")] as [string, string]) };
  } catch {
    return { galat: "Tidak dapat menghubungi layanan terjemahan." };
  }
}
