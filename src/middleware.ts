import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

// Lindungi semua /admin kecuali halaman login
export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith("/admin/login")) return NextResponse.next();
  const token = req.cookies.get("session")?.value;
  try {
    await jwtVerify(token!, new TextEncoder().encode(process.env.SESSION_SECRET!));
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}
export const config = { matcher: ["/admin/:path*"] };
