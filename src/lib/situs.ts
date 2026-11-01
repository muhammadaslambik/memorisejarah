// PAKET-9E: pengaturan umum situs (tautan sosial, kontak, teks sambutan footer)
import { getSetting } from "./pengaturan";

export type Situs = { instagram: string; youtube: string; whatsapp: string; email: string; sambutan1: string; sambutan2: string };

export const SITUS_DEFAULT: Situs = {
  instagram: "https://www.instagram.com/memori_sejarah",
  youtube: "https://www.youtube.com/@Memori_Sejarah",
  whatsapp: "",
  email: "admin@memorisejarah.eu.org",
  sambutan1: "Selamat datang di Memori Sejarah. Situs ini berisi karya historiografi dan kumpulan data sumber primer sejarah.",
  sambutan2: "Kami percaya sejarah bukan hanya hafalan tanggal, melainkan dialog kritis antara masa lalu dan masa kini untuk masa depan yang lebih adil.",
};

// Nilai yang pernah disimpan dari CMS menimpa bawaan, termasuk yang dikosongkan (kosong = disembunyikan)
export async function getSitus(): Promise<Situs> {
  const tersimpan = await getSetting<Partial<Situs>>("situs", {});
  return { ...SITUS_DEFAULT, ...tersimpan };
}