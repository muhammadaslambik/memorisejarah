// PAKET-15B: ambil ID video YouTube dari alamat (watch, youtu.be, embed, shorts, live) atau ID 11 karakter. Dipakai di sisi peramban.
export const ambilIdYoutube = (input: string): string | null => {
  const s = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(s)) return s;
  if (!s) return null;
  try {
    const u = new URL(s.startsWith("http") ? s : `https://${s}`);
    const host = u.hostname.replace(/^www\.|^m\./, "");
    let id: string | null = null;
    if (host === "youtu.be") id = u.pathname.split("/")[1] ?? null;
    else if (host === "youtube.com" || host === "youtube-nocookie.com") {
      const bagian = u.pathname.split("/").filter(Boolean);
      if (u.searchParams.get("v")) id = u.searchParams.get("v");
      else if (["embed", "shorts", "live", "v"].includes(bagian[0])) id = bagian[1] ?? null;
    }
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
};
