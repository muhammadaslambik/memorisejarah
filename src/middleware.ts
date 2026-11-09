import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { buatToken, kunciSesi, opsiCookieSesi, PERBARUI_SETELAH_DETIK } from "@/lib/sesi";

// Lindungi semua /admin kecuali halaman login. Sesi yang masih berlaku diperpanjang otomatis; bila ditolak, alasannya dibawa ke halaman login.
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin/login")) return NextResponse.next();
  const token = req.cookies.get("session")?.value;
  const ke = (alasan: string) => NextResponse.redirect(new URL(`/admin/login?alasan=${alasan}`, req.url));
  if (!token) return ke("sesi");
  try {
    const { payload } = await jwtVerify(token, kunciSesi());
    const res = NextResponse.next();
    const iat = typeof payload.iat === "number" ? payload.iat : 0;
    if (typeof payload.uid === "number" && Date.now() / 1000 - iat > PERBARUI_SETELAH_DETIK) {
      res.cookies.set("session", await buatToken(payload.uid), opsiCookieSesi);
    }
    return res;
  } catch (e) {
    const kode = (e as { code?: string } | null)?.code;
    return ke(kode === "ERR_JWT_EXPIRED" ? "habis" : "tidak-valid");
  }
}
export const config = { matcher: ["/admin/:path*"] };
