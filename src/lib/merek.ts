// PAKET-28: nama situs tidak pernah diterjemahkan; keterangan di bawah nama mengikuti bahasa yang sedang dibuka.
export const TAGLINE: Record<string, string> = {
  id: "Tempat Mengingat Sejarah",
  jw: "Papan Kanggo Ngelingi Sejarah",
  su: "Tempat Ngélingan Sajarah",
  ms: "Tempat Mengenang Sejarah",
  ar: "مكان لتذكّر التاريخ",
  "zh-CN": "一个铭记历史的地方",
  en: "A Place to Remember History",
  fr: "Un lieu pour se souvenir de l\u2019histoire",
  ru: "Место, где помнят историю",
  es: "Un lugar para recordar la historia",
};

// bahasa aktif dibaca dari cookie Google Translate (/id/en); tanpa cookie = Indonesia
export const kodeBahasaAktif = (): string => {
  if (typeof document === "undefined") return "id";
  const m = document.cookie.match(/(?:^|;\s*)googtrans=([^;]*)/);
  const k = m ? decodeURIComponent(m[1]).split("/")[2] : "";
  return k && TAGLINE[k] ? k : "id";
};
