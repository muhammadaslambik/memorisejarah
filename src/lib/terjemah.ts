// PAKET-14C: terjemahan hemat dan gratis dengan beberapa mesin bergantian supaya tidak mudah "kehabisan jatah".
// Urutan: Google dari browser (IP pengguna sendiri) -> Google lewat server -> AI Cloudflare (jatah harian gratis).
// Mesin yang menolak atau dibatasi diistirahatkan sementara; hasil diingat di memori halaman. Tidak memakai database.
import { terjemahkanServer } from "./terjemah-actions";

type Segmen = [string, string][];
type Hasil = { segmen: Segmen } | { galat: string; batas?: boolean; lama?: number };
export type Mesin = "google-langsung" | "google-server" | "ai";

const NAMA: Record<Mesin, string> = { "google-langsung": "Google dari browser", "google-server": "Google lewat server", ai: "AI Cloudflare" };
const URUTAN: Mesin[] = ["google-langsung", "google-server", "ai"];
const cache = new Map<string, string>();
const rehat = new Map<Mesin, number>(); // mesin -> dilewati sampai (ms)
let terakhir: Mesin | null = null;
const BATAS_HURUF = 3000;
const BATAS_BARIS = 40;

export const namaMesinTerakhir = () => (terakhir ? NAMA[terakhir] : "");

const parse = (j: unknown): Segmen => {
  const mentah = Array.isArray(j) && Array.isArray(j[0]) ? (j[0] as unknown[]) : [];
  return mentah.filter(Array.isArray).map((s) => [String((s as unknown[])[0] ?? ""), String((s as unknown[])[1] ?? "")] as [string, string]);
};

const googleLangsung = async (tl: string, teks: string): Promise<Hasil> => {
  try {
    const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "q=" + encodeURIComponent(teks),
    });
    if (r.status === 429) return { galat: "Google membatasi permintaan.", batas: true };
    if (!r.ok) return { galat: "Google menolak permintaan." };
    return { segmen: parse(await r.json()) };
  } catch {
    return { galat: "Diblokir peramban.", lama: 120 }; // umumnya aturan CORS: jangan dicoba lagi pada sesi ini
  }
};

const coba = (m: Mesin, tl: string, teks: string, sumber: string): Promise<Hasil> =>
  m === "google-langsung" ? googleLangsung(tl, teks) : terjemahkanServer(tl, teks, m === "ai" ? "ai" : "google", sumber);

const ambilSegmen = async (tl: string, teks: string, sumber: string): Promise<{ segmen: Segmen } | { galat: string }> => {
  let galat = "Semua mesin terjemahan sedang tidak tersedia. Coba lagi beberapa menit lagi.";
  for (const m of URUTAN) {
    if ((rehat.get(m) ?? 0) > Date.now()) continue;
    const r = await coba(m, tl, teks, sumber);
    if ("segmen" in r) { terakhir = m; return r; }
    galat = r.galat;
    rehat.set(m, Date.now() + (r.lama ?? (r.batas ? 15 : 5)) * 60000);
  }
  return { galat };
};

// Mencocokkan hasil terjemahan dengan barisnya: segmen yang sumbernya berakhir "\n" menutup satu baris
export function pisahPerBaris(segmen: Segmen, jumlah: number): string[] | null {
  const hasil: string[] = [];
  let tr = "";
  let ada = false;
  for (const [t, s] of segmen) {
    tr += t;
    ada = true;
    if (s.endsWith("\n")) { hasil.push(tr.replace(/\n$/, "")); tr = ""; ada = false; }
  }
  if (ada) hasil.push(tr.replace(/\n$/, ""));
  return hasil.length === jumlah ? hasil : null;
}

// sumber = kode bahasa teks asal (dipakai mesin AI yang tidak mendeteksi otomatis); Google mendeteksi sendiri
export async function terjemahkanDaftar(items: string[], tl: string, kemajuan?: (selesai: number, total: number) => void, sumber = "id"): Promise<string[] | { galat: string }> {
  const unik = [...new Set(items)].filter((t) => !cache.has(`${tl}|${t}`));
  let selesai = 0;
  let i = 0;
  while (i < unik.length) {
    const bagian: string[] = [];
    let huruf = 0;
    while (i < unik.length && bagian.length < BATAS_BARIS && (bagian.length === 0 || huruf + unik[i].length < BATAS_HURUF)) {
      bagian.push(unik[i]);
      huruf += unik[i].length + 1;
      i++;
    }
    const r = await ambilSegmen(tl, bagian.join("\n"), sumber);
    if ("galat" in r) return r;
    let baris = pisahPerBaris(r.segmen, bagian.length);
    if (!baris) {
      baris = [];
      for (const b of bagian) {
        const satu = await ambilSegmen(tl, b, sumber);
        if ("galat" in satu) return satu;
        baris.push(satu.segmen.map((s) => s[0]).join("").replace(/\n$/, ""));
      }
    }
    bagian.forEach((b, k) => cache.set(`${tl}|${b}`, baris![k]));
    selesai += bagian.length;
    kemajuan?.(selesai, unik.length);
    if (i < unik.length) await new Promise((res) => setTimeout(res, 200));
  }
  return items.map((t) => cache.get(`${tl}|${t}`) ?? t);
}
