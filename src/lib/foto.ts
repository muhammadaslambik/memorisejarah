// PAKET-15C: alamat foto akun yang diperkecil lewat ImageKit (hemat bandwidth). Alamat lain dikembalikan apa adanya.
export const fotoKecil = (url: string | null | undefined, sisi = 96): string | null => {
  if (!url) return null;
  if (!url.startsWith("https://ik.imagekit.io/") || url.includes("?")) return url;
  return `${url}?tr=w-${sisi},h-${sisi}`;
};
