// PAKET-7A: data bersama yang dibaca sekali per permintaan (React cache), agar Header, Footer,
// dan blok beranda tidak mengulang kueri yang sama ke database.
import { cache } from "react";
import { db, categories, siteSettings } from "@/db";

// Kategori untuk menu: hanya subkategori (kategori induk tidak ditampilkan di menu)
export const ambilKategoriCache = cache(async () => {
  try {
    const k = await db().select().from(categories).orderBy(categories.name);
    const induk = new Set(k.map((c) => c.parentId));
    return k.filter((c) => !induk.has(c.id));
  } catch {
    return [];
  }
});

// Semua pengaturan tampilan dalam satu kueri
export const semuaPengaturan = cache(async () => {
  try {
    const rows = await db().select().from(siteSettings);
    return new Map(rows.map((r) => [r.key, r.value]));
  } catch {
    return new Map<string, string>();
  }
});