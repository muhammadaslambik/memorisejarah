// PAKET-15L: seluruh galeri untuk pemilih gambar (tanpa halaman bertahap): berkas ImageKit yang terdaftar + judul dan kategori dari entri galeri.
"use server";
import { desc } from "drizzle-orm";
import { requireUser } from "./auth";
import { db, gambarBerkas, images, categories } from "@/db";

export type ItemGaleri = { url: string; nama: string; judul: string; categoryId: number | null };

export async function ambilGaleriLengkap(): Promise<{ item: ItemGaleri[]; kategori: { id: number; name: string }[] } | { galat: string }> {
  await requireUser();
  const d = db();
  const aman = async <T,>(nama: string, f: () => Promise<T[]>): Promise<T[]> => {
    try { return await f(); } catch (e) { console.error(`galeri-lengkap: ${nama} gagal`, e); return []; }
  };
  try {
    const berkas = await aman("berkas", () => d.select({ url: gambarBerkas.url, nama: gambarBerkas.nama }).from(gambarBerkas).orderBy(desc(gambarBerkas.id)));
    const entri = await aman("entri", () => d.select({ url: images.url, title: images.title, categoryId: images.categoryId }).from(images).orderBy(desc(images.id)));
    const kat = await aman("kategori", () => d.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name));
    const dasar = (u: string) => u.split("?")[0];
    const petaEntri = new Map<string, { judul: string[]; categoryId: number | null }>();
    for (const e of entri) {
      const k = dasar(e.url);
      const m = petaEntri.get(k) ?? { judul: [], categoryId: null };
      if (!m.judul.includes(e.title)) m.judul.push(e.title);
      if (m.categoryId === null && e.categoryId !== null) m.categoryId = e.categoryId;
      petaEntri.set(k, m);
    }
    const dilihat = new Set<string>();
    const item: ItemGaleri[] = [];
    for (const b of berkas) {
      const k = dasar(b.url);
      if (dilihat.has(k)) continue;
      dilihat.add(k);
      const m = petaEntri.get(k);
      item.push({ url: b.url, nama: b.nama, judul: m?.judul.join(" | ") ?? "", categoryId: m?.categoryId ?? null });
    }
    // gambar yang ada di galeri tetapi belum tercatat sebagai berkas
    for (const [k, m] of petaEntri) if (!dilihat.has(k)) item.push({ url: k, nama: k.split("/").pop() ?? k, judul: m.judul.join(" | "), categoryId: m.categoryId });
    return { item, kategori: kat };
  } catch (e) {
    console.error("galeri-lengkap", e);
    return { galat: `Gagal memuat galeri (${e instanceof Error ? e.message.slice(0, 120) : "galat tak dikenal"}).` };
  }
}
