// PAKET-21: pengaturan tata letak per blok Informasi Pilihan (urutan, lebar, tinggi, bentuk, latar, warna/jenis/ukuran teks, animasi, sembunyi).
// Dipakai di situs (menggambar) dan di CMS (mengedit); semua nilai dibersihkan sebelum disimpan.
export const BLOK_IDS = ["merah", "krem", "diskusi", "hijau"] as const;
export type BlokId = (typeof BLOK_IDS)[number];
export const NAMA_BLOK: Record<BlokId, string> = { merah: "Kartu merah", krem: "Kartu krem", diskusi: "Kartu diskusi", hijau: "Kartu hijau" };
export const LEBAR_BAWAAN: Record<BlokId, number> = { merah: 7, krem: 5, diskusi: 8, hijau: 4 };

export type Bentuk = "kotak" | "sedang" | "besar" | "pil";
export type JenisFont = "bawaan" | "serif" | "sans" | "mono";
export type GayaBlok = { lebar: number; tinggi: number; bentuk: Bentuk; latar: string; teks: string; font: JenisFont; skala: number; animasi: string; sembunyi: boolean };
export type TataInformasi = { urutan: BlokId[]; gaya: Record<BlokId, GayaBlok> };

export const RADIUS: Record<Bentuk, string> = { kotak: "0.25rem", sedang: "0.5rem", besar: "0.75rem", pil: "3rem" };
export const LATAR: Record<string, { nama: string; css: string }> = {
  merah: { nama: "Merah tua", css: "linear-gradient(135deg,#991b1b,#450a0a)" },
  krem: { nama: "Krem", css: "#f3e9d8" },
  gelap: { nama: "Cokelat gelap", css: "#1f1610" },
  hijau: { nama: "Hijau tua", css: "linear-gradient(135deg,#065f46,#022c22)" },
  biru: { nama: "Biru malam", css: "linear-gradient(135deg,#1e3a8a,#0b1a3d)" },
  ungu: { nama: "Ungu", css: "linear-gradient(135deg,#6b21a8,#2e1065)" },
  emas: { nama: "Emas tua", css: "linear-gradient(135deg,#b45309,#78350f)" },
};
export const ANIMASI: { id: string; nama: string }[] = [
  { id: "", nama: "Tanpa animasi" },
  { id: "naik", nama: "Muncul dari bawah" },
  { id: "kiri", nama: "Muncul dari kiri" },
  { id: "kanan", nama: "Muncul dari kanan" },
  { id: "zoom", nama: "Zoom lembut" },
  { id: "mengambang", nama: "Mengambang pelan" },
  { id: "denyut", nama: "Denyut halus" },
  { id: "kilau", nama: "Kilau bergerak" },
];
const ANIMASI_ID = new Set(ANIMASI.map((a) => a.id));

export const gayaBawaan = (id: BlokId): GayaBlok => ({ lebar: LEBAR_BAWAAN[id], tinggi: 0, bentuk: "besar", latar: "", teks: "", font: "bawaan", skala: 100, animasi: "", sembunyi: false });
export const tataBawaan = (): TataInformasi => ({ urutan: [...BLOK_IDS], gaya: { merah: gayaBawaan("merah"), krem: gayaBawaan("krem"), diskusi: gayaBawaan("diskusi"), hijau: gayaBawaan("hijau") } });

const hex = (v: unknown) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : "");
const angka = (v: unknown, min: number, maks: number, def: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(maks, Math.max(min, n)) : def;
};

export function bersihkanTata(mentah: unknown): TataInformasi {
  const t = tataBawaan();
  if (!mentah || typeof mentah !== "object") return t;
  const m = mentah as { urutan?: unknown; gaya?: Record<string, Partial<GayaBlok>> };
  if (Array.isArray(m.urutan)) {
    const ada = m.urutan.filter((x): x is BlokId => (BLOK_IDS as readonly string[]).includes(x as string));
    const unik = [...new Set(ada)];
    t.urutan = [...unik, ...BLOK_IDS.filter((b) => !unik.includes(b))];
  }
  for (const id of BLOK_IDS) {
    const g = m.gaya?.[id];
    if (!g || typeof g !== "object") continue;
    const d = t.gaya[id];
    d.lebar = angka(g.lebar, 3, 12, d.lebar);
    d.tinggi = angka(g.tinggi, 0, 900, 0);
    d.bentuk = (["kotak", "sedang", "besar", "pil"] as const).includes(g.bentuk as Bentuk) ? (g.bentuk as Bentuk) : d.bentuk;
    d.latar = typeof g.latar === "string" && (g.latar in LATAR || hex(g.latar)) ? g.latar : "";
    d.teks = hex(g.teks);
    d.font = (["bawaan", "serif", "sans", "mono"] as const).includes(g.font as JenisFont) ? (g.font as JenisFont) : "bawaan";
    d.skala = angka(g.skala, 70, 140, 100);
    d.animasi = typeof g.animasi === "string" && ANIMASI_ID.has(g.animasi) ? g.animasi : "";
    d.sembunyi = g.sembunyi === true;
  }
  return t;
}
export const cssLatar = (v: string) => LATAR[v]?.css ?? v;
