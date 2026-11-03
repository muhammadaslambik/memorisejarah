// PAKET-12B: sambungan server ke ImageKit (daftar berkas, hapus berkas). Kunci privat hanya dibaca di server.
// Hanya berkas di folder /memori-sejarah yang pernah disentuh; alamat gambar lain dibiarkan.
import { sql } from "drizzle-orm";
import { db } from "@/db";

const API = "https://api.imagekit.io/v1";
const FOLDER = "/memori-sejarah";
const MAKS_HAPUS = 12; // batas berkas yang dibersihkan sekali jalan (membatasi jumlah panggilan jaringan)

const auth = () => {
  const k = process.env.IMAGEKIT_PRIVATE_KEY;
  return k ? "Basic " + btoa(k + ":") : null;
};

// Alamat ImageKit milik situs -> jalur berkas (/memori-sejarah/nama.jpg); selain itu null
export const jalurIK = (url: string | null | undefined): string | null => {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname !== "ik.imagekit.io") return null;
    const seg = decodeURIComponent(u.pathname).split("/").filter(Boolean); // [idImageKit, memori-sejarah, nama]
    return seg.length >= 3 && seg[1] === "memori-sejarah" ? "/" + seg.slice(1).join("/") : null;
  } catch {
    return null;
  }
};

export const urlIKDalam = (html: string): string[] => {
  const hasil = new Set<string>();
  for (const m of html.matchAll(/src="(https:\/\/ik\.imagekit\.io\/[^"?]+)/gi)) hasil.add(m[1]);
  return [...hasil];
};

export type BerkasIK = { id: string; nama: string; url: string };

export async function daftarBerkasIK(skip: number, limit = 24): Promise<{ berkas: BerkasIK[]; lagi: boolean } | { galat: string }> {
  const a = auth();
  if (!a) return { galat: "Penyimpanan ImageKit belum disiapkan (IMAGEKIT_PRIVATE_KEY kosong)." };
  try {
    const q = new URL(`${API}/files`);
    q.searchParams.set("path", FOLDER);
    q.searchParams.set("type", "file");
    q.searchParams.set("fileType", "image");
    q.searchParams.set("sort", "DESC_CREATED");
    q.searchParams.set("skip", String(skip));
    q.searchParams.set("limit", String(limit + 1));
    const r = await fetch(q, { headers: { Authorization: a } });
    if (!r.ok) return { galat: "ImageKit menolak permintaan daftar gambar." };
    const j = (await r.json()) as { fileId: string; name: string; url: string }[];
    return { berkas: j.slice(0, limit).map((f) => ({ id: f.fileId, nama: f.name, url: f.url })), lagi: j.length > limit };
  } catch {
    return { galat: "Tidak dapat menghubungi ImageKit." };
  }
}

type Berkas = { fileId: string; filePath: string };

async function cariIdBerkas(a: string, jalur: string): Promise<string | null> {
  const nama = jalur.split("/").pop() ?? "";
  const q = new URL(`${API}/files`);
  q.searchParams.set("path", FOLDER);
  q.searchParams.set("searchQuery", `name = "${nama.replace(/"/g, "")}"`);
  q.searchParams.set("limit", "10");
  const r = await fetch(q, { headers: { Authorization: a } });
  if (r.ok) return ((await r.json()) as Berkas[]).find((f) => f.filePath === jalur)?.fileId ?? null;
  // Cadangan bila pencarian ditolak: pindai daftar folder
  for (let skip = 0; skip < 3000; skip += 1000) {
    const p = new URL(`${API}/files`);
    p.searchParams.set("path", FOLDER);
    p.searchParams.set("skip", String(skip));
    p.searchParams.set("limit", "1000");
    const rr = await fetch(p, { headers: { Authorization: a } });
    if (!rr.ok) return null;
    const j = (await rr.json()) as Berkas[];
    const ketemu = j.find((f) => f.filePath === jalur);
    if (ketemu) return ketemu.fileId;
    if (j.length < 1000) break;
  }
  return null;
}

export async function hapusBerkasIK(url: string): Promise<boolean> {
  const a = auth();
  const jalur = jalurIK(url);
  if (!a || !jalur) return false;
  try {
    const id = await cariIdBerkas(a, jalur);
    if (!id) return false;
    return (await fetch(`${API}/files/${id}`, { method: "DELETE", headers: { Authorization: a } })).ok;
  } catch {
    return false;
  }
}

// Apakah nama berkas ini masih tertulis di artikel, sampul, galeri, foto redaksi, atau pengaturan situs?
async function masihDipakai(jalur: string): Promise<boolean> {
  const nama = jalur.split("/").pop() ?? "";
  const pola = `%${nama.replace(/[%_\\]/g, "\\$&")}%`;
  const r = await db().execute(sql`select (
    exists(select 1 from posts where content ilike ${pola} or cover_url ilike ${pola})
    or exists(select 1 from images where url ilike ${pola})
    or exists(select 1 from redaksi where foto_url ilike ${pola})
    or exists(select 1 from settings where value ilike ${pola})
    or exists(select 1 from site_settings where value ilike ${pola})
  ) as dipakai`);
  return (r.rows[0] as { dipakai?: boolean } | undefined)?.dipakai !== false;
}

// Dipanggil SETELAH data tersimpan: berkas yang sudah tidak dipakai di mana pun dihapus dari ImageKit.
// Tidak pernah melempar galat, supaya gagalnya pembersihan tidak menggagalkan penyimpanan.
export async function bersihkanYatim(urls: (string | null | undefined)[]): Promise<void> {
  try {
    const unik = new Set<string>();
    for (const u of urls) {
      const j = jalurIK(u);
      if (j) unik.add(u!.split("?")[0]);
    }
    let n = 0;
    for (const u of unik) {
      if (n++ >= MAKS_HAPUS) break;
      const j = jalurIK(u)!;
      if (!(await masihDipakai(j))) await hapusBerkasIK(u);
    }
  } catch { /* abaikan */ }
}
