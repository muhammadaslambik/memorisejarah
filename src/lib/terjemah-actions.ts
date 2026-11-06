// PAKET-14C: terjemahan lewat server untuk dua mesin: Google (jalur gratis) dan Cloudflare Workers AI (jatah harian gratis di akun Cloudflare sendiri).
// Tidak menyimpan apa pun di database. Hanya untuk pengguna yang sudah masuk.
"use server";
import { requireUser } from "./auth";
import { BAHASA_CMS } from "./bahasa";

type Segmen = [string, string][];
type Hasil = { segmen: Segmen } | { galat: string; batas?: boolean };

// kode Google -> kode model m2m100
const KODE_AI: Record<string, string> = { id: "id", jw: "jv", su: "su", ms: "ms", ar: "ar", "zh-CN": "zh", en: "en", fr: "fr", ru: "ru", es: "es" };

const googleServer = async (tl: string, teks: string): Promise<Hasil> => {
  try {
    const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "q=" + encodeURIComponent(teks),
    });
    if (r.status === 429) return { galat: "Google membatasi permintaan dari server.", batas: true };
    if (!r.ok) return { galat: "Google menolak permintaan dari server." };
    const j = (await r.json()) as unknown[];
    const mentah = Array.isArray(j[0]) ? (j[0] as unknown[]) : [];
    return { segmen: mentah.filter(Array.isArray).map((s) => [String((s as unknown[])[0] ?? ""), String((s as unknown[])[1] ?? "")] as [string, string]) };
  } catch {
    return { galat: "Tidak dapat menghubungi Google dari server." };
  }
};

type MesinAI = { run: (model: string, input: object) => Promise<unknown> };

// Binding AI aktif di situs publik (wrangler.jsonc). Untuk pengembangan lokal bisa diisi CLOUDFLARE_ACCOUNT_ID dan CLOUDFLARE_AI_TOKEN (opsional).
async function ambilAI(): Promise<MesinAI | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const env = getCloudflareContext().env as unknown as { AI?: MesinAI };
    if (env.AI) return env.AI;
  } catch { /* tidak berjalan di Cloudflare */ }
  const akun = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_AI_TOKEN;
  if (akun && token) {
    return {
      run: async (model, input) => {
        const r = await fetch(`https://api.cloudflare.com/client/v4/accounts/${akun}/ai/run/${model}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!r.ok) throw new Error(String(r.status));
        return ((await r.json()) as { result?: unknown }).result;
      },
    };
  }
  return null;
}

const ai = async (tl: string, teks: string, sumber: string): Promise<Hasil> => {
  const mesin = await ambilAI();
  if (!mesin) return { galat: "Mesin AI Cloudflare belum aktif (hanya tersedia di situs publik setelah binding AI dipasang)." };
  const target = KODE_AI[tl];
  let asal = KODE_AI[sumber] ?? "id";
  if (!target) return { galat: "Bahasa tidak didukung oleh mesin AI." };
  if (asal === target) asal = target === "en" ? "id" : "en"; // sumber tidak boleh sama dengan tujuan
  const baris = teks.split("\n");
  const hasil: string[] = new Array(baris.length).fill("");
  let kena = false;
  let i = 0;
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (i < baris.length && !kena) {
      const k = i++;
      const b = baris[k];
      if (!b.trim()) continue;
      try {
        const r = (await mesin.run("@cf/meta/m2m100-1.2b", { text: b, source_lang: asal, target_lang: target })) as { translated_text?: string } | null;
        hasil[k] = r?.translated_text ?? b;
      } catch (e) {
        if (/429|neurons|limit|quota/i.test(String(e))) kena = true;
        hasil[k] = b; // gagal pada satu baris: biarkan teks aslinya
      }
    }
  }));
  if (kena) return { galat: "Jatah harian mesin AI Cloudflare habis.", batas: true };
  const segmen: Segmen = baris.map((b, k) => [hasil[k] + (k < baris.length - 1 ? "\n" : ""), b + (k < baris.length - 1 ? "\n" : "")]);
  return { segmen };
};

export async function terjemahkanServer(tl: string, teks: string, mesin: "google" | "ai" = "google", sumber = "id"): Promise<Hasil> {
  await requireUser();
  if (!BAHASA_CMS.some((b) => b.kode === tl)) return { galat: "Bahasa tidak didukung." };
  if (typeof teks !== "string" || teks.length === 0 || teks.length > 6000 || teks.split("\n").length > 60) return { galat: "Teks terlalu panjang." };
  return mesin === "ai" ? ai(tl, teks, String(sumber)) : googleServer(tl, teks);
}
