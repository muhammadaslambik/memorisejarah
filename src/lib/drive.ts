// PAKET-32: penjelajah folder Google Drive di dalam situs (tanpa tab baru, warna mengikuti situs).
// Isi folder dibaca lewat Google Drive API v3 dengan kunci API (GOOGLE_DRIVE_API_KEY, hanya dipakai di server). Folder harus dibagikan "Siapa saja yang memiliki link".
// Keamanan: server hanya mau membuka folder akar pustaka atau subfolder yang ia sendiri daftarkan (diberi tanda HMAC), bukan folder Drive sembarang.
import { kunciSesi } from "./sesi";

export const driveSiap = () => !!process.env.GOOGLE_DRIVE_API_KEY;
const DASAR = () => process.env.GOOGLE_DRIVE_API_BASE || "https://www.googleapis.com/drive/v3"; // GOOGLE_DRIVE_API_BASE hanya untuk uji lokal

export type ItemFolder = { id: string; nama: string; t: string };
export type ItemBerkas = { id: string; nama: string; mime: string; thumb: string; ukuran: number; diubah: string };
export type IsiFolder = { folders: ItemFolder[]; berkas: ItemBerkas[] };

export const idValid = (s: string) => /^[\w-]{10,80}$/.test(s);

async function hmac(id: string) {
  const k = await crypto.subtle.importKey("raw", kunciSesi(), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const s = new Uint8Array(await crypto.subtle.sign("HMAC", k, new TextEncoder().encode("pustaka:" + id))).slice(0, 12);
  return btoa(String.fromCharCode(...s)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export async function cekTanda(id: string, t: string) {
  if (!t) return false;
  const benar = await hmac(id);
  if (benar.length !== t.length) return false;
  let beda = 0;
  for (let i = 0; i < benar.length; i++) beda |= benar.charCodeAt(i) ^ t.charCodeAt(i);
  return beda === 0;
}

type Mentah = { id: string; name: string; mimeType: string; thumbnailLink?: string; size?: string; modifiedTime?: string; shortcutDetails?: { targetId?: string; targetMimeType?: string } };
const MIME_FOLDER = "application/vnd.google-apps.folder";
const MIME_PINTAS = "application/vnd.google-apps.shortcut";

export async function daftarFolder(id: string): Promise<IsiFolder> {
  const kunci = process.env.GOOGLE_DRIVE_API_KEY;
  if (!kunci) throw new Error("kunci belum diatur");
  const semua: Mentah[] = [];
  let halaman = "";
  for (let i = 0; i < 3; i++) {
    const p = new URLSearchParams({
      q: `'${id}' in parents and trashed=false`, key: kunci, pageSize: "1000", orderBy: "folder,name_natural",
      fields: "nextPageToken,files(id,name,mimeType,thumbnailLink,size,modifiedTime,shortcutDetails(targetId,targetMimeType))",
      supportsAllDrives: "true", includeItemsFromAllDrives: "true",
    });
    if (halaman) p.set("pageToken", halaman);
    const r = await fetch(`${DASAR()}/files?${p}`, { headers: { Accept: "application/json" } });
    if (!r.ok) throw new Error(`Drive ${r.status}`);
    const d = (await r.json()) as { files?: Mentah[]; nextPageToken?: string };
    semua.push(...(d.files ?? []));
    if (!d.nextPageToken) break;
    halaman = d.nextPageToken;
  }
  const folders: ItemFolder[] = [];
  const berkas: ItemBerkas[] = [];
  for (const f of semua) {
    let fid = f.id, mime = f.mimeType;
    if (mime === MIME_PINTAS && f.shortcutDetails?.targetId) { fid = f.shortcutDetails.targetId; mime = f.shortcutDetails.targetMimeType ?? ""; }
    if (!idValid(fid)) continue;
    if (mime === MIME_FOLDER) folders.push({ id: fid, nama: f.name, t: await hmac(fid) });
    else berkas.push({ id: fid, nama: f.name, mime, thumb: f.thumbnailLink ?? "", ukuran: Number(f.size ?? 0) || 0, diubah: f.modifiedTime ?? "" });
  }
  return { folders, berkas };
}
