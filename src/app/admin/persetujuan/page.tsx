import Link from "next/link";
import { and, asc, eq } from "drizzle-orm";
import { db, posts, users } from "@/db";
import { requireReviewer } from "@/lib/auth";
import { reviewPosts, setTrusted } from "@/lib/review-actions";

export const dynamic = "force-dynamic";

const errors: Record<string, string> = { kosong: "Pilih minimal satu artikel.", aksi: "Aksi tidak dikenal." };
const oks: Record<string, string> = {
  disetujui: "Artikel yang dipilih sudah diterbitkan.",
  "disetujui-percaya": "Artikel diterbitkan dan penulisnya sekarang tepercaya (bebas posting).",
  ditolak: "Artikel yang dipilih dikembalikan ke draft.",
  percaya: "Penulis sekarang tepercaya (bebas posting).",
  cabut: "Status tepercaya dicabut. Artikel penulis itu kembali perlu persetujuan.",
};

export default async function Persetujuan({ searchParams }: { searchParams: Promise<{ error?: string; ok?: string }> }) {
  await requireReviewer();
  const { error, ok } = await searchParams;
  const pending = await db().select({ post: posts, author: users.name }).from(posts)
    .leftJoin(users, eq(posts.authorId, users.id)).where(eq(posts.status, "pending")).orderBy(asc(posts.updatedAt));
  const writers = await db().select().from(users).where(and(eq(users.role, "penulis"), eq(users.active, true))).orderBy(asc(users.name));
  return (
    <div className="mx-auto max-w-5xl px-5 py-10">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl">Persetujuan</h1>
        <Link href="/admin" className="rounded border px-4 py-2">← Artikel</Link>
      </div>
      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{errors[error] ?? "Terjadi kesalahan."}</p>}
      {ok && <p className="mt-4 rounded bg-green-50 p-3 text-sm text-green-800">{oks[ok] ?? "Berhasil."}</p>}

      <h2 className="mt-8 font-medium">Artikel menunggu persetujuan ({pending.length})</h2>
      {pending.length === 0 ? (
        <p className="mt-2 text-sm text-charcoal/60">Tidak ada artikel yang menunggu.</p>
      ) : (
        <form action={reviewPosts} className="mt-3 rounded bg-white/70">
          <ul className="divide-y divide-cream-dark">
            {pending.map(({ post: p, author }) => (
              <li key={p.id} className="flex items-center gap-3 p-4">
                <input type="checkbox" name="ids" value={p.id} aria-label={`Pilih ${p.title}`} />
                <div>
                  <Link href={`/admin/artikel/${p.id}`} className="font-medium hover:text-gold-dark">{p.title}</Link>
                  <span className="ml-2 text-xs text-charcoal/50">oleh {author ?? "tanpa penulis"}</span>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t border-cream-dark p-4 pb-0">
            <input name="note" maxLength={1000} placeholder="Catatan untuk penulis (opsional, dipakai saat dikembalikan ke draft)" className="w-full rounded border p-2 text-sm" />
          </div>
          <div className="flex flex-wrap gap-3 p-4">
            <button name="do" value="approve" className="rounded bg-gold px-4 py-2 text-sm text-white">Setujui yang dipilih</button>
            <button name="do" value="approve_trust" className="rounded border px-4 py-2 text-sm">Setujui + percayai penulisnya</button>
            <button name="do" value="reject" className="rounded border px-4 py-2 text-sm">Kembalikan ke draft</button>
          </div>
        </form>
      )}
      <p className="mt-2 text-xs text-charcoal/50">
        "Setujui yang dipilih" hanya berlaku untuk artikel yang dicentang. "Percayai penulisnya" membuat penulis itu bebas
        posting tanpa persetujuan sampai kepercayaannya dicabut.
      </p>

      <h2 className="mt-10 font-medium">Penulis</h2>
      {writers.length === 0 ? (
        <p className="mt-2 text-sm text-charcoal/60">Belum ada penulis.</p>
      ) : (
        <ul className="mt-3 divide-y divide-cream-dark rounded bg-white/70">
          {writers.map((u) => (
            <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-medium">{u.name}</span>
                <span className="text-sm text-charcoal/60">{u.email}</span>
                <span className={`rounded px-2 py-0.5 text-xs ${u.trusted ? "bg-green-100 text-green-800" : "bg-cream-dark"}`}>
                  {u.trusted ? "tepercaya: bebas posting" : "perlu persetujuan"}
                </span>
              </div>
              <form action={setTrusted}>
                <input type="hidden" name="id" value={u.id} />
                <input type="hidden" name="trusted" value={u.trusted ? "0" : "1"} />
                <button className="rounded border px-3 py-1 text-sm">{u.trusted ? "Cabut kepercayaan" : "Jadikan tepercaya"}</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
