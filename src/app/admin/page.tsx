// PAKET-9D: daftar artikel dengan pencarian, filter status, dan tombol cepat "Pilihan"
import Link from "next/link";
import { and, count, desc, eq, ilike } from "drizzle-orm";
import { db, posts, users, categories } from "@/db";
import { kolomKartu } from "@/lib/kolom";
import { deletePost } from "@/lib/actions";
import { toggleFeatured } from "@/lib/artikel-cepat-actions";
import { canDeletePost, isReviewer, requireUser, ROLE_LABEL, type Role } from "@/lib/auth";
import { DeleteButton } from "@/components/DeleteButton";

export const dynamic = "force-dynamic";
const PER_HALAMAN = 20;
type Status = "published" | "pending" | "draft";
const LABEL: Record<Status, string> = { published: "Terbit", pending: "Menunggu", draft: "Draft" };
const WARNA: Record<Status, string> = { published: "bg-green-100 text-green-800", pending: "bg-amber-100 text-amber-800", draft: "bg-stone-200 text-stone-700" };

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ q?: string; s?: string; hal?: string }> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const q = (sp.q ?? "").trim().slice(0, 100);
  const status = (["published", "pending", "draft"] as const).find((x) => x === sp.s);
  const hal = Math.max(1, Number(sp.hal) || 1);
  const rev = isReviewer(me.role);

  const milik = me.role === "penulis" ? eq(posts.authorId, me.id) : undefined;
  const cocok = q ? ilike(posts.title, `%${q.replace(/[\\%_]/g, "\\$&")}%`) : undefined;
  const d = db();
  const [rows, hitung, kats] = await Promise.all([
    d.select({ post: kolomKartu, author: users.name }).from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(and(milik, cocok, status ? eq(posts.status, status) : undefined))
      .orderBy(desc(posts.updatedAt)).limit(PER_HALAMAN + 1).offset((hal - 1) * PER_HALAMAN),
    d.select({ status: posts.status, n: count() }).from(posts).where(milik).groupBy(posts.status),
    d.select({ id: categories.id, name: categories.name }).from(categories),
  ]);
  const tampil = rows.slice(0, PER_HALAMAN);
  const adaLagi = rows.length > PER_HALAMAN;
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
    return "/admin" + (str ? `?${str}` : "");
  };
  const kartu = [["Semua", semua, undefined, ""], ["Terbit", jml("published"), "published", ""], ["Menunggu", jml("pending"), "pending", ""], ["Draft", jml("draft"), "draft", ""]] as const;
  const kembali = href({ hal });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">Artikel</h1>
          <p className="text-sm text-charcoal/60">{me.name} &middot; {ROLE_LABEL[me.role as Role]}</p>
        </div>
        <Link href="/admin/artikel/baru" className="rounded-lg bg-gold px-4 py-2 text-white">+ Artikel Baru</Link>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kartu.map(([label, jumlah, s]) => (
          <Link key={label} href={href({ s: s ?? "" })} className={`rounded-xl bg-white/70 p-4 transition hover:shadow ${status === s ? "ring-2 ring-gold" : ""}`}>
            <p className="text-xs uppercase tracking-wider text-charcoal/50">{label}</p>
            <p className="mt-1 font-serif text-2xl">{jumlah}</p>
          </Link>
        ))}
      </div>

      <form action="/admin" className="mt-5 flex gap-2">
        {status && <input type="hidden" name="s" value={status} />}
        <input name="q" defaultValue={q} placeholder="Cari judul artikel..." className="min-w-0 flex-1" />
        <button className="rounded-lg bg-charcoal px-4 py-2 text-sm text-cream">Cari</button>
        {(q || status) && <Link href="/admin" className="rounded-lg border px-4 py-2 text-sm">Reset</Link>}
      </form>

      {tampil.length === 0 ? (
        <p className="mt-6 rounded-xl bg-white/70 p-6 text-center text-sm text-charcoal/60">Tidak ada artikel yang cocok.</p>
      ) : (
        <ul className="mt-4 divide-y divide-cream-dark rounded-xl bg-white/70">
          {tampil.map(({ post: p, author }) => (
            <li key={p.id} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <Link href={`/admin/artikel/${p.id}`} className="font-medium hover:text-gold-dark">{p.title}</Link>
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-charcoal/55">
                  <span className={`rounded px-2 py-0.5 ${WARNA[p.status]}`}>{LABEL[p.status]}</span>
                  {p.categoryId && nama.get(p.categoryId) && <span>{nama.get(p.categoryId)}</span>}
                  {me.role !== "penulis" && author && <span>oleh {author}</span>}
                  <span>{p.updatedAt.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" })}</span>
                  {p.status === "draft" && p.reviewNote && <span className="rounded bg-amber-100 px-2 py-0.5 text-amber-800">ada catatan editor</span>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                {p.status === "published" && <Link href={`/artikel/${p.slug}`} target="_blank" className="text-sm text-charcoal/60 hover:text-gold-dark">Lihat</Link>}
                {rev && (
                  <form action={toggleFeatured}>
                    <input type="hidden" name="id" value={p.id} />
                    <input type="hidden" name="kembali" value={kembali} />
                    <button title={p.featured ? "Hapus dari Artikel Pilihan" : "Jadikan Artikel Pilihan"} aria-label="Artikel Pilihan" className={`text-xl leading-none ${p.featured ? "text-gold" : "text-charcoal/25 hover:text-gold"}`}>
                      {p.featured ? "\u2605" : "\u2606"}
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
        <div className="mt-5 flex items-center justify-between text-sm">
          {hal > 1 ? <Link href={href({ hal: hal - 1 })} className="rounded-lg border px-4 py-2">&larr; Sebelumnya</Link> : <span />}
          <span className="text-charcoal/50">Halaman {hal}</span>
          {adaLagi ? <Link href={href({ hal: hal + 1 })} className="rounded-lg border px-4 py-2">Berikutnya &rarr;</Link> : <span />}
        </div>
      )}
    </div>
  );
}