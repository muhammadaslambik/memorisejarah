// PAKET-9C: konstanta dan pembantu untuk redaksi (tidak berisi data pribadi)
export const TIM = [
  { kunci: "editor", nama: "Tim Editor dan Kreatif" },
  { kunci: "humas", nama: "Tim Humas & Jaringan Relasi" },
  { kunci: "it", nama: "Tim IT (Situs Website)" },
  { kunci: "sosmed", nama: "Tim Sosial-Media" },
  { kunci: "riset", nama: "Tim Riset" },
] as const;

export const namaTim = (kunci: string) => TIM.find((t) => t.kunci === kunci)?.nama ?? kunci;

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim()
    .replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);

// Nomor WhatsApp: hanya angka, awalan 0 atau 8 dijadikan 62 (Indonesia)
export const waDigits = (s: string): string => {
  let d = s.replace(/[^\d]/g, "");
  if (d.startsWith("0")) d = "62" + d.slice(1);
  else if (d.startsWith("8")) d = "62" + d;
  return d.slice(0, 20);
};

// Tautan https saja. Kosong -> "", tidak valid -> null
export const tautanHttps = (input: string): string | null => {
  const v = input.trim();
  if (!v) return "";
  try {
    const u = new URL(/^[a-z]+:\/\//i.test(v) ? v.replace(/^http:\/\//i, "https://") : `https://${v}`);
    return u.protocol === "https:" && v.length <= 500 ? u.toString() : null;
  } catch {
    return null;
  }
};

// Instagram: boleh @nama, nama, atau tautan
export const tautanInstagram = (input: string): string | null => {
  const v = input.trim();
  if (!v) return "";
  if (v.includes("/") || v.includes(".com")) return tautanHttps(v);
  const h = v.replace(/^@/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(h) ? `https://www.instagram.com/${h}/` : null;
};

// Pertahanan tambahan saat menampilkan: hanya https atau mailto
export const tautanAman = (u: string) => /^(https:\/\/|mailto:)/i.test(u);