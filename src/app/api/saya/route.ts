// PAKET-15C: data singkat pengguna yang sedang masuk (nama, foto) untuk header situs publik. Tanpa sesi: null.
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { fotoKecil } from "@/lib/foto";

export const dynamic = "force-dynamic";

export async function GET() {
  const me = await getCurrentUser();
  const kepala = { "Cache-Control": "no-store" };
  if (!me) return NextResponse.json(null, { headers: kepala });
  const inisial = me.name.split(" ").filter(Boolean).slice(0, 2).map((x) => x[0]).join("").toUpperCase() || "?";
  return NextResponse.json({ nama: me.name, foto: fotoKecil(me.photoUrl), inisial }, { headers: kepala });
}
