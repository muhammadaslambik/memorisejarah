// PAKET-3C2: pengaturan tampilan situs. Nilai dari CMS menimpa isi bawaan; bila kosong, isi bawaan dipakai.
import { eq } from "drizzle-orm";
import { db, siteSettings } from "@/db";
import { AGENDA, type Program } from "./agenda";
import { PUSTAKA } from "./pustaka";

export async function getSetting<T>(key: string, def: T): Promise<T> {
  try {
    const [r] = await db().select().from(siteSettings).where(eq(siteSettings.key, key)).limit(1);
    return r ? (JSON.parse(r.value) as T) : def;
  } catch {
    return def;
  }
}

export async function setSetting(key: string, value: unknown) {
  const v = JSON.stringify(value);
  await db().insert(siteSettings).values({ key, value: v })
    .onConflictDoUpdate({ target: siteSettings.key, set: { value: v, updatedAt: new Date() } });
}

// ---------- Agenda & Program ----------
export type OverrideAgenda = Record<string, Partial<{ nama: string; sub: string; emoji: string; deskripsi: string; jadwal: string }>>;
export type ProgramTampil = Program & { emoji: string };

export async function getAgenda(): Promise<ProgramTampil[]> {
  const ov = await getSetting<OverrideAgenda>("agenda", {});
  return AGENDA.map((a) => {
    const o = ov[a.slug] ?? {};
    return {
      ...a,
      nama: o.nama || a.nama,
      sub: o.sub || a.sub,
      deskripsi: o.deskripsi || a.deskripsi,
      jadwal: o.jadwal !== undefined ? o.jadwal : a.jadwal,
      emoji: o.emoji || String.fromCodePoint(a.ikon),
    };
  });
}

// ---------- Informasi ----------
export type Informasi = {
  merah: { label: string; judul: string; ket: string; tombol: string; href: string };
  krem: { judul: string; isi: string; kutipan: string };
  diskusi: { thumbAtas: string; thumbJudul: string; thumbBawah: string; badge: string; judul: string; deskripsi: string; info: string };
  hijau: { judul: string; deskripsi: string; tombol: string; href: string };
};

export const INFORMASI_DEFAULT: Informasi = {
  merah: { label: "Sejarah Indonesia", judul: "Sejarah Singkat Kemerdekaan Indonesia", ket: "Narasi proklamasi, diplomasi, dan perjuangan fisik 1945-1949", tombol: "Baca Materi", href: "/cari?q=kemerdekaan" },
  krem: {
    judul: "Apa manfaat sejarah?",
    isi: "Sejarah membantu kita **meminimalisir konflik** dengan memahami akar prasangka, pola kekuasaan, dan pengalaman kolektif. Tanpa memori, kita mengulang kesalahan yang sama.",
    kutipan: "Bangsa yang melupakan sejarahnya akan kehilangan identitasnya. - Memori Sejarah",
  },
  diskusi: {
    thumbAtas: "Spesial Ramadhan", thumbJudul: "Diskusi Sejarah Ramadhan", thumbBawah: "Maret 2025", badge: "Live Discussion",
    judul: "Diskusi Sejarah (Spesial Ramadhan): Seminar Rutin Setiap Bulan Suci",
    deskripsi: "Menghidupkan tradisi diskusi intelektual di bidang ilmu sejarah bersama lima pemateri.",
    info: "14, 16-19 Maret 2025 \u2022 pukul 16.30 - 17.15 \u2022 siaran langsung YouTube",
  },
  hijau: { judul: "Diskusi Sejarah (Spesial Ramadhan)", deskripsi: "Kajian tematik setiap sore menjelang berbuka.", tombol: "Lihat Jadwal", href: "/agenda/diskusi-ramadhan" },
};

export const INFORMASI_FIELDS: { grup: keyof Informasi; judul: string; fields: { key: string; label: string; area?: boolean }[] }[] = [
  { grup: "merah", judul: "Kartu merah (utama)", fields: [
    { key: "label", label: "Label kecil" }, { key: "judul", label: "Judul" }, { key: "ket", label: "Keterangan", area: true },
    { key: "tombol", label: "Teks tombol" }, { key: "href", label: "Tautan tombol (contoh: /artikel/slug)" } ] },
  { grup: "krem", judul: "Kartu krem", fields: [
    { key: "judul", label: "Judul" }, { key: "isi", label: "Isi (gunakan **tebal** untuk huruf tebal)", area: true }, { key: "kutipan", label: "Kutipan" } ] },
  { grup: "diskusi", judul: "Kartu diskusi / acara", fields: [
    { key: "thumbAtas", label: "Gambar mini: teks atas" }, { key: "thumbJudul", label: "Gambar mini: judul" }, { key: "thumbBawah", label: "Gambar mini: teks bawah" },
    { key: "badge", label: "Lencana" }, { key: "judul", label: "Judul" }, { key: "deskripsi", label: "Deskripsi", area: true }, { key: "info", label: "Waktu dan tempat" } ] },
  { grup: "hijau", judul: "Kartu hijau", fields: [
    { key: "judul", label: "Judul" }, { key: "deskripsi", label: "Deskripsi", area: true }, { key: "tombol", label: "Teks tombol" }, { key: "href", label: "Tautan tombol" } ] },
];

export async function getInformasi(): Promise<Informasi> {
  const s = await getSetting<Partial<Record<keyof Informasi, Record<string, string>>>>("informasi", {});
  const gabung = <K extends keyof Informasi>(k: K): Informasi[K] => {
    const hasil = { ...INFORMASI_DEFAULT[k] } as Record<string, string>;
    for (const [f, v] of Object.entries(s[k] ?? {})) if (typeof v === "string" && v.trim() !== "") hasil[f] = v;
    return hasil as Informasi[K];
  };
  return { merah: gabung("merah"), krem: gabung("krem"), diskusi: gabung("diskusi"), hijau: gabung("hijau") };
}

// ---------- Pustaka ----------
export type PustakaItem = { kunci: string; nama: string; id: string; ket: string; url: string };

export async function getPustaka(): Promise<PustakaItem[]> {
  const s = await getSetting<{ kunci: string; nama: string; id: string; ket: string }[] | null>("pustaka", null);
  const dasar = Array.isArray(s) && s.length > 0 ? s : PUSTAKA;
  return dasar.map((p) => ({ kunci: p.kunci, nama: p.nama, id: p.id, ket: p.ket, url: `https://drive.google.com/drive/folders/${p.id}?usp=sharing` }));
}