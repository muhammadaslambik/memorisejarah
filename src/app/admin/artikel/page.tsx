// PAKET-11A: daftar artikel: filter menempel saat digulir, jumlah per halaman per akun, mengingat posisi untuk tombol Kembali
import Link from "next/link";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { db, posts, users, categories, userPrefs } from "@/db";
import { kolomKartu } from "@/lib/kolom";
import { kecil } from "@/lib/gambar-url";
import { deletePost } from "@/lib/actions";
import { toggleFeatured } from "@/lib/artikel-cepat-actions";
import { canDeletePost, isReviewer, requireUser } from "@/lib/auth";
import { DeleteButton } from "@/components/DeleteButton";
import { IkonAdmin } from "@/components/admin/ikon-admin";
import { PageHeader } from "@/components/admin/PageHeader";
import { PilihPerHalaman } from "@/components/admin/PilihPerHalaman";
import { IngatDaftar } from "@/components/admin/IngatDaftar";
import { simpanPerHalaman } from "@/lib/pref-actions";

export const dynamic = "force-dynamic";
const DASAR = "/admin/artikel";
type Status = "published" | "pending" | "draft";
const LABEL: Record<Status, string> = { published: "Terbit", pending: "Menunggu", draft: "Draft" };
const CHIP: Record<Status, string> = { published: "a-chip-hijau", pending: "a-chip-kuning", draft: "a-chip-abu" };

export default async function DaftarArtikel({ searchParams }: { searchParams: Promise<{ q?: string; s?: string; hal?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = (["published", "pending", "draft"] as const).find((x) => x === sp.s);
  const hal = Math.max(1, Number(sp.hal) || 1);
  const rev = isReviewer(me.role);

  const milik = me.role === "penulis" ? eq(posts.authorId, me.id) : undefined;
  const cocok = q ? ilike(posts.title, `%${q.replace(/[\\%_]/g, "\\$&")}%`) : undefined;
  const d = db();
  const pref = await d.select({ n: userPrefs.perHalaman }).from(userPrefs).where(eq(userPrefs.userId, me.id)).limit(1).then((r) => r[0]?.n ?? 20).catch(() => 20);
  const perHalaman = pref === 0 ? 5000 : pref;
  const [rows, hitung, kats] = await Promise.all([
    d.select({ post: kolomKartu, author: users.name }).from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(and(milik, cocok, status ? eq(posts.status, status) : undefined))
      .orderBy(desc(posts.updatedAt)).limit(perHalaman + 1).offset((hal - 1) * perHalaman),
    d.select({ status: posts.status, n: count() }).from(posts).where(milik).groupBy(posts.status),
    d.select({ id: categories.id, name: categories.name }).from(categories),
  ]);
  const tampil = rows.slice(0, perHalaman);
  const adaLagi = rows.length > perHalaman;
  const nama = new Map(kats.map((k) => [k.id, k.name]));
  const jml = (s: Status) => Number(hitung.find((h) => h.status === s)?.n ?? 0);
  const semua = jml("published") + jml("pending") + jml("draft");

  const href = (o: { s?: string; hal?: number }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const s = "s" in o ? o.s : status;
    if (s) p.set("s", s);
    if (o.hal && o.hal > 1) p.set("hal", String(o.hal));
    const str = p.toString();
    return DASAR + (str ? `?${str}` : "");
  };
  const tab: [string, number, string][] = [["Semua", semua, ""], ["Terbit", jml("published"), "published"], ["Menunggu", jml("pending"), "pending"], ["Draft", jml("draft"), "draft"]];
  const kembali = href({ hal });

  return (
    <div>
      <PageHeader
        ikon="artikel"
        judul="Artikel"
        deskripsi="Kelola semua tulisan di situs."
        aksi={<Link href="/admin/artikel/baru" className="a-btn"><IkonAdmin nama="tambah" className="h-4 w-4" /> Artikel Baru</Link>}
      />

      <IngatDaftar />
      <div className="a-sticky">
        <div className="a-card flex flex-wrap items-center justify-between gap-3 p-3 md:px-4">
          <div className="a-tab-baris" role="tablist" aria-label="Filter status">
            {tab.map(([label, jumlah, s]) => (
              <Link key={label} href={href({ s })} className="a-tab" aria-current={(status ?? "") === s ? "page" : undefined}>
                {label} <span className="a-tab-n">{jumlah}</span>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <PilihPerHalaman nilai={pref} kembali={href({})} aksi={simpanPerHalaman} />
            <form action={DASAR} className="a-search flex w-full sm:w-64">
              <IkonAdmin nama="cari" className="h-4 w-4 opacity-60" />
              {status && <input type="hidden" name="s" value={status} />}
              <input name="q" type="search" defaultValue={q} placeholder="Cari judul artikel..." aria-label="Cari judul" autoComplete="off" />
            </form>
          </div>
        </div>
      </div>

      <div className="a-card a-bleed mt-3 p-4 md:p-5">
        {tampil.length === 0 ? (
          <p className="a-muted py-12 text-center text-sm">Tidak ada artikel yang cocok.{(q || status) && <> <Link href={DASAR} className="a-link">Reset pencarian</Link></>}</p>
        ) : (
          <ul className="a-daftar mt-3">
            {tampil.map(({ post: p, author }) => (
              <li key={p.id} className="flex items-center gap-3 py-3 max-sm:flex-col max-sm:items-stretch max-sm:gap-1.5">
                <Link href={`/admin/artikel/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  {p.coverUrl
                    ? <img src={kecil(p.coverUrl, 140)} alt="" loading="lazy" referrerPolicy="no-referrer" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                    : <span className="a-ico h-14 w-20 shrink-0 rounded-lg" style={{ ["--c" as string]: "var(--a-accent)" }}><IkonAdmin nama="artikel" /></span>}
                  <span className="min-w-0">
                    <span className="block truncate font-semibold max-sm:line-clamp-2 max-sm:whitespace-normal max-sm:text-[13px] max-sm:leading-snug">{p.title}</span>
                    <span className="a-muted mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                      <span className={`a-chip ${CHIP[p.status]}`}>{LABEL[p.status]}</span>
                      {p.categoryId && nama.get(p.categoryId) && <span>{nama.get(p.categoryId)}</span>}
                      {me.role !== "penulis" && author && <span>oleh {author}</span>}
                      <span>{p.updatedAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}</span>
                      {p.status === "draft" && p.reviewNote && <span className="a-chip a-chip-kuning">ada catatan editor</span>}
                    </span>
                  </span>
                </Link>
                <div className="flex shrink-0 items-center gap-1 max-sm:justify-end">
                  {p.status === "published" && <Link href={`/artikel/${p.slug}`} target="_blank" className="a-ikon-btn" title="Lihat di situs" aria-label="Lihat di situs"><IkonAdmin nama="mata" /></Link>}
                  {rev && (
                    <form action={toggleFeatured}>
                      <input type="hidden" name="id" value={p.id} />
                      <input type="hidden" name="kembali" value={kembali} />
                      <button title={p.featured ? "Hapus dari Artikel Pilihan" : "Jadikan Artikel Pilihan"} aria-label="Artikel Pilihan" className={`a-ikon-btn ${p.featured ? "a-bintang-aktif" : ""}`}>
                        <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill={p.featured ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg>
                      </button>
                    </form>
                  )}
                  {canDeletePost(me, p) && (
                    <form action={deletePost}>
                      <input type="hidden" name="id" value={p.id} />
                      <DeleteButton title={p.title} />
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {(hal > 1 || adaLagi) && (
          <div className="mt-4 flex items-center justify-between border-t border-[var(--a-line)] pt-4 text-sm">
            {hal > 1 ? <Link href={href({ hal: hal - 1 })} className="a-btn-soft">&larr; Sebelumnya</Link> : <span />}
            <span className="a-muted">Halaman {hal}</span>
            {adaLagi ? <Link href={href({ hal: hal + 1 })} className="a-btn-soft">Berikutnya &rarr;</Link> : <span />}
          </div>
        )}
      </div>
    </div>
  );
}