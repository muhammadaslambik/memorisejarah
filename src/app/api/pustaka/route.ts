// PAKET-32: isi satu folder Pustaka (Google Drive) untuk penjelajah di halaman /pustaka. Hanya folder akar pustaka atau subfolder bertanda yang dilayani.
import { NextResponse, type NextRequest } from "next/server";
import { getPustaka } from "@/lib/pengaturan";
import { PUSTAKA } from "@/lib/pustaka";
import { cekTanda, daftarFolder, driveSiap, idValid } from "@/lib/drive";

export const dynamic = "force-dynamic";
const json = (d: unknown, status = 200, kepala: Record<string, string> = {}) => NextResponse.json(d, { status, headers: kepala });

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  const id = u.searchParams.get("d") ?? "";
  const t = u.searchParams.get("t") ?? "";
  const k = u.searchParams.get("k") ?? "";
  if (!driveSiap()) return json({ galat: "belum-diatur" }, 503);
  if (!idValid(id)) return json({ galat: "id-tidak-valid" }, 400);
  let daftar: { kunci: string; id: string }[] = PUSTAKA;
  try { daftar = await getPustaka(); } catch { /* pakai bawaan */ }
  const akar = daftar.find((p) => p.kunci === k);
  if (!((akar && akar.id === id) || (await cekTanda(id, t)))) return json({ galat: "tidak-diizinkan" }, 403);

  // cache tepi 5 menit agar kuota Drive API hemat (hanya ada di Cloudflare; di komputer lokal dilewati)
  const cache = typeof caches !== "undefined" ? (caches as unknown as { default?: Cache }).default : undefined;
  const kunciCache = new Request(`https://pustaka.cache.internal/${id}`);
  try { const hit = await cache?.match(kunciCache); if (hit) return new NextResponse(hit.body, { status: 200, headers: hit.headers }); } catch { /* abaikan */ }
  try {
    const isi = await daftarFolder(id);
    const kepala = { "Cache-Control": "public, max-age=300", "Content-Type": "application/json" };
    const res = new NextResponse(JSON.stringify(isi), { status: 200, headers: kepala });
    try { await cache?.put(kunciCache, res.clone()); } catch { /* abaikan */ }
    return res;
  } catch {
    return json({ galat: "gagal-memuat" }, 502);
  }
}
