// PAKET-21: pengaturan tata letak per blok Informasi Pilihan (urutan, lebar, tinggi, bentuk, latar, warna/jenis/ukuran teks, animasi, sembunyi).
// Dipakai di situs (menggambar) dan di CMS (mengedit); semua nilai dibersihkan sebelum disimpan.
export const BLOK_IDS = ["merah", "krem", "diskusi", "hijau"] as const;
export type BlokId = (typeof BLOK_IDS)[number];
export const NAMA_BLOK: Record<BlokId, string> = { merah: "Kartu merah", krem: "Kartu krem", diskusi: "Kartu diskusi", hijau: "Kartu hijau" };
export const LEBAR_BAWAAN: Record<BlokId, number> = { merah: 7, krem: 5, diskusi: 8, hijau: 4 };

export type Bentuk = "kotak" | "sedang" | "besar" | "pil";
export type JenisFont = "bawaan" | "serif" | "sans" | "mono";
export type GayaBlok = { lebar: number; tinggi: number; bentuk: Bentuk; latar: string; teks: string; font: JenisFont; skala: number; animasi: string; sembunyi: boolean };
// PAKET-30: blok baru bebas ("kustom") + blok bawaan yang bisa dihapus. Blok baru disimpan di dalam tata (JSON pengaturan "informasi_tata"), tanpa tabel baru.
export type ModelKustom = "kartu" | "gambar" | "tombol" | "kutipan";
export type BlokKustom = { id: string; model: ModelKustom; label: string; judul: string; isi: string; tombol: string; href: string; gambar: string };
export type TataInformasi = { urutan: string[]; gaya: Record<string, GayaBlok>; kustom: BlokKustom[]; dihapus: BlokId[] };
export const MAKS_KUSTOM = 20;
export const adaKustom = (id: string) => /^k-[a-z0-9]{3,12}$/.test(id);
export const idKustom = () => "k-" + Math.random().toString(36).slice(2, 8).padEnd(4, "x");
export const MODEL_KUSTOM: { id: ModelKustom; nama: string; ket: string; isi: Omit<BlokKustom, "id" | "model">; gaya: Partial<GayaBlok> }[] = [
  { id: "kartu", nama: "Kartu teks", ket: "Label, judul, isi, tombol", isi: { label: "Info", judul: "Judul kartu", isi: "Tulis isi kartu di sini. Gunakan **tebal** untuk huruf tebal.", tombol: "", href: "", gambar: "" }, gaya: { lebar: 6 } },
  { id: "gambar", nama: "Kartu gambar", ket: "Gambar di atas, teks di bawah", isi: { label: "", judul: "Judul gambar", isi: "Keterangan singkat tentang gambar.", tombol: "", href: "", gambar: "" }, gaya: { lebar: 6 } },
  { id: "tombol", nama: "Ajakan (tombol)", ket: "Pita lebar dengan tombol besar", isi: { label: "", judul: "Ayo bergabung bersama kami", isi: "Ajakan singkat untuk pengunjung.", tombol: "Selengkapnya", href: "/tentang", gambar: "" }, gaya: { lebar: 12, latar: "emas" } },
  { id: "kutipan", nama: "Kutipan", ket: "Kalimat bijak dan sumbernya", isi: { label: "", judul: "- Nama sumber", isi: "Tulis kutipan di sini.", tombol: "", href: "", gambar: "" }, gaya: { lebar: 6 } },
];
const MODEL_ID = new Set<string>(MODEL_KUSTOM.map((m) => m.id));

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
export const tataBawaan = (): TataInformasi => ({ urutan: [...BLOK_IDS], gaya: { merah: gayaBawaan("merah"), krem: gayaBawaan("krem"), diskusi: gayaBawaan("diskusi"), hijau: gayaBawaan("hijau") }, kustom: [], dihapus: [] });
export const gayaKustom = (m: ModelKustom): GayaBlok => ({ lebar: 6, tinggi: 0, bentuk: "besar", latar: "", teks: "", font: "bawaan", skala: 100, animasi: "", sembunyi: false, ...(MODEL_KUSTOM.find((x) => x.id === m)?.gaya ?? {}) });
export const namaBlok = (t: TataInformasi, id: string) => {
  if (id in NAMA_BLOK) return NAMA_BLOK[id as BlokId];
  const b = t.kustom.find((k) => k.id === id);
  if (!b) return id;
  const j = (b.judul || MODEL_KUSTOM.find((m) => m.id === b.model)?.nama || "Blok").trim();
  return "Baru: " + (j.length > 18 ? j.slice(0, 18) + "…" : j);
};
export const idTampil = (t: TataInformasi, editor?: boolean) => t.urutan.filter((id) => !(t.dihapus as string[]).includes(id) && (editor || !t.gaya[id]?.sembunyi));

const hex = (v: unknown) => (typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v) ? v : "");
const angka = (v: unknown, min: number, maks: number, def: number) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(maks, Math.max(min, n)) : def;
};

const teksAman = (v: unknown, maks: number) => (typeof v === "string" ? v.slice(0, maks) : "");
const tautanAman = (v: unknown) => { const s = teksAman(v, 500).trim(); return /^\/(?!\/)/.test(s) || /^https:\/\/[^\s]+$/i.test(s) ? s : ""; };
const gambarAman = (v: unknown) => { const s = teksAman(v, 800).trim(); try { return new URL(s).protocol === "https:" ? s : ""; } catch { return ""; } };

export function bersihkanTata(mentah: unknown): TataInformasi {
  const t = tataBawaan();
  if (!mentah || typeof mentah !== "object") return t;
  const m = mentah as { urutan?: unknown; gaya?: Record<string, Partial<GayaBlok>>; kustom?: unknown; dihapus?: unknown };
  if (Array.isArray(m.kustom)) {
    const dipakai = new Set<string>();
    for (const x of m.kustom.slice(0, MAKS_KUSTOM)) {
      if (!x || typeof x !== "object") continue;
      const b = x as Partial<BlokKustom>;
      if (typeof b.id !== "string" || !adaKustom(b.id) || dipakai.has(b.id)) continue;
      dipakai.add(b.id);
      t.kustom.push({ id: b.id, model: MODEL_ID.has(b.model as string) ? (b.model as ModelKustom) : "kartu", label: teksAman(b.label, 60), judul: teksAman(b.judul, 300), isi: teksAman(b.isi, 1500), tombol: teksAman(b.tombol, 60), href: tautanAman(b.href), gambar: gambarAman(b.gambar) });
    }
  }
  const semua = [...(BLOK_IDS as readonly string[]), ...t.kustom.map((k) => k.id)];
  if (Array.isArray(m.urutan)) {
    const unik = [...new Set(m.urutan.filter((x): x is string => typeof x === "string" && semua.includes(x)))];
    t.urutan = [...unik, ...semua.filter((b) => !unik.includes(b))];
  } else t.urutan = semua;
  if (Array.isArray(m.dihapus)) t.dihapus = [...new Set(m.dihapus.filter((x): x is BlokId => (BLOK_IDS as readonly string[]).includes(x as string)))];
  for (const k of t.kustom) t.gaya[k.id] = gayaKustom(k.model);
  for (const id of semua) {
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
