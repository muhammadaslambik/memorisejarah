// PAKET-4B: gambar mini dari ImageKit (transformasi lewat alamat); alamat lain dikembalikan apa adanya
export const kecil = (url: string, lebar = 640): string => {
  try {
    const u = new URL(url);
    if (u.hostname === "ik.imagekit.io") {
      u.searchParams.set("tr", `w-${lebar}`);
      return u.toString();
    }
  } catch {}
  return url;
};