// PAKET-21: mengenali tautan video dari berbagai situs dan mengubahnya menjadi alamat sematan (embed). Hanya https.
// Dipakai di server (menampilkan kartu) dan di CMS (pratinjau). Situs yang tidak dikenal hanya dibuka sebagai tautan biasa.
export type JenisEmbed = "youtube" | "vimeo" | "instagram" | "tiktok" | "twitter" | "facebook" | "berkas" | "tautan";
export type Embed = { jenis: JenisEmbed; label: string; src: string; poster: string; tinggi: boolean };

const NAMA: Record<JenisEmbed, string> = { youtube: "YouTube", vimeo: "Vimeo", instagram: "Instagram", tiktok: "TikTok", twitter: "X (Twitter)", facebook: "Facebook", berkas: "Berkas video", tautan: "Tautan video" };

export function embedDariUrl(mentah: string): Embed | null {
  let u: URL;
  try { u = new URL(mentah.trim()); } catch { return null; }
  if (u.protocol !== "https:") return null;
  const h = u.hostname.toLowerCase().replace(/^(www\.|m\.|mobile\.)/, "");
  const p = u.pathname;
  const buat = (jenis: JenisEmbed, src: string, poster = "", tinggi = false): Embed => ({ jenis, label: NAMA[jenis], src, poster, tinggi });

  if (h === "youtu.be" || h === "youtube.com" || h === "youtube-nocookie.com" || h === "music.youtube.com") {
    const id = h === "youtu.be" ? p.split("/")[1] : (u.searchParams.get("v") ?? p.match(/^\/(?:shorts|embed|live|v)\/([\w-]{11})/)?.[1]);
    if (id && /^[\w-]{11}$/.test(id)) return buat("youtube", `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`, `https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
  }
  if (h === "vimeo.com") {
    const id = p.match(/\/(\d{5,})/)?.[1];
    if (id) return buat("vimeo", `https://player.vimeo.com/video/${id}?autoplay=1`);
  }
  if (h === "instagram.com") {
    const m = p.match(/^\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([\w-]+)/);
    if (m) return buat("instagram", `https://www.instagram.com/${m[1] === "reels" ? "reel" : m[1]}/${m[2]}/embed/`, "", true);
  }
  if (h === "tiktok.com") {
    const id = p.match(/\/video\/(\d+)/)?.[1];
    if (id) return buat("tiktok", `https://www.tiktok.com/embed/v2/${id}`, "", true);
  }
  if (h === "twitter.com" || h === "x.com") {
    const id = p.match(/\/status(?:es)?\/(\d+)/)?.[1];
    if (id) return buat("twitter", `https://platform.twitter.com/embed/Tweet.html?id=${id}&theme=dark`, "", true);
  }
  if (h === "facebook.com" || h === "fb.watch" || h === "fb.com") {
    const video = h === "fb.watch" || /\/(videos|reel|watch)\b/.test(p);
    return buat("facebook", `https://www.facebook.com/plugins/${video ? "video" : "post"}.php?href=${encodeURIComponent(u.toString())}&show_text=false`, "", true);
  }
  if (/\.(mp4|webm|mov|m4v)$/i.test(p)) return buat("berkas", u.toString());
  return buat("tautan", u.toString());
}
