// PAKET-13B: pembantu sisi peramban untuk gambar
export async function hashBerkas(f: File): Promise<string> {
  try {
    const h = await crypto.subtle.digest("SHA-256", await f.arrayBuffer());
    return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
  } catch {
    return ""; // peramban tanpa SubtleCrypto: pencegah kembar tetap bekerja di server memakai isi hasil unggahan
  }
}

export const tanpaQuery = (u: string) => u.split("?")[0].trim();

// Alamat gambar ImageKit di dalam HTML artikel (tanpa parameter), sama dengan urlIKDalam di server
export const urlIKDi = (html: string): string[] => {
  const hasil = new Set<string>();
  for (const m of html.matchAll(/src="(https:\/\/ik\.imagekit\.io\/[^"?]+)/gi)) hasil.add(m[1]);
  return [...hasil];
};
