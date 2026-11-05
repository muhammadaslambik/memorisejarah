// PAKET-13C: terjemahan hemat dan gratis. Tidak memakai database; hasil hanya diingat di memori halaman.
// Urutan: panggilan langsung dari peramban (memakai IP pengguna sendiri) -> bila diblokir, lewat server.
import { terjemahkanServer } from "./terjemah-actions";

type Segmen = [string, string][];
const cache = new Map<string, string>();
let langsungBisa = true;
const BATAS_HURUF = 3000;
const BATAS_BARIS = 40;

const ambilSegmen = async (tl: string, teks: string): Promise<{ segmen: Segmen } | { galat: string }> => {
  if (langsungBisa) {
    try {
      const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(tl)}&dt=t`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "q=" + encodeURIComponent(teks),
      });
      if (r.status === 429) return { galat: "Layanan terjemahan sedang membatasi permintaan. Coba lagi beberapa menit lagi." };
      if (r.ok) {
        const j = (await r.json()) as unknown[];
        const mentah = Array.isArray(j[0]) ? (j[0] as unknown[]) : [];
        return { segmen: mentah.filter(Array.isArray).map((s) => [String((s as unknown[])[0] ?? ""), String((s as unknown[])[1] ?? "")] as [string, string]) };
      }
      langsungBisa = false;
    } catch {
      langsungBisa = false; // diblokir (CORS/jaringan): pakai server
    }
  }
  return terjemahkanServer(tl, teks);
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

export async function terjemahkanDaftar(items: string[], tl: string, kemajuan?: (selesai: number, total: number) => void): Promise<string[] | { galat: string }> {
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
    const r = await ambilSegmen(tl, bagian.join("\n"));
    if ("galat" in r) return r;
    let baris = pisahPerBaris(r.segmen, bagian.length);
    if (!baris) {
      // susunan baris tidak cocok: terjemahkan satu per satu supaya tetap akurat
      baris = [];
      for (const b of bagian) {
        const satu = await ambilSegmen(tl, b);
        if ("galat" in satu) return satu;
        baris.push(satu.segmen.map((s) => s[0]).join("").replace(/\n$/, ""));
      }
    }
    bagian.forEach((b, k) => cache.set(`${tl}|${b}`, baris![k]));
    selesai += bagian.length;
    kemajuan?.(selesai, unik.length);
    if (i < unik.length) await new Promise((res) => setTimeout(res, 200)); // jeda kecil agar layanan gratis tidak menolak
  }
  return items.map((t) => cache.get(`${tl}|${t}`) ?? t);
}
