// PAKET-13C: daftar bahasa untuk alat bahasa di CMS (sama dengan tombol bahasa di halaman utama)
export type Bahasa = { kode: string; lang: string; nama: string };

// kode = kode Google Translate; lang = kode BCP 47 untuk atribut lang (pemeriksa ejaan peramban)
export const BAHASA_CMS: Bahasa[] = [
  { kode: "id", lang: "id", nama: "Bahasa Indonesia" },
  { kode: "jw", lang: "jv", nama: "Basa Jawa" },
  { kode: "su", lang: "su", nama: "Basa Sunda" },
  { kode: "ms", lang: "ms", nama: "Bahasa Melayu" },
  { kode: "ar", lang: "ar", nama: "\u0627\u0644\u0639\u0631\u0628\u064A\u0629 (Arab)" },
  { kode: "zh-CN", lang: "zh-CN", nama: "\u4E2D\u6587 (Mandarin)" },
  { kode: "en", lang: "en", nama: "English" },
  { kode: "fr", lang: "fr", nama: "Fran\u00E7ais" },
  { kode: "ru", lang: "ru", nama: "\u0420\u0443\u0441\u0441\u043A\u0438\u0439" },
  { kode: "es", lang: "es", nama: "Espa\u00F1ol" },
];
export const cariBahasa = (kode: string) => BAHASA_CMS.find((b) => b.kode === kode) ?? BAHASA_CMS[0];
