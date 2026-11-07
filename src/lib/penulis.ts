// PAKET-12D: data penulis untuk halaman artikel dan halaman tulisan penulis.
// Profil diambil dari Redaksi (bila akun penulis punya profil aktif); email akun tidak pernah ditampilkan.
import { and, count, desc, eq } from "drizzle-orm";
import { db, posts, redaksi, redaksiTim, users } from "@/db";
import { namaTim, tautanAman } from "./redaksi";

export type DataPenulis = {
  id: number;
  nama: string;
  foto: string | null;
  peran: string;
  bidang: string;
  domisili: string;
  tim: string[];
  bio: string;
  kontak: [string, string][];
  profilSlug: string | null;
  jumlah: number;
  tulisan: { slug: string; title: string }[];
};

export async function ambilPenulis(authorId: number | null | undefined): Promise<DataPenulis | null> {
  if (!authorId) return null;
  try {
    const d = db();
    const [u] = await d.select({ id: users.id, name: users.name, foto: users.photoUrl }).from(users).where(eq(users.id, authorId)).limit(1);
    if (!u) return null;
    const [m] = await d.select().from(redaksi).where(and(eq(redaksi.userId, u.id), eq(redaksi.aktif, true))).limit(1);
    const terbit = and(eq(posts.authorId, u.id), eq(posts.status, "published"));
    const [tim, [jml], tulisan] = await Promise.all([
      m ? d.select().from(redaksiTim).where(eq(redaksiTim.memberId, m.id)) : Promise.resolve([]),
      d.select({ n: count() }).from(posts).where(terbit),
      d.select({ slug: posts.slug, title: posts.title }).from(posts).where(terbit).orderBy(desc(posts.publishedAt)).limit(8),
    ]);
    const kontak: [string, string][] = [];
    if (m?.email) kontak.push(["Email", `mailto:${m.email}`]);
    if (m?.whatsapp) kontak.push(["WhatsApp", `https://wa.me/${m.whatsapp}`]);
    if (m?.instagram) kontak.push(["Instagram", m.instagram]);
    if (m?.linkedin) kontak.push(["LinkedIn", m.linkedin]);
    if (m?.facebook) kontak.push(["Facebook", m.facebook]);
    if (m?.website) kontak.push(["Situs web", m.website]);
    return {
      id: u.id,
      nama: m?.name ?? u.name,
      foto: m?.fotoUrl ?? u.foto ?? null, // PAKET-15H: foto akun sebagai cadangan
      peran: m?.peran ?? "",
      bidang: m?.bidang ?? "",
      domisili: m?.domisili ?? "",
      tim: tim.map((t) => namaTim(t.tim)),
      bio: m?.bio ?? "",
      kontak: kontak.filter(([, url]) => tautanAman(url)),
      profilSlug: m?.slug ?? null,
      jumlah: Number(jml?.n ?? 0),
      tulisan,
    };
  } catch {
    return null;
  }
}

// Artikel impor WordPress membawa tautan "Lihat Biografi Penulis" di dalam isi; sekarang digantikan nama penulis yang bisa diklik.
export function buangTautanBiografiLama(html: string): string {
  return html.replace(/<p\b[^>]*>[\s\S]*?<\/p>/gi, (blok) =>
    /lihat\s+biografi\s+penulis/i.test(blok) && blok.replace(/<[^>]*>/g, "").trim().length < 60 ? "" : blok);
}

// PAKET-12D2: ringkasan penulis untuk baris tanggal di artikel (ringan: hanya nama dan alamat profil)
export type RingkasPenulis = { id: number; nama: string; profilSlug: string | null };

export async function ringkasPenulis(authorId: number | null | undefined): Promise<RingkasPenulis | null> {
  if (!authorId) return null;
  try {
    const d = db();
    const [u] = await d.select({ id: users.id, name: users.name }).from(users).where(eq(users.id, authorId)).limit(1);
    if (!u) return null;
    const [m] = await d.select({ name: redaksi.name, slug: redaksi.slug }).from(redaksi).where(and(eq(redaksi.userId, u.id), eq(redaksi.aktif, true))).limit(1);
    return { id: u.id, nama: m?.name ?? u.name, profilSlug: m?.slug ?? null };
  } catch {
    return null;
  }
}
