// PAKET-20: pembuatan token sesi (aman dipakai di middleware/edge). Sesi 30 hari dan DIPERPANJANG otomatis tiap kali dipakai (lebih dari sehari sejak dibuat),
// sehingga pengguna yang aktif tidak tiba-tiba keluar.
import { SignJWT } from "jose";

export const MASA_SESI_DETIK = 30 * 24 * 3600;
export const PERBARUI_SETELAH_DETIK = 24 * 3600;
export const kunciSesi = () => new TextEncoder().encode(process.env.SESSION_SECRET!);

export const buatToken = (userId: number) =>
  new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime(`${MASA_SESI_DETIK}s`).sign(kunciSesi());

export const opsiCookieSesi = { httpOnly: true, secure: true, sameSite: "lax" as const, path: "/", maxAge: MASA_SESI_DETIK };
