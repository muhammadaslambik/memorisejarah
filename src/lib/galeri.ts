// PAKET-13B: indeks galeri gambar di database (tabel gambar_berkas): daftar cepat, pencarian nama,
// pencegah gambar kembar (hash isi gambar), dan fileId ImageKit untuk penghapusan langsung.
// Semua fungsi aman dipanggil sebelum tabel dibuat: bila galat, hasilnya kosong/null dan unggah tetap berjalan.
import { desc, eq, ilike, or } from "drizzle-orm";
import { db, gambarBerkas } from "@/db";

export type BerkasGaleri = { id: string; nama: string; url: string };

export async function daftarGaleriDB(skip: number, limit: number, cari: string): Promise<{ berkas: BerkasGaleri[]; lagi: boolean } | null> {
  try {
    const q = cari.trim();
    const kondisi = q ? ilike(gambarBerkas.nama, `%${q.replace(/[%_\\]/g, "\\$&")}%`) : undefined;
    const rows = await db()
      .select({ id: gambarBerkas.id, nama: gambarBerkas.nama, url: gambarBerkas.url })
      .from(gambarBerkas)
      .where(kondisi)
      .orderBy(desc(gambarBerkas.dibuat), desc(gambarBerkas.id))
      .limit(limit + 1)
      .offset(skip);
    if (rows.length === 0 && skip === 0 && !q) return null; // tabel masih kosong: pakai daftar langsung dari ImageKit
    return { berkas: rows.slice(0, limit).map((r) => ({ id: String(r.id), nama: r.nama, url: r.url })), lagi: rows.length > limit };
  } catch {
    return null;
  }
}

// Berkas dengan isi yang sama persis (hash isi tersimpan, atau hash berkas asli sebelum dikecilkan di peramban)
export async function cariBerkasSama(hash: string, hashAsli?: string | null): Promise<{ url: string } | null> {
  try {
    const kondisi = hashAsli
      ? or(eq(gambarBerkas.hash, hash), eq(gambarBerkas.hashAsli, hashAsli), eq(gambarBerkas.hash, hashAsli))
      : eq(gambarBerkas.hash, hash);
    const [r] = await db().select({ url: gambarBerkas.url }).from(gambarBerkas).where(kondisi).limit(1);
    return r ?? null;
  } catch {
    return null;
  }
}

export async function catatBerkas(b: { url: string; fileId?: string | null; nama: string; hash?: string | null; hashAsli?: string | null; ukuran?: number | null; lebar?: number | null; tinggi?: number | null }): Promise<void> {
  try { await db().insert(gambarBerkas).values(b).onConflictDoNothing(); } catch { /* tabel belum ada */ }
}

export async function idBerkasDB(url: string): Promise<string | null> {
  try {
    const [r] = await db().select({ fileId: gambarBerkas.fileId }).from(gambarBerkas).where(eq(gambarBerkas.url, url)).limit(1);
    return r?.fileId ?? null;
  } catch {
    return null;
  }
}

export async function hapusCatatan(url: string): Promise<void> {
  try { await db().delete(gambarBerkas).where(eq(gambarBerkas.url, url)); } catch { /* abaikan */ }
}
