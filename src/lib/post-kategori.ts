// PAKET-5B: kategori artikel (banyak kategori per artikel via tabel post_categories)
import { eq, inArray } from "drizzle-orm";
import { db, categories, postCategories } from "@/db";

type DB = ReturnType<typeof db>;

const daftarId = (fd: FormData) =>
  Array.from(new Set(fd.getAll("categoryIds").map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0)));

async function kategoriAda(d: DB, fd: FormData) {
  const ids = daftarId(fd);
  if (ids.length === 0) return [];
  return d.select().from(categories).where(inArray(categories.id, ids));
}

// Kategori utama (dipakai untuk lencana di kartu): subkategori pertama yang dicentang, bila tidak ada, yang pertama
export async function kategoriUtama(d: DB, fd: FormData): Promise<number | null> {
  const ada = await kategoriAda(d, fd);
  return (ada.find((c) => c.parentId !== null) ?? ada[0])?.id ?? null;
}

export async function simpanKategori(d: DB, postId: number, fd: FormData) {
  const ada = await kategoriAda(d, fd);
  await d.delete(postCategories).where(eq(postCategories.postId, postId));
  if (ada.length) await d.insert(postCategories).values(ada.map((c) => ({ postId, categoryId: c.id })));
}