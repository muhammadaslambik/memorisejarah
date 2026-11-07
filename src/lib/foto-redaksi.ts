// PAKET-15I: foto anggota redaksi. Urutan: foto di profil redaksi -> foto akun penulis yang tertaut -> foto akun yang namanya
// diawali nama penulis (mis. "Arya Bagus" untuk "Arya Bagus Nur Ajiyanto, S.Hum."). Dipakai bersama leftJoin users pada userId.
import { sql } from "drizzle-orm";
import { redaksi, users } from "@/db";

export const fotoRedaksiSql = sql<string | null>`coalesce(${redaksi.fotoUrl}, ${users.photoUrl}, (select u2.photo_url from users u2 where u2.photo_url is not null and u2.active = true and lower(${redaksi.name}) like lower(u2.name) || '%' order by length(u2.name) desc limit 1))`;
