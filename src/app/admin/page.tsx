// PAKET-10B: dashboard CMS (ringkasan, aksi cepat, artikel terbaru, kategori terbanyak)
import Link from "next/link";
import { count, desc, eq, sql } from "drizzle-orm";
import { db, posts, categories, postCategories, videos, images, redaksi, users } from "@/db";
import { kolomKartu } from "@/lib/kolom";
import { kecil } from "@/lib/gambar-url";
import { isReviewer, requireUser, ROLE_LABEL, type Role } from "@/lib/auth";
import { IkonAdmin } from "@/components/admin/ikon-admin";
import { PageHeader } from "@/components/admin/PageHeader";

export const dynamic = "force-dynamic";

const LABEL = { published: "Terbit", pending: "Menunggu", draft: "Draft" } as const;
const CHIP = { published: "a-chip-hijau", pending: "a-chip-kuning", draft: "a-chip-abu" } as const;
const aman = async <T,>(p: PromiseLike<T>, bawaan: T): Promise<T> => { try { return await p; } catch { return bawaan; } };
const tgl = (d: Date) => d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" });

export default async function Dashboard() {
  const me = await requireUser();
  const rev = isReviewer(me.role);
  const d = db();
  const milik = me.role === "penulis" ? eq(posts.authorId, me.id) : undefined;

  const [perStatus, terbaru, menunggu, nVideo, nGambar, nRedaksi, nPengguna, perKategori] = await Promise.all([
    d.select({ status: posts.status, n: count() }).from(posts).where(milik).groupBy(posts.status),
    d.select(kolomKartu).from(posts).where(milik).orderBy(desc(posts.updatedAt)).limit(6),
    rev ? d.select(kolomKartu).from(posts).where(eq(posts.status, "pending")).orderBy(desc(posts.updatedAt)).limit(5) : Promise.resolve([]),
    aman(d.select({ n: count() }).from(videos), [{ n: 0 }]),
    aman(d.select({ n: count() }).from(images), [{ n: 0 }]),
    aman(d.select({ n: count() }).from(redaksi), [{ n: 0 }]),
    me.role === "admin" ? aman(d.select({ n: count() }).from(users), [{ n: 0 }]) : Promise.resolve([{ n: 0 }]),
    aman(
      d.select({ nama: categories.name, n: sql<number>`count(*)::int` }).from(postCategories)
        .innerJoin(categories, eq(categories.id, postCategories.categoryId)).groupBy(categories.name).orderBy(desc(sql`count(*)`)).limit(6),
      [] as { nama: string; n: number }[],
    ),
  ]);
  const jml = (s: keyof typeof LABEL) => Number(perStatus.find((x) => x.status === s)?.n ?? 0);
  const total = jml("published") + jml("pending") + jml("draft");
  const maks = Math.max(1, ...perKategori.map((k) => k.n));
  const hariIni = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" });

  const kartu: { label: string; nilai: number; ikon: string; warna: string; href: string; ket: string }[] = [
    { label: "Artikel terbit", nilai: jml("published"), ikon: "artikel", warna: "#d9a441", href: "/admin/artikel?s=published", ket: `dari ${total} artikel` },
    { label: "Menunggu", nilai: jml("pending"), ikon: "persetujuan", warna: "#e8a13a", href: rev ? "/admin/persetujuan" : "/admin/artikel?s=pending", ket: "perlu ditinjau" },
    { label: "Draft", nilai: jml("draft"), ikon: "gambar", warna: "#8aa0b8", href: "/admin/artikel?s=draft", ket: "belum diterbitkan" },
    ...(rev ? [
      { label: "Video", nilai: Number(nVideo[0]?.n ?? 0), ikon: "video", warna: "#e0705a", href: "/admin/video", ket: "dalam pustaka" },
      { label: "Gambar", nilai: Number(nGambar[0]?.n ?? 0), ikon: "gambar", warna: "#5bb48a", href: "/admin/gambar", ket: "dalam galeri" },
      { label: "Anggota redaksi", nilai: Number(nRedaksi[0]?.n ?? 0), ikon: "redaksi", warna: "#a78bda", href: "/admin/redaksi", ket: "profil publik" },
    ] : []),
  ];
  const aksi: [string, string, string][] = [
    ["Tulis artikel baru", "/admin/artikel/baru", "artikel"],
    ...(rev ? [["Unggah gambar", "/admin/gambar", "gambar"], ["Tambah video", "/admin/video", "video"], ["Atur redaksi", "/admin/redaksi", "redaksi"], ["Pengaturan situs", "/admin/situs", "pengaturan"]] as [string, string, string][] : []),
  ];

  return (
    <div>
      <PageHeader
        ikon="dashboard"
        judul={`Selamat datang, ${me.name.split(" ")[0]}`}
        deskripsi={`${hariIni} \u2022 ${ROLE_LABEL[me.role as Role]}`}
        aksi={<Link href="/admin/artikel/baru" className="a-btn"><IkonAdmin nama="tambah" className="h-4 w-4" /> Artikel Baru</Link>}
      />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {kartu.map((k) => (
          <Link key={k.label} href={k.href} className="a-card a-card-hover flex flex-col gap-3 p-4">
            <span className="a-ico h-10 w-10 rounded-xl" style={{ ["--c" as string]: k.warna }}><IkonAdmin nama={k.ikon} className="h-5 w-5" /></span>
            <span>
              <span className="block font-serif text-3xl font-bold leading-none">{k.nilai}</span>
              <span className="mt-1.5 block text-sm font-medium">{k.label}</span>
              <span className="a-muted block text-xs">{k.ket}</span>
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <section className="a-card min-w-0 p-5 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold">Artikel terbaru</h2>
            <Link href="/admin/artikel" className="a-link text-sm">Lihat semua &rarr;</Link>
          </div>
          {terbaru.length === 0 ? <p className="a-muted text-sm">Belum ada artikel.</p> : (
            <ul className="a-daftar">
              {terbaru.map((p) => (
                <li key={p.id}>
                  <Link href={`/admin/artikel/${p.id}`} className="flex items-center gap-3 py-3">
                    {p.coverUrl ? <img src={kecil(p.coverUrl, 120)} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-12 w-16 shrink-0 rounded-lg object-cover" /> : <span className="a-ico h-12 w-16 shrink-0 rounded-lg" style={{ ["--c" as string]: "var(--a-accent)" }}><IkonAdmin nama="artikel" /></span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{p.title}</span>
                      <span className="a-muted mt-0.5 block text-xs">{tgl(p.updatedAt)}</span>
                    </span>
                    <span className={`a-chip ${CHIP[p.status]}`}>{LABEL[p.status]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="min-w-0 space-y-6">
          <section className="a-card p-5">
            <h2 className="mb-3 font-serif text-lg font-bold">Aksi cepat</h2>
            <div className="grid grid-cols-1 gap-2">
              {aksi.map(([label, href, ikon]) => (
                <Link key={href} href={href} className="a-aksi"><IkonAdmin nama={ikon} /> <span className="flex-1">{label}</span> <span aria-hidden="true">&rarr;</span></Link>
              ))}
            </div>
          </section>
          {perKategori.length > 0 && (
            <section className="a-card p-5">
              <h2 className="mb-3 font-serif text-lg font-bold">Kategori terbanyak</h2>
              <ul className="space-y-3">
                {perKategori.map((k) => (
                  <li key={k.nama}>
                    <div className="mb-1 flex justify-between text-xs"><span className="truncate pr-2">{k.nama}</span><span className="a-muted">{k.n}</span></div>
                    <div className="a-bar"><span style={{ width: `${Math.max(6, (k.n / maks) * 100)}%` }} /></div>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {rev && menunggu.length > 0 && (
        <section className="a-card mt-6 p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-serif text-lg font-bold">Menunggu persetujuan</h2>
            <Link href="/admin/persetujuan" className="a-link text-sm">Tinjau &rarr;</Link>
          </div>
          <ul className="a-daftar">
            {menunggu.map((p) => (
              <li key={p.id}><Link href={`/admin/artikel/${p.id}`} className="flex items-center justify-between gap-3 py-2.5 text-sm"><span className="truncate font-medium">{p.title}</span><span className="a-muted shrink-0 text-xs">{tgl(p.updatedAt)}</span></Link></li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}